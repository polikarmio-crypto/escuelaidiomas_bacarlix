<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Inscripcion;
use App\Models\InscripcionLibro;
use App\Models\Paralelo;
use App\Models\Libro;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class InscripcionController extends Controller
{
    public function index(Request $request)
    {
        $inscripciones = Inscripcion::with([
            'estudiante.militar',
            'paralelo.nivel.programa.idioma',
            'paralelo.aula',
            'librosAvance.libro',
        ])->latest('fecha_inscripcion')->paginate(20);

        return response()->json($inscripciones);
    }

    public function inscribir(Request $request)
    {
        $validated = $request->validate([
            'id_estudiante' => 'required|exists:estudiante,id_estudiante',
            'id_paralelo' => 'required|exists:paralelo,id_paralelo',
        ]);

        return DB::transaction(function () use ($validated) {
            $paralelo = Paralelo::with('nivel.libros')->findOrFail($validated['id_paralelo']);

            if (!$paralelo->tiene_cupo_disponible) {
                AuditLogger::academico(AuditLogger::LEVEL_WARNING, 'INSCRIPCION_RECHAZADA_AFORO_COMPLETO', [
                    'id_estudiante' => $validated['id_estudiante'],
                    'id_paralelo' => $validated['id_paralelo'],
                ]);

                return response()->json([
                    'error' => 'Aforo completo: No existen cupos disponibles en el paralelo seleccionado.'
                ], 422);
            }

            $yaInscrito = Inscripcion::where('id_estudiante', $validated['id_estudiante'])
                ->where('id_paralelo', $validated['id_paralelo'])
                ->where('estado_inscripcion', 'Activa')
                ->exists();

            if ($yaInscrito) {
                return response()->json([
                    'error' => 'El estudiante ya se encuentra formalmente matriculado en este paralelo.'
                ], 422);
            }

            $inscripcion = Inscripcion::create([
                'id_estudiante' => $validated['id_estudiante'],
                'id_paralelo' => $validated['id_paralelo'],
                'fecha_inscripcion' => Carbon::now()->toDateString(),
                'estado_inscripcion' => 'Activa',
            ]);

            $librosNivel = $paralelo->nivel->libros()->orderBy('numero_libro')->get();
            $esPrimero = true;
            foreach ($librosNivel as $lib) {
                InscripcionLibro::create([
                    'id_inscripcion'     => $inscripcion->id_inscripcion,
                    'id_libro'           => $lib->id_libro,
                    'fecha_inicio_libro' => $esPrimero ? Carbon::now()->toDateString() : null,
                    'fecha_fin_libro'    => null,
                    'estado_libro'       => $esPrimero ? 'En curso' : 'Pendiente',
                ]);
                $esPrimero = false;
            }

            AuditLogger::academico(AuditLogger::LEVEL_INFO, 'INSCRIPCION_FORMALIZADA', [
                'id_inscripcion' => $inscripcion->id_inscripcion,
                'id_estudiante' => $validated['id_estudiante'],
                'id_paralelo' => $validated['id_paralelo'],
            ], null, 'inscripcion', $inscripcion->id_inscripcion);

            return response()->json([
                'message' => 'Estudiante matriculado exitosamente con avance curricular inicializado.',
                'data' => $inscripcion->load(['estudiante.militar', 'paralelo.nivel.programa.idioma', 'librosAvance.libro']),
            ], 201);
        });
    }

    public function show($id)
    {
        $inscripcion = Inscripcion::with([
            'estudiante.militar',
            'paralelo.nivel.programa.idioma',
            'paralelo.docenteActual.docente',
            'librosAvance.libro',
            'librosAvance.evaluacion.docenteCalificador',
            'examenNivel',
        ])->findOrFail($id);

        return response()->json($inscripcion);
    }
}
