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
  ChevronRight
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

const PER_PAGE = 10;

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
      const res = await fetch('http://localhost:8000/api/v1/paralelos');
      if (res.ok) {
        const data = await res.json();
        setParalelos(data || []);
        if (data.length > 0 && !idParaleloSeleccionado) {
          setIdParaleloSeleccionado(data[0].id_paralelo.toString());
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
      const res = await fetch(`http://localhost:8000/api/v1/calificaciones/paralelo/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAlumnos(data.alumnos || []);
        setInfoParalelo({ codigo: data.paralelo, nivel: data.nivel });
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
  }, []);

  useEffect(() => {
    if (idParaleloSeleccionado) {
      cargarNotasParalelo(idParaleloSeleccionado);
    }
  }, [idParaleloSeleccionado]);

  const idiomasDisponibles = useMemo(() => {
    const set = new Set<string>();
    paralelos.forEach((p) => {
      const idm = p.nivel?.programa?.idioma?.nombre_idioma;
      if (idm) set.add(idm);
    });
    return Array.from(set);
  }, [paralelos]);

  const paralelosFiltrados = useMemo(() => {
    if (!filtroIdioma) return paralelos;
    return paralelos.filter((p) => p.nivel?.programa?.idioma?.nombre_idioma === filtroIdioma);
  }, [paralelos, filtroIdioma]);

  useEffect(() => {
    setPage(1);
  }, [busqueda, idParaleloSeleccionado, filtroIdioma]);

  const alumnosFiltrados = useMemo(() => {
    if (esEstudiante) {
      return alumnos.filter((a) => a.estudiante.nombre_completo.toLowerCase().includes(usuario.nombre.toLowerCase()) || a.estudiante.ci.includes(usuario.ci.split(' ')[0]));
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
        id_docente_calificador: 1,
      };

      if (modoCalculo === 'directa') {
        payload.nota_final_directa = formNotas.promedioDirecto;
      } else {
        payload.nota_examen_libro = formNotas.examen;
        payload.nota_defensa_oral = formNotas.oral;
        payload.nota_participacion_libro = formNotas.participacion;
      }

      const res = await fetch('http://localhost:8000/api/v1/calificaciones/libro', {
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
              <span>SACA</span>
              <span>/</span>
              <span className="text-emerald-400 font-semibold">Calificaciones</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              {esEstudiante ? 'Mi Historial de Calificaciones' : 'Registro de Calificaciones'}
            </h1>
          </div>
        </div>
        <button
          onClick={() => cargarNotasParalelo(idParaleloSeleccionado)}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar Notas
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
          {alerta.tipo === 'ok' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{alerta.mensaje}</span>
        </div>
      )}

      {!esEstudiante && (
        <div className="flex flex-wrap items-center justify-between gap-3 py-1 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 font-semibold">Idioma:</span>
              <select
                value={filtroIdioma}
                onChange={(e) => setFiltroIdioma(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white"
              >
                <option value="">Todos los idiomas</option>
                {idiomasDisponibles.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 font-semibold">Paralelo / Curso:</span>
              <select
                value={idParaleloSeleccionado}
                onChange={(e) => setIdParaleloSeleccionado(e.target.value)}
                className="bg-neutral-900 border border-emerald-500/50 rounded-lg px-3 py-1.5 text-white font-mono font-bold"
              >
                {paralelosFiltrados.map((p) => (
                  <option key={p.id_paralelo} value={p.id_paralelo}>
                    {p.codigo_paralelo} — {p.nivel?.programa?.idioma?.nombre_idioma} ({p.nivel?.nombre_nivel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar en acta..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>
      )}

      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-3">Estudiante</th>
                <th className="p-3">CI</th>
                <th className="p-3">Libro en Curso</th>
                <th className="p-3 text-center">Examen (80%)</th>
                <th className="p-3 text-center">Oral (10%)</th>
                <th className="p-3 text-center">Part. (10%)</th>
                <th className="p-3 text-center">Nota Final</th>
                <th className="p-3 text-center">Estado</th>
                {puedeCalificar && <th className="p-3 text-right">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {alumnosPaginados.map((item) => {
                const primerLibro = item.libros_evaluados?.[0];
                return (
                  <tr key={item.id_inscripcion} className="hover:bg-neutral-800/30 transition">
                    <td className="p-3">
                      <div className="font-bold text-white text-sm">
                        {item.estudiante.nombre_completo}
                      </div>
                      {item.estudiante.grado_militar && (
                        <p className="text-[11px] text-amber-400 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> {item.estudiante.grado_militar}
                        </p>
                      )}
                    </td>
                    <td className="p-3 font-mono text-neutral-400">
                      {item.estudiante.ci}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-white">
                        {primerLibro?.libro || 'Sin libro asignado'}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-white">
                      {primerLibro?.nota_examen !== null ? primerLibro?.nota_examen : '—'}
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-white">
                      {primerLibro?.nota_oral !== null ? primerLibro?.nota_oral : '—'}
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-white">
                      {primerLibro?.nota_participacion !== null ? primerLibro?.nota_participacion : '—'}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-base">
                      {primerLibro?.nota_final !== null ? (
                        <span className={primerLibro.aprobado ? 'text-emerald-400' : 'text-red-400'}>
                          {primerLibro.nota_final}
                        </span>
                      ) : (
                        <span className="text-neutral-500 font-normal text-xs">Pendiente</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {primerLibro?.estado_libro ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                            primerLibro.estado_libro === 'Aprobado'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : primerLibro.estado_libro === 'Reprobado'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {primerLibro.estado_libro}
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-[10px]">Sin registro</span>
                      )}
                    </td>
                    {puedeCalificar && (
                      <td className="p-3 text-right">
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
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 ml-auto"
                          >
                            <Edit className="w-3 h-3" /> Calificar
                          </button>
                        ) : (
                          <span className="text-neutral-500 text-[11px]">No habilitado</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {alumnosFiltrados.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-500">
                    No hay estudiantes inscritos en este paralelo o curso seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {alumnosFiltrados.length > PER_PAGE && (
          <div className="flex items-center justify-between p-3 border-t border-neutral-800 text-xs text-neutral-400 bg-neutral-950/40">
            <span>Página {page} de {totalPages} ({alumnosFiltrados.length} estudiantes)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {modalCalificar && evaluando && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Registro de Evaluación</h3>
                <p className="text-xs text-neutral-400">
                  {evaluando.alumnoNombre} &bull; <span className="text-emerald-400">{evaluando.libroTitulo}</span>
                </p>
              </div>
              <button onClick={() => setModalCalificar(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModoCalculo('ponderada')}
                className={`py-1.5 rounded transition ${
                  modoCalculo === 'ponderada' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Fórmula 80/10/10 (Desglose)
              </button>
              <button
                type="button"
                onClick={() => setModoCalculo('directa')}
                className={`py-1.5 rounded transition ${
                  modoCalculo === 'directa' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Promedio Directo Docente
              </button>
            </div>

            <form onSubmit={handleGuardarCalificacion} className="space-y-4 text-xs">
              {modoCalculo === 'ponderada' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-neutral-300 font-semibold block mb-1">
                      1. Examen Teórico / Escrito (80% de la nota final)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={formNotas.examen}
                      onChange={(e) => setFormNotas({ ...formNotas, examen: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-neutral-300 font-semibold block mb-1">
                      2. Defensa Oral / Speaking (10% de la nota final)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={formNotas.oral}
                      onChange={(e) => setFormNotas({ ...formNotas, oral: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-neutral-300 font-semibold block mb-1">
                      3. Participación y Disciplina (10% de la nota final)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={formNotas.participacion}
                      onChange={(e) => setFormNotas({ ...formNotas, participacion: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono text-sm"
                      required
                    />
                  </div>

                  <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-neutral-400 font-medium">Nota Final Ponderada:</span>
                    <span className={`font-mono text-lg font-extrabold ${notaCalculadaPonderada >= 71 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {notaCalculadaPonderada} / 100 {notaCalculadaPonderada >= 71 ? '(Aprobado)' : '(Reprobado)'}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">
                    Nota Promedio Final (Colocada por el Docente)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formNotas.promedioDirecto}
                    onChange={(e) => setFormNotas({ ...formNotas, promedioDirecto: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono text-base font-bold"
                    required
                  />
                  <p className="text-[11px] text-neutral-400 mt-1.5">
                    Nota mínima de aprobación: 71.0 puntos.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalCalificar(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow"
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
