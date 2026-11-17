<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Programa;
use App\Models\Nivel;
use App\Models\Libro;

class EstructuraAcademicaController extends Controller
{

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
            'nombre_programa'         => ['required','string','min:3','max:80','regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-\.]+$/','not_regex:/^\s+$/'],
            'duracion_anios_programa' => 'nullable|integer|min:1|max:5',
        ]);

        $validated['nombre_programa'] = trim($validated['nombre_programa']);
        if (mb_strlen($validated['nombre_programa']) < 3) {
            return response()->json(['error' => 'El nombre del programa debe tener al menos 3 caracteres significativos.'], 422);
        }

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
            'nombre_programa'         => ['required','string','min:3','max:80','regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-\.]+$/','not_regex:/^\s+$/'],
            'duracion_anios_programa' => 'nullable|integer|min:1|max:5',
        ]);

        $validated['nombre_programa'] = trim($validated['nombre_programa']);
        if (mb_strlen($validated['nombre_programa']) < 3) {
            return response()->json(['error' => 'El nombre del programa debe tener al menos 3 caracteres significativos.'], 422);
        }

        $programa->update($validated);
        return response()->json(['message' => 'Programa académico actualizado.', 'data' => $programa]);
    }

    public function destroyPrograma($id)
    {
        $programa = Programa::findOrFail($id);
        $programa->delete();
        return response()->json(['message' => 'Programa académico eliminado.']);
    }

    public function storeNivel(Request $request)
    {
        $validated = $request->validate([
            'id_programa'           => 'required|exists:programa,id_programa',
            'numero_nivel'          => 'required|integer|min:1',
            'nombre_nivel'          => ['required','string','min:3','max:50','regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\/\-\.]+$/','not_regex:/^\s+$/'],
            'cantidad_libros_nivel' => 'nullable|integer|min:1',
        ]);

        $validated['nombre_nivel'] = trim($validated['nombre_nivel']);
        if (mb_strlen($validated['nombre_nivel']) < 3) {
            return response()->json(['error' => 'El nombre del nivel debe tener al menos 3 caracteres significativos.'], 422);
        }

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
            'nombre_nivel'          => ['required','string','min:3','max:50','regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\/\-\.]+$/','not_regex:/^\s+$/'],
            'cantidad_libros_nivel' => 'nullable|integer|min:1',
        ]);

        $validated['nombre_nivel'] = trim($validated['nombre_nivel']);
        if (mb_strlen($validated['nombre_nivel']) < 3) {
            return response()->json(['error' => 'El nombre del nivel debe tener al menos 3 caracteres significativos.'], 422);
        }

        $nivel->update($validated);
        return response()->json(['message' => 'Nivel curricular actualizado.', 'data' => $nivel]);
    }

    public function destroyNivel($id)
    {
        $nivel = Nivel::findOrFail($id);
        $nivel->delete();
        return response()->json(['message' => 'Nivel curricular eliminado.']);
    }

    public function storeLibro(Request $request)
    {
        $validated = $request->validate([
            'id_nivel'     => 'required|exists:nivel,id_nivel',
            'numero_libro' => 'required|integer|min:1',
            'nombre_libro' => ['required','string','min:3','max:80','regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\/\-\.\(\)]+$/','not_regex:/^\s+$/'],
        ]);

        $validated['nombre_libro'] = trim($validated['nombre_libro']);
        if (mb_strlen($validated['nombre_libro']) < 3) {
            return response()->json(['error' => 'El nombre del libro debe tener al menos 3 caracteres significativos.'], 422);
        }

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
            'nombre_libro' => ['required','string','min:3','max:80','regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\/\-\.\(\)]+$/','not_regex:/^\s+$/'],
        ]);

        $validated['nombre_libro'] = trim($validated['nombre_libro']);
        if (mb_strlen($validated['nombre_libro']) < 3) {
            return response()->json(['error' => 'El nombre del libro debe tener al menos 3 caracteres significativos.'], 422);
        }

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
