'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Edit,
  Save,
  X,
  Layers,
  GraduationCap,
  Sparkles,
  BookOpen,
  ShieldAlert,
  RefreshCw,
  Calculator,
  ChevronLeft,
  ChevronRight,
  User,
  Check
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

const PER_PAGE = 7;

interface AlumnoCalificacion {
  id_inscripcion: number;
  estudiante: {
    id_estudiante: number;
    nombre_completo: string;
    ci: string;
    tipo: string;
    grado_militar?: string | null;
  };
  libros_evaluados: {
    id_inscripcion_libro: number;
    libro: string;
    numero_libro: number;
    estado_libro: string;
    nota_examen: number | null;
    nota_oral: number | null;
    nota_participacion: number | null;
    nota_final: number | null;
    aprobado: boolean;
    docente_calificador?: string | null;
  }[];
}

export default function CalificacionesPage() {
  const { rolActivo, esDocente, esJefeAcademico, esEstudiante, esAdmin, rolConfig, usuario } = useAuthRole();
  const puedeCalificar = esDocente || esJefeAcademico || esAdmin;

  const [loading, setLoading] = useState(false);
  const [paralelos, setParalelos] = useState<any[]>([]);
  const [idParaleloSeleccionado, setIdParaleloSeleccionado] = useState<string>('');
  const [alumnos, setAlumnos] = useState<AlumnoCalificacion[]>([]);
  const [infoParalelo, setInfoParalelo] = useState<any | null>(null);

  const [filtroIdioma, setFiltroIdioma] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);

  const [modalCalificar, setModalCalificar] = useState(false);
  const [evaluando, setEvaluando] = useState<{
    id_inscripcion_libro: number;
    alumnoNombre: string;
    libroTitulo: string;
  } | null>(null);

  const [modoCalculo, setModoCalculo] = useState<'ponderada' | 'directa'>('ponderada');
  const [formNotas, setFormNotas] = useState({
    examen: 80,
    oral: 10,
    participacion: 10,
    promedioDirecto: 80,
  });

  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);

  const mostrarMensaje = (tipo: 'ok' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 5000);
  };

  const cargarParalelos = async () => {
    try {
      // Flujo especial para ESTUDIANTE: buscar en qué paralelo está inscrito
      if (esEstudiante && usuario.id_estudiante) {
        const insRes = await fetch(`/api/v1/inscripciones?id_estudiante=${usuario.id_estudiante}`);
        if (insRes.ok) {
          const insData = await insRes.json();
          const inscList: any[] = insData.data || (Array.isArray(insData) ? insData : []);
          if (inscList.length > 0) {
            const paraleloIds = inscList.map((i: any) => i.id_paralelo);
            const resP = await fetch('/api/v1/paralelos');
            if (resP.ok) {
              const dataP = await resP.json();
              const all = Array.isArray(dataP) ? dataP : (dataP.data || []);
              const lista = all.filter((p: any) => paraleloIds.includes(p.id_paralelo));
              setParalelos(lista);
              if (lista.length > 0) setIdParaleloSeleccionado(lista[0].id_paralelo.toString());
              else setIdParaleloSeleccionado('');
            }
          } else {
            // Estudiante sin inscripciones
            setParalelos([]);
            setIdParaleloSeleccionado('');
          }
        }
        return;
      }

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
      console.error(e);
    }
  };

  const cargarNotasParalelo = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const idDoc = esDocente ? (usuario.id_docente || 1) : '';
      let url: string;
      if (esEstudiante && usuario.id_estudiante) {
        url = `/api/v1/calificaciones/paralelo/${id}?id_estudiante=${usuario.id_estudiante}`;
      } else if (idDoc) {
        url = `/api/v1/calificaciones/paralelo/${id}?id_docente=${idDoc}`;
      } else {
        url = `/api/v1/calificaciones/paralelo/${id}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAlumnos(data.alumnos || []);
        setInfoParalelo({ codigo: data.paralelo, nivel: data.nivel });
      } else {
        const errData = await res.json().catch(() => ({}));
        mostrarMensaje('error', errData.error || 'Error al obtener matriz de calificaciones.');
        setAlumnos([]);
      }
    } catch (e) {
      console.error(e);
      mostrarMensaje('error', 'Error al obtener matriz de calificaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarParalelos();
  }, [esDocente, usuario.id_docente, usuario.email, rolActivo]);

  useEffect(() => {
    if (idParaleloSeleccionado) {
      cargarNotasParalelo(idParaleloSeleccionado);
    }
  }, [idParaleloSeleccionado]);

  const idiomasDisponibles = useMemo(() => {
    const set = new Set<string>();
    paralelos.forEach((p) => {
      const idm = p.idioma || p.nivel?.programa?.idioma?.nombre_idioma;
      if (idm) set.add(idm);
    });
    return Array.from(set);
  }, [paralelos]);

  const paralelosFiltrados = useMemo(() => {
    if (!filtroIdioma) return paralelos;
    return paralelos.filter((p) => (p.idioma || p.nivel?.programa?.idioma?.nombre_idioma) === filtroIdioma);
  }, [paralelos, filtroIdioma]);

  useEffect(() => {
    setPage(1);
  }, [busqueda, idParaleloSeleccionado, filtroIdioma]);

  const alumnosFiltrados = useMemo(() => {
    if (esEstudiante) {
      return alumnos.filter((a) => {
        if (usuario.id_estudiante) return a.estudiante.id_estudiante === usuario.id_estudiante;
        if (usuario.ci) return a.estudiante.ci === usuario.ci || a.estudiante.ci === usuario.ci.split(' ')[0];
        return false;
      });
    }
    if (!busqueda.trim()) return alumnos;
    const q = busqueda.toLowerCase().trim();
    return alumnos.filter((a) =>
      a.estudiante.nombre_completo.toLowerCase().includes(q) ||
      a.estudiante.ci.toLowerCase().includes(q)
    );
  }, [alumnos, busqueda, esEstudiante, usuario]);

  const totalPages = Math.max(1, Math.ceil(alumnosFiltrados.length / PER_PAGE));
  const alumnosPaginados = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return alumnosFiltrados.slice(start, start + PER_PAGE);
  }, [alumnosFiltrados, page]);

  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<AlumnoCalificacion | null>(null);

  useEffect(() => {
    if (alumnosPaginados.length > 0) {
      if (!alumnoSeleccionado || !alumnosPaginados.some((a) => a.id_inscripcion === alumnoSeleccionado.id_inscripcion)) {
        setAlumnoSeleccionado(alumnosPaginados[0]);
      }
    } else {
      setAlumnoSeleccionado(null);
    }
  }, [alumnosPaginados]);

  const statsParalelo = useMemo(() => {
    let totalNotas = 0;
    let sumaNotas = 0;
    let aprobados = 0;
    let reprobados = 0;
    let pendientes = 0;

    alumnos.forEach((a) => {
      const libro = a.libros_evaluados?.[0];
      if (libro && libro.nota_final !== null && libro.nota_final !== undefined) {
        totalNotas++;
        sumaNotas += Number(libro.nota_final);
        if (libro.aprobado) aprobados++;
        else reprobados++;
      } else {
        pendientes++;
      }
    });

    const promedio = totalNotas > 0 ? (sumaNotas / totalNotas).toFixed(1) : '—';
    const tasaAprobacion = totalNotas > 0 ? Math.round((aprobados / totalNotas) * 100) : 0;

    return { totalNotas, sumaNotas, promedio, aprobados, reprobados, pendientes, tasaAprobacion };
  }, [alumnos]);

  const notaCalculadaPonderada = useMemo(() => {
    const e = parseFloat(formNotas.examen.toString()) || 0;
    const o = parseFloat(formNotas.oral.toString()) || 0;
    const p = parseFloat(formNotas.participacion.toString()) || 0;
    return Math.round(((e * 0.80) + (o * 0.10) + (p * 0.10)) * 100) / 100;
  }, [formNotas.examen, formNotas.oral, formNotas.participacion]);

  const abrirModalCalificar = (idInsLibro: number, alumno: string, libro: string, evalActual?: any) => {
    setEvaluando({
      id_inscripcion_libro: idInsLibro,
      alumnoNombre: alumno,
      libroTitulo: libro,
    });
    if (evalActual && evalActual.nota_final !== null) {
      setFormNotas({
        examen: evalActual.nota_examen || 0,
        oral: evalActual.nota_oral || 0,
        participacion: evalActual.nota_participacion || 0,
        promedioDirecto: evalActual.nota_final || 0,
      });
    } else {
      setFormNotas({ examen: 75, oral: 80, participacion: 85, promedioDirecto: 76 });
    }
    setModalCalificar(true);
  };

  const handleGuardarCalificacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluando) return;

    try {
      const payload: any = {
        id_inscripcion_libro: evaluando.id_inscripcion_libro,
        id_docente_calificador: usuario.id_docente || 1,
      };

      if (modoCalculo === 'directa') {
        payload.nota_final_directa = formNotas.promedioDirecto;
      } else {
        payload.nota_examen_libro = formNotas.examen;
        payload.nota_defensa_oral = formNotas.oral;
        payload.nota_participacion_libro = formNotas.participacion;
      }

      const res = await fetch('/api/v1/calificaciones/libro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar calificación.');

      mostrarMensaje('ok', `${data.message} Nota final: ${data.nota_final} (${data.resultado})`);
      setModalCalificar(false);
      cargarNotasParalelo(idParaleloSeleccionado);
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  if (!puedeCalificar && !esEstudiante) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-8 text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-neutral-300 max-w-xl mx-auto">
            El registro de calificaciones corresponde exclusivamente a los <strong className="text-emerald-400">Docentes</strong> y la supervisión a la <strong className="text-sky-400">Jefatura Académica</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* FRANJA SUPERIOR COMPACTA (44px): Breadcrumb + Filtros Inline + Buscador */}
      <div className="strip-utility-bar">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--military-green-subtle)] border border-[var(--border-accent)] text-[var(--military-green-primary)] dark:text-[var(--military-gold-primary)] font-mono text-[11px] font-bold shrink-0">
            <Award className="w-3.5 h-3.5" />
            <span>SACA / Calificaciones</span>
          </div>

          {!esEstudiante && (
            <>
              <div className="h-4 w-[1px] bg-[var(--border-fine)] shrink-0" />
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-bold text-[var(--text-dim)] uppercase hidden sm:inline">Idioma:</span>
                <select
                  value={filtroIdioma}
                  onChange={(e) => setFiltroIdioma(e.target.value)}
                  className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded px-2 py-0.5 text-xs text-[var(--text-main)] outline-none"
                >
                  <option value="">Todos los idiomas</option>
                  {idiomasDisponibles.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-bold text-[var(--text-dim)] uppercase hidden md:inline">Paralelo:</span>
                <select
                  value={idParaleloSeleccionado}
                  onChange={(e) => setIdParaleloSeleccionado(e.target.value)}
                  className="bg-[var(--bg-surface-elevated)] border border-[var(--military-gold-primary)] rounded px-2 py-0.5 text-xs text-[var(--text-main)] font-mono font-bold outline-none"
                >
                  {paralelosFiltrados.map((p) => (
                    <option key={p.id_paralelo} value={p.id_paralelo}>
                      {p.codigo_paralelo} — {p.nivel?.programa?.idioma?.nombre_idioma} ({p.nivel?.nombre_nivel})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!esEstudiante && (
            <div className="relative w-40 sm:w-56">
              <Search className="w-3.5 h-3.5 text-[var(--text-dim)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar CI / nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded pl-8 pr-2 py-1 text-xs text-[var(--text-main)] outline-none"
              />
            </div>
          )}

          <button
            onClick={() => cargarNotasParalelo(idParaleloSeleccionado)}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem', height: '28px' }}
            title="Sincronizar actas de calificaciones"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sincronizar</span>
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

      {/* ÁREA DE TRABAJO DIVIDIDA (SPLIT-WORKSPACE): TABLA COMPACTA + PANEL LATERAL */}
      <div className="split-workspace">
        {/* PANEL PRINCIPAL: TABLA COMPACTA (7 REGISTROS) */}
        <div className="workspace-main-panel">
          <div className="workspace-table-container">
            <table className="compact-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>CI</th>
                  <th>Libro en Curso</th>
                  <th className="text-center">Examen (80%)</th>
                  <th className="text-center">Oral (10%)</th>
                  <th className="text-center">Part. (10%)</th>
                  <th className="text-center">Nota Final</th>
                  <th className="text-center">Estado</th>
                  {puedeCalificar && <th className="text-right">Acción</th>}
                </tr>
              </thead>
              <tbody>
                {alumnosPaginados.map((item) => {
                  const primerLibro = item.libros_evaluados?.[0];
                  const esActivo = alumnoSeleccionado?.id_inscripcion === item.id_inscripcion;

                  return (
                    <tr
                      key={item.id_inscripcion}
                      onClick={() => setAlumnoSeleccionado(item)}
                      className={`cursor-pointer transition ${esActivo ? 'selected' : ''}`}
                    >
                      <td>
                        <div className="font-bold text-[var(--text-main)] truncate max-w-[200px]">
                          {item.estudiante.nombre_completo}
                        </div>
                        {item.estudiante.grado_militar ? (
                          <span className="text-[10px] text-[var(--military-gold-primary)] font-bold flex items-center gap-1 font-mono">
                            <Shield className="w-2.5 h-2.5" /> {item.estudiante.grado_militar}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-dim)] font-mono">CIVIL</span>
                        )}
                      </td>
                      <td className="font-mono text-[var(--text-muted)] font-semibold text-xs whitespace-nowrap">
                        {item.estudiante.ci}
                      </td>
                      <td className="truncate max-w-[150px]">
                        <span className="font-medium text-[var(--text-main)] text-xs">
                          {primerLibro?.libro || 'Sin libro'}
                        </span>
                      </td>
                      <td className="text-center font-mono font-semibold text-[var(--text-main)]">
                        {primerLibro?.nota_examen !== null && primerLibro?.nota_examen !== undefined ? primerLibro.nota_examen : '—'}
                      </td>
                      <td className="text-center font-mono font-semibold text-[var(--text-main)]">
                        {primerLibro?.nota_oral !== null && primerLibro?.nota_oral !== undefined ? primerLibro.nota_oral : '—'}
                      </td>
                      <td className="text-center font-mono font-semibold text-[var(--text-main)]">
                        {primerLibro?.nota_participacion !== null && primerLibro?.nota_participacion !== undefined ? primerLibro.nota_participacion : '—'}
                      </td>
                      <td className="text-center font-mono font-bold text-sm">
                        {primerLibro?.nota_final !== null && primerLibro?.nota_final !== undefined ? (
                          <span className={primerLibro.aprobado ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                            {primerLibro.nota_final}
                          </span>
                        ) : (
                          <span className="text-[var(--text-dim)] font-normal text-[11px]">Pendiente</span>
                        )}
                      </td>
                      <td className="text-center whitespace-nowrap">
                        {primerLibro?.estado_libro ? (
                          <span
                            className={`badge ${
                              primerLibro.estado_libro === 'Aprobado'
                                ? 'badge-military'
                                : primerLibro.estado_libro === 'Reprobado'
                                ? 'badge-danger'
                                : 'badge-gold'
                            }`}
                          >
                            {primerLibro.estado_libro}
                          </span>
                        ) : (
                          <span className="text-[var(--text-dim)] text-[10px]">Sin registro</span>
                        )}
                      </td>
                      {puedeCalificar && (
                        <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {primerLibro ? (
                            <button
                              onClick={() =>
                                abrirModalCalificar(
                                  primerLibro.id_inscripcion_libro,
                                  item.estudiante.nombre_completo,
                                  primerLibro.libro,
                                  primerLibro
                                )
                              }
                              className="btn btn-secondary"
                              style={{ padding: '0.15rem 0.45rem', fontSize: '0.70rem', height: '24px' }}
                            >
                              <Edit className="w-3 h-3 text-[var(--military-gold-primary)]" />
                              <span>Calificar</span>
                            </button>
                          ) : (
                            <span className="text-[var(--text-dim)] text-[10px]">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {alumnosFiltrados.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[var(--text-dim)]">
                      No hay estudiantes registrados en el paralelo seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN TÁCTICA FIJA INFERIOR */}
          <div className="tactical-pagination">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--military-gold-primary)]">ALUMNOS:</span>
              <span>{alumnosFiltrados.length} REGISTRADOS</span>
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

        {/* PANEL LATERAL DERECHO: DOSSIER ACTIVO & ACCIÓN RÁPIDA */}
        <div className="workspace-side-panel">
          {alumnoSeleccionado ? (
            <div className="flex flex-col h-full gap-2.5">
              {/* Encabezado del Alumno */}
              <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--border-subtle)]">
                <div className="w-9 h-9 rounded bg-[var(--military-green-primary)] text-[var(--military-gold-primary)] font-bold font-mono text-sm flex items-center justify-center shrink-0 border border-[var(--border-accent)]">
                  {alumnoSeleccionado.estudiante.grado_militar ? (
                    <Shield className="w-5 h-5" />
                  ) : (
                    alumnoSeleccionado.estudiante.nombre_completo.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-xs text-[var(--text-main)] truncate leading-tight">
                    {alumnoSeleccionado.estudiante.nombre_completo}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-dim)] font-mono mt-0.5">
                    <span>CI: {alumnoSeleccionado.estudiante.ci}</span>
                    <span>&bull;</span>
                    <span className="text-[var(--military-gold-primary)] font-bold">
                      {alumnoSeleccionado.estudiante.grado_militar || 'CIVIL'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Libro y Calificaciones en Tiempo Real */}
              {(() => {
                const primerLibro = alumnoSeleccionado.libros_evaluados?.[0];
                return (
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="bg-[var(--bg-surface-elevated)] p-2 rounded border border-[var(--border-fine)]">
                      <div className="text-[10px] uppercase font-bold text-[var(--text-dim)]">Libro Evaluado</div>
                      <div className="text-xs font-bold text-[var(--text-main)] truncate mt-0.5">
                        {primerLibro?.libro || 'Sin libro asignado en este curso'}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="bg-[var(--bg-surface-elevated)] p-1.5 rounded border border-[var(--border-fine)] text-center">
                        <div className="text-[9px] uppercase font-bold text-[var(--text-dim)]">Examen</div>
                        <div className="text-sm font-mono font-bold text-[var(--text-main)] mt-0.5">
                          {primerLibro?.nota_examen ?? '—'}
                        </div>
                        <div className="text-[8px] text-[var(--text-dim)] font-mono">80%</div>
                      </div>

                      <div className="bg-[var(--bg-surface-elevated)] p-1.5 rounded border border-[var(--border-fine)] text-center">
                        <div className="text-[9px] uppercase font-bold text-[var(--text-dim)]">Oral</div>
                        <div className="text-sm font-mono font-bold text-[var(--text-main)] mt-0.5">
                          {primerLibro?.nota_oral ?? '—'}
                        </div>
                        <div className="text-[8px] text-[var(--text-dim)] font-mono">10%</div>
                      </div>

                      <div className="bg-[var(--bg-surface-elevated)] p-1.5 rounded border border-[var(--border-fine)] text-center">
                        <div className="text-[9px] uppercase font-bold text-[var(--text-dim)]">Part.</div>
                        <div className="text-sm font-mono font-bold text-[var(--text-main)] mt-0.5">
                          {primerLibro?.nota_participacion ?? '—'}
                        </div>
                        <div className="text-[8px] text-[var(--text-dim)] font-mono">10%</div>
                      </div>
                    </div>

                    {/* Nota Final Prominente */}
                    <div className="p-2.5 rounded border border-[var(--border-accent)] bg-[var(--military-gold-subtle)] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Nota Final Ponderada</div>
                        <div className="text-[10px] text-[var(--text-dim)] font-mono">Mínimo aprobación: 71.0</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-mono font-black text-[var(--text-main)]">
                          {primerLibro?.nota_final !== null && primerLibro?.nota_final !== undefined ? primerLibro.nota_final : '—'}
                        </div>
                        {primerLibro?.estado_libro && (
                          <span className={`badge ${primerLibro.aprobado ? 'badge-military' : 'badge-danger'}`}>
                            {primerLibro.estado_libro}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botón de Acción Directo */}
                    {puedeCalificar && primerLibro && (
                      <button
                        onClick={() =>
                          abrirModalCalificar(
                            primerLibro.id_inscripcion_libro,
                            alumnoSeleccionado.estudiante.nombre_completo,
                            primerLibro.libro,
                            primerLibro
                          )
                        }
                        className="btn btn-primary w-full mt-auto"
                        style={{ padding: '0.45rem', fontSize: '0.78rem' }}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Calificar / Asignar Nota</span>
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 text-[var(--text-dim)]">
              <User className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs">Seleccione un estudiante de la tabla para ver su desglose táctico y calificar.</p>
            </div>
          )}

          {/* Estadísticas del Paralelo al pie del panel derecho */}
          <div className="pt-2 mt-auto border-t border-[var(--border-subtle)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
              Balance del Curso
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
              <div className="flex justify-between bg-[var(--bg-surface-elevated)] p-1.5 rounded">
                <span className="text-[var(--text-dim)]">Promedio:</span>
                <span className="font-bold text-[var(--text-main)]">{statsParalelo.promedio}</span>
              </div>
              <div className="flex justify-between bg-[var(--bg-surface-elevated)] p-1.5 rounded">
                <span className="text-[var(--text-dim)]">Aprobados:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{statsParalelo.tasaAprobacion}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalCalificar && evaluando && (
        <div className="modal-overlay" onClick={() => setModalCalificar(false)}>
          <div className="modal-card animate-solemn-fade" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Registro de Evaluación
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: '0.15rem 0 0' }}>
                  {evaluando.alumnoNombre} &bull; <span style={{ color: 'var(--military-gold-primary)', fontWeight: 700 }}>{evaluando.libroTitulo}</span>
                </p>
              </div>
              <button onClick={() => setModalCalificar(false)} className="btn-icon btn-ghost">
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '0.85rem 1.25rem 0', display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setModoCalculo('ponderada')}
                className={`filter-tab ${modoCalculo === 'ponderada' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Fórmula 80/10/10
              </button>
              <button
                type="button"
                onClick={() => setModoCalculo('directa')}
                className={`filter-tab ${modoCalculo === 'directa' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Promedio Directo
              </button>
            </div>

            <form onSubmit={handleGuardarCalificacion} style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {modoCalculo === 'ponderada' ? (
                <>
                  <div>
                    <label>1. Examen Teórico / Escrito (80%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={formNotas.examen}
                      onChange={(e) => setFormNotas({ ...formNotas, examen: parseFloat(e.target.value) || 0 })}
                      required
                      style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label>2. Defensa Oral / Speaking (10%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={formNotas.oral}
                      onChange={(e) => setFormNotas({ ...formNotas, oral: parseFloat(e.target.value) || 0 })}
                      required
                      style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label>3. Participación & Disciplina (10%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={formNotas.participacion}
                      onChange={(e) => setFormNotas({ ...formNotas, participacion: parseFloat(e.target.value) || 0 })}
                      required
                      style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}
                    />
                  </div>

                  <div style={{ background: 'var(--military-gold-subtle)', border: '1px solid var(--border-accent)', padding: '0.65rem 0.85rem', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Nota Final Ponderada:</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 900, color: notaCalculadaPonderada >= 71 ? 'var(--status-active)' : 'var(--status-danger)' }}>
                      {notaCalculadaPonderada} / 100 {notaCalculadaPonderada >= 71 ? '(Aprobado)' : '(Reprobado)'}
                    </span>
                  </div>
                </>
              ) : (
                <div>
                  <label>Nota Promedio Final (Docente)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formNotas.promedioDirecto}
                    onChange={(e) => setFormNotas({ ...formNotas, promedioDirecto: parseFloat(e.target.value) || 0 })}
                    required
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 900 }}
                  />
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', margin: '0.35rem 0 0' }}>
                    Nota mínima de aprobación: 71.0 puntos.
                  </p>
                </div>
              )}

              <div className="modal-footer" style={{ margin: '0.5rem -1.25rem -1rem', padding: '0.75rem 1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setModalCalificar(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
                >
                  Guardar Calificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
