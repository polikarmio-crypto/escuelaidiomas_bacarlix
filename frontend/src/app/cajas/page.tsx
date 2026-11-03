'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark,
  Shield,
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Users,
  RefreshCw,
  X,
  Play,
  Printer,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

export default function CajasPage() {
  const { rolActivo, esCajero, esEstudiante, esAdmin, rolConfig, usuario } = useAuthRole();
  const puedeOperarCaja = esCajero || esAdmin;

  const [loading, setLoading] = useState(false);
  const [cajas, setCajas] = useState<any[]>([]);
  const [colaFifo, setColaFifo] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any | null>(null);
  const [historialPagos, setHistorialPagos] = useState<any[]>([]);
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);

  const [cajaActivaId, setCajaActivaId] = useState<number>(1);
  const [turnoEnAtencion, setTurnoEnAtencion] = useState<any | null>(null);

  const [miFicha, setMiFicha] = useState<any | null>(null);

  const [modalPago, setModalPago] = useState(false);
  const [formPago, setFormPago] = useState({
    id_tipo_pago: 1,
    monto: 150,
    concepto: 'Matrícula Regular',
  });

  const [comprobanteEmitido, setComprobanteEmitido] = useState<any | null>(null);

  const mostrarMensaje = (tipo: 'ok' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 5000);
  };

  const cargarDatosCaja = async () => {
    setLoading(true);
    try {
      const [resCajas, resCola, resMetricas, resPagos] = await Promise.all([
        fetch('http://localhost:8000/api/v1/cajas'),
        fetch('http://localhost:8000/api/v1/cajas/cola-fifo'),
        fetch('http://localhost:8000/api/v1/cajas/metricas'),
        fetch('http://localhost:8000/api/v1/cajas/pagos'),
      ]);

      if (resCajas.ok) {
        const dataC = await resCajas.json();
        setCajas(dataC || []);
        if (dataC.length > 0 && !cajaActivaId) setCajaActivaId(dataC[0].id_caja);
      }
      if (resCola.ok) {
        const dataQ = await resCola.json();
        setColaFifo(dataQ.cola_fifo || []);
      }
      if (resMetricas.ok) {
        const dataM = await resMetricas.json();
        setMetricas(dataM);
      }
      if (resPagos.ok) {
        const dataP = await resPagos.json();
        setHistorialPagos(dataP || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosCaja();
    const interval = setInterval(cargarDatosCaja, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSolicitarFicha = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/cajas/ficha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_estudiante: usuario.id || 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al emitir ficha.');
      setMiFicha(data.ficha);
      mostrarMensaje('ok', `Ficha N° ${data.ficha.numero_ficha} emitida. Por favor espere su turno en pantalla.`);
      cargarDatosCaja();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleLlamarSiguiente = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/cajas/ficha/llamar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_caja: cajaActivaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No hay turnos pendientes en cola FIFO.');
      setTurnoEnAtencion(data.ficha);
      mostrarMensaje('ok', `Llamando al turno N° ${data.ficha.numero_ficha}: ${data.ficha.estudiante}`);
      cargarDatosCaja();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleProcesarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnoEnAtencion) return;

    try {
      const res = await fetch('http://localhost:8000/api/v1/cajas/pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_estudiante: turnoEnAtencion.id_estudiante,
          id_caja: cajaActivaId,
          id_ficha: turnoEnAtencion.id_ficha,
          id_tipo_pago: formPago.id_tipo_pago,
          monto_pago: formPago.monto,
          id_gestion: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el pago.');

      setComprobanteEmitido(data.data);
      mostrarMensaje('ok', 'Pago procesado exitosamente. Comprobante emitido.');
      setModalPago(false);

      await fetch('http://localhost:8000/api/v1/cajas/ficha/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_ficha: turnoEnAtencion.id_ficha }),
      });

      setTurnoEnAtencion(null);
      cargarDatosCaja();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  if (!puedeOperarCaja && !esEstudiante) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-8 text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-neutral-300 max-w-xl mx-auto">
            La atención en ventanilla y el cobro de aranceles corresponde exclusivamente a los <strong className="text-amber-400">Cajeros</strong>.
            Los estudiantes pueden acceder únicamente a la solicitud de ficha de atención digital.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
              <span>SACA</span>
              <span>/</span>
              <span className="text-amber-400 font-semibold">Cajas</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              {esEstudiante ? 'Atención en Caja — Turno Digital' : 'Cajas y Recaudaciones'}
            </h1>
          </div>
        </div>
        <button
          onClick={cargarDatosCaja}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Cola
        </button>
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

      {esEstudiante ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <Ticket className="w-16 h-16 text-cyan-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Emisión de Ticket / Turno para Caja</h2>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Presione el botón para encolarse de forma ordenada bajo disciplina FIFO. Será llamado por número en los altavoces y pantallas de ventanilla.
            </p>

            {miFicha ? (
              <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-6 space-y-2 max-w-sm mx-auto">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">Su Turno Asignado</span>
                <div className="text-5xl font-extrabold font-mono text-white py-2">
                  #{miFicha.numero_ficha}
                </div>
                <p className="text-xs text-neutral-300">
                  Estado: <strong className="text-amber-400">{miFicha.estado_ficha}</strong>
                </p>
                <p className="text-[11px] text-neutral-400">
                  Hora de solicitud: {new Date(miFicha.hora_llegada_ficha).toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <button
                onClick={handleSolicitarFicha}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-cyan-600/30"
              >
                Solicitar Ficha de Turno
              </button>
            )}
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 text-xs">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span>Personas esperando en cola FIFO:</span>
              <strong className="text-white font-mono text-sm">{colaFifo.length}</strong>
            </div>
            <p className="text-[11px] text-neutral-500">
              Tiempo medio estimado de espera: ~{metricas?.tiempo_promedio_espera_minutos || 6} minutos por persona.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-lg">
              <span className="text-neutral-400 text-[11px] block truncate">En Cola FIFO (Lq)</span>
              <p className="text-xl font-bold font-mono text-amber-400 mt-0.5">{colaFifo.length}</p>
              <span className="text-[10px] text-neutral-500">Estudiantes en espera</span>
            </div>
            <div className="bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-lg">
              <span className="text-neutral-400 text-[11px] block truncate">Tiempo Espera (Wq)</span>
              <p className="text-xl font-bold font-mono text-sky-400 mt-0.5">{metricas?.tiempo_promedio_espera_minutos || 0} min</p>
              <span className="text-[10px] text-neutral-500">Promedio de espera</span>
            </div>
            <div className="bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-lg">
              <span className="text-neutral-400 text-[11px] block truncate">Atendidos Hoy</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{metricas?.fichas_atendidas_hoy || 0}</p>
              <span className="text-[10px] text-neutral-500">Turnos completados</span>
            </div>
            <div className="bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-lg">
              <span className="text-neutral-400 text-[11px] block truncate">Ventanillas Activas</span>
              <p className="text-xl font-bold font-mono text-purple-400 mt-0.5">{cajas.length}</p>
              <span className="text-[10px] text-neutral-500">Cajas operativas</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-amber-400" />
                  Mi Ventanilla
                </h3>
                <select
                  value={cajaActivaId}
                  onChange={(e) => setCajaActivaId(parseInt(e.target.value) || 1)}
                  className="bg-neutral-950 border border-neutral-700 text-xs text-white rounded px-2 py-1"
                >
                  {cajas.map((c) => (
                    <option key={c.id_caja} value={c.id_caja}>{c.nombre_caja}</option>
                  ))}
                </select>
              </div>

              {turnoEnAtencion ? (
                <div className="bg-amber-950/30 border border-amber-500/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Atendiendo Actualmente</span>
                    <span className="font-mono text-xs text-white bg-neutral-900 px-2 py-0.5 rounded">
                      Ficha #{turnoEnAtencion.numero_ficha}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white">{turnoEnAtencion.estudiante}</h4>
                  <p className="text-xs text-neutral-400">
                    Hora inicio: {new Date(turnoEnAtencion.hora_inicio_atencion_ficha).toLocaleTimeString()}
                  </p>
                  <button
                    onClick={() => setModalPago(true)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow"
                  >
                    <CreditCard className="w-4 h-4" /> Cobrar Arancel / Emitir Comprobante
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3 bg-neutral-950/40 rounded-xl border border-neutral-800">
                  <UserCheck className="w-10 h-10 text-neutral-600 mx-auto" />
                  <p className="text-xs text-neutral-400">Ventanilla disponible para llamada</p>
                  <button
                    onClick={handleLlamarSiguiente}
                    disabled={colaFifo.length === 0}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold rounded-lg text-xs transition shadow-md shadow-amber-500/20"
                  >
                    Llamar Siguiente Turno (FIFO)
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  Cola FIFO en Espera ({colaFifo.length})
                </h3>
                <span className="text-[11px] text-neutral-500 font-mono">Orden estricto por hora de llegada</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="p-2.5">Pos.</th>
                      <th className="p-2.5">N° Ficha</th>
                      <th className="p-2.5">Estudiante</th>
                      <th className="p-2.5">Tipo</th>
                      <th className="p-2.5">Llegada</th>
                      <th className="p-2.5">Espera</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300">
                    {colaFifo.map((f) => (
                      <tr key={f.id_ficha} className="hover:bg-neutral-800/30">
                        <td className="p-2.5 font-bold text-sky-400 font-mono">#{f.posicion_fifo}</td>
                        <td className="p-2.5 font-bold text-white font-mono">{f.numero_ficha}</td>
                        <td className="p-2.5 font-semibold text-white">{f.estudiante}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300">
                            {f.tipo_estudiante}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-neutral-400">{f.hora_llegada}</td>
                        <td className="p-2.5 font-mono text-amber-400">{f.minutos_esperando} min</td>
                      </tr>
                    ))}
                    {colaFifo.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-neutral-500">
                          No hay turnos en espera en la cola FIFO.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalPago && turnoEnAtencion && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">Procesar Pago en Ventanilla</h3>
              <button onClick={() => setModalPago(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcesarPago} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 block mb-1">Estudiante</label>
                <input
                  type="text"
                  disabled
                  value={turnoEnAtencion.estudiante}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-neutral-300 block mb-1">Concepto de Pago</label>
                <select
                  value={formPago.id_tipo_pago}
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    const concepto = id === 1 ? 'Matrícula' : id === 2 ? 'Mensualidad' : 'Compra de Libro';
                    const monto = id === 1 ? 150 : id === 2 ? 220 : 180;
                    setFormPago({ id_tipo_pago: id, concepto, monto });
                  }}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                >
                  <option value={1}>Matrícula Regular</option>
                  <option value={2}>Mensualidad Académica</option>
                  <option value={3}>Compra de Texto Guía / Libro</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1">Monto a Cobrar (Bs.)</label>
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={formPago.monto}
                  onChange={(e) => setFormPago({ ...formPago, monto: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white font-mono text-base font-bold text-emerald-400"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalPago(false)}
                  className="px-3 py-1.5 rounded bg-neutral-800 text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow"
                >
                  Confirmar Cobro & Comprobante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {comprobanteEmitido && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-emerald-500/50 rounded-2xl w-full max-w-sm p-6 space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Comprobante Oficial de Pago</h3>
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-left text-xs space-y-1 font-mono">
              <p className="text-neutral-400">Recibo: <strong className="text-white">#{comprobanteEmitido.id_pago}</strong></p>
              <p className="text-neutral-400">Monto: <strong className="text-emerald-400 text-sm">{comprobanteEmitido.monto_pago} Bs.</strong></p>
              <p className="text-neutral-400">Fecha: <strong className="text-white">{new Date(comprobanteEmitido.fecha_pago).toLocaleString()}</strong></p>
            </div>
            <button
              onClick={() => setComprobanteEmitido(null)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg text-xs"
            >
              Cerrar Comprobante
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
