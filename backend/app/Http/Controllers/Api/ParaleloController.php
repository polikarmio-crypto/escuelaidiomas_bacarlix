<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Paralelo;
use App\Models\AsignacionDocenteParalelo;
use App\Models\Gestion;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ParaleloController extends Controller
{
    public function index(Request $request)
    {
        $gestionActiva = Gestion::where('estado_gestion', 'Activa')->first();
        $idGestion = $request->get('id_gestion', $gestionActiva ? $gestionActiva->id_gestion : null);

        $query = Paralelo::with([
            'nivel.programa.idioma',
            'aula',
            'horario',
            'modalidad',
            'docenteActual.docente',
        ]);

        if ($idGestion) {
            $query->where('id_gestion', $idGestion);
        }

        if ($request->filled('id_docente')) {
            $idDoc = (int) $request->id_docente;
            $query->whereHas('docenteActual', function ($q) use ($idDoc) {
                $q->where('id_docente', $idDoc);
            });
        }

        $paralelos = $query->get()->map(function ($p) {
            $docenteAsignado = $p->docenteActual;
            return [
                'id_paralelo' => $p->id_paralelo,
                'codigo_paralelo' => $p->codigo_paralelo,
                'idioma' => $p->nivel && $p->nivel->programa && $p->nivel->programa->idioma ? $p->nivel->programa->idioma->nombre_idioma : 'Inglés',
                'id_idioma' => $p->nivel && $p->nivel->programa ? $p->nivel->programa->id_idioma : 1,
                'programa' => $p->nivel && $p->nivel->programa ? $p->nivel->programa->nombre_programa : 'Plan de Idioma Inglés',
                'nivel' => $p->nivel ? $p->nivel->nombre_nivel : 'Básico',
                'aula' => $p->aula ? $p->aula->nombre_aula : 'Aula General',
                'horario' => $p->horario ? "{$p->horario->hora_inicio_horario} - {$p->horario->hora_fin_horario}" : 'Horario Regular',
                'modalidad' => $p->modalidad ? $p->modalidad->nombre_modalidad : 'Presencial',
                'docente_actual' => $docenteAsignado && $docenteAsignado->docente ? "{$docenteAsignado->docente->nombre_docente} {$docenteAsignado->docente->apellido_docente}" : 'Sin docente asignado',
                'id_docente_actual' => $docenteAsignado ? $docenteAsignado->docente->id_docente : null,
                'dias_en_aula' => $docenteAsignado ? $docenteAsignado->dias_en_aula : 0,
                'inscritos' => $p->inscritos_count,
                'inscripciones_count' => $p->inscritos_count,
                'capacidad_maxima' => $p->capacidad_maxima_paralelo,
                'capacidad_maxima_paralelo' => $p->capacidad_maxima_paralelo,
                'capacidad_minima_apertura' => $p->capacidad_minima_apertura,
                'cupo_disponible' => $p->tiene_cupo_disponible,
                'estado' => $p->estado_paralelo,
                'estado_paralelo' => $p->estado_paralelo,
            ];
        });

        return response()->json($paralelos);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_nivel' => 'required|exists:nivel,id_nivel',
            'id_aula' => 'required|exists:aula,id_aula',
            'id_horario' => 'required|exists:horario,id_horario',
            'id_modalidad' => 'required|exists:modalidad,id_modalidad',
            'id_gestion' => 'required|exists:gestion,id_gestion',
            'codigo_paralelo' => 'required|string|max:20',
            'capacidad_maxima_paralelo' => 'nullable|integer|min:5|max:60',
            'id_docente_inicial' => 'nullable|exists:docente,id_docente',
        ]);

        $solapamiento = Paralelo::where('id_gestion', $validated['id_gestion'])
            ->where('id_aula', $validated['id_aula'])
            ->where('id_horario', $validated['id_horario'])
            ->whereIn('estado_paralelo', ['Planificado', 'Abierto', 'En curso'])
            ->exists();

        if ($solapamiento) {
            AuditLogger::academico(AuditLogger::LEVEL_WARNING, 'SOLAPAMIENTO_AULA_HORARIO', [
                'id_aula' => $validated['id_aula'],
                'id_horario' => $validated['id_horario'],
            ]);

            return response()->json([
                'error' => 'Conflicto de infraestructura: El aula seleccionada ya se encuentra ocupada en ese horario y gestión.'
            ], 422);
        }

        $paralelo = DB::transaction(function () use ($validated) {
            $p = Paralelo::create([
                'id_nivel' => $validated['id_nivel'],
                'id_aula' => $validated['id_aula'],
                'id_horario' => $validated['id_horario'],
                'id_modalidad' => $validated['id_modalidad'],
                'id_gestion' => $validated['id_gestion'],
                'codigo_paralelo' => strtoupper($validated['codigo_paralelo']),
                'capacidad_maxima_paralelo' => $validated['capacidad_maxima_paralelo'] ?? 30,
                'capacidad_minima_apertura' => 10,
                'estado_paralelo' => 'Abierto',
            ]);

            if (!empty($validated['id_docente_inicial'])) {
                AsignacionDocenteParalelo::create([
                    'id_paralelo' => $p->id_paralelo,
                    'id_docente' => $validated['id_docente_inicial'],
                    'fecha_inicio_asignacion' => Carbon::now()->toDateString(),
                    'fecha_fin_asignacion' => null,
                ]);
            }

            AuditLogger::academico(AuditLogger::LEVEL_INFO, 'PARALELO_APERTURADO', [
                'id_paralelo' => $p->id_paralelo,
                'codigo' => $p->codigo_paralelo,
            ], null, 'paralelo', $p->id_paralelo);

            return $p;
        });

        return response()->json([
            'message' => 'Paralelo aperturado exitosamente.',
            'data' => $paralelo->load(['aula', 'horario', 'nivel.programa.idioma']),
        ], 201);
    }

    public function asignarDocente(Request $request, $id)
    {
        $validated = $request->validate([
            'id_docente' => 'required|exists:docente,id_docente',
        ]);

        $paralelo = Paralelo::findOrFail($id);

        DB::transaction(function () use ($paralelo, $validated) {
            AsignacionDocenteParalelo::where('id_paralelo', $paralelo->id_paralelo)
                ->whereNull('fecha_fin_asignacion')
                ->update(['fecha_fin_asignacion' => Carbon::now()->toDateString()]);

            AsignacionDocenteParalelo::create([
                'id_paralelo' => $paralelo->id_paralelo,
                'id_docente' => $validated['id_docente'],
                'fecha_inicio_asignacion' => Carbon::now()->toDateString(),
                'fecha_fin_asignacion' => null,
            ]);

            AuditLogger::academico(AuditLogger::LEVEL_INFO, 'DOCENTE_ASIGNADO_MANUALMENTE', [
                'id_paralelo' => $paralelo->id_paralelo,
                'id_docente' => $validated['id_docente'],
            ], null, 'paralelo', $paralelo->id_paralelo);
        });

        return response()->json(['message' => 'Docente asignado correctamente.']);
    }

    public function asignarAula(Request $request, $id)
    {
        $validated = $request->validate([
            'id_aula' => 'required|exists:aula,id_aula',
        ]);

        $paralelo = Paralelo::findOrFail($id);
        $paralelo->id_aula = $validated['id_aula'];
        $paralelo->save();

        AuditLogger::academico(AuditLogger::LEVEL_INFO, 'AULA_ASIGNADA_MANUALMENTE', [
            'id_paralelo' => $paralelo->id_paralelo,
            'id_aula' => $validated['id_aula'],
        ], null, 'paralelo', $paralelo->id_paralelo);

        return response()->json(['message' => 'Aula reasignada correctamente.', 'data' => $paralelo->load('aula')]);
    }

    public function show($id)
    {
        $paralelo = Paralelo::with([
            'nivel.programa.idioma',
            'aula',
            'horario',
            'docenteActual.docente',
            'inscripciones.estudiante.militar',
        ])->findOrFail($id);

        return response()->json($paralelo);
    }
}
