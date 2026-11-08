<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AlmacenLibro;
use App\Models\MovimientoAlmacen;
use App\Models\PedidoReposicion;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AlmacenController extends Controller
{
    public function stock()
    {
        $inventario = AlmacenLibro::with(['libro.nivel.programa.idioma', 'pedidosReposicion'])
            ->get()
            ->map(function ($item) {
                $porcentajeStock = $item->stock_maximo_almacen > 0
                    ? round(($item->stock_actual_almacen / $item->stock_maximo_almacen) * 100, 1)
                    : 0;

                return [
                    'id_almacen_libro'      => $item->id_almacen_libro,
                    'libro'                 => $item->libro->nombre_libro,
                    'numero_libro'          => $item->libro->numero_libro,
                    'nivel'                 => $item->libro->nivel->nombre_nivel,
                    'programa'              => $item->libro->nivel->programa->nombre_programa,
                    'idioma'                => $item->libro->nivel->programa->idioma->nombre_idioma,
                    'stock_actual'          => $item->stock_actual_almacen,
                    'punto_reorden_rop'     => $item->punto_reorden_almacen,
                    'stock_minimo'          => $item->stock_minimo_almacen,
                    'stock_maximo'          => $item->stock_maximo_almacen,
                    'porcentaje_stock'      => $porcentajeStock,
                    'requiere_reposicion'   => $item->requiere_reposicion,
                    'alerta_critica'        => $item->stock_actual_almacen <= $item->stock_minimo_almacen,
                    'pedidos_pendientes'    => $item->pedidosReposicion->where('estado_pedido', 'Pendiente')->count(),
                ];
            });

        $resumen = [
            'total_titulos'         => $inventario->count(),
            'total_unidades'        => $inventario->sum('stock_actual'),
            'bajo_rop'              => $inventario->where('requiere_reposicion', true)->count(),
            'alerta_critica'        => $inventario->where('alerta_critica', true)->count(),
        ];

        return response()->json([
            'resumen'    => $resumen,
            'inventario' => $inventario,
        ]);
    }

    public function alertasRop()
    {
        $alertas = AlmacenLibro::bajoPuntoReorden()
            ->with('libro.nivel.programa.idioma')
            ->get()
            ->map(function ($item) {
                $deficit = $item->punto_reorden_almacen - $item->stock_actual_almacen;
                $esCritico = $item->stock_actual_almacen <= $item->stock_minimo_almacen;

                return [
                    'id_almacen_libro'   => $item->id_almacen_libro,
                    'libro'              => $item->libro->nombre_libro,
                    'idioma'             => $item->libro->nivel->programa->idioma->nombre_idioma,
                    'stock_actual'       => $item->stock_actual_almacen,
                    'punto_reorden'      => $item->punto_reorden_almacen,
                    'stock_minimo'       => $item->stock_minimo_almacen,
                    'deficit_unidades'   => $deficit,
                    'nivel_alerta'       => $esCritico ? 'CRÍTICO' : 'ADVERTENCIA',
                    'sugerencia_pedido'  => max(10, $item->stock_maximo_almacen - $item->stock_actual_almacen),
                ];
            });

        return response()->json([
            'total_alertas' => $alertas->count(),
            'alertas'       => $alertas,
        ]);
    }

    public function registrarMovimiento(Request $request)
    {
        $validated = $request->validate([
            'id_almacen_libro'    => 'required|exists:almacen_libro,id_almacen_libro',
            'id_paralelo'         => 'nullable|exists:paralelo,id_paralelo',
            'tipo_movimiento'     => 'required|in:Entrada,Salida',
            'cantidad_movimiento' => 'required|integer|min:1|max:5000',
            'fecha_movimiento'    => 'nullable|date|before_or_equal:today',
            'motivo_movimiento'   => 'required|string|max:150',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                $almacen = AlmacenLibro::lockForUpdate()->findOrFail($validated['id_almacen_libro']);

                if ($validated['tipo_movimiento'] === 'Salida') {
                    if ($almacen->stock_actual_almacen < $validated['cantidad_movimiento']) {
                        AuditLogger::almacen(AuditLogger::LEVEL_WARNING, 'SALIDA_STOCK_INSUFICIENTE', [
                            'id_almacen_libro' => $validated['id_almacen_libro'],
                            'stock_disponible' => $almacen->stock_actual_almacen,
                            'cantidad_solicitada' => $validated['cantidad_movimiento'],
                        ], null, $almacen->id_almacen_libro);

                        return response()->json([
                            'error' => "Existencias insuficientes. Stock disponible: {$almacen->stock_actual_almacen} unidades."
                        ], 422);
                    }
                    $almacen->stock_actual_almacen -= $validated['cantidad_movimiento'];
                } else {
                    $nuevoStock = $almacen->stock_actual_almacen + $validated['cantidad_movimiento'];
                    if ($nuevoStock > $almacen->stock_maximo_almacen) {
                        return response()->json([
                            'error' => "El ingreso excede la capacidad autorizada del depósito ({$almacen->stock_maximo_almacen} unidades)."
                        ], 422);
                    }
                    $almacen->stock_actual_almacen = $nuevoStock;
                }

                $almacen->save();

                $movimiento = MovimientoAlmacen::create([
                    'id_almacen_libro'    => $validated['id_almacen_libro'],
                    'id_paralelo'         => $validated['id_paralelo'] ?? null,
                    'tipo_movimiento'     => $validated['tipo_movimiento'],
                    'cantidad_movimiento' => $validated['cantidad_movimiento'],
                    'fecha_movimiento'    => Carbon::now(),
                    'motivo_movimiento'   => $validated['motivo_movimiento'],
                ]);

                AuditLogger::almacen(AuditLogger::LEVEL_INFO, 'MOVIMIENTO_KARDEX_REGISTRADO', [
                    'id_almacen_libro' => $validated['id_almacen_libro'],
                    'tipo' => $validated['tipo_movimiento'],
                    'cantidad' => $validated['cantidad_movimiento'],
                    'stock_resultante' => $almacen->stock_actual_almacen,
                ], null, $almacen->id_almacen_libro);

                return response()->json([
                    'message'           => 'Movimiento de inventario registrado satisfactoriamente.',
                    'stock_actualizado' => $almacen->stock_actual_almacen,
                    'requiere_reposicion' => $almacen->requiere_reposicion,
                    'data'              => $movimiento,
                ], 201);
            });
        } catch (\Throwable $e) {
            AuditLogger::almacen(AuditLogger::LEVEL_ERROR, 'FALLO_TRANSACCION_MOVIMIENTO', [
                'error' => $e->getMessage(),
                'trace' => $e->getFile() . ':' . $e->getLine(),
            ]);

            return response()->json([
                'error' => 'Se produjo un error durante el registro del movimiento de inventario.'
            ], 500);
        }
    }

    public function kardex($idAlmacenLibro)
    {
        $almacen = AlmacenLibro::with(['libro.nivel.programa.idioma'])->findOrFail($idAlmacenLibro);

        $movimientos = MovimientoAlmacen::where('id_almacen_libro', $idAlmacenLibro)
            ->with('paralelo')
            ->orderByDesc('fecha_movimiento')
            ->paginate(30);

        return response()->json([
            'libro'        => $almacen->libro->nombre_libro,
            'stock_actual' => $almacen->stock_actual_almacen,
            'movimientos'  => $movimientos,
        ]);
    }

    public function crearPedidoReposicion(Request $request)
    {
        $validated = $request->validate([
            'id_almacen_libro' => 'required|exists:almacen_libro,id_almacen_libro',
            'cantidad_pedido'  => 'required|integer|min:1|max:5000',
            'fecha_pedido'     => 'nullable|date|before_or_equal:today',
        ]);

        $pedido = PedidoReposicion::create([
            'id_almacen_libro' => $validated['id_almacen_libro'],
            'cantidad_pedido'  => $validated['cantidad_pedido'],
            'fecha_pedido'     => $validated['fecha_pedido'] ?? Carbon::now()->toDateString(),
            'estado_pedido'    => 'Pendiente',
        ]);

        AuditLogger::almacen(AuditLogger::LEVEL_INFO, 'ORDEN_REPOSICION_CREADA', [
            'id_pedido' => $pedido->id_pedido,
            'id_almacen_libro' => $validated['id_almacen_libro'],
            'cantidad' => $validated['cantidad_pedido'],
        ], null, $pedido->id_pedido);

        return response()->json([
            'message' => 'Solicitud de reposición registrada exitosamente.',
            'data'    => $pedido->load('almacenLibro.libro'),
        ], 201);
    }

    public function recibirPedido(Request $request, $idPedido)
    {
        try {
            return DB::transaction(function () use ($idPedido) {
                $pedido = PedidoReposicion::with('almacenLibro')->lockForUpdate()->findOrFail($idPedido);

                if ($pedido->estado_pedido !== 'Pendiente') {
                    return response()->json([
                        'error' => 'La orden seleccionada ya fue procesada anteriormente.'
                    ], 422);
                }

                $pedido->update([
                    'fecha_recepcion_pedido' => Carbon::now()->toDateString(),
                    'estado_pedido'          => 'Recibido',
                ]);

                $almacen = AlmacenLibro::lockForUpdate()->findOrFail($pedido->id_almacen_libro);
                $nuevoStock = min(
                    $almacen->stock_actual_almacen + $pedido->cantidad_pedido,
                    $almacen->stock_maximo_almacen
                );

                $almacen->update(['stock_actual_almacen' => $nuevoStock]);

                MovimientoAlmacen::create([
                    'id_almacen_libro'    => $pedido->id_almacen_libro,
                    'tipo_movimiento'     => 'Entrada',
                    'cantidad_movimiento' => $pedido->cantidad_pedido,
                    'fecha_movimiento'    => Carbon::now(),
                    'motivo_movimiento'   => "Recepción de lote bajo orden #{$pedido->id_pedido}",
                ]);

                AuditLogger::almacen(AuditLogger::LEVEL_INFO, 'LOTE_REPOSICION_RECIBIDO', [
                    'id_pedido' => $pedido->id_pedido,
                    'stock_final' => $nuevoStock,
                ], null, $pedido->id_pedido);

                return response()->json([
                    'message'           => 'Lote recepcionado y existencias actualizadas.',
                    'stock_actualizado' => $nuevoStock,
                    'data'              => $pedido,
                ]);
            });
        } catch (\Throwable $e) {
            AuditLogger::almacen(AuditLogger::LEVEL_ERROR, 'FALLO_RECEPCION_PEDIDO', [
                'id_pedido' => $idPedido,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'No fue posible completar la recepción del pedido de reposición.'
            ], 500);
        }
    }

    public function listaPedidos(Request $request)
    {
        $query = PedidoReposicion::with('almacenLibro.libro');

        if ($request->has('estado')) {
            $query->where('estado_pedido', $request->estado);
        }

        $pedidos = $query->orderByDesc('fecha_pedido')->paginate(20);
        return response()->json($pedidos);
    }
}
