<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FichaAtencion;
use App\Models\Pago;
use App\Models\Caja;
use App\Models\Gestion;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CajaPagoController extends Controller
{
    public function listarCajas()
    {
        $hoy = Carbon::today();
        $cajas = Caja::all()->map(function ($caja) use ($hoy) {
            $fichasHoy = FichaAtencion::where('id_caja', $caja->id_caja)
                ->whereDate('hora_llegada_ficha', $hoy)
                ->get();

            $atendidas = $fichasHoy->where('estado_ficha', 'Atendida');
            $enAtencion = $fichasHoy->where('estado_ficha', 'En atencion')->first();

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
                    'estudiante'  => "{$enAtencion->estudiante->nombre_estudiante} {$enAtencion->estudiante->apellido_estudiante}",
                ] : null,
                'promedio_servicio_min' => $tiemposServicio->isNotEmpty() ? round($tiemposServicio->avg(), 1) : null,
                'promedio_espera_min'   => $tiemposEspera->isNotEmpty() ? round($tiemposEspera->avg(), 1) : null,
            ];
        });

        return response()->json($cajas);
    }

    public function colaAtencion()
    {
        return $this->colaEspera();
    }

    public function colaEspera()
    {
        $fichasEnEspera = FichaAtencion::with('estudiante.militar')
            ->enEspera()
            ->orderBy('hora_llegada_ficha', 'asc')
            ->get()
            ->map(function ($ficha, $index) {
                return [
                    'posicion'        => $index + 1,
                    'posicion_cola'   => $index + 1,
                    'id_ficha'        => $ficha->id_ficha,
                    'numero_ficha'    => $ficha->numero_ficha,
                    'estudiante'      => "{$ficha->estudiante->nombre_estudiante} {$ficha->estudiante->apellido_estudiante}",
                    'tipo_estudiante' => $ficha->estudiante->tipo_estudiante,
                    'hora_llegada'    => $ficha->hora_llegada_ficha->format('H:i:s'),
                    'minutos_esperando' => $ficha->tiempo_espera_minutos,
                ];
            });

        return response()->json([
            'total_en_espera' => $fichasEnEspera->count(),
            'cola_espera'     => $fichasEnEspera,
            'cola_atencion'   => $fichasEnEspera,
        ]);
    }

    public function emitirFicha(Request $request)
    {
        $validated = $request->validate([
            'id_estudiante' => 'required|exists:estudiante,id_estudiante',
        ]);

        return DB::transaction(function () use ($validated) {
            $fichaActiva = FichaAtencion::where('id_estudiante', $validated['id_estudiante'])
                ->whereIn('estado_ficha', ['En espera', 'En atencion'])
                ->whereDate('hora_llegada_ficha', Carbon::today())
                ->lockForUpdate()
                ->first();

            if ($fichaActiva) {
                $posicionExistente = FichaAtencion::where('estado_ficha', 'En espera')
                    ->where('hora_llegada_ficha', '<=', $fichaActiva->hora_llegada_ficha)
                    ->count();

                AuditLogger::cajas(AuditLogger::LEVEL_INFO, 'FICHA_CONSULTA_DUPLICADA', [
                    'id_estudiante' => $validated['id_estudiante'],
                    'numero_ficha' => $fichaActiva->numero_ficha,
                ], null, $fichaActiva->id_ficha);

                return response()->json([
                    'message'        => 'Ya cuenta con un turno activo en sala de espera.',
                    'numero_ficha'   => $fichaActiva->numero_ficha,
                    'posicion'       => $posicionExistente,
                    'posicion_cola'  => $posicionExistente,
                    'data'           => $fichaActiva->load('estudiante'),
                ], 200);
            }

            $ultimoNumero = FichaAtencion::whereDate('hora_llegada_ficha', Carbon::today())
                ->lockForUpdate()
                ->max('numero_ficha');

            $nuevoNumero = ($ultimoNumero ?? 100) + 1;

            $ficha = FichaAtencion::create([
                'id_caja'                    => null,
                'id_estudiante'              => $validated['id_estudiante'],
                'numero_ficha'               => $nuevoNumero,
                'hora_llegada_ficha'         => Carbon::now(),
                'hora_inicio_atencion_ficha' => null,
                'hora_fin_atencion_ficha'    => null,
                'estado_ficha'               => 'En espera',
            ]);

            $posicion = FichaAtencion::where('estado_ficha', 'En espera')
                ->where('hora_llegada_ficha', '<=', $ficha->hora_llegada_ficha)
                ->count();

            AuditLogger::cajas(AuditLogger::LEVEL_INFO, 'EMISION_FICHA_ATENCION', [
                'id_estudiante' => $validated['id_estudiante'],
                'numero_ficha' => $nuevoNumero,
                'posicion' => $posicion,
            ], null, $ficha->id_ficha);

            return response()->json([
                'message'        => 'Ficha de atención emitida correctamente.',
                'numero_ficha'   => $nuevoNumero,
                'posicion'       => $posicion,
                'posicion_cola'  => $posicion,
                'data'           => $ficha->load('estudiante'),
            ], 201);
        });
    }

    public function llamarSiguienteTurno(Request $request)
    {
        return $this->llamarSiguiente($request);
    }

    public function llamarSiguiente(Request $request)
    {
        $validated = $request->validate([
            'id_caja' => 'required|exists:caja,id_caja',
        ]);

        return DB::transaction(function () use ($validated) {
            $caja = Caja::lockForUpdate()->findOrFail($validated['id_caja']);

            $enAtencion = FichaAtencion::where('id_caja', $validated['id_caja'])
                ->where('estado_ficha', 'En atencion')
                ->lockForUpdate()
                ->first();

            if ($enAtencion) {
                AuditLogger::cajas(AuditLogger::LEVEL_WARNING, 'LLAMADA_FALLIDA_VENTANILLA_OCUPADA', [
                    'id_caja' => $validated['id_caja'],
                    'ficha_actual' => $enAtencion->numero_ficha,
                ], null, $enAtencion->id_ficha);

                return response()->json([
                    'error' => 'La ventanilla tiene un turno activo. Debe finalizar la atención antes de llamar al siguiente.'
                ], 422);
            }

            $siguienteFicha = FichaAtencion::where('estado_ficha', 'En espera')
                ->orderBy('hora_llegada_ficha', 'asc')
                ->lockForUpdate()
                ->first();

            if (!$siguienteFicha) {
                return response()->json([
                    'message' => 'No hay turnos pendientes en sala de espera.'
                ], 200);
            }

            $siguienteFicha->update([
                'id_caja'                    => $validated['id_caja'],
                'hora_inicio_atencion_ficha' => Carbon::now(),
                'estado_ficha'               => 'En atencion',
            ]);

            AuditLogger::cajas(AuditLogger::LEVEL_INFO, 'TURNO_LLAMADO_VENTANILLA', [
                'id_caja' => $validated['id_caja'],
                'numero_ficha' => $siguienteFicha->numero_ficha,
                'id_estudiante' => $siguienteFicha->id_estudiante,
            ], null, $siguienteFicha->id_ficha);

            return response()->json([
                'message' => 'Turno llamado a ventanilla exitosamente.',
                'data'    => $siguienteFicha->load(['estudiante.militar', 'caja']),
            ]);
        });
    }

    public function finalizarAtencion(Request $request)
    {
        $validated = $request->validate([
            'id_ficha' => 'required|exists:ficha_atencion,id_ficha',
        ]);

        return DB::transaction(function () use ($validated) {
            $ficha = FichaAtencion::lockForUpdate()->findOrFail($validated['id_ficha']);

            if ($ficha->estado_ficha !== 'En atencion') {
                return response()->json([
                    'error' => 'Solo se puede finalizar una ficha que esté en estado En atención.'
                ], 422);
            }

            $ficha->update([
                'hora_fin_atencion_ficha' => Carbon::now(),
                'estado_ficha'            => 'Atendida',
            ]);

            AuditLogger::cajas(AuditLogger::LEVEL_INFO, 'ATENCION_FINALIZADA', [
                'id_ficha' => $ficha->id_ficha,
                'numero_ficha' => $ficha->numero_ficha,
                'tiempo_servicio_minutos' => $ficha->tiempo_servicio_minutos,
            ], null, $ficha->id_ficha);

            return response()->json([
                'message'                  => 'Atención finalizada exitosamente.',
                'tiempo_servicio_minutos'  => $ficha->tiempo_servicio_minutos,
                'tiempo_espera_minutos'    => $ficha->tiempo_espera_minutos,
                'data'                     => $ficha,
            ]);
        });
    }

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

        return DB::transaction(function () use ($validated) {
            $gestionActiva = Gestion::where('estado_gestion', 'Activa')->first();
            $idGestion = $gestionActiva ? $gestionActiva->id_gestion : 1;

            $pago = Pago::create([
                'id_estudiante'       => $validated['id_estudiante'],
                'id_tipo_pago'        => $validated['id_tipo_pago'],
                'id_inscripcion'      => $validated['id_inscripcion'] ?? null,
                'id_inscripcion_libro' => $validated['id_inscripcion_libro'] ?? null,
                'id_gestion'          => $idGestion,
                'id_caja'             => $validated['id_caja'],
                'id_ficha'            => $validated['id_ficha'] ?? null,
                'monto_pago'          => $validated['monto_pago'],
                'fecha_pago'          => $validated['fecha_pago'] ?? Carbon::now(),
            ]);

            AuditLogger::cajas(AuditLogger::LEVEL_INFO, 'PAGO_REGISTRADO', [
                'id_pago' => $pago->id_pago,
                'id_estudiante' => $validated['id_estudiante'],
                'monto' => $validated['monto_pago'],
                'id_caja' => $validated['id_caja'],
            ], null, $pago->id_pago);

            return response()->json([
                'message' => 'Comprobante de recaudación emitido exitosamente.',
                'data'    => $pago->load(['estudiante', 'tipoPago', 'caja']),
            ], 201);
        });
    }

    public function metricasCola()
    {
        $hoy = Carbon::today();
        $fichasHoy = FichaAtencion::whereDate('hora_llegada_ficha', $hoy)->get();

        $atendidas = $fichasHoy->where('estado_ficha', 'Atendida');
        $enEspera = $fichasHoy->where('estado_ficha', 'En espera');
        $enAtencion = $fichasHoy->where('estado_ficha', 'En atencion');

        $tiemposServicio = $atendidas->map(fn($f) => $f->tiempo_servicio_minutos)->filter();
        $tiemposEspera = $atendidas->map(fn($f) => $f->tiempo_espera_minutos)->filter();

        $totalHorasDia = max(0.5, Carbon::now()->diffInMinutes($hoy) / 60);
        $tasaLlegada = $totalHorasDia > 0 ? $fichasHoy->count() / $totalHorasDia : 0;
        $tasaServicio = ($tiemposServicio->isNotEmpty() && $tiemposServicio->avg() > 0) ? 60 / $tiemposServicio->avg() : 0;
        $servidoresActivos = max(1, Caja::count());
        $utilizacion = ($servidoresActivos > 0 && $tasaServicio > 0)
            ? min(1.0, $tasaLlegada / ($servidoresActivos * $tasaServicio))
            : 0;

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
