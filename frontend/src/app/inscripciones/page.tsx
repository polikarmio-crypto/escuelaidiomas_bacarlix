'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardEdit,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  RefreshCw,
  ShieldAlert,
  Layers,
  GraduationCap,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Shield
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

const PER_PAGE = 7;

export default function InscripcionesPage() {
  const { esJefeAcademico, esEstudiante, esAdmin, rolConfig, usuario } = useAuthRole();
  const puedeInscribir = esJefeAcademico || esAdmin;

  const [loading, setLoading] = useState(false);
  const [inscripciones, setInscripciones] = useState<any[]>([]);
  const [paralelos, setParalelos] = useState<any[]>([]);
  const [estudiantesElegibles, setEstudiantesElegibles] = useState<any[]>([]);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);

  const [modalInscribir, setModalInscribir] = useState(false);
  const [formIns, setFormIns] = useState({
    id_estudiante: '',
    id_paralelo: '',
  });

  const mostrarMensaje = (tipo: 'ok' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 5000);
  };

  const cargarEstudiantesElegibles = async (idParalelo: string) => {
    if (!idParalelo) {
      setEstudiantesElegibles([]);
      return;
    }
    setLoadingEstudiantes(true);
    try {
      const res = await fetch(`/api/v1/estudiantes?id_paralelo_destino=${idParalelo}&per_page=100`);
      if (res.ok) {
        const d = await res.json();
        const lista = d.data || [];
        setEstudiantesElegibles(lista);
        if (lista.length > 0) {
          setFormIns((f) => ({ ...f, id_estudiante: (lista[0].id_estudiante || lista[0].id).toString() }));
        } else {
          setFormIns((f) => ({ ...f, id_estudiante: '' }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEstudiantes(false);
    }
  };

  const abrirModalInscribir = () => {
    setModalInscribir(true);
    const primerParalelo = paralelos[0]?.id_paralelo?.toString() || '';
    setFormIns({
      id_paralelo: primerParalelo,
      id_estudiante: '',
    });
    if (primerParalelo) {
      cargarEstudiantesElegibles(primerParalelo);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      let urlIns = '/api/v1/inscripciones?per_page=100';
      if (esEstudiante) {
        if (usuario.id_estudiante) urlIns += `&id_estudiante=${usuario.id_estudiante}`;
        else if (usuario.email) urlIns += `&email=${encodeURIComponent(usuario.email)}`;
      }

      const [resIns, resPar] = await Promise.all([
        fetch(urlIns),
        esEstudiante ? Promise.resolve({ ok: true, json: async () => [] } as any) : fetch('/api/v1/paralelos'),
      ]);

      if (resIns.ok) {
        const d = await resIns.json();
        setInscripciones(d.data || []);
      }
      if (resPar.ok && !esEstudiante) {
        const d = await resPar.json();
        setParalelos(d || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [esEstudiante, usuario.id_estudiante, usuario.email]);

  const handleFormalizarInscripcion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_estudiante: parseInt(formIns.id_estudiante),
          id_paralelo: parseInt(formIns.id_paralelo),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al formalizar la matrícula.');

      mostrarMensaje('ok', data.message || 'Inscripción procesada y avance de libros inicializado.');
      setModalInscribir(false);
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [busqueda]);

  const inscripcionesFiltradas = useMemo(() => {
    return inscripciones.filter((ins) => {
      if (esEstudiante) {
        if (usuario.id_estudiante && ins.id_estudiante) {
          return Number(ins.id_estudiante) === Number(usuario.id_estudiante);
        }
        if (usuario.email && ins.estudiante?.email_estudiante) {
          return ins.estudiante.email_estudiante.toLowerCase().trim() === usuario.email.toLowerCase().trim();
        }
        if (usuario.ci && ins.estudiante?.ci_estudiante) {
          return ins.estudiante.ci_estudiante.trim().toLowerCase() === usuario.ci.trim().toLowerCase();
        }
        const nomEst = `${ins.estudiante?.nombre_estudiante || ''} ${ins.estudiante?.apellido_estudiante || ''}`.trim().toLowerCase();
        return nomEst === usuario.nombre.trim().toLowerCase();
      }
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      const nom = `${ins.estudiante?.nombre_estudiante} ${ins.estudiante?.apellido_estudiante}`.toLowerCase();
      const ci = ins.estudiante?.ci_estudiante?.toLowerCase() || '';
      const par = ins.paralelo?.codigo_paralelo?.toLowerCase() || '';
      return nom.includes(q) || ci.includes(q) || par.includes(q);
    });
  }, [inscripciones, esEstudiante, usuario, busqueda]);

  const totalPages = Math.max(1, Math.ceil(inscripcionesFiltradas.length / PER_PAGE));
  const inscripcionesPaginadas = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return inscripcionesFiltradas.slice(start, start + PER_PAGE);
  }, [inscripcionesFiltradas, page]);

  const [inscripcionSeleccionada, setInscripcionSeleccionada] = useState<any | null>(null);

  useEffect(() => {
    if (inscripcionesPaginadas.length > 0) {
      if (!inscripcionSeleccionada || !inscripcionesPaginadas.some((i) => i.id_inscripcion === inscripcionSeleccionada.id_inscripcion)) {
        setInscripcionSeleccionada(inscripcionesPaginadas[0]);
      }
    } else {
      setInscripcionSeleccionada(null);
    }
  }, [inscripcionesPaginadas]);

  if (!puedeInscribir && !esEstudiante) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-8 text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-neutral-300 max-w-xl mx-auto">
            La formalización de matrículas y control de avance corresponde a la <strong className="text-sky-400">Jefatura Académica</strong>.
            Los estudiantes tienen acceso exclusivo en modo consulta de sus cursos inscritos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* FRANJA SUPERIOR COMPACTA (44px): Breadcrumb + Filtros Inline + Acciones */}
      <div className="strip-utility-bar">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--military-green-subtle)] border border-[var(--border-accent)] text-[var(--military-green-primary)] dark:text-[var(--military-gold-primary)] font-mono text-[11px] font-bold shrink-0">
            <ClipboardEdit className="w-3.5 h-3.5" />
            <span>SACA / Inscripciones</span>
          </div>

          <div className="h-4 w-[1px] bg-[var(--border-fine)] shrink-0" />

          {!esEstudiante && (
            <div className="relative w-44 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[var(--text-dim)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por estudiante, CI o paralelo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded pl-8 pr-2 py-1 text-xs text-[var(--text-main)] outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {puedeInscribir && (
            <button
              onClick={abrirModalInscribir}
              className="btn btn-primary"
              style={{ padding: '0.2rem 0.65rem', fontSize: '0.72rem', height: '28px' }}
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline">Nueva Matrícula</span>
            </button>
          )}

          <button
            onClick={cargarDatos}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', height: '28px' }}
            title="Sincronizar matrículas"
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
        {/* PANEL PRINCIPAL: TABLA DE INSCRIPCIONES (7 REGISTROS) */}
        <div className="workspace-main-panel">
          <div className="workspace-table-container">
            <table className="compact-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>ID</th>
                  <th>Estudiante</th>
                  <th>Paralelo & Idioma</th>
                  <th>Nivel Curricular</th>
                  <th>Fecha Matrícula</th>
                  <th className="text-center">Libros</th>
                  <th className="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {inscripcionesPaginadas.map((ins) => {
                  const esActivo = inscripcionSeleccionada?.id_inscripcion === ins.id_inscripcion;

                  return (
                    <tr
                      key={ins.id_inscripcion}
                      onClick={() => setInscripcionSeleccionada(ins)}
                      className={`cursor-pointer transition ${esActivo ? 'selected' : ''}`}
                    >
                      <td className="font-mono font-bold text-[var(--military-gold-primary)] text-xs whitespace-nowrap">
                        #{ins.id_inscripcion}
                      </td>
                      <td>
                        <div className="font-bold text-[var(--text-main)] truncate max-w-[190px]">
                          {ins.estudiante?.nombre_estudiante} {ins.estudiante?.apellido_estudiante}
                        </div>
                        <span className="text-[10px] text-[var(--text-dim)] font-mono">
                          CI: {ins.estudiante?.ci_estudiante} &bull; {ins.estudiante?.tipo_estudiante}
                        </span>
                      </td>
                      <td className="truncate max-w-[160px]">
                        <span className="font-mono font-bold text-[var(--text-main)] text-xs">
                          {ins.paralelo?.codigo_paralelo}
                        </span>
                        <div className="text-[10px] text-[var(--military-gold-primary)] font-bold">
                          {ins.paralelo?.nivel?.programa?.idioma?.nombre_idioma}
                        </div>
                      </td>
                      <td className="text-[11px] text-[var(--text-muted)] truncate max-w-[140px]">
                        {ins.paralelo?.nivel?.nombre_nivel}
                      </td>
                      <td className="font-mono text-[var(--text-dim)] text-[11px] whitespace-nowrap">
                        {ins.fecha_inscripcion}
                      </td>
                      <td className="text-center">
                        <span className="font-mono font-bold text-xs text-[var(--text-main)]">
                          {(ins.libros_avance || []).length}
                        </span>
                      </td>
                      <td className="text-center whitespace-nowrap">
                        <span className="badge badge-military">
                          {ins.estado_inscripcion}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {inscripcionesFiltradas.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[var(--text-dim)]">
                      No se encontraron inscripciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* DOCKED BOTTOM PAGINATION */}
          <div className="tactical-pagination">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--military-gold-primary)]">MATRÍCULAS:</span>
              <span>{inscripcionesFiltradas.length} REGISTRADAS</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-secondary"
                style={{ padding: '0.15rem 0.5rem', height: '26px', fontSize: '0.72rem' }}
                title="Página Anterior"
              >
                <ChevronLeft className="w-3 h-3" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-[var(--text-dim)]">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`px-2 py-0.5 rounded text-xs font-mono font-bold border transition ${
                          page === p
                            ? 'bg-[var(--military-green-primary)] text-white border-[var(--border-accent)]'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn btn-secondary"
                style={{ padding: '0.15rem 0.5rem', height: '26px', fontSize: '0.72rem' }}
                title="Página Siguiente"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="hidden sm:block">
              <span>PÁG {page} DE {totalPages}</span>
            </div>
          </div>
        </div>

        {/* PANEL LATERAL DERECHO: DOSSIER DE MATRÍCULA Y AVANCE DE LIBROS */}
        <div className="workspace-side-panel">
          {inscripcionSeleccionada ? (
            <div className="flex flex-col h-full gap-2.5">
              {/* Encabezado */}
              <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--border-subtle)]">
                <div className="w-9 h-9 rounded bg-[var(--military-green-primary)] text-[var(--military-gold-primary)] font-bold font-mono text-sm flex items-center justify-center shrink-0 border border-[var(--border-accent)]">
                  {inscripcionSeleccionada.estudiante?.nombre_estudiante?.slice(0, 2).toUpperCase() || 'ES'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-xs text-[var(--text-main)] truncate leading-tight">
                    {inscripcionSeleccionada.estudiante?.nombre_estudiante} {inscripcionSeleccionada.estudiante?.apellido_estudiante}
                  </h3>
                  <div className="text-[10px] text-[var(--text-dim)] font-mono mt-0.5">
                    CI: {inscripcionSeleccionada.estudiante?.ci_estudiante} &bull; {inscripcionSeleccionada.estudiante?.tipo_estudiante}
                  </div>
                </div>
              </div>

              {/* Datos de Matrícula */}
              <div className="flex flex-col gap-2 flex-1">
                <div className="bg-[var(--bg-surface-elevated)] p-2 rounded border border-[var(--border-fine)] space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)] font-mono">
                    Paralelo Asignado
                  </div>
                  <div className="text-sm font-bold text-[var(--military-gold-primary)] font-mono">
                    {inscripcionSeleccionada.paralelo?.codigo_paralelo}
                  </div>
                  <div className="text-xs text-[var(--text-main)] font-semibold">
                    {inscripcionSeleccionada.paralelo?.nivel?.programa?.idioma?.nombre_idioma}
                  </div>
                  <div className="text-[10px] text-[var(--text-dim)]">
                    {inscripcionSeleccionada.paralelo?.nivel?.nombre_nivel} ({inscripcionSeleccionada.paralelo?.nivel?.programa?.nombre_programa})
                  </div>
                </div>

                {/* Avance de Libros Inicializados */}
                <div className="flex-1 flex flex-col gap-1.5 min-h-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)] font-mono">
                    Avance de Libros (Malla)
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {(inscripcionSeleccionada.libros_avance || []).map((la: any) => (
                      <div
                        key={la.id_inscripcion_libro}
                        className="p-1.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-fine)] flex items-center justify-between text-xs"
                      >
                        <div className="truncate pr-2">
                          <span className="font-medium text-[var(--text-main)] block truncate">
                            {la.libro?.nombre_libro || `Libro #${la.id_libro}`}
                          </span>
                        </div>
                        <span
                          className={`badge shrink-0 ${
                            la.estado_libro === 'Aprobado'
                              ? 'badge-military'
                              : la.estado_libro === 'En curso'
                              ? 'badge-gold'
                              : 'badge-civil'
                          }`}
                        >
                          {la.estado_libro}
                        </span>
                      </div>
                    ))}
                    {(inscripcionSeleccionada.libros_avance || []).length === 0 && (
                      <div className="text-xs text-[var(--text-dim)] p-2">Sin libros registrados en este curso.</div>
                    )}
                  </div>
                </div>

                {/* Fecha y Estado */}
                <div className="bg-[var(--bg-surface-elevated)] p-2 rounded border border-[var(--border-fine)] flex items-center justify-between text-xs font-mono mt-auto">
                  <span className="text-[var(--text-dim)]">Fecha: {inscripcionSeleccionada.fecha_inscripcion}</span>
                  <span className="badge badge-military">{inscripcionSeleccionada.estado_inscripcion}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 text-[var(--text-dim)]">
              <ClipboardEdit className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs">Seleccione una matrícula para ver el plan curricular y libros del estudiante.</p>
            </div>
          )}
        </div>
      </div>

      {modalInscribir && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">Inscripción y Apertura de Malla</h3>
              <button onClick={() => setModalInscribir(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormalizarInscripcion} className="space-y-4 text-xs">
              <div>
                <label className="text-neutral-300 block mb-1 font-semibold">1. Paralelo / Aula Destino (Idioma y Nivel)</label>
                <select
                  value={formIns.id_paralelo}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setFormIns((f) => ({ ...f, id_paralelo: newId }));
                    cargarEstudiantesElegibles(newId);
                  }}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white font-mono"
                  required
                >
                  <option value="" disabled>-- Seleccione un paralelo --</option>
                  {paralelos.map((p) => {
                    const nombreIdioma = p.idioma || p.nivel?.programa?.idioma?.nombre_idioma || 'Idioma';
                    const nombreNivel = typeof p.nivel === 'string' ? p.nivel : (p.nivel?.nombre_nivel || '');
                    const cupos = p.cupos_disponibles ?? Math.max(0, (p.capacidad_maxima ?? 30) - (p.inscritos ?? 0));
                    return (
                      <option key={p.id_paralelo} value={p.id_paralelo}>
                        {p.codigo_paralelo} — {nombreIdioma} ({nombreNivel}) [Cupo disp: {cupos}]
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1 font-semibold">
                  2. Estudiante Elegible (Pendiente en este idioma)
                </label>
                {loadingEstudiantes ? (
                  <div className="p-2.5 text-xs text-sky-400 bg-sky-950/30 border border-sky-800/50 rounded flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Filtrando estudiantes aptos para este idioma...
                  </div>
                ) : estudiantesElegibles.length === 0 ? (
                  <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded text-amber-300 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      Sin estudiantes pendientes para este idioma
                    </p>
                    <p className="text-[11px] text-amber-200/80">
                      No existen estudiantes registrados que falten por asignar a este idioma. Todos los alumnos ya tienen un aula activa en este idioma o debe registrar nuevos estudiantes.
                    </p>
                  </div>
                ) : (
                  <select
                    value={formIns.id_estudiante}
                    onChange={(e) => setFormIns((f) => ({ ...f, id_estudiante: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                    required
                  >
                    <option value="" disabled>-- Seleccionar de {estudiantesElegibles.length} estudiantes disponibles --</option>
                    {estudiantesElegibles.map((e) => (
                      <option key={e.id_estudiante || e.id} value={e.id_estudiante || e.id}>
                        {e.nombres || e.nombre_estudiante} {e.apellidos || e.apellido_estudiante} (CI: {e.ci || e.ci_estudiante}) — {e.tipo || e.tipo_estudiante}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400 text-[11px] space-y-1">
                <p className="font-semibold text-white">Nota de Control Curricular:</p>
                <p>Al matricular, el sistema valida que el alumno no tenga paralelo activo en el idioma y genera automáticamente el avance curricular libro a libro en estado inicial &lsquo;En curso&rsquo;.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalInscribir(false)}
                  className="px-3 py-1.5 rounded bg-neutral-800 text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!formIns.id_estudiante || !formIns.id_paralelo || loadingEstudiantes || estudiantesElegibles.length === 0}
                  className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Formalizar Matrícula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
