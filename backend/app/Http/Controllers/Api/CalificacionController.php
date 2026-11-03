<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EvaluacionLibro;
use App\Models\InscripcionLibro;
use App\Models\ExamenNivel;
use App\Models\Paralelo;
use App\Models\Libro;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CalificacionController extends Controller
{
    /**
     * Matriz de calificaciones de un paralelo determinado
     */
    public function notasParalelo($idParalelo)
    {
        $paralelo = Paralelo::with([
            'nivel.libros',
            'inscripciones.estudiante.militar',
            'inscripciones.librosAvance.libro',
            'inscripciones.librosAvance.evaluacion.docenteCalificador',
        ])->findOrFail($idParalelo);

        $matriz = $paralelo->inscripciones->map(function ($ins) {
            return [
                'id_inscripcion' => $ins->id_inscripcion,
                'estudiante' => [
                    'id_estudiante' => $ins->estudiante->id_estudiante,
                    'nombre_completo' => "{$ins->estudiante->nombre_estudiante} {$ins->estudiante->apellido_estudiante}",
                    'ci' => $ins->estudiante->ci_estudiante,
                    'tipo' => $ins->estudiante->tipo_estudiante,
                    'grado_militar' => $ins->estudiante->militar ? $ins->estudiante->militar->grado_militar : null,
                ],
                'libros_evaluados' => $ins->librosAvance->map(function ($libAvance) {
                    $eval = $libAvance->evaluacion;
                    return [
                        'id_inscripcion_libro' => $libAvance->id_inscripcion_libro,
                        'libro' => $libAvance->libro->nombre_libro,
                        'numero_libro' => $libAvance->libro->numero_libro,
                        'estado_libro' => $libAvance->estado_libro,
                        'nota_examen' => $eval ? $eval->nota_examen_libro : null,
                        'nota_oral' => $eval ? $eval->nota_defensa_oral : null,
                        'nota_participacion' => $eval ? $eval->nota_participacion_libro : null,
                        'nota_final' => $eval ? $eval->nota_final_libro : null,
                        'aprobado' => $eval ? $eval->esAprobado() : false,
                        'docente_calificador' => $eval ? "{$eval->docenteCalificador->nombre_docente} {$eval->docenteCalificador->apellido_docente}" : null,
                    ];
                }),
            ];
        });

        return response()->json([
            'paralelo' => $paralelo->codigo_paralelo,
            'nivel' => $paralelo->nivel->nombre_nivel,
            'alumnos' => $matriz,
        ]);
    }

    /**
     * Registro de notas con ponderación oficial militar (Examen 80%, Oral 10%, Participación 10%)
     */
    public function registrarNotaLibro(Request $request)
    {
        $validated = $request->validate([
            'id_inscripcion_libro'     => 'required|exists:inscripcion_libro,id_inscripcion_libro',
            'nota_examen_libro'        => 'nullable|numeric|min:0|max:100',
            'nota_defensa_oral'        => 'nullable|numeric|min:0|max:100',
            'nota_participacion_libro' => 'nullable|numeric|min:0|max:100',
            'nota_final_directa'       => 'nullable|numeric|min:0|max:100',
            'fecha_evaluacion_libro'   => 'nullable|date|before_or_equal:today',
            'id_docente_calificador'   => 'required|exists:docente,id_docente',
        ]);

        return DB::transaction(function () use ($validated) {
            $inscripcionLibro = InscripcionLibro::with(['libro', 'inscripcion.paralelo.nivel.libros'])
                ->findOrFail($validated['id_inscripcion_libro']);

            if (isset($validated['nota_final_directa']) && $validated['nota_final_directa'] !== null) {
                // Caso: Docente coloca directamente la nota promedio final
                $notaFinal = round((float) $validated['nota_final_directa'], 2);
                $notaExamen = $validated['nota_examen_libro'] ?? $notaFinal;
                $notaOral = $validated['nota_defensa_oral'] ?? $notaFinal;
                $notaPart = $validated['nota_participacion_libro'] ?? $notaFinal;
            } else {
                // Ponderación institucional oficial: 80% Examen + 10% Oral + 10% Participación
                $notaExamen = (float) ($validated['nota_examen_libro'] ?? 0);
                $notaOral   = (float) ($validated['nota_defensa_oral'] ?? 0);
                $notaPart   = (float) ($validated['nota_participacion_libro'] ?? 0);
                $notaFinal  = round(($notaExamen * 0.80) + ($notaOral * 0.10) + ($notaPart * 0.10), 2);
            }

            $esAprobado = $notaFinal >= 71.0;

            // Guardar o actualizar la evaluación
            $evaluacion = EvaluacionLibro::updateOrCreate(
                ['id_inscripcion_libro' => $validated['id_inscripcion_libro']],
                [
                    'nota_examen_libro'        => $notaExamen,
                    'nota_defensa_oral'        => $notaOral,
                    'nota_participacion_libro' => $notaPart,
                    'nota_final_libro'         => $notaFinal,
                    'id_docente_calificador'   => $validated['id_docente_calificador'],
                    'fecha_evaluacion_libro'   => $validated['fecha_evaluacion_libro'] ?? Carbon::now()->toDateString(),
                ]
            );

            // Actualizar el estado del libro cursado
            $inscripcionLibro->update([
                'fecha_fin_libro' => Carbon::now()->toDateString(),
                'estado_libro' => $esAprobado ? 'Aprobado' : 'Reprobado',
            ]);

            // Si aprobó, avanzar al siguiente libro del nivel de forma automática
            if ($esAprobado) {
                $libroActual = $inscripcionLibro->libro;
                $siguienteLibro = $inscripcionLibro->inscripcion->paralelo->nivel->libros()
                    ->where('numero_libro', '>', $libroActual->numero_libro)
                    ->orderBy('numero_libro')
                    ->first();

                if ($siguienteLibro) {
                    InscripcionLibro::firstOrCreate(
                        [
                            'id_inscripcion' => $inscripcionLibro->id_inscripcion,
                            'id_libro' => $siguienteLibro->id_libro,
                        ],
                        [
                            'fecha_inicio_libro' => Carbon::now()->toDateString(),
                            'estado_libro' => 'En curso',
                        ]
                    );
                }
            }

            return response()->json([
                'message' => 'Calificación procesada exitosamente.',
                'nota_final' => $notaFinal,
                'resultado' => $esAprobado ? 'APROBADO' : 'REPROBADO',
                'data' => $evaluacion,
            ]);
        });
    }

    /**
     * Registro de examen global de nivel
     */
    public function registrarExamenNivel(Request $request)
    {
        $validated = $request->validate([
            'id_inscripcion' => 'required|exists:inscripcion,id_inscripcion',
            'nota_examen_nivel' => 'required|numeric|min:0|max:100',
            'fecha_examen_nivel' => 'nullable|date|before_or_equal:today',
            'id_docente_calificador' => 'required|exists:docente,id_docente',
        ]);

        $aprobado = $validated['nota_examen_nivel'] >= 71.0;

        $examen = ExamenNivel::updateOrCreate(
            ['id_inscripcion' => $validated['id_inscripcion']],
            [
                'nota_examen_nivel' => $validated['nota_examen_nivel'],
                'id_docente_calificador' => $validated['id_docente_calificador'],
                'fecha_examen_nivel' => Carbon::now()->toDateString(),
                'estado_examen_nivel' => $aprobado ? 'Aprobado' : 'Reprobado',
            ]
        );

        return response()->json([
            'message' => 'Examen de suficiencia de nivel registrado con éxito',
            'resultado' => $aprobado ? 'APROBADO' : 'REPROBADO',
            'data' => $examen,
        ]);
    }
}
