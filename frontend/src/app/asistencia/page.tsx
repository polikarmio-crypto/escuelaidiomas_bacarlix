'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Printer,
  X,
  Search,
  Shield,
  RefreshCw,
  Award,
  Users
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

interface EstudianteAsistencia {
  id_inscripcion: number;
  id_estudiante: number;
  nombre_completo: string;
  ci: string;
  tipo: string;
  grado_militar?: string | null;
  id_asistencia?: number | null;
  estado_asistencia: 'Presente' | 'Falta' | 'Atraso' | 'Licencia';
  observacion: string;
}

export default function AsistenciaPage() {
  const { rolActivo, esDocente, esJefeAcademico, esAdmin, rolConfig, usuario } = useAuthRole();
  const puedeRegistrar = esDocente || esJefeAcademico || esAdmin;

  const [paralelos, setParalelos] = useState<any[]>([]);
  const [idParaleloSeleccionado, setIdParaleloSeleccionado] = useState<string>('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [infoParalelo, setInfoParalelo] = useState<any | null>(null);
  const [estudiantes, setEstudiantes] = useState<EstudianteAsistencia[]>([]);
  const [resumen, setResumen] = useState<any | null>(null);
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);

  const [modalPdf, setModalPdf] = useState(false);
  const [reportePdf, setReportePdf] = useState<any | null>(null);
  const [cargandoPdf, setCargandoPdf] = useState(false);

  const mostrarMensaje = (tipo: 'ok' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 5000);
  };

  const cargarParalelos = async () => {
    try {
      const idDoc = usuario.id_docente || (esDocente ? 1 : null);
      const url = esDocente && idDoc
        ? `/api/v1/paralelos?id_docente=${idDoc}&email_docente=${encodeURIComponent(usuario.email || '')}`
        : '/api/v1/paralelos';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        let lista = Array.isArray(data) ? data : (data.data || []);
        if (esDocente) {
          if (idDoc) {
            lista = lista.filter((p: any) => Number(p.id_docente_actual) === Number(idDoc));
          } else {
            lista = [];
          }
        }
        setParalelos(lista);
        if (lista.length > 0) {
          setIdParaleloSeleccionado(lista[0].id_paralelo.toString());
        } else {
          setIdParaleloSeleccionado('');
        }
      }
    } catch (e) {
      mostrarMensaje('error', 'Error al cargar paralelos.');
    }
  };

  const cargarAsistencia = async () => {
    if (!idParaleloSeleccionado) return;
    setLoading(true);
    try {
      const idDoc = esDocente ? (usuario.id_docente || 1) : '';
      const url = idDoc
        ? `/api/v1/asistencia?id_paralelo=${idParaleloSeleccionado}&fecha=${fechaSeleccionada}&id_docente=${idDoc}`
        : `/api/v1/asistencia?id_paralelo=${idParaleloSeleccionado}&fecha=${fechaSeleccionada}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInfoParalelo(data.paralelo);
        setEstudiantes(data.estudiantes || []);
        setResumen(data.resumen || null);
      } else {
        const err = await res.json();
        mostrarMensaje('error', err.error || 'No se pudo cargar la lista de asistencia.');
      }
    } catch (e) {
      mostrarMensaje('error', 'Fallo de conexión al cargar asistencia.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarParalelos();
  }, [esDocente, usuario.id_docente, usuario.email, rolActivo]);

  useEffect(() => {
    if (idParaleloSeleccionado) {
      cargarAsistencia();
    }
  }, [idParaleloSeleccionado, fechaSeleccionada]);

  const cambiarEstadoAlumno = (idInscripcion: number, nuevoEstado: 'Presente' | 'Falta' | 'Atraso' | 'Licencia') => {
    setEstudiantes((prev) =>
      prev.map((e) => (e.id_inscripcion === idInscripcion ? { ...e, estado_asistencia: nuevoEstado } : e))
    );
  };

  const marcarTodos = (estado: 'Presente' | 'Falta' | 'Atraso' | 'Licencia') => {
    setEstudiantes((prev) => prev.map((e) => ({ ...e, estado_asistencia: estado })));
  };

  const handleGuardarAsistencia = async () => {
    if (!idParaleloSeleccionado || estudiantes.length === 0) return;
    setGuardando(true);
    try {
      const payload = {
        id_paralelo: parseInt(idParaleloSeleccionado, 10),
        fecha_asistencia: fechaSeleccionada,
        id_docente: esDocente ? (usuario.id_docente || 1) : (infoParalelo?.id_docente || null),
        asistencias: estudiantes.map((e) => ({
          id_inscripcion: e.id_inscripcion,
          id_estudiante: e.id_estudiante,
          estado_asistencia: e.estado_asistencia,
          observacion: e.observacion || null,
        })),
      };

      const res = await fetch('/api/v1/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        mostrarMensaje('ok', data.message || 'Parte de asistencia registrado correctamente.');
        cargarAsistencia();
      } else {
        throw new Error(data.error || 'No se pudo guardar la asistencia.');
      }
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    } finally {
      setGuardando(false);
    }
  };

  const abrirReportePdf = async () => {
    if (!idParaleloSeleccionado) return;
    setCargandoPdf(true);
    try {
      const res = await fetch(`/api/v1/asistencia/reporte/${idParaleloSeleccionado}`);
      if (res.ok) {
        const data = await res.json();
        setReportePdf(data);
        setModalPdf(true);
      } else {
        mostrarMensaje('error', 'Error al generar el reporte de asistencia.');
      }
    } catch (e) {
      mostrarMensaje('error', 'Fallo al conectar con el servicio de reportes.');
    } finally {
      setCargandoPdf(false);
    }
  };

  if (!puedeRegistrar) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-8 text-center space-y-4">
          <Shield className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-neutral-300 max-w-xl mx-auto">
            El control de asistencia institucional está reservado para el personal docente y jefatura académica.
          </p>
        </div>
      </div>
    );
  }

  const conteoLocal = {
    presentes: estudiantes.filter((e) => e.estado_asistencia === 'Presente').length,
    faltas: estudiantes.filter((e) => e.estado_asistencia === 'Falta').length,
    atrasos: estudiantes.filter((e) => e.estado_asistencia === 'Atraso').length,
    licencias: estudiantes.filter((e) => e.estado_asistencia === 'Licencia').length,
  };

  const porcentajeAsistencia = estudiantes.length > 0 ? Math.round((conteoLocal.presentes / estudiantes.length) * 100) : 0;

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* FRANJA SUPERIOR COMPACTA (44px): Breadcrumb + Filtros Inline + Acciones */}
      <div className="strip-utility-bar">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--military-green-subtle)] border border-[var(--border-accent)] text-[var(--military-green-primary)] dark:text-[var(--military-gold-primary)] font-mono text-[11px] font-bold shrink-0">
            <UserCheck className="w-3.5 h-3.5" />
            <span>SACA / Asistencia</span>
          </div>

          <div className="h-4 w-[1px] bg-[var(--border-fine)] shrink-0" />

          {/* Selector de Paralelo inline */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-[var(--text-dim)] uppercase hidden sm:inline">Curso:</span>
            <select
              value={idParaleloSeleccionado}
              onChange={(e) => setIdParaleloSeleccionado(e.target.value)}
              className="bg-[var(--bg-surface-elevated)] border border-[var(--military-gold-primary)] rounded px-2 py-0.5 text-xs text-[var(--text-main)] font-mono font-bold outline-none"
            >
              {paralelos.map((p) => {
                const nombreIdioma = typeof p.idioma === 'string' ? p.idioma : (p.nivel?.programa?.idioma?.nombre_idioma || 'Idioma');
                const nombreNivel = typeof p.nivel === 'string' ? p.nivel : (p.nivel?.nombre_nivel || 'Nivel');
                return (
                  <option key={p.id_paralelo} value={p.id_paralelo}>
                    {p.codigo_paralelo} — {nombreIdioma} ({nombreNivel})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Fecha inline */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-[var(--text-dim)] uppercase hidden md:inline">Fecha:</span>
            <input
              type="date"
              value={fechaSeleccionada}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded px-2 py-0.5 text-xs text-[var(--text-main)] font-mono outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => marcarTodos('Presente')}
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.55rem', fontSize: '0.70rem', height: '28px' }}
            title="Marcar toda la nómina como presente"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span className="hidden sm:inline">Todos Presentes</span>
          </button>

          <button
            onClick={abrirReportePdf}
            disabled={cargandoPdf || !idParaleloSeleccionado}
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.55rem', fontSize: '0.70rem', height: '28px', color: 'var(--military-gold-primary)' }}
            title="Previsualizar e imprimir reporte oficial"
          >
            <FileText className="w-3 h-3" />
            <span className="hidden sm:inline">Reporte PDF</span>
          </button>

          <button
            onClick={handleGuardarAsistencia}
            disabled={guardando || estudiantes.length === 0}
            className="btn btn-primary"
            style={{ padding: '0.2rem 0.65rem', fontSize: '0.72rem', height: '28px' }}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${guardando ? 'animate-spin' : ''}`} />
            <span>{guardando ? 'Guardando...' : 'Guardar Asistencia'}</span>
          </button>

          <button
            onClick={cargarAsistencia}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem', height: '28px' }}
            title="Refrescar lista"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
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
          {alerta.tipo === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
          <span>{alerta.mensaje}</span>
        </div>
      )}

      {/* ÁREA DE TRABAJO DIVIDIDA (SPLIT-WORKSPACE) */}
      <div className="split-workspace">
        {/* PANEL PRINCIPAL: TABLA DE ASISTENCIA */}
        <div className="workspace-main-panel">
          <div className="workspace-table-container">
            <table className="compact-table">
              <thead>
                <tr>
                  <th style={{ width: '32px' }}>#</th>
                  <th>Cédula (CI)</th>
                  <th>Estudiante</th>
                  <th>Condición</th>
                  <th className="text-center" style={{ width: '220px' }}>Estado Asistencia</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--text-dim)]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-[var(--military-gold-primary)]" />
                      Cargando nómina de estudiantes...
                    </td>
                  </tr>
                ) : estudiantes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--text-dim)]">
                      No se encontraron inscripciones activas para este paralelo.
                    </td>
                  </tr>
                ) : (
                  estudiantes.map((est, index) => (
                    <tr key={est.id_inscripcion} className="hover:bg-[var(--military-green-subtle)] transition">
                      <td className="font-mono text-[var(--text-dim)] text-xs">{index + 1}</td>
                      <td className="font-mono text-[var(--text-muted)] font-semibold text-xs whitespace-nowrap">{est.ci}</td>
                      <td>
                        <div className="font-bold text-[var(--text-main)] truncate max-w-[200px]">{est.nombre_completo}</div>
                        {est.grado_militar ? (
                          <div className="text-[10px] text-[var(--military-gold-primary)] font-bold font-mono flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5" /> {est.grado_militar}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[var(--text-dim)] font-mono">CIVIL</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        <span className={`badge ${est.tipo === 'Militar' ? 'badge-gold' : 'badge-civil'}`}>
                          {est.tipo}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => cambiarEstadoAlumno(est.id_inscripcion, 'Presente')}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition border ${
                              est.estado_asistencia === 'Presente'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-emerald-500'
                            }`}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={() => cambiarEstadoAlumno(est.id_inscripcion, 'Falta')}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition border ${
                              est.estado_asistencia === 'Falta'
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-red-500'
                            }`}
                          >
                            F
                          </button>
                          <button
                            type="button"
                            onClick={() => cambiarEstadoAlumno(est.id_inscripcion, 'Atraso')}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition border ${
                              est.estado_asistencia === 'Atraso'
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-amber-500'
                            }`}
                          >
                            A
                          </button>
                          <button
                            type="button"
                            onClick={() => cambiarEstadoAlumno(est.id_inscripcion, 'Licencia')}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition border ${
                              est.estado_asistencia === 'Licencia'
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-sky-500'
                            }`}
                          >
                            L
                          </button>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={est.observacion}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEstudiantes((prev) =>
                              prev.map((item) => (item.id_inscripcion === est.id_inscripcion ? { ...item, observacion: val } : item))
                            );
                          }}
                          placeholder="Observación..."
                          className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded px-2 py-0.5 text-xs text-[var(--text-main)] outline-none"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* DOCKED BOTTOM BAR */}
          <div className="tactical-pagination">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--military-gold-primary)]">NÓMINA:</span>
              <span>{estudiantes.length} ESTUDIANTES</span>
            </div>
            <div className="font-mono text-[11px]">
              <span>FECHA: <strong className="text-[var(--text-main)]">{fechaSeleccionada}</strong></span>
            </div>
          </div>
        </div>

        {/* PANEL LATERAL DERECHO: MÉTRICAS EN TIEMPO REAL & DATOS DEL CURSO */}
        <div className="workspace-side-panel">
          <div className="flex flex-col h-full gap-2.5">
            {/* Cabecera del Curso */}
            {infoParalelo && (
              <div className="bg-[var(--bg-surface-elevated)] p-2.5 rounded border border-[var(--border-fine)] space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)] font-mono">
                  Datos de la Sesión
                </div>
                <div className="text-xs font-bold text-[var(--text-main)]">
                  {infoParalelo.docente}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono">
                  Aula: {infoParalelo.aula} &bull; {infoParalelo.horario}
                </div>
              </div>
            )}

            {/* Gauge de Asistencia del día */}
            <div className="p-3 rounded border border-[var(--border-accent)] bg-[var(--military-gold-subtle)] text-center">
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Asistencia General del Día</div>
              <div className="text-3xl font-mono font-black text-[var(--text-main)] my-1">
                {porcentajeAsistencia}%
              </div>
              <div className="w-full bg-[var(--border-subtle)] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${porcentajeAsistencia}%` }}
                />
              </div>
            </div>

            {/* Tarjetas de Conteo */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-[var(--bg-surface-elevated)] p-2 rounded border border-[var(--border-fine)] flex items-center justify-between">
                <div>
                  <div className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Presentes</div>
                  <div className="text-lg font-mono font-bold text-[var(--text-main)]">{conteoLocal.presentes}</div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">P</span>
              </div>

              <div className="bg-[var(--bg-surface-elevated)] p-2 rounded border border-[var(--border-fine)] flex items-center justify-between">
                <div>
                  <div className="text-[9px] uppercase font-bold text-red-600 dark:text-red-400">Faltas</div>
                  <div className="text-lg font-mono font-bold text-[var(--text-main)]">{conteoLocal.faltas}</div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-600 dark:text-red-400">F</span>
              </div>

              <div className="bg-[var(--bg-surface-elevated)] p-2 rounded border border-[var(--border-fine)] flex items-center justify-between">
                <div>
                  <div className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400">Atrasos</div>
                  <div className="text-lg font-mono font-bold text-[var(--text-main)]">{conteoLocal.atrasos}</div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">A</span>
              </div>

              <div className="bg-[var(--bg-surface-elevated)] p-2 rounded border border-[var(--border-fine)] flex items-center justify-between">
                <div>
                  <div className="text-[9px] uppercase font-bold text-sky-600 dark:text-sky-400">Licencias</div>
                  <div className="text-lg font-mono font-bold text-[var(--text-main)]">{conteoLocal.licencias}</div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-600 dark:text-sky-400">L</span>
              </div>
            </div>

            {/* Acciones principales */}
            <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t border-[var(--border-subtle)]">
              <button
                onClick={handleGuardarAsistencia}
                disabled={guardando || estudiantes.length === 0}
                className="btn btn-primary w-full"
                style={{ padding: '0.45rem', fontSize: '0.78rem' }}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${guardando ? 'animate-spin' : ''}`} />
                <span>{guardando ? 'Guardando Registro...' : 'Guardar Asistencia de Hoy'}</span>
              </button>

              <button
                onClick={abrirReportePdf}
                disabled={cargandoPdf || !idParaleloSeleccionado}
                className="btn btn-secondary w-full"
                style={{ padding: '0.4rem', fontSize: '0.75rem', color: 'var(--military-gold-primary)' }}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Imprimir Acta de Asistencia</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalPdf && reportePdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white text-neutral-900 rounded-xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200">
            <div className="sticky top-0 bg-neutral-100 px-6 py-4 border-b border-neutral-300 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-neutral-900">
                  Previsualización de Reporte Oficial de Asistencia
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir / Guardar PDF
                </button>
                <button
                  onClick={() => setModalPdf(false)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 printable-report">
              <div className="text-center border-b-2 border-neutral-800 pb-4">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <img src="/images/logos/logo-eie.png" alt="EIE" className="w-14 h-14 object-contain" />
                  <div>
                    <h2 className="text-base font-extrabold tracking-wider text-neutral-900 uppercase">
                      {reportePdf.institucion.entidad}
                    </h2>
                    <h3 className="text-xs font-semibold text-neutral-700 tracking-wide uppercase">
                      {reportePdf.institucion.subtitulo}
                    </h3>
                    <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      Acta Oficial N°: {reportePdf.institucion.codigo_reporte} &bull; Emisión: {reportePdf.institucion.fecha_emision}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-xs">
                <div>
                  <span className="font-bold text-neutral-600 block">Paralelo:</span>
                  <span className="font-bold text-neutral-900">{reportePdf.paralelo.codigo}</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-600 block">Idioma / Nivel:</span>
                  <span className="font-semibold text-neutral-800">{reportePdf.paralelo.idioma} - {reportePdf.paralelo.nivel}</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-600 block">Horario / Aula:</span>
                  <span className="text-neutral-800">{reportePdf.paralelo.horario} ({reportePdf.paralelo.aula})</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-600 block">Promedio Asistencia:</span>
                  <span className="font-bold text-emerald-700 text-sm">{reportePdf.resumen_general.promedio_asistencia_paralelo}%</span>
                </div>
              </div>

              <div>
                <table className="w-full text-left text-xs border border-neutral-300">
                  <thead className="bg-neutral-200 text-neutral-800 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border border-neutral-300 text-center">#</th>
                      <th className="p-2 border border-neutral-300">C.I.</th>
                      <th className="p-2 border border-neutral-300">Estudiante</th>
                      <th className="p-2 border border-neutral-300 text-center">Clases</th>
                      <th className="p-2 border border-neutral-300 text-center text-emerald-800">P</th>
                      <th className="p-2 border border-neutral-300 text-center text-red-800">F</th>
                      <th className="p-2 border border-neutral-300 text-center text-amber-800">A</th>
                      <th className="p-2 border border-neutral-300 text-center text-sky-800">L</th>
                      <th className="p-2 border border-neutral-300 text-center">% Asist.</th>
                      <th className="p-2 border border-neutral-300 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {reportePdf.estudiantes.map((alu: any, idx: number) => (
                      <tr key={alu.id_inscripcion} className="odd:bg-white even:bg-neutral-50">
                        <td className="p-2 border border-neutral-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border border-neutral-300 font-mono">{alu.codigo}</td>
                        <td className="p-2 border border-neutral-300 font-medium">
                          {alu.estudiante}
                          {alu.grado && <span className="block text-[10px] text-amber-700 font-semibold">{alu.grado}</span>}
                        </td>
                        <td className="p-2 border border-neutral-300 text-center">{alu.total_clases}</td>
                        <td className="p-2 border border-neutral-300 text-center font-bold text-emerald-700">{alu.presentes}</td>
                        <td className="p-2 border border-neutral-300 text-center font-bold text-red-700">{alu.faltas}</td>
                        <td className="p-2 border border-neutral-300 text-center font-bold text-amber-700">{alu.atrasos}</td>
                        <td className="p-2 border border-neutral-300 text-center font-bold text-sky-700">{alu.licencias}</td>
                        <td className="p-2 border border-neutral-300 text-center font-bold">{alu.porcentaje_asistencia}%</td>
                        <td className="p-2 border border-neutral-300 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              alu.estado_asistencia_general === 'REGULAR'
                                ? 'bg-emerald-100 text-emerald-800'
                                : alu.estado_asistencia_general === 'OBSERVADO'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {alu.estado_asistencia_general}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-16 pb-4 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="border-t border-neutral-800 pt-2 font-bold text-neutral-900">
                    {reportePdf.firmas.docente.nombre}
                  </div>
                  <div className="text-[10px] text-neutral-600">{reportePdf.firmas.docente.cargo}</div>
                </div>

                <div>
                  <div className="border-t border-neutral-800 pt-2 font-bold text-neutral-900">
                    {reportePdf.firmas.jefe_academico.nombre}
                  </div>
                  <div className="text-[10px] text-neutral-600">{reportePdf.firmas.jefe_academico.cargo}</div>
                </div>

                <div>
                  <div className="border-t border-neutral-800 pt-2 font-bold text-neutral-900">
                    {reportePdf.firmas.direccion.nombre}
                  </div>
                  <div className="text-[10px] text-neutral-600">{reportePdf.firmas.direccion.cargo}</div>
                </div>
              </div>

              <div className="text-center text-[10px] text-neutral-400 border-t border-neutral-200 pt-2 italic">
                Documento de Control y Auditoría Académica &bull; Sistema Académico de Control y Aprendizaje (SACA)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

