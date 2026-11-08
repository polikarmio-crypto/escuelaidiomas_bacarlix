<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Docente;
use App\Models\AsignacionDocenteParalelo;
use App\Models\Paralelo;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DocenteController extends Controller
{
    public function index()
    {
        $docentes = Docente::with(['idiomas', 'asignacionActiva.paralelo.nivel.programa.idioma'])->get();

        $data = $docentes->map(function ($d) {
            $asignacion = $d->asignacionActiva;
            $diasEnAula = $asignacion ? $asignacion->dias_en_aula : 0;
            $requiereRelevo = $diasEnAula >= 14;

            return [
                'id_docente' => $d->id_docente,
                'ci_docente' => $d->ci_docente,
                'nombre_completo' => "{$d->nombre_docente} {$d->apellido_docente}",
                'telefono' => $d->telefono_docente,
                'email' => $d->email_docente,
                'estado' => $d->estado_docente,
                'idiomas' => $d->idiomas->pluck('nombre_idioma'),
                'paralelo_actual' => $asignacion ? $asignacion->paralelo->codigo_paralelo : null,
                'dias_en_aula' => $diasEnAula,
                'alerta_rotacion_15_dias' => $requiereRelevo,
            ];
        });

        return response()->json($data);
    }

    public function alertarRotaciones()
    {
        $asignaciones = AsignacionDocenteParalelo::with(['docente', 'paralelo.nivel.programa.idioma'])
            ->whereNull('fecha_fin_asignacion')
            ->get();

        $alertas = $asignaciones->filter(function ($asig) {
            return $asig->dias_en_aula >= 14;
        })->map(function ($asig) {
            return [
                'id_asignacion' => $asig->id_asignacion,
                'paralelo' => $asig->paralelo->codigo_paralelo,
                'idioma' => $asig->paralelo->nivel->programa->idioma->nombre_idioma,
                'docente_actual' => "{$asig->docente->nombre_docente} {$asig->docente->apellido_docente}",
                'dias_en_aula' => $asig->dias_en_aula,
                'estado' => $asig->dias_en_aula >= 15 ? 'RELEVO_OBLIGATORIO_CUMPLIDO' : 'RELEVO_INMINENTE_14_DIAS',
            ];
        })->values();

        return response()->json([
            'total_alertas' => $alertas->count(),
            'alertas' => $alertas,
        ]);
    }

    public function rotarDocente(Request $request)
    {
        $validated = $request->validate([
            'id_paralelo' => 'required|exists:paralelo,id_paralelo',
            'id_docente_nuevo' => 'required|exists:docente,id_docente',
        ]);

        return DB::transaction(function () use ($validated) {
            $paralelo = Paralelo::with('nivel.programa.idioma')->findOrFail($validated['id_paralelo']);
            $idIdiomaRequerido = $paralelo->nivel->programa->id_idioma;

            $tieneIdioma = DB::table('docente_idioma')
                ->where('id_docente', $validated['id_docente_nuevo'])
                ->where('id_idioma', $idIdiomaRequerido)
                ->exists();

            if (!$tieneIdioma) {
                AuditLogger::academico(AuditLogger::LEVEL_WARNING, 'ROTACION_FALLIDA_IDIOMA_NO_HABILITADO', [
                    'id_paralelo' => $validated['id_paralelo'],
                    'id_docente' => $validated['id_docente_nuevo'],
                ], null, 'asignacion_docente_paralelo');

                return response()->json([
                    'error' => 'El docente seleccionado no cuenta con la habilitación idiomática requerida para este paralelo.'
                ], 422);
            }

            AsignacionDocenteParalelo::where('id_paralelo', $validated['id_paralelo'])
                ->whereNull('fecha_fin_asignacion')
                ->update(['fecha_fin_asignacion' => Carbon::now()->toDateString()]);

            $nuevaAsignacion = AsignacionDocenteParalelo::create([
                'id_paralelo' => $validated['id_paralelo'],
                'id_docente' => $validated['id_docente_nuevo'],
                'fecha_inicio_asignacion' => Carbon::now()->toDateString(),
                'fecha_fin_asignacion' => null,
            ]);

            AuditLogger::academico(AuditLogger::LEVEL_INFO, 'ROTACION_DOCENTE_EXITOSA', [
                'id_paralelo' => $validated['id_paralelo'],
                'id_docente' => $validated['id_docente_nuevo'],
                'id_asignacion' => $nuevaAsignacion->id_asignacion,
            ], null, 'asignacion_docente_paralelo', $nuevaAsignacion->id_asignacion);

            return response()->json([
                'message' => 'Orden de relevo quincenal ejecutada exitosamente.',
                'data' => $nuevaAsignacion->load(['docente', 'paralelo']),
            ]);
        });
    }

    public function asignacionAutomatica(Request $request)
    {
        return DB::transaction(function () {
            $paralelosSinDocente = Paralelo::with(['nivel.programa.idioma', 'horario', 'aula'])
                ->where('estado_paralelo', 'Activo')
                ->whereDoesntHave('asignacionesDocente', function ($q) {
                    $q->whereNull('fecha_fin_asignacion');
                })
                ->get();

            if ($paralelosSinDocente->isEmpty()) {
                return response()->json([
                    'message' => 'Todos los paralelos activos ya cuentan con docentes asignados.',
                    'total_asignados' => 0,
                    'asignaciones' => [],
                ]);
            }

            $docentesActivos = Docente::with('idiomas')
                ->where('estado_docente', 'Activo')
                ->get();

            $aulas = DB::table('aula')->where('estado_aula', 'Activo')->get();

            $asignacionesRealizadas = [];

            foreach ($paralelosSinDocente as $paralelo) {
                $idIdioma = $paralelo->nivel->programa->id_idioma;

                $candidatos = $docentesActivos->filter(function ($doc) use ($idIdioma) {
                    return $doc->idiomas->contains('id_idioma', $idIdioma);
                });

                if ($candidatos->isEmpty()) {
                    continue;
                }

                $docenteSeleccionado = null;
                $menorCarga = PHP_INT_MAX;

                foreach ($candidatos as $doc) {
                    $carga = AsignacionDocenteParalelo::where('id_docente', $doc->id_docente)
                        ->whereNull('fecha_fin_asignacion')
                        ->count();

                    $conflictoHorario = AsignacionDocenteParalelo::where('id_docente', $doc->id_docente)
                        ->whereNull('fecha_fin_asignacion')
                        ->whereHas('paralelo', function ($pq) use ($paralelo) {
                            $pq->where('id_horario', $paralelo->id_horario);
                        })
                        ->exists();

                    if (!$conflictoHorario && $carga < $menorCarga) {
                        $menorCarga = $carga;
                        $docenteSeleccionado = $doc;
                    }
                }

                if (!$docenteSeleccionado) {
                    $docenteSeleccionado = $candidatos->first();
                }

                if (!$paralelo->id_aula && $aulas->isNotEmpty()) {
                    $aulaDisponible = $aulas->first(function ($a) use ($paralelo) {
                        return !Paralelo::where('id_aula', $a->id_aula)
                            ->where('id_horario', $paralelo->id_horario)
                            ->where('estado_paralelo', 'Activo')
                            ->exists();
                    });

                    if ($aulaDisponible) {
                        $paralelo->update(['id_aula' => $aulaDisponible->id_aula]);
                    }
                }

                $asignacion = AsignacionDocenteParalelo::create([
                    'id_paralelo' => $paralelo->id_paralelo,
                    'id_docente' => $docenteSeleccionado->id_docente,
                    'fecha_inicio_asignacion' => Carbon::now()->toDateString(),
                    'fecha_fin_asignacion' => null,
                ]);

                AuditLogger::academico(AuditLogger::LEVEL_INFO, 'ASIGNACION_AUTOMATICA_DOCENTE', [
                    'id_paralelo' => $paralelo->id_paralelo,
                    'codigo_paralelo' => $paralelo->codigo_paralelo,
                    'id_docente' => $docenteSeleccionado->id_docente,
                    'nombre_docente' => "{$docenteSeleccionado->nombre_docente} {$docenteSeleccionado->apellido_docente}",
                    'idioma' => $paralelo->nivel->programa->idioma->nombre_idioma,
                ], null, 'asignacion_docente_paralelo', $asignacion->id_asignacion);

                $asignacionesRealizadas[] = [
                    'id_asignacion' => $asignacion->id_asignacion,
                    'paralelo' => $paralelo->codigo_paralelo,
                    'idioma' => $paralelo->nivel->programa->idioma->nombre_idioma,
                    'docente' => "{$docenteSeleccionado->nombre_docente} {$docenteSeleccionado->apellido_docente}",
                    'aula' => $paralelo->aula ? $paralelo->aula->nombre_aula : 'Aula Asignada',
                    'fecha_inicio' => $asignacion->fecha_inicio_asignacion->toDateString(),
                ];
            }

            return response()->json([
                'message' => 'Proceso de asignación docente automatizada concluido satisfactoriamente.',
                'total_asignados' => count($asignacionesRealizadas),
                'asignaciones' => $asignacionesRealizadas,
            ]);
        });
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ci_docente' => 'required|string|max:15|unique:docente,ci_docente',
            'nombre_docente' => 'required|string|max:60',
            'apellido_docente' => 'required|string|max:60',
            'telefono_docente' => 'nullable|string|max:20',
            'email_docente' => 'nullable|email|max:100',
            'idiomas_ids' => 'required|array|min:1',
            'idiomas_ids.*' => 'exists:idioma,id_idioma',
        ]);

        $docente = DB::transaction(function () use ($validated) {
            $doc = Docente::create([
                'ci_docente' => $validated['ci_docente'],
                'nombre_docente' => $validated['nombre_docente'],
                'apellido_docente' => $validated['apellido_docente'],
                'telefono_docente' => $validated['telefono_docente'] ?? null,
                'email_docente' => $validated['email_docente'] ?? null,
                'estado_docente' => 'Activo',
            ]);

            $doc->idiomas()->sync($validated['idiomas_ids']);

            AuditLogger::academico(AuditLogger::LEVEL_INFO, 'DOCENTE_CREADO', [
                'id_docente' => $doc->id_docente,
                'nombre' => "{$doc->nombre_docente} {$doc->apellido_docente}",
            ], null, 'docente', $doc->id_docente);

            return $doc;
        });

        return response()->json(['message' => 'Docente registrado con éxito', 'data' => $docente->load('idiomas')], 201);
    }

    public function show($id)
    {
        $docente = Docente::with(['idiomas', 'asignacionesParalelo.paralelo.nivel.programa'])->findOrFail($id);
        return response()->json($docente);
    }

    public function update(Request $request, $id)
    {
        $docente = Docente::findOrFail($id);
        $validated = $request->validate([
            'ci_docente'       => 'sometimes|string|max:15',
            'nombre_docente'   => 'sometimes|string|max:60',
            'apellido_docente' => 'sometimes|string|max:60',
            'telefono_docente' => 'nullable|string|max:20',
            'email_docente'    => 'nullable|email|max:100',
            'estado_docente'   => 'sometimes|in:Activo,Inactivo,Licencia',
            'idiomas_ids'      => 'nullable|array',
            'idiomas_ids.*'    => 'exists:idioma,id_idioma',
        ]);

        DB::transaction(function () use ($docente, $validated) {
            $docente->update($validated);
            if (isset($validated['idiomas_ids'])) {
                $docente->idiomas()->sync($validated['idiomas_ids']);
            }

            AuditLogger::academico(AuditLogger::LEVEL_INFO, 'DOCENTE_ACTUALIZADO', [
                'id_docente' => $docente->id_docente,
            ], null, 'docente', $docente->id_docente);
        });

        return response()->json([
            'message' => "Ficha del docente {$docente->nombre_docente} actualizada exitosamente.",
            'data'    => $docente->load('idiomas'),
        ]);
    }

    public function bajaLogica($id)
    {
        $docente = Docente::findOrFail($id);
        $nuevoEstado = ($docente->estado_docente === 'Activo') ? 'Inactivo' : 'Activo';
        $docente->update(['estado_docente' => $nuevoEstado]);

        AuditLogger::academico(AuditLogger::LEVEL_WARNING, 'DOCENTE_ESTADO_CAMBIADO', [
            'id_docente' => $docente->id_docente,
            'nuevo_estado' => $nuevoEstado,
        ], null, 'docente', $docente->id_docente);

        return response()->json([
            'message' => "Baja lógica procesada: Docente {$docente->nombre_docente} cambiado a estado {$nuevoEstado}.",
            'estado'  => $nuevoEstado,
        ]);
    }

    public function destroy($id)
    {
        $docente = Docente::withTrashed()->findOrFail($id);
        $nombre = "{$docente->nombre_docente} {$docente->apellido_docente}";

        DB::transaction(function () use ($docente) {
            $docente->idiomas()->detach();
            AsignacionDocenteParalelo::where('id_docente', $docente->id_docente)->delete();
            $docente->forceDelete();
        });

        AuditLogger::academico(AuditLogger::LEVEL_CRITICAL, 'DOCENTE_ELIMINADO_DEFINITIVO', [
            'nombre' => $nombre,
        ], null, 'docente');

        return response()->json([
            'message' => "Baja física definitiva ejecutada para el docente {$nombre}."
        ]);
    }
}
