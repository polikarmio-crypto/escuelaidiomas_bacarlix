<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Asistencia;
use App\Models\Paralelo;
use App\Models\Inscripcion;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AsistenciaController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'id_paralelo' => 'required|exists:paralelo,id_paralelo',
            'fecha' => 'nullable|date',
        ]);

        $idParalelo = $validated['id_paralelo'];
        $fecha = $validated['fecha'] ?? Carbon::now()->toDateString();

        $paralelo = Paralelo::with([
            'nivel.programa.idioma',
            'horario',
            'aula',
            'asignacionActiva.docente',
            'inscripciones' => function ($q) {
                $q->whereIn('estado_inscripcion', ['Activa', 'En curso'])
                  ->with('estudiante.militar');
            }
        ])->findOrFail($idParalelo);

        $asistenciasExistentes = Asistencia::where('id_paralelo', $idParalelo)
            ->where('fecha_asistencia', $fecha)
            ->get()
            ->keyBy('id_inscripcion');

        $estudiantes = $paralelo->inscripciones->map(function ($ins) use ($asistenciasExistentes) {
            $reg = $asistenciasExistentes->get($ins->id_inscripcion);

            return [
                'id_inscripcion' => $ins->id_inscripcion,
                'id_estudiante' => $ins->estudiante->id_estudiante,
                'nombre_completo' => "{$ins->estudiante->nombre_estudiante} {$ins->estudiante->apellido_estudiante}",
                'ci' => $ins->estudiante->ci_estudiante,
                'tipo' => $ins->estudiante->tipo_estudiante,
                'grado_militar' => $ins->estudiante->militar ? $ins->estudiante->militar->grado_militar : null,
                'id_asistencia' => $reg ? $reg->id_asistencia : null,
                'estado_asistencia' => $reg ? $reg->estado_asistencia : 'Presente',
                'observacion' => $reg ? $reg->observacion : '',
            ];
        });

        $resumen = [
            'total_alumnos' => $estudiantes->count(),
            'presentes' => $estudiantes->where('estado_asistencia', 'Presente')->count(),
            'faltas' => $estudiantes->where('estado_asistencia', 'Falta')->count(),
            'atrasos' => $estudiantes->where('estado_asistencia', 'Atraso')->count(),
            'licencias' => $estudiantes->where('estado_asistencia', 'Licencia')->count(),
        ];

        return response()->json([
            'paralelo' => [
                'id_paralelo' => $paralelo->id_paralelo,
                'codigo_paralelo' => $paralelo->codigo_paralelo,
                'idioma' => $paralelo->nivel->programa->idioma->nombre_idioma,
                'nivel' => $paralelo->nivel->nombre_nivel,
                'docente' => $paralelo->asignacionActiva && $paralelo->asignacionActiva->docente
                    ? "{$paralelo->asignacionActiva->docente->nombre_docente} {$paralelo->asignacionActiva->docente->apellido_docente}"
                    : 'Sin Docente Titular',
                'id_docente' => $paralelo->asignacionActiva ? $paralelo->asignacionActiva->id_docente : null,
                'aula' => $paralelo->aula ? $paralelo->aula->nombre_aula : 'Aula General',
                'horario' => $paralelo->horario ? "{$paralelo->horario->hora_inicio_horario} - {$paralelo->horario->hora_fin_horario}" : 'Turno Regular',
            ],
            'fecha' => $fecha,
            'resumen' => $resumen,
            'estudiantes' => $estudiantes,
        ]);
    }

    public function registrar(Request $request)
    {
        $validated = $request->validate([
            'id_paralelo' => 'required|exists:paralelo,id_paralelo',
            'fecha_asistencia' => 'required|date|before_or_equal:today',
            'id_docente' => 'nullable|exists:docente,id_docente',
            'asistencias' => 'required|array|min:1',
            'asistencias.*.id_inscripcion' => 'required|exists:inscripcion,id_inscripcion',
            'asistencias.*.id_estudiante' => 'required|exists:estudiante,id_estudiante',
            'asistencias.*.estado_asistencia' => 'required|in:Presente,Falta,Atraso,Licencia',
            'asistencias.*.observacion' => 'nullable|string|max:200',
        ]);

        return DB::transaction(function () use ($validated) {
            $guardados = [];

            foreach ($validated['asistencias'] as $item) {
                $asig = Asistencia::updateOrCreate(
                    [
                        'id_inscripcion' => $item['id_inscripcion'],
                        'fecha_asistencia' => $validated['fecha_asistencia'],
                    ],
                    [
                        'id_paralelo' => $validated['id_paralelo'],
                        'id_estudiante' => $item['id_estudiante'],
                        'id_docente' => $validated['id_docente'] ?? null,
                        'estado_asistencia' => $item['estado_asistencia'],
                        'observacion' => $item['observacion'] ?? null,
                    ]
                );

                $guardados[] = $asig;
            }

            AuditLogger::academico(AuditLogger::LEVEL_INFO, 'REGISTRO_ASISTENCIA_DIARIA', [
                'id_paralelo' => $validated['id_paralelo'],
                'fecha' => $validated['fecha_asistencia'],
                'total_registrados' => count($guardados),
            ], null, 'asistencia');

            return response()->json([
                'message' => 'Parte de asistencia institucional procesado y almacenado correctamente.',
                'total' => count($guardados),
                'fecha' => $validated['fecha_asistencia'],
            ], 200);
        });
    }

    public function reporte($idParalelo)
    {
        $paralelo = Paralelo::with([
            'nivel.programa.idioma',
            'horario',
            'aula',
            'asignacionActiva.docente',
            'inscripciones.estudiante.militar'
        ])->findOrFail($idParalelo);

        $asistencias = Asistencia::where('id_paralelo', $idParalelo)
            ->orderBy('fecha_asistencia')
            ->get();

        $fechas = $asistencias->pluck('fecha_asistencia')->unique()->map(function ($d) {
            return is_string($d) ? $d : $d->toDateString();
        })->values();

        $agrupado = $asistencias->groupBy('id_inscripcion');

        $matriz = $paralelo->inscripciones->map(function ($ins) use ($agrupado, $fechas) {
            $registrosAlumno = $agrupado->get($ins->id_inscripcion, collect());

            $totalSesiones = $fechas->count();
            $presentes = $registrosAlumno->where('estado_asistencia', 'Presente')->count();
            $atrasos = $registrosAlumno->where('estado_asistencia', 'Atraso')->count();
            $faltas = $registrosAlumno->where('estado_asistencia', 'Falta')->count();
            $licencias = $registrosAlumno->where('estado_asistencia', 'Licencia')->count();

            $ponderacion = $totalSesiones > 0
                ? round((($presentes + ($atrasos * 0.5)) / $totalSesiones) * 100, 1)
                : 100.0;

            return [
                'id_inscripcion' => $ins->id_inscripcion,
                'codigo' => $ins->estudiante->ci_estudiante,
                'estudiante' => "{$ins->estudiante->nombre_estudiante} {$ins->estudiante->apellido_estudiante}",
                'tipo' => $ins->estudiante->tipo_estudiante,
                'grado' => $ins->estudiante->militar ? $ins->estudiante->militar->grado_militar : null,
                'total_clases' => $totalSesiones,
                'presentes' => $presentes,
                'atrasos' => $atrasos,
                'faltas' => $faltas,
                'licencias' => $licencias,
                'porcentaje_asistencia' => $ponderacion,
                'estado_asistencia_general' => $ponderacion >= 80 ? 'REGULAR' : ($ponderacion >= 65 ? 'OBSERVADO' : 'CRÍTICO'),
            ];
        });

        AuditLogger::academico(AuditLogger::LEVEL_INFO, 'GENERACION_REPORTE_ASISTENCIA', [
            'id_paralelo' => $idParalelo,
            'codigo_paralelo' => $paralelo->codigo_paralelo,
        ], null, 'asistencia');

        return response()->json([
            'institucion' => [
                'entidad' => 'ESCUELA DE IDIOMAS DEL EJÉRCITO',
                'subtitulo' => 'COMANDO DE EDUCACIÓN Y DOCTRINA MILITAR (CEDMIL)',
                'codigo_reporte' => 'EIE-ACTA-ASIST-' . Carbon::now()->format('Ymd') . '-' . $paralelo->id_paralelo,
                'fecha_emision' => Carbon::now()->format('d/m/Y H:i'),
            ],
            'paralelo' => [
                'id_paralelo' => $paralelo->id_paralelo,
                'codigo' => $paralelo->codigo_paralelo,
                'idioma' => $paralelo->nivel->programa->idioma->nombre_idioma,
                'nivel' => $paralelo->nivel->nombre_nivel,
                'aula' => $paralelo->aula ? $paralelo->aula->nombre_aula : 'Aula Principal',
                'horario' => $paralelo->horario ? "{$paralelo->horario->hora_inicio_horario} a {$paralelo->horario->hora_fin_horario}" : 'Turno Regular',
                'docente' => $paralelo->asignacionActiva && $paralelo->asignacionActiva->docente
                    ? "{$paralelo->asignacionActiva->docente->nombre_docente} {$paralelo->asignacionActiva->docente->apellido_docente}"
                    : 'Docente Titular Asignado',
            ],
            'resumen_general' => [
                'total_estudiantes' => $matriz->count(),
                'total_fechas' => $fechas->count(),
                'promedio_asistencia_paralelo' => $matriz->avg('porcentaje_asistencia') ? round($matriz->avg('porcentaje_asistencia'), 1) : 100,
            ],
            'fechas_evaluadas' => $fechas,
            'estudiantes' => $matriz,
            'firmas' => [
                'docente' => [
                    'cargo' => 'Docente Catedrático Titular',
                    'nombre' => $paralelo->asignacionActiva && $paralelo->asignacionActiva->docente
                        ? "{$paralelo->asignacionActiva->docente->nombre_docente} {$paralelo->asignacionActiva->docente->apellido_docente}"
                        : 'Docente Responsable',
                ],
                'jefe_academico' => [
                    'cargo' => 'Jefe del Departamento Académico',
                    'nombre' => 'Tcnl. DEM. Hugo Banzer Rivera',
                ],
                'direccion' => [
                    'cargo' => 'Director General Escuela de Idiomas',
                    'nombre' => 'Cnl. DAEN. Roberto Méndez Silva',
                ],
            ],
        ]);
    }
}

