'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  ShieldAlert,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

const PER_PAGE = 10;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export default function AlmacenPage() {
  const { esAlmacenero, esAdmin, rolConfig } = useAuthRole();
  const puedeOperarAlmacen = esAlmacenero || esAdmin;

  const [loading, setLoading] = useState(false);
  const [inventario, setInventario] = useState<any[]>([]);
  const [resumen, setResumen] = useState<any | null>(null);
  const [alertasRop, setAlertasRop] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);

  const [tab, setTab] = useState<'stock' | 'movimientos' | 'alertas' | 'pedidos'>('stock');
  const [busqueda, setBusqueda] = useState('');
  const [pageStock, setPageStock] = useState(1);
  const [pagePedidos, setPagePedidos] = useState(1);

  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [modalPedido, setModalPedido] = useState(false);

  const [formMov, setFormMov] = useState({
    id_almacen_libro: 1,
    tipo: 'Salida' as 'Entrada' | 'Salida',
    cantidad: 10,
    motivo: 'Entrega para inicio de ciclo académico',
  });

  const [formPed, setFormPed] = useState({
    id_almacen_libro: 1,
    cantidad: 50,
  });

  const mostrarMensaje = (tipo: 'ok' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 5000);
  };

  const cargarDatosAlmacen = async () => {
    setLoading(true);
    try {
      const [resStock, resRop, resPed] = await Promise.all([
        fetch(`${API_BASE}/almacen/stock`).catch(() => null),
        fetch(`${API_BASE}/almacen/alertas-rop`).catch(() => null),
        fetch(`${API_BASE}/almacen/pedidos`).catch(() => null),
      ]);

      if (resStock && resStock.ok) {
        const dataS = await resStock.json();
        const inv = dataS.inventario || [];
        setInventario(inv);
        setResumen(dataS.resumen);
        if (inv.length > 0 && formMov.id_almacen_libro === 1) {
          setFormMov((f) => ({ ...f, id_almacen_libro: inv[0].id_almacen_libro }));
          setFormPed((f) => ({ ...f, id_almacen_libro: inv[0].id_almacen_libro }));
        }
      }

      if (resRop && resRop.ok) {
        const dataR = await resRop.json();
        setAlertasRop(dataR.alertas || []);
      }

      if (resPed && resPed.ok) {
        const dataP = await resPed.json();
        const listaPedidos = Array.isArray(dataP) ? dataP : (dataP.data || []);
        setPedidos(listaPedidos);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosAlmacen();
  }, []);

  const handleRegistrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/almacen/movimiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_almacen_libro: formMov.id_almacen_libro,
          tipo_movimiento: formMov.tipo,
          cantidad_movimiento: formMov.cantidad,
          motivo_movimiento: formMov.motivo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar movimiento de inventario.');

      mostrarMensaje('ok', data.message || 'Movimiento de inventario registrado correctamente.');
      setModalMovimiento(false);
      cargarDatosAlmacen();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleCrearPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/almacen/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_almacen_libro: formPed.id_almacen_libro,
          cantidad_pedido: formPed.cantidad,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al solicitar pedido de reposición.');

      mostrarMensaje('ok', data.message || 'Solicitud de reposición registrada.');
      setModalPedido(false);
      cargarDatosAlmacen();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleRecibirPedido = async (id: number) => {
    if (!confirm('¿Confirma la recepción física del lote? Las existencias se incrementarán automáticamente.')) return;
    try {
      const res = await fetch(`${API_BASE}/almacen/pedidos/${id}/recibir`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al recepcionar pedido.');
      mostrarMensaje('ok', data.message || 'Lote recepcionado.');
      cargarDatosAlmacen();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  useEffect(() => {
    setPageStock(1);
  }, [busqueda]);

  const inventarioFiltrado = useMemo(() => {
    return inventario.filter((item) => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      return (
        item.libro?.toLowerCase().includes(q) ||
        item.idioma?.toLowerCase().includes(q) ||
        item.nivel?.toLowerCase().includes(q)
      );
    });
  }, [inventario, busqueda]);

  const totalPagesStock = Math.max(1, Math.ceil(inventarioFiltrado.length / PER_PAGE));
  const inventarioPaginado = useMemo(() => {
    const start = (pageStock - 1) * PER_PAGE;
    return inventarioFiltrado.slice(start, start + PER_PAGE);
  }, [inventarioFiltrado, pageStock]);

  const pedidosValidos = useMemo(() => Array.isArray(pedidos) ? pedidos : [], [pedidos]);
  const totalPagesPedidos = Math.max(1, Math.ceil(pedidosValidos.length / PER_PAGE));
  const pedidosPaginados = useMemo(() => {
    const start = (pagePedidos - 1) * PER_PAGE;
    return pedidosValidos.slice(start, start + PER_PAGE);
  }, [pedidosValidos, pagePedidos]);

  if (!puedeOperarAlmacen) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-8 text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-neutral-300 max-w-xl mx-auto">
            La administración de existencias de material bibliográfico corresponde exclusivamente al{' '}
            <strong className="text-pink-400">Encargado de Almacén</strong>.
            Rol actual: <span className="px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-semibold">{rolConfig.titulo}</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-sm shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
              <span>SACA</span>
              <span>/</span>
              <span className="text-pink-400 font-semibold">Almacén</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              Inventario de Textos y Control de Existencias
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={cargarDatosAlmacen}
            disabled={loading}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span>Sincronizar Stock</span>
          </button>
          <button
            onClick={() => setModalMovimiento(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition shadow-md shadow-pink-600/20"
          >
            <Plus className="w-4 h-4" />
            + Registrar Salida / Entrada
          </button>
        </div>
      </div>

      {alerta && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${
            alerta.tipo === 'ok'
              ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/50 border-red-500/50 text-red-200'
          }`}
        >
          {alerta.tipo === 'ok' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span>{alerta.mensaje}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-lg">
          <span className="text-neutral-400 text-[11px] block truncate">Títulos Registrados</span>
          <p className="text-xl font-bold font-mono text-white mt-0.5">{resumen?.total_titulos || 0}</p>
          <span className="text-[10px] text-neutral-500">En catálogo</span>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-lg">
          <span className="text-neutral-400 text-[11px] block truncate">Stock Físico Total</span>
          <p className="text-xl font-bold font-mono text-sky-400 mt-0.5">{resumen?.total_unidades || 0}</p>
          <span className="text-[10px] text-neutral-500">Unidades en depósito</span>
        </div>
        <div className="bg-neutral-900/60 border border-amber-500/30 p-2.5 rounded-lg">
          <span className="text-amber-400 text-[11px] font-semibold block truncate">Por Reabastecer</span>
          <p className="text-xl font-bold font-mono text-amber-400 mt-0.5">{resumen?.bajo_rop || 0}</p>
          <span className="text-[10px] text-neutral-400">Próximos al umbral</span>
        </div>
        <div className="bg-neutral-900/60 border border-red-500/30 p-2.5 rounded-lg">
          <span className="text-red-400 text-[11px] font-semibold block truncate">Nivel Crítico</span>
          <p className="text-xl font-bold font-mono text-red-400 mt-0.5">{resumen?.alerta_critica || 0}</p>
          <span className="text-[10px] text-neutral-400">Bajo existencia mínima</span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setTab('stock')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            tab === 'stock' ? 'bg-pink-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          Inventario de Textos ({inventario.length})
        </button>
        <button
          onClick={() => setTab('alertas')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            tab === 'alertas' ? 'bg-amber-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          Alertas de Reabastecimiento
          {alertasRop.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px]">
              {alertasRop.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('pedidos')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            tab === 'pedidos' ? 'bg-purple-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          Órdenes de Reposición ({pedidosValidos.length})
        </button>
      </div>

      {tab === 'stock' && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por libro, idioma o nivel..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-3 py-1.5 text-xs text-white"
              />
            </div>
            <span className="text-xs text-neutral-400">
              Control de existencias bibliográficas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="p-3">Título / Texto Guía</th>
                  <th className="p-3">Idioma & Nivel</th>
                  <th className="p-3 text-center">Stock Actual</th>
                  <th className="p-3 text-center">Umbral Reorden</th>
                  <th className="p-3 text-center">Stock Mínimo</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                {inventarioPaginado.map((item) => (
                  <tr key={item.id_almacen_libro} className="hover:bg-neutral-800/30">
                    <td className="p-3 font-bold text-white">
                      {item.libro}
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-white">{item.idioma}</p>
                      <p className="text-[11px] text-neutral-400">{item.nivel} &bull; {item.programa}</p>
                    </td>
                    <td className="p-3 text-center font-mono text-sm font-bold text-white">
                      {item.stock_actual} unids.
                    </td>
                    <td className="p-3 text-center font-mono text-amber-400 font-semibold">
                      {item.punto_reorden_rop} unids.
                    </td>
                    <td className="p-3 text-center font-mono text-neutral-400">
                      {item.stock_minimo} unids.
                    </td>
                    <td className="p-3 text-center">
                      {item.alerta_critica ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          CRÍTICO
                        </span>
                      ) : item.requiere_reposicion ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          POR REPONER
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ÓPTIMO
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {item.requiere_reposicion && (
                        <button
                          onClick={() => {
                            setFormPed({ id_almacen_libro: item.id_almacen_libro, cantidad: 50 });
                            setModalPedido(true);
                          }}
                          className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-[11px] transition shadow"
                        >
                          Solicitar Reposición
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {inventarioFiltrado.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-500">
                      No se encontraron libros en inventario.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {inventarioFiltrado.length > PER_PAGE && (
            <div className="flex items-center justify-between p-3 border-t border-neutral-800 text-xs text-neutral-400 bg-neutral-950/40">
              <span>Página {pageStock} de {totalPagesStock} ({inventarioFiltrado.length} títulos)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageStock((p) => Math.max(1, p - 1))}
                  disabled={pageStock <= 1}
                  className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPageStock((p) => Math.min(totalPagesStock, p + 1))}
                  disabled={pageStock >= totalPagesStock}
                  className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'alertas' && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-3.5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Títulos que Requieren Reabastecimiento
            </h3>
            <span className="text-xs text-neutral-400">{alertasRop.length} alertas registradas</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="p-3">Texto Guía</th>
                  <th className="p-3">Idioma</th>
                  <th className="p-3 text-center">Stock Actual</th>
                  <th className="p-3 text-center">Umbral Mínimo</th>
                  <th className="p-3 text-center">Déficit</th>
                  <th className="p-3 text-center">Sugerencia Compra</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                {alertasRop.map((a) => (
                  <tr key={a.id_almacen_libro} className="hover:bg-neutral-800/30">
                    <td className="p-3 font-bold text-white">{a.libro}</td>
                    <td className="p-3 text-neutral-300">{a.idioma}</td>
                    <td className="p-3 text-center font-mono font-bold text-red-400">{a.stock_actual}</td>
                    <td className="p-3 text-center font-mono text-amber-400">{a.punto_reorden}</td>
                    <td className="p-3 text-center font-mono text-neutral-300">{a.deficit_unidades} unids.</td>
                    <td className="p-3 text-center font-mono font-bold text-sky-400">{a.sugerencia_pedido} unids.</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setFormPed({ id_almacen_libro: a.id_almacen_libro, cantidad: a.sugerencia_pedido || 50 });
                          setModalPedido(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
                      >
                        Emitir Orden
                      </button>
                    </td>
                  </tr>
                ))}
                {alertasRop.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-500">
                      Todos los títulos se encuentran con existencias suficientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'pedidos' && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-3">ID Orden</th>
                <th className="p-3">Texto Solicitado</th>
                <th className="p-3 text-center">Cantidad</th>
                <th className="p-3">Fecha</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {pedidosPaginados.map((p) => (
                <tr key={p.id_pedido} className="hover:bg-neutral-800/30">
                  <td className="p-3 font-mono font-bold text-white">#{p.id_pedido}</td>
                  <td className="p-3 font-semibold text-white">
                    {p.almacen_libro?.libro?.nombre_libro || `Libro N° ${p.id_almacen_libro}`}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-sky-400">{p.cantidad_pedido} unids.</td>
                  <td className="p-3 font-mono text-neutral-400">{p.fecha_pedido}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.estado_pedido === 'Recibido' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {p.estado_pedido}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {p.estado_pedido === 'Pendiente' && (
                      <button
                        onClick={() => handleRecibirPedido(p.id_pedido)}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                      >
                        Confirmar Ingreso
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {pedidosValidos.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    No se han registrado órdenes de reposición.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {pedidosValidos.length > PER_PAGE && (
            <div className="flex items-center justify-between p-3 border-t border-neutral-800 text-xs text-neutral-400 bg-neutral-950/40">
              <span>Página {pagePedidos} de {totalPagesPedidos} ({pedidosValidos.length} órdenes)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagePedidos((p) => Math.max(1, p - 1))}
                  disabled={pagePedidos <= 1}
                  className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPagePedidos((p) => Math.min(totalPagesPedidos, p + 1))}
                  disabled={pagePedidos >= totalPagesPedidos}
                  className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {modalMovimiento && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">Registrar Entrada / Salida de Depósito</h3>
              <button onClick={() => setModalMovimiento(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarMovimiento} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 block mb-1">Texto Guía</label>
                <select
                  value={formMov.id_almacen_libro}
                  onChange={(e) => setFormMov({ ...formMov, id_almacen_libro: parseInt(e.target.value) || 1 })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                >
                  {inventario.map((i) => (
                    <option key={i.id_almacen_libro} value={i.id_almacen_libro}>
                      {i.libro} ({i.idioma}) — Existencias: {i.stock_actual}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1">Tipo de Operación</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormMov({ ...formMov, tipo: 'Salida' })}
                    className={`py-2 rounded font-bold border text-center transition ${
                      formMov.tipo === 'Salida' ? 'bg-red-600 text-white border-red-500' : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    Salida (Entrega)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMov({ ...formMov, tipo: 'Entrada' })}
                    className={`py-2 rounded font-bold border text-center transition ${
                      formMov.tipo === 'Entrada' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    Entrada (Ingreso)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1">Cantidad de Ejemplares</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formMov.cantidad}
                  onChange={(e) => setFormMov({ ...formMov, cantidad: parseInt(e.target.value) || 1 })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-300 block mb-1">Motivo / Justificación</label>
                <input
                  type="text"
                  placeholder="Ej: Asignación a paralelo académico"
                  value={formMov.motivo}
                  onChange={(e) => setFormMov({ ...formMov, motivo: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalMovimiento(false)}
                  className="px-3 py-1.5 rounded bg-neutral-800 text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-pink-600 hover:bg-pink-500 text-white font-bold transition shadow"
                >
                  Registrar en Inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalPedido && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">Solicitud de Reposición</h3>
              <button onClick={() => setModalPedido(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearPedido} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 block mb-1">Texto a Solicitar</label>
                <select
                  value={formPed.id_almacen_libro}
                  onChange={(e) => setFormPed({ ...formPed, id_almacen_libro: parseInt(e.target.value) || 1 })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                >
                  {inventario.map((i) => (
                    <option key={i.id_almacen_libro} value={i.id_almacen_libro}>
                      {i.libro} — Stock: {i.stock_actual}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1">Cantidad Requerida</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  step="10"
                  value={formPed.cantidad}
                  onChange={(e) => setFormPed({ ...formPed, cantidad: parseInt(e.target.value) || 10 })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white font-mono font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalPedido(false)}
                  className="px-3 py-1.5 rounded bg-neutral-800 text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition shadow"
                >
                  Emitir Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
