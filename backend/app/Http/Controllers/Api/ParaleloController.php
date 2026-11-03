<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Paralelo;
use App\Models\AsignacionDocenteParalelo;
use App\Models\Gestion;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ParaleloController extends Controller
{
    /**
     * Lista los paralelos con su aforo, docente asignado e información de aula
     */
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

        $paralelos = $query->get()->map(function ($p) {
            $docenteAsignado = $p->docenteActual;
            return [
                'id_paralelo' => $p->id_paralelo,
                'codigo_paralelo' => $p->codigo_paralelo,
                'idioma' => $p->nivel->programa->idioma->nombre_idioma,
                'nivel' => $p->nivel->nombre_nivel,
                'aula' => $p->aula->nombre_aula,
                'horario' => "{$p->horario->hora_inicio_horario} - {$p->horario->hora_fin_horario}",
                'modalidad' => $p->modalidad->nombre_modalidad,
                'docente_actual' => $docenteAsignado ? "{$docenteAsignado->docente->nombre_docente} {$docenteAsignado->docente->apellido_docente}" : 'Sin docente asignado',
                'dias_en_aula' => $docenteAsignado ? $docenteAsignado->dias_en_aula : 0,
                'inscritos' => $p->inscritos_count,
                'capacidad_maxima' => $p->capacidad_maxima_paralelo,
                'cupo_disponible' => $p->tiene_cupo_disponible,
                'estado' => $p->estado_paralelo,
            ];
        });

        return response()->json($paralelos);
    }

    /**
     * Apertura de nuevo paralelo con validación estricta de no-solapamiento de aula y horario
     */
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

        // Validación de solapamiento de aula y horario en la misma gestión académica
        $solapamiento = Paralelo::where('id_gestion', $validated['id_gestion'])
            ->where('id_aula', $validated['id_aula'])
            ->where('id_horario', $validated['id_horario'])
            ->whereIn('estado_paralelo', ['Planificado', 'Abierto', 'En curso'])
            ->exists();

        if ($solapamiento) {
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

            return $p;
        });

        return response()->json([
            'message' => 'Paralelo aperturado exitosamente.',
            'data' => $paralelo->load(['aula', 'horario', 'nivel.programa.idioma']),
        ], 201);
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
