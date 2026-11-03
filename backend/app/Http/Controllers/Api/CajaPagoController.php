<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FichaAtencion;
use App\Models\Pago;
use App\Models\Caja;
use App\Models\Gestion;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CajaPagoController extends Controller
{
    /**
     * Lista las cajas/ventanillas con su estado actual y métricas del día
     */
    public function listarCajas()
    {
        $hoy = Carbon::today();
        $cajas = Caja::all()->map(function ($caja) use ($hoy) {
            $fichasHoy = FichaAtencion::where('id_caja', $caja->id_caja)
                ->whereDate('hora_llegada_ficha', $hoy)
                ->get();

            $atendidas = $fichasHoy->where('estado_ficha', 'Atendida');
            $enAtencion = $fichasHoy->where('estado_ficha', 'En atencion')->first();

            // Métricas M/M/c del día para esta ventanilla
            $tiemposServicio = $atendidas->map(fn($f) => $f->tiempo_servicio_minutos)->filter();
            $tiemposEspera = $atendidas->map(fn($f) => $f->tiempo_espera_minutos)->filter();

            return [
                'id_caja'         => $caja->id_caja,
                'nombre_caja'     => $caja->nombre_caja,
                'ubicacion_caja'  => $caja->ubicacion_caja,
                'atendidas_hoy'   => $atendidas->count(),
                'en_atencion'     => $enAtencion ? [
                    'id_ficha'    => $enAtencion->id_ficha,
                    'numero_ficha' => $enAtencion->numero_ficha,
                    'estudiante'  => $enAtencion->estudiante->nombre_estudiante . ' ' . $enAtencion->estudiante->apellido_estudiante,
                ] : null,
                'promedio_servicio_min' => $tiemposServicio->isNotEmpty() ? round($tiemposServicio->avg(), 1) : null,
                'promedio_espera_min'   => $tiemposEspera->isNotEmpty() ? round($tiemposEspera->avg(), 1) : null,
            ];
        });

        return response()->json($cajas);
    }

    /**
     * Cola FIFO completa: Fichas en espera ordenadas estrictamente por hora de llegada (First In, First Out)
     */
    public function colaFifo()
    {
        $fichasEnEspera = FichaAtencion::with('estudiante.militar')
            ->enEspera()
            ->get()
            ->map(function ($ficha, $index) {
                return [
                    'posicion_fifo'   => $index + 1,
                    'id_ficha'        => $ficha->id_ficha,
                    'numero_ficha'    => $ficha->numero_ficha,
                    'estudiante'      => $ficha->estudiante->nombre_estudiante . ' ' . $ficha->estudiante->apellido_estudiante,
                    'tipo_estudiante' => $ficha->estudiante->tipo_estudiante,
                    'hora_llegada'    => $ficha->hora_llegada_ficha->format('H:i:s'),
                    'minutos_esperando' => $ficha->tiempo_espera_minutos,
                ];
            });

        return response()->json([
            'total_en_espera' => $fichasEnEspera->count(),
            'cola_fifo'       => $fichasEnEspera,
        ]);
    }

    /**
     * Emitir nueva ficha de atención (encolar estudiante con disciplina FIFO)
     */
    public function emitirFicha(Request $request)
    {
        $validated = $request->validate([
            'id_estudiante' => 'required|exists:estudiante,id_estudiante',
        ]);

        // Obtener el siguiente número correlativo del día
        $ultimoNumero = FichaAtencion::whereDate('hora_llegada_ficha', Carbon::today())
            ->max('numero_ficha');
        $nuevoNumero = ($ultimoNumero ?? 100) + 1;

        $ficha = FichaAtencion::create([
            'id_caja'                     => null, // Sin asignar hasta ser llamado
            'id_estudiante'               => $validated['id_estudiante'],
            'numero_ficha'                => $nuevoNumero,
            'hora_llegada_ficha'          => Carbon::now(),
            'hora_inicio_atencion_ficha'  => null,
            'hora_fin_atencion_ficha'     => null,
            'estado_ficha'                => 'En espera',
        ]);

        // Calcular posición FIFO actual
        $posicion = FichaAtencion::where('estado_ficha', 'En espera')
            ->where('hora_llegada_ficha', '<=', $ficha->hora_llegada_ficha)
            ->count();

        return response()->json([
            'message'        => 'Ficha de atención emitida correctamente (Disciplina FIFO)',
            'numero_ficha'   => $nuevoNumero,
            'posicion_fifo'  => $posicion,
            'data'           => $ficha->load('estudiante'),
        ], 201);
    }

    /**
     * Llamar al siguiente turno FIFO para una ventanilla/caja específica
     */
    public function llamarSiguienteFifo(Request $request)
    {
        $validated = $request->validate([
            'id_caja' => 'required|exists:caja,id_caja',
        ]);

        // Verificar que la caja no tenga ya una ficha en atención
        $enAtencion = FichaAtencion::where('id_caja', $validated['id_caja'])
            ->where('estado_ficha', 'En atencion')
            ->exists();

        if ($enAtencion) {
            return response()->json([
                'error' => 'La ventanilla tiene un turno activo. Debe finalizarlo antes de llamar al siguiente.'
            ], 422);
        }

        // FIFO: El que llegó primero (hora_llegada_ficha más antigua) se atiende primero
        $siguienteFicha = FichaAtencion::where('estado_ficha', 'En espera')
            ->orderBy('hora_llegada_ficha', 'asc')
            ->first();

        if (!$siguienteFicha) {
            return response()->json([
                'message' => 'No hay fichas en espera en la cola FIFO.'
            ], 200);
        }

        $siguienteFicha->update([
            'id_caja'                    => $validated['id_caja'],
            'hora_inicio_atencion_ficha' => Carbon::now(),
            'estado_ficha'               => 'En atencion',
        ]);

        return response()->json([
            'message' => 'Turno FIFO llamado a ventanilla exitosamente.',
            'data'    => $siguienteFicha->load(['estudiante.militar', 'caja']),
        ]);
    }

    /**
     * Finalizar atención de un turno en ventanilla
     */
    public function finalizarAtencion(Request $request)
    {
        $validated = $request->validate([
            'id_ficha' => 'required|exists:ficha_atencion,id_ficha',
        ]);

        $ficha = FichaAtencion::findOrFail($validated['id_ficha']);

        if ($ficha->estado_ficha !== 'En atencion') {
            return response()->json([
                'error' => 'Solo se puede finalizar una ficha que esté en atención.'
            ], 422);
        }

        $ficha->update([
            'hora_fin_atencion_ficha' => Carbon::now(),
            'estado_ficha'            => 'Atendida',
        ]);

        return response()->json([
            'message'                  => 'Atención finalizada exitosamente.',
            'tiempo_servicio_minutos'  => $ficha->tiempo_servicio_minutos,
            'tiempo_espera_minutos'    => $ficha->tiempo_espera_minutos,
            'data'                     => $ficha,
        ]);
    }

    /**
     * Registrar un pago asociado a una ficha de atención
     */
    public function registrarPago(Request $request)
    {
        $validated = $request->validate([
            'id_estudiante'       => 'required|exists:estudiante,id_estudiante',
            'id_tipo_pago'        => 'required|exists:tipo_pago,id_tipo_pago',
            'id_inscripcion'      => 'nullable|exists:inscripcion,id_inscripcion',
            'id_inscripcion_libro' => 'nullable|exists:inscripcion_libro,id_inscripcion_libro',
            'id_caja'             => 'required|exists:caja,id_caja',
            'id_ficha'            => 'nullable|exists:ficha_atencion,id_ficha',
            'monto_pago'          => 'required|numeric|min:0|max:50000',
            'fecha_pago'          => 'nullable|date|before_or_equal:today',
        ]);

        $gestionActiva = Gestion::where('estado_gestion', 'Activa')->firstOrFail();

        $pago = Pago::create([
            'id_estudiante'       => $validated['id_estudiante'],
            'id_tipo_pago'        => $validated['id_tipo_pago'],
            'id_inscripcion'      => $validated['id_inscripcion'] ?? null,
            'id_inscripcion_libro' => $validated['id_inscripcion_libro'] ?? null,
            'id_gestion'          => $gestionActiva->id_gestion,
            'id_caja'             => $validated['id_caja'],
            'id_ficha'            => $validated['id_ficha'] ?? null,
            'monto_pago'          => $validated['monto_pago'],
            'fecha_pago'          => $validated['fecha_pago'] ?? Carbon::now(),
        ]);

        return response()->json([
            'message' => 'Pago registrado exitosamente en el sistema financiero.',
            'data'    => $pago->load(['estudiante', 'tipoPago', 'caja']),
        ], 201);
    }

    /**
     * Métricas de Teoría de Colas (M/M/c) del día para integración con Quarkus
     */
    public function metricasCola()
    {
        $hoy = Carbon::today();
        $fichasHoy = FichaAtencion::whereDate('hora_llegada_ficha', $hoy)->get();

        $atendidas = $fichasHoy->where('estado_ficha', 'Atendida');
        $enEspera = $fichasHoy->where('estado_ficha', 'En espera');
        $enAtencion = $fichasHoy->where('estado_ficha', 'En atencion');

        $tiemposServicio = $atendidas->map(fn($f) => $f->tiempo_servicio_minutos)->filter();
        $tiemposEspera = $atendidas->map(fn($f) => $f->tiempo_espera_minutos)->filter();

        // Cálculos M/M/c
        $totalHorasDia = Carbon::now()->diffInMinutes($hoy) / 60;
        $tasaLlegada = $totalHorasDia > 0 ? $fichasHoy->count() / $totalHorasDia : 0; // λ (lambda)
        $tasaServicio = $tiemposServicio->isNotEmpty() ? 60 / $tiemposServicio->avg() : 0; // μ (mu)
        $servidoresActivos = Caja::count(); // c
        $utilizacion = ($servidoresActivos > 0 && $tasaServicio > 0)
            ? $tasaLlegada / ($servidoresActivos * $tasaServicio)
            : 0; // ρ (rho)

        return response()->json([
            'fecha'                        => $hoy->format('Y-m-d'),
            'total_fichas_dia'             => $fichasHoy->count(),
            'atendidas'                    => $atendidas->count(),
            'en_espera'                    => $enEspera->count(),
            'en_atencion'                  => $enAtencion->count(),
            'servidores_activos_c'         => $servidoresActivos,
            'tasa_llegada_lambda'          => round($tasaLlegada, 4),
            'tasa_servicio_mu'             => round($tasaServicio, 4),
            'utilizacion_rho'              => round($utilizacion, 4),
            'promedio_espera_minutos_Wq'   => $tiemposEspera->isNotEmpty() ? round($tiemposEspera->avg(), 2) : 0,
            'promedio_servicio_minutos_Ws' => $tiemposServicio->isNotEmpty() ? round($tiemposServicio->avg(), 2) : 0,
            'max_espera_minutos'           => $tiemposEspera->isNotEmpty() ? round($tiemposEspera->max(), 2) : 0,
            'longitud_cola_Lq'             => $enEspera->count(),
        ]);
    }

    /**
     * Historial de pagos con filtros
     */
    public function historialPagos(Request $request)
    {
        $query = Pago::with(['estudiante', 'tipoPago', 'caja', 'gestion', 'ficha']);

        if ($request->has('id_gestion')) {
            $query->where('id_gestion', $request->id_gestion);
        }

        if ($request->has('id_caja')) {
            $query->where('id_caja', $request->id_caja);
        }

        if ($request->has('fecha_desde')) {
            $query->whereDate('fecha_pago', '>=', $request->fecha_desde);
        }

        if ($request->has('fecha_hasta')) {
            $query->whereDate('fecha_pago', '<=', $request->fecha_hasta);
        }

        $pagos = $query->orderByDesc('fecha_pago')->paginate($request->get('per_page', 20));

        return response()->json($pagos);
    }
}
