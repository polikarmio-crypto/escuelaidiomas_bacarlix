'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Ticket,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Users,
  RefreshCw,
  X,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export default function CajasPage() {
  const { esCajero, esEstudiante, esAdmin, usuario } = useAuthRole();
  const puedeOperarCaja = esCajero || esAdmin;

  const [loading, setLoading] = useState(false);
  const [cajas, setCajas] = useState<any[]>([]);
  const [colaEspera, setColaEspera] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any | null>(null);
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);

  const [cajaActivaId, setCajaActivaId] = useState<number>(1);
  const [filtrarPorVentanilla, setFiltrarPorVentanilla] = useState<boolean>(true);
  const [turnoEnAtencion, setTurnoEnAtencion] = useState<any | null>(null);
  const [miFicha, setMiFicha] = useState<any | null>(null);
  const [tipoTramiteFicha, setTipoTramiteFicha] = useState<'regular' | 'libros'>('regular');

  const [modalPago, setModalPago] = useState(false);
  const [formPago, setFormPago] = useState({
    id_tipo_pago: 2,
    monto: 150,
    concepto: 'Matrícula Regular Civil',
  });

  const [comprobanteEmitido, setComprobanteEmitido] = useState<any | null>(null);

  const mostrarMensaje = (tipo: 'ok' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 5000);
  };

  const cargarDatosCaja = async (cajaIdOverride?: number, forzarTodas?: boolean) => {
    setLoading(true);
    try {
      const activeCaja = cajaIdOverride !== undefined ? cajaIdOverride : cajaActivaId;
      const usarFiltro = forzarTodas !== undefined ? !forzarTodas : filtrarPorVentanilla;
      const urlCola = (puedeOperarCaja && usarFiltro && activeCaja)
        ? `${API_BASE}/cajas/cola-espera?id_caja=${activeCaja}`
        : `${API_BASE}/cajas/cola-espera`;

      const [resCajas, resCola, resMetricas] = await Promise.all([
        fetch(`${API_BASE}/cajas`).catch(() => null),
        fetch(urlCola).catch(() => null),
        fetch(`${API_BASE}/cajas/metricas`).catch(() => null),
      ]);

      if (resCajas && resCajas.ok) {
        const dataC = await resCajas.json();
        const lista = Array.isArray(dataC) ? dataC : (dataC.data || []);
        setCajas(lista);
        if (lista.length > 0 && !cajaActivaId) {
          setCajaActivaId(lista[0].id_caja);
        }
      }

      if (resCola && resCola.ok) {
        const dataQ = await resCola.json();
        setColaEspera(dataQ.cola_espera || dataQ.cola_atencion || []);
      }

      if (resMetricas && resMetricas.ok) {
        const dataM = await resMetricas.json();
        setMetricas(dataM);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosCaja();
    const interval = setInterval(() => cargarDatosCaja(), 15000);
    return () => clearInterval(interval);
  }, [cajaActivaId, filtrarPorVentanilla]);

  const handleSolicitarFicha = async () => {
    try {
      let idEst = usuario?.id_estudiante;
      if (!idEst && usuario?.email) {
        try {
          const resEst = await fetch(`${API_BASE}/estudiantes?email=${encodeURIComponent(usuario.email)}`);
          if (resEst.ok) {
            const d = await resEst.json();
            const list = d.data || (Array.isArray(d) ? d : []);
            const match = list.find((e: any) => e.email_estudiante?.toLowerCase() === usuario.email.toLowerCase()) || list[0];
            if (match) idEst = match.id_estudiante;
          }
        } catch (e) {}
      }
      if (!idEst) {
        idEst = usuario?.id_estudiante || 11;
      }
      const res = await fetch(`${API_BASE}/cajas/ficha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_estudiante: idEst,
          tipo_tramite: tipoTramiteFicha,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'No fue posible emitir el turno en este momento.');
      }

      const fichaObj = data.data || {
        numero_ficha: data.numero_ficha,
        estado_ficha: 'En espera',
        hora_llegada_ficha: new Date().toISOString(),
        id_caja: tipoTramiteFicha === 'libros' ? 3 : 1,
      };

      setMiFicha(fichaObj);
      const ventanillaNombre = fichaObj.caja?.nombre_caja || (fichaObj.id_caja === 3 ? 'Ventanilla 3 - Material & Libros' : (fichaObj.id_caja === 1 ? 'Ventanilla 1 - Militar' : 'Ventanilla 2 - Civiles'));
      mostrarMensaje('ok', `Turno N° ${data.numero_ficha || fichaObj.numero_ficha} emitido para ${ventanillaNombre}.`);
      cargarDatosCaja();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleLlamarSiguiente = async () => {
    try {
      const res = await fetch(`${API_BASE}/cajas/ficha/llamar-siguiente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_caja: cajaActivaId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No fue posible avanzar el turno.');
      }

      const siguiente = data.data || null;
      if (!siguiente) {
        mostrarMensaje('ok', data.message || 'No existen turnos en espera.');
        setTurnoEnAtencion(null);
        return;
      }

      setTurnoEnAtencion(siguiente);
      const nombreEstudiante = siguiente.estudiante?.nombre_estudiante
        ? `${siguiente.estudiante.nombre_estudiante} ${siguiente.estudiante.apellido_estudiante}`
        : (typeof siguiente.estudiante === 'string' ? siguiente.estudiante : 'Estudiante');

      mostrarMensaje('ok', `Turno N° ${siguiente.numero_ficha} convocado a ventanilla (${nombreEstudiante}).`);
      cargarDatosCaja();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleProcesarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnoEnAtencion) return;

    try {
      const res = await fetch(`${API_BASE}/cajas/pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_estudiante: turnoEnAtencion.id_estudiante,
          id_caja: cajaActivaId,
          id_ficha: turnoEnAtencion.id_ficha,
          id_tipo_pago: formPago.id_tipo_pago,
          monto_pago: formPago.monto,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el pago.');
      }

      setComprobanteEmitido(data.data);
      mostrarMensaje('ok', 'Pago procesado exitosamente. Comprobante emitido.');
      setModalPago(false);

      await fetch(`${API_BASE}/cajas/ficha/finalizar`, {
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
        <div className="bg-[var(--bg-card)] border border-red-500/40 rounded-[3px] p-8 text-center space-y-4 shadow-xs">
          <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-[var(--text-main)] font-sans">Acceso Restringido</h2>
          <p className="text-xs text-[var(--text-muted)] max-w-xl mx-auto">
            La atención en ventanilla y el cobro de aranceles corresponde exclusivamente a los <strong className="text-[var(--color-accent)] font-mono">Cajeros</strong> autorizados del sistema SACA CEDMIL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* FRANJA SUPERIOR COMPACTA (44px) */}
      <div className="strip-utility-bar">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--military-green-subtle)] border border-[var(--border-accent)] text-[var(--military-green-primary)] dark:text-[var(--military-gold-primary)] font-mono text-[11px] font-bold shrink-0">
            <Landmark className="w-3.5 h-3.5" />
            <span>SACA / Cajas</span>
          </div>

          <div className="h-4 w-[1px] bg-[var(--border-fine)] shrink-0" />

          <span className="text-xs font-bold text-[var(--text-main)] truncate hidden sm:inline">
            {esEstudiante ? 'Atención en Caja — Turno Digital' : 'Cajas y Recaudaciones Institucionales'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => cargarDatosCaja()}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.55rem', fontSize: '0.70rem', height: '28px' }}
            title="Actualizar cola y turnos"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar Cola</span>
          </button>
        </div>
      </div>

      {alerta && (
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded mb-2 text-xs font-semibold shrink-0 border ${
            alerta.tipo === 'ok'
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-950/20 border-red-500/40 text-red-600 dark:text-red-400'
          }`}
        >
          {alerta.tipo === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
          <span>{alerta.mensaje}</span>
        </div>
      )}

      {esEstudiante ? (
        /* VISTA EDITORIAL ESTUDIANTE: DISPENSADOR DE TURNO DIGITAL */
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-3 overflow-y-auto">
          <div className="bg-[var(--bg-card)] border border-[var(--border-fine)] rounded-[3px] p-5 text-center space-y-3 shadow-xs max-w-lg w-full">
            <div className="w-10 h-10 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-fine)] flex items-center justify-center text-[var(--color-accent)] mx-auto">
              <Ticket className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[var(--text-main)] font-sans">Emisión de Ticket de Atención</h2>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Seleccione el trámite a realizar en ventanilla y solicite su ficha de atención digital en tiempo real:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-1">
              <button
                type="button"
                onClick={() => setTipoTramiteFicha('regular')}
                className={`p-3 rounded-[2px] border text-xs transition ${
                  tipoTramiteFicha === 'regular'
                    ? 'border-[var(--color-primary)] dark:border-[var(--color-accent)] bg-[var(--bg-surface)] text-[var(--text-main)] ring-1 ring-[var(--color-accent)]/50'
                    : 'border-[var(--border-fine)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--color-accent)]'
                }`}
              >
                <div className="font-bold text-[var(--text-main)] mb-1 flex items-center justify-between text-xs">
                  <span>Trámite Regular / Matrícula</span>
                  {tipoTramiteFicha === 'regular' && <span className="w-2 h-2 rounded-[1px] bg-[var(--color-accent)]" />}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                  Inscripciones y mensualidades.
                </p>
                <span className="inline-block mt-2 text-[10px] font-mono text-[var(--color-primary)] dark:text-[var(--color-accent)] font-bold bg-[var(--bg-card)] border border-[var(--border-fine)] px-1.5 py-0.5 rounded-[2px]">
                  {usuario?.subtitulo?.toLowerCase().includes('militar') || usuario?.nombre?.includes('Cad.') ? 'Ventanilla 1 - Militar' : 'Ventanilla 2 - Civiles'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTipoTramiteFicha('libros')}
                className={`p-3 rounded-[2px] border text-xs transition ${
                  tipoTramiteFicha === 'libros'
                    ? 'border-[var(--color-accent)] bg-[var(--bg-surface)] text-[var(--text-main)] ring-1 ring-[var(--color-accent)]/50'
                    : 'border-[var(--border-fine)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--color-accent)]'
                }`}
              >
                <div className="font-bold text-[var(--text-main)] mb-1 flex items-center justify-between text-xs">
                  <span>Adquisición Libros</span>
                  {tipoTramiteFicha === 'libros' && <span className="w-2 h-2 rounded-[1px] bg-[var(--color-accent)]" />}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                  Texto guía oficial y bibliografía.
                </p>
                <span className="inline-block mt-2 text-[10px] font-mono text-[var(--color-accent)] font-bold bg-[var(--bg-card)] border border-[var(--border-fine)] px-1.5 py-0.5 rounded-[2px]">
                  Ventanilla 3 - Material & Libros
                </span>
              </button>
            </div>

            {miFicha ? (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-fine)] border-t-4 border-t-[var(--color-primary)] dark:border-t-[var(--color-accent)] rounded-[2px] p-4 space-y-1.5 max-w-xs mx-auto shadow-xs">
                <span className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest font-mono">
                  Su Turno Asignado
                </span>
                <div className="text-4xl font-black font-mono text-[var(--text-main)] py-0.5">
                  #{miFicha.numero_ficha}
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Estado: <strong className="text-[var(--color-accent)] font-mono">{miFicha.estado_ficha || 'En espera'}</strong>
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Ventanilla: <strong className="text-[var(--text-main)] font-mono">{miFicha.caja?.nombre_caja || (miFicha.id_caja === 3 ? 'Ventanilla 3 - Material & Libros' : (miFicha.id_caja === 1 ? 'Ventanilla 1 - Militar' : 'Ventanilla 2 - Civiles'))}</strong>
                </p>
                {miFicha.hora_llegada_ficha && (
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">
                    Hora: {new Date(miFicha.hora_llegada_ficha).toLocaleTimeString()}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={handleSolicitarFicha}
                className="btn btn-primary px-6 py-2 text-xs font-bold"
              >
                Solicitar Ficha de Turno
              </button>
            )}

            <div className="border-t border-[var(--border-fine)] pt-2 text-xs text-[var(--text-muted)] font-mono flex justify-between">
              <span>Esperando atención: <strong className="text-[var(--text-main)]">{colaEspera.length}</strong></span>
              <span>Tiempo medio: ~{Math.max(1, Math.min(120, Math.round(Number(metricas?.promedio_espera_minutos_Wq) || 5)))} min</span>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA EDITORIAL CAJERO / OPERADOR */
        <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
          {/* Tira Ledger de KPIs de Caja (52px) */}
          <div className="border border-[var(--border-fine)] rounded-[2px] bg-[var(--bg-card)] shadow-xs overflow-hidden shrink-0">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--border-fine)]">
              <div className="p-2 bg-[var(--bg-card)]">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block truncate font-sans">En Sala de Espera</span>
                <p className="text-lg font-black font-mono text-[var(--text-main)] leading-none mt-0.5">{colaEspera.length}</p>
              </div>
              <div className="p-2 bg-[var(--bg-card)]">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block truncate font-sans">Tiempo Medio Espera</span>
                <p className="text-lg font-black font-mono text-[var(--color-accent)] leading-none mt-0.5">
                  {Math.max(0, Math.min(120, Math.round(Number(metricas?.promedio_espera_minutos_Wq) || 0)))} min
                </p>
              </div>
              <div className="p-2 bg-[var(--bg-card)]">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block truncate font-sans">Atendidos Hoy</span>
                <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">{metricas?.atendidas || 0}</p>
              </div>
              <div className="p-2 bg-[var(--bg-card)]">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block truncate font-sans">Ventanillas Activas</span>
                <p className="text-lg font-black font-mono text-[var(--text-main)] leading-none mt-0.5">{cajas.length}</p>
              </div>
            </div>
          </div>

          {/* Área Dividida */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden">
            {/* Puesto de Ventanilla */}
            <div className="lg:col-span-4 bg-[var(--bg-card)] border border-[var(--border-fine)] rounded-[2px] p-3 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--border-fine)] pb-2">
                  <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <Landmark className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    Mi Ventanilla
                  </h3>
                  <select
                    value={cajaActivaId}
                    onChange={(e) => {
                      const newId = parseInt(e.target.value) || 1;
                      setCajaActivaId(newId);
                      cargarDatosCaja(newId);
                    }}
                    className="bg-[var(--bg-surface)] border border-[var(--border-fine)] text-xs text-[var(--text-main)] rounded-[2px] px-2 py-0.5 font-mono"
                  >
                    {cajas.map((c) => (
                      <option key={c.id_caja} value={c.id_caja}>{c.nombre_caja}</option>
                    ))}
                  </select>
                </div>

                {turnoEnAtencion ? (
                  <div className="bg-[var(--bg-surface)] border border-[var(--color-accent)]/60 rounded-[2px] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase text-[var(--color-accent)] tracking-wider font-mono">
                        Atendiendo Actualmente
                      </span>
                      <span className="font-mono text-xs text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-fine)] px-2 py-0.5 rounded-[2px] font-bold">
                        Turno #{turnoEnAtencion.numero_ficha}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[var(--text-main)]">
                      {turnoEnAtencion.estudiante?.nombre_estudiante
                        ? `${turnoEnAtencion.estudiante.nombre_estudiante} ${turnoEnAtencion.estudiante.apellido_estudiante}`
                        : (typeof turnoEnAtencion.estudiante === 'string' ? turnoEnAtencion.estudiante : 'Estudiante')}
                    </h4>
                    {turnoEnAtencion.hora_inicio_atencion_ficha && (
                      <p className="text-[10px] text-[var(--text-muted)] font-mono">
                        Inicio: {new Date(turnoEnAtencion.hora_inicio_atencion_ficha).toLocaleTimeString()}
                      </p>
                    )}
                    <button
                      onClick={() => setModalPago(true)}
                      className="w-full py-1.5 btn btn-primary rounded-[2px] text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Cobrar Arancel / Comprobante
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`${API_BASE}/cajas/ficha/finalizar`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id_ficha: turnoEnAtencion.id_ficha }),
                        });
                        setTurnoEnAtencion(null);
                        mostrarMensaje('ok', 'Atención finalizada sin cobro.');
                        cargarDatosCaja();
                      }}
                      className="w-full py-1 btn btn-secondary text-xs"
                    >
                      <X className="w-3 h-3" /> Finalizar sin cobro
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-5 space-y-2 bg-[var(--bg-surface)] rounded-[2px] border border-dashed border-[var(--border-fine)]">
                    <UserCheck className="w-7 h-7 text-[var(--text-muted)] mx-auto opacity-40" />
                    <p className="text-xs text-[var(--text-muted)]">Ventanilla lista para convocar turno</p>
                    <button
                      onClick={handleLlamarSiguiente}
                      disabled={colaEspera.length === 0}
                      className="btn btn-primary text-xs font-bold"
                    >
                      Llamar Siguiente Turno
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Listado Editorial de Sala de Espera */}
            <div className="lg:col-span-8 bg-[var(--bg-card)] border border-[var(--border-fine)] rounded-[2px] p-3 flex flex-col overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-fine)] pb-2 mb-2">
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <Users className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    Turnos en Sala de Espera ({colaEspera.length})
                  </h3>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {filtrarPorVentanilla ? `Filtrando por ${cajas.find(c => c.id_caja === cajaActivaId)?.nombre_caja || 'Mi Ventanilla'}` : 'Todas las ventanillas'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nuevo = !filtrarPorVentanilla;
                    setFiltrarPorVentanilla(nuevo);
                    cargarDatosCaja(cajaActivaId, !nuevo);
                  }}
                  className="btn btn-secondary text-xs"
                  style={{ padding: '0.15rem 0.5rem', height: '24px' }}
                >
                  {filtrarPorVentanilla ? 'Mi Ventanilla' : 'Todos los Turnos'}
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <table className="compact-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }}>Pos.</th>
                      <th>N° Turno</th>
                      <th>Estudiante</th>
                      <th>Tipo</th>
                      <th>Ventanilla Asignada</th>
                      <th>Llegada</th>
                      <th>Tiempo Espera</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colaEspera.map((f) => (
                      <tr key={f.id_ficha}>
                        <td className="font-bold font-mono text-[var(--color-accent)]">#{f.posicion || f.posicion_cola}</td>
                        <td className="font-bold font-mono text-[var(--text-main)]">#{f.numero_ficha}</td>
                        <td>
                          <div className="font-semibold text-[var(--text-main)] truncate max-w-[170px]">
                            {f.estudiante?.nombre_estudiante
                              ? `${f.estudiante.nombre_estudiante} ${f.estudiante.apellido_estudiante}`
                              : (typeof f.estudiante === 'string' ? f.estudiante : 'Estudiante')}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${f.tipo_cliente === 'Militar' ? 'badge-gold' : 'badge-civil'}`}>
                            {f.tipo_cliente || 'Civil'}
                          </span>
                        </td>
                        <td className="text-[11px] text-[var(--text-muted)] font-mono truncate max-w-[140px]">
                          {f.caja?.nombre_caja || (f.id_caja === 3 ? 'Ventanilla 3 - Libros' : (f.id_caja === 1 ? 'Ventanilla 1 - Militar' : 'Ventanilla 2 - Civiles'))}
                        </td>
                        <td className="font-mono text-[10px] text-[var(--text-dim)]">
                          {f.hora_llegada_ficha ? new Date(f.hora_llegada_ficha).toLocaleTimeString() : '—'}
                        </td>
                        <td className="font-mono text-[11px] font-bold text-[var(--color-accent)]">
                          {f.tiempo_espera_minutos !== undefined ? `${f.tiempo_espera_minutos} min` : '—'}
                        </td>
                      </tr>
                    ))}
                    {colaEspera.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-[var(--text-dim)]">
                          No hay turnos pendientes en sala de espera.
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

      {/* Modal de Cobro y Recaudación */}
      {modalPago && turnoEnAtencion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-fine)] rounded-[3px] w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-fine)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text-main)] font-sans uppercase tracking-wider">
                Procesar Recaudación en Ventanilla
              </h3>
              <button onClick={() => setModalPago(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcesarPago} className="space-y-3 text-xs">
              <div>
                <label className="text-[var(--text-muted)] block mb-1 font-mono text-[11px]">Estudiante</label>
                <input
                  type="text"
                  disabled
                  value={turnoEnAtencion.estudiante?.nombre_estudiante
                    ? `${turnoEnAtencion.estudiante.nombre_estudiante} ${turnoEnAtencion.estudiante.apellido_estudiante}`
                    : (typeof turnoEnAtencion.estudiante === 'string' ? turnoEnAtencion.estudiante : 'Estudiante')}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-fine)] rounded-[2px] px-3 py-2 text-[var(--text-main)] font-bold font-mono"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] block mb-1 font-mono text-[11px]">Concepto</label>
                <select
                  value={formPago.id_tipo_pago}
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    const concepto =
                      id === 1 ? 'Beca Militar (100% Exenta)'
                      : id === 2 ? 'Matrícula Regular Civil'
                      : id === 3 ? 'Mensualidad Civil'
                      : id === 4 ? 'Adquisición de Texto Oficial'
                      : 'Certificado de Suficiencia';
                    const monto = id === 1 ? 0 : id === 2 ? 150 : id === 3 ? 220 : id === 4 ? 180 : 80;
                    setFormPago({ id_tipo_pago: id, concepto, monto });
                  }}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-fine)] rounded-[2px] px-3 py-2 text-[var(--text-main)] font-mono text-xs"
                >
                  <option value={1}>Beca Militar (100% Exenta)</option>
                  <option value={2}>Matrícula Regular Civil</option>
                  <option value={3}>Mensualidad Civil</option>
                  <option value={4}>Adquisición de Texto Oficial</option>
                  <option value={5}>Certificado de Suficiencia</option>
                </select>
              </div>

              <div>
                <label className="text-[var(--text-muted)] block mb-1 font-mono text-[11px]">Monto a Cobrar (Bs.)</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={formPago.monto}
                  onChange={(e) => setFormPago({ ...formPago, monto: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-fine)] rounded-[2px] px-3 py-2 text-[var(--text-main)] font-mono text-base font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-fine)]">
                <button
                  type="button"
                  onClick={() => setModalPago(false)}
                  className="px-3 py-1.5 rounded-[2px] border border-[var(--border-fine)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[2px] btn-primary text-xs font-bold transition shadow-xs"
                >
                  Confirmar Cobro & Comprobante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprobante Oficial Emitido */}
      {comprobanteEmitido && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-fine)] rounded-[3px] w-full max-w-sm p-6 space-y-4 text-center shadow-xl">
            <CheckCircle2 className="w-10 h-10 text-[var(--color-primary)] dark:text-[var(--color-accent)] mx-auto" />
            <h3 className="text-sm font-bold text-[var(--text-main)] font-sans uppercase tracking-wider">
              Comprobante Oficial de Pago
            </h3>
            <div className="bg-[var(--bg-surface)] p-4 rounded-[2px] border border-[var(--border-fine)] text-left text-xs space-y-1 font-mono">
              <p className="text-[var(--text-muted)]">Recibo: <strong className="text-[var(--text-main)]">#{comprobanteEmitido.id_pago}</strong></p>
              <p className="text-[var(--text-muted)]">Monto: <strong className="text-[var(--color-accent)] text-sm">{comprobanteEmitido.monto_pago} Bs.</strong></p>
              <p className="text-[var(--text-muted)]">Fecha: <strong className="text-[var(--text-main)]">{new Date(comprobanteEmitido.fecha_pago).toLocaleString()}</strong></p>
            </div>
            <button
              onClick={() => setComprobanteEmitido(null)}
              className="w-full py-2 btn-primary rounded-[2px] text-xs font-bold"
            >
              Cerrar Comprobante
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
