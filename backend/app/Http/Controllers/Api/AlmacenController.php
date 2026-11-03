<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AlmacenLibro;
use App\Models\MovimientoAlmacen;
use App\Models\PedidoReposicion;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AlmacenController extends Controller
{
    /**
     * Inventario completo con estado de alertas ROP
     */
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

    /**
     * Alertas ROP: Libros bajo punto de reorden
     */
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
                    'sugerencia_pedido'  => $item->stock_maximo_almacen - $item->stock_actual_almacen,
                ];
            });

        return response()->json([
            'total_alertas' => $alertas->count(),
            'alertas'       => $alertas,
        ]);
    }

    /**
     * Registrar movimiento de inventario (entrada o salida) con actualización atómica de stock
     */
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

        return DB::transaction(function () use ($validated) {
            $almacen = AlmacenLibro::lockForUpdate()->findOrFail($validated['id_almacen_libro']);

            if ($validated['tipo_movimiento'] === 'Salida') {
                if ($almacen->stock_actual_almacen < $validated['cantidad_movimiento']) {
                    return response()->json([
                        'error' => 'Stock insuficiente. Disponible: ' . $almacen->stock_actual_almacen . ' unidades.'
                    ], 422);
                }
                $almacen->stock_actual_almacen -= $validated['cantidad_movimiento'];
            } else {
                $nuevoStock = $almacen->stock_actual_almacen + $validated['cantidad_movimiento'];
                if ($nuevoStock > $almacen->stock_maximo_almacen) {
                    return response()->json([
                        'error' => 'La entrada excede la capacidad máxima de almacenaje (' . $almacen->stock_maximo_almacen . ' unidades).'
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

            return response()->json([
                'message'           => 'Movimiento de almacén registrado exitosamente.',
                'stock_actualizado' => $almacen->stock_actual_almacen,
                'requiere_reposicion' => $almacen->requiere_reposicion,
                'data'              => $movimiento,
            ], 201);
        });
    }

    /**
     * Kardex: Historial de movimientos de un libro específico
     */
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

    /**
     * Crear pedido de reposición (solicitud de compra)
     */
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

        return response()->json([
            'message' => 'Pedido de reposición registrado exitosamente.',
            'data'    => $pedido->load('almacenLibro.libro'),
        ], 201);
    }

    /**
     * Recibir pedido de reposición (confirmar entrega y actualizar stock)
     */
    public function recibirPedido(Request $request, $idPedido)
    {
        $pedido = PedidoReposicion::with('almacenLibro')->findOrFail($idPedido);

        if ($pedido->estado_pedido !== 'Pendiente') {
            return response()->json([
                'error' => 'Solo se pueden recibir pedidos en estado Pendiente.'
            ], 422);
        }

        return DB::transaction(function () use ($pedido) {
            $pedido->update([
                'fecha_recepcion_pedido' => Carbon::now()->toDateString(),
                'estado_pedido'          => 'Recibido',
            ]);

            // Registrar entrada automática en el kardex
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
                'motivo_movimiento'   => 'Recepción de pedido de reposición #' . $pedido->id_pedido,
            ]);

            return response()->json([
                'message'           => 'Pedido recibido y stock actualizado.',
                'stock_actualizado' => $nuevoStock,
                'data'              => $pedido,
            ]);
        });
    }

    /**
     * Lista pedidos de reposición con filtro de estado
     */
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
