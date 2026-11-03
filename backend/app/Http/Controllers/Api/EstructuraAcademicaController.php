<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Programa;
use App\Models\Nivel;
use App\Models\Libro;

class EstructuraAcademicaController extends Controller
{
    /**
     * MÓDULO 2: CREACIÓN DE LA ESTRUCTURA ACADÉMICA (Sprint 2, Casos de Uso 11.2, Secuencia 12.2)
     * Actor: Jefe Académico
     * Jerarquía: Programas -> Niveles -> Libros curriculares
     */
    public function index()
    {
        $programas = Programa::with([
            'idioma',
            'tipoPrograma',
            'niveles.libros'
        ])->orderBy('id_programa')->get();

        return response()->json($programas);
    }

    public function showPrograma($id)
    {
        $programa = Programa::with(['idioma', 'tipoPrograma', 'niveles.libros'])->findOrFail($id);
        return response()->json($programa);
    }

    public function storePrograma(Request $request)
    {
        $validated = $request->validate([
            'id_idioma'               => 'required|exists:idioma,id_idioma',
            'id_tipo_programa'        => 'required|exists:tipo_programa,id_tipo_programa',
            'nombre_programa'         => 'required|string|max:80',
            'duracion_anios_programa' => 'nullable|integer|min:1|max:5',
        ]);

        // Secuencia 12.2 paso 2: Verificar si el programa académico ya existe
        $existe = Programa::where('id_idioma', $validated['id_idioma'])
            ->where('id_tipo_programa', $validated['id_tipo_programa'])
            ->where('nombre_programa', 'ilike', trim($validated['nombre_programa']))
            ->exists();

        if ($existe) {
            return response()->json([
                'error' => "El programa académico '{$validated['nombre_programa']}' ya se encuentra registrado."
            ], 422);
        }

        $programa = Programa::create([
            'id_idioma'               => $validated['id_idioma'],
            'id_tipo_programa'        => $validated['id_tipo_programa'],
            'nombre_programa'         => trim($validated['nombre_programa']),
            'duracion_anios_programa' => $validated['duracion_anios_programa'] ?? 1,
        ]);

        return response()->json([
            'message' => 'Programa académico registrado exitosamente.',
            'data'    => $programa->load(['idioma', 'tipoPrograma'])
        ], 201);
    }

    public function updatePrograma(Request $request, $id)
    {
        $programa = Programa::findOrFail($id);
        $validated = $request->validate([
            'id_idioma'               => 'required|exists:idioma,id_idioma',
            'id_tipo_programa'        => 'required|exists:tipo_programa,id_tipo_programa',
            'nombre_programa'         => 'required|string|max:80',
            'duracion_anios_programa' => 'nullable|integer|min:1|max:5',
        ]);

        $programa->update($validated);
        return response()->json(['message' => 'Programa académico actualizado.', 'data' => $programa]);
    }

    public function destroyPrograma($id)
    {
        $programa = Programa::findOrFail($id);
        $programa->delete();
        return response()->json(['message' => 'Programa académico eliminado.']);
    }

    // ── NIVELES CURRICULARES ──
    public function storeNivel(Request $request)
    {
        $validated = $request->validate([
            'id_programa'           => 'required|exists:programa,id_programa',
            'numero_nivel'          => 'required|integer|min:1',
            'nombre_nivel'          => 'required|string|max:50',
            'cantidad_libros_nivel' => 'nullable|integer|min:1',
        ]);

        $existe = Nivel::where('id_programa', $validated['id_programa'])
            ->where('numero_nivel', $validated['numero_nivel'])
            ->exists();

        if ($existe) {
            return response()->json([
                'error' => "El nivel {$validated['numero_nivel']} ya existe en este programa académico."
            ], 422);
        }

        $nivel = Nivel::create($validated);
        return response()->json(['message' => 'Nivel curricular registrado con éxito.', 'data' => $nivel], 201);
    }

    public function updateNivel(Request $request, $id)
    {
        $nivel = Nivel::findOrFail($id);
        $validated = $request->validate([
            'numero_nivel'          => 'required|integer|min:1',
            'nombre_nivel'          => 'required|string|max:50',
            'cantidad_libros_nivel' => 'nullable|integer|min:1',
        ]);

        $nivel->update($validated);
        return response()->json(['message' => 'Nivel curricular actualizado.', 'data' => $nivel]);
    }

    public function destroyNivel($id)
    {
        $nivel = Nivel::findOrFail($id);
        $nivel->delete();
        return response()->json(['message' => 'Nivel curricular eliminado.']);
    }

    // ── LIBROS Y MÓDULOS DE TEXTO ──
    public function storeLibro(Request $request)
    {
        $validated = $request->validate([
            'id_nivel'     => 'required|exists:nivel,id_nivel',
            'numero_libro' => 'required|integer|min:1',
            'nombre_libro' => 'required|string|max:80',
        ]);

        $existe = Libro::where('id_nivel', $validated['id_nivel'])
            ->where('numero_libro', $validated['numero_libro'])
            ->exists();

        if ($existe) {
            return response()->json([
                'error' => "El libro N° {$validated['numero_libro']} ya está asignado a este nivel."
            ], 422);
        }

        $libro = Libro::create($validated);
        return response()->json(['message' => 'Libro/Texto curricular asignado al nivel con éxito.', 'data' => $libro], 201);
    }

    public function updateLibro(Request $request, $id)
    {
        $libro = Libro::findOrFail($id);
        $validated = $request->validate([
            'numero_libro' => 'required|integer|min:1',
            'nombre_libro' => 'required|string|max:80',
        ]);

        $libro->update($validated);
        return response()->json(['message' => 'Libro curricular actualizado.', 'data' => $libro]);
    }

    public function destroyLibro($id)
    {
        $libro = Libro::findOrFail($id);
        $libro->delete();
        return response()->json(['message' => 'Libro eliminado de la malla curricular.']);
    }
}
