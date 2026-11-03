<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Gestion;
use App\Models\Idioma;
use App\Models\TipoPrograma;
use App\Models\Modalidad;
use App\Models\Horario;
use App\Models\Aula;
use App\Models\TipoPago;
use App\Models\Caja;

class CatalogoController extends Controller
{
    /**
     * MÓDULO 1: GESTIÓN DE CATÁLOGOS BASE (Sprint 1, Secuencia 12.1)
     * Actor: Administrador del Sistema
     * Parametrizaciones generales: gestiones, idiomas, aulas, horarios, tipos programa, modalidades, tipos pago, cajas.
     */
    public function index()
    {
        return response()->json([
            'gestiones'      => Gestion::orderBy('anio_gestion', 'desc')->get(),
            'idiomas'        => Idioma::orderBy('nombre_idioma')->get(),
            'tipos_programa' => TipoPrograma::all(),
            'modalidades'    => Modalidad::all(),
            'horarios'       => Horario::orderBy('hora_inicio_horario')->get(),
            'aulas'          => Aula::orderBy('nombre_aula')->get(),
            'tipos_pago'     => TipoPago::all(),
            'cajas'          => Caja::orderBy('nombre_caja')->get(),
        ]);
    }

    // ── GESTIONES ANUALES ──
    public function gestiones()
    {
        return response()->json(Gestion::orderBy('anio_gestion', 'desc')->get());
    }

    public function storeGestion(Request $request)
    {
        $validated = $request->validate([
            'anio_gestion'   => 'required|integer|min:2020|max:2040',
            'estado_gestion' => 'required|in:Activa,Cerrada',
        ]);

        if (Gestion::where('anio_gestion', $validated['anio_gestion'])->exists()) {
            return response()->json([
                'error' => "La gestión académica {$validated['anio_gestion']} ya se encuentra registrada en el sistema."
            ], 422);
        }

        $gestion = Gestion::create($validated);
        return response()->json([
            'message' => 'Gestión académica registrada exitosamente.',
            'data' => $gestion
        ], 201);
    }

    public function updateGestion(Request $request, $id)
    {
        $gestion = Gestion::findOrFail($id);
        $validated = $request->validate([
            'anio_gestion'   => 'required|integer|min:2020|max:2040|unique:gestion,anio_gestion,' . $id . ',id_gestion',
            'estado_gestion' => 'required|in:Activa,Cerrada',
        ]);

        $gestion->update($validated);
        return response()->json(['message' => 'Gestión actualizada correctamente.', 'data' => $gestion]);
    }

    public function destroyGestion($id)
    {
        $gestion = Gestion::findOrFail($id);
        $gestion->delete();
        return response()->json(['message' => 'Gestión eliminada del catálogo.']);
    }

    // ── IDIOMAS OFERTADOS ──
    public function idiomas()
    {
        return response()->json(Idioma::orderBy('nombre_idioma')->get());
    }

    public function storeIdioma(Request $request)
    {
        $validated = $request->validate([
            'nombre_idioma' => 'required|string|max:50',
        ]);

        if (Idioma::where('nombre_idioma', 'ilike', trim($validated['nombre_idioma']))->exists()) {
            return response()->json([
                'error' => "El idioma '{$validated['nombre_idioma']}' ya existe en el catálogo institucional."
            ], 422);
        }

        $idioma = Idioma::create(['nombre_idioma' => trim($validated['nombre_idioma'])]);
        return response()->json([
            'message' => 'Idioma ofertado registrado con éxito.',
            'data' => $idioma
        ], 201);
    }

    public function updateIdioma(Request $request, $id)
    {
        $idioma = Idioma::findOrFail($id);
        $validated = $request->validate([
            'nombre_idioma' => 'required|string|max:50',
        ]);

        $idioma->update(['nombre_idioma' => trim($validated['nombre_idioma'])]);
        return response()->json(['message' => 'Idioma actualizado.', 'data' => $idioma]);
    }

    public function destroyIdioma($id)
    {
        $idioma = Idioma::findOrFail($id);
        $idioma->delete();
        return response()->json(['message' => 'Idioma eliminado del catálogo.']);
    }

    // ── AULAS Y ESPACIOS FÍSICOS ──
    public function aulas()
    {
        return response()->json(Aula::orderBy('nombre_aula')->get());
    }

    public function storeAula(Request $request)
    {
        $validated = $request->validate([
            'nombre_aula'    => 'required|string|max:30',
            'capacidad_aula' => 'required|integer|min:5|max:100',
        ]);

        if (Aula::where('nombre_aula', 'ilike', trim($validated['nombre_aula']))->exists()) {
            return response()->json([
                'error' => "El aula '{$validated['nombre_aula']}' ya está registrada."
            ], 422);
        }

        $aula = Aula::create([
            'nombre_aula'    => trim($validated['nombre_aula']),
            'capacidad_aula' => $validated['capacidad_aula']
        ]);
        return response()->json(['message' => 'Ambiente/Aula registrada exitosamente.', 'data' => $aula], 201);
    }

    public function updateAula(Request $request, $id)
    {
        $aula = Aula::findOrFail($id);
        $validated = $request->validate([
            'nombre_aula'    => 'required|string|max:30',
            'capacidad_aula' => 'required|integer|min:5|max:100',
        ]);

        $aula->update([
            'nombre_aula'    => trim($validated['nombre_aula']),
            'capacidad_aula' => $validated['capacidad_aula']
        ]);
        return response()->json(['message' => 'Aula actualizada.', 'data' => $aula]);
    }

    public function destroyAula($id)
    {
        $aula = Aula::findOrFail($id);
        $aula->delete();
        return response()->json(['message' => 'Aula eliminada del catálogo.']);
    }

    // ── HORARIOS Y TURNOS ──
    public function horarios()
    {
        return response()->json(Horario::orderBy('hora_inicio_horario')->get());
    }

    public function storeHorario(Request $request)
    {
        $validated = $request->validate([
            'hora_inicio_horario' => 'required|date_format:H:i',
            'hora_fin_horario'    => 'required|date_format:H:i|after:hora_inicio_horario',
        ]);

        $existe = Horario::where('hora_inicio_horario', $validated['hora_inicio_horario'])
            ->where('hora_fin_horario', $validated['hora_fin_horario'])
            ->exists();

        if ($existe) {
            return response()->json(['error' => 'La franja horaria especificada ya existe.'], 422);
        }

        $horario = Horario::create($validated);
        return response()->json(['message' => 'Horario registrado exitosamente.', 'data' => $horario], 201);
    }

    public function updateHorario(Request $request, $id)
    {
        $horario = Horario::findOrFail($id);
        $validated = $request->validate([
            'hora_inicio_horario' => 'required|date_format:H:i',
            'hora_fin_horario'    => 'required|date_format:H:i|after:hora_inicio_horario',
        ]);

        $horario->update($validated);
        return response()->json(['message' => 'Horario actualizado.', 'data' => $horario]);
    }

    public function destroyHorario($id)
    {
        $horario = Horario::findOrFail($id);
        $horario->delete();
        return response()->json(['message' => 'Horario eliminado.']);
    }

    // ── TIPOS DE PROGRAMA Y MODALIDADES ──
    public function tiposPrograma()
    {
        return response()->json(TipoPrograma::all());
    }

    public function storeTipoPrograma(Request $request)
    {
        $validated = $request->validate(['nombre_tipo_programa' => 'required|string|max:30']);
        if (TipoPrograma::where('nombre_tipo_programa', 'ilike', trim($validated['nombre_tipo_programa']))->exists()) {
            return response()->json(['error' => 'El tipo de programa ya existe.'], 422);
        }
        $item = TipoPrograma::create(['nombre_tipo_programa' => trim($validated['nombre_tipo_programa'])]);
        return response()->json(['message' => 'Tipo de programa registrado.', 'data' => $item], 201);
    }

    public function modalidades()
    {
        return response()->json(Modalidad::all());
    }

    public function storeModalidad(Request $request)
    {
        $validated = $request->validate(['nombre_modalidad' => 'required|string|max:20']);
        if (Modalidad::where('nombre_modalidad', 'ilike', trim($validated['nombre_modalidad']))->exists()) {
            return response()->json(['error' => 'La modalidad ya existe.'], 422);
        }
        $item = Modalidad::create(['nombre_modalidad' => trim($validated['nombre_modalidad'])]);
        return response()->json(['message' => 'Modalidad registrada.', 'data' => $item], 201);
    }

    // ── TIPOS DE PAGO ──
    public function tiposPago()
    {
        return response()->json(TipoPago::all());
    }

    public function storeTipoPago(Request $request)
    {
        $validated = $request->validate(['nombre_tipo_pago' => 'required|string|max:40']);
        if (TipoPago::where('nombre_tipo_pago', 'ilike', trim($validated['nombre_tipo_pago']))->exists()) {
            return response()->json(['error' => 'El concepto/tipo de pago ya existe.'], 422);
        }
        $item = TipoPago::create(['nombre_tipo_pago' => trim($validated['nombre_tipo_pago'])]);
        return response()->json(['message' => 'Tipo de pago registrado con éxito.', 'data' => $item], 201);
    }

    // ── CAJAS ──
    public function cajas()
    {
        return response()->json(Caja::all());
    }

    public function storeCaja(Request $request)
    {
        $validated = $request->validate([
            'nombre_caja'    => 'required|string|max:30',
            'ubicacion_caja' => 'required|string|max:80',
        ]);
        if (Caja::where('nombre_caja', 'ilike', trim($validated['nombre_caja']))->exists()) {
            return response()->json(['error' => 'La caja/ventanilla ya está registrada.'], 422);
        }
        $caja = Caja::create([
            'nombre_caja'    => trim($validated['nombre_caja']),
            'ubicacion_caja' => trim($validated['ubicacion_caja'])
        ]);
        return response()->json(['message' => 'Caja/Ventanilla registrada.', 'data' => $caja], 201);
    }
}
