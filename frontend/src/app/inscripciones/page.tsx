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
  ChevronRight
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

const PER_PAGE = 10;

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm shrink-0">
            <ClipboardEdit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
              <span>SACA</span>
              <span>/</span>
              <span className="text-indigo-400 font-semibold">Inscripciones</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              {esEstudiante ? 'Mis Matrículas y Cursos Inscritos' : 'Matriculación y Avance Académico'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span>Sincronizar</span>
          </button>
          {puedeInscribir && (
            <button
              onClick={abrirModalInscribir}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              + Inscribir Estudiante
            </button>
          )}
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
          {alerta.tipo === 'ok' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{alerta.mensaje}</span>
        </div>
      )}

      {!esEstudiante && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por estudiante, CI o código de paralelo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-3 py-1.5 text-xs text-white"
            />
          </div>
          <span className="text-xs text-neutral-500">
            Mostrando <strong className="text-white">{inscripcionesFiltradas.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, inscripcionesFiltradas.length)}</strong> de <strong className="text-white">{inscripcionesFiltradas.length}</strong> matriculados
          </span>
        </div>
      )}

      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-3">ID Inscripción</th>
                <th className="p-3">Estudiante</th>
                <th className="p-3">Paralelo & Idioma</th>
                <th className="p-3">Nivel Curricular</th>
                <th className="p-3">Fecha Matrícula</th>
                <th className="p-3">Avance Libros Inicializados</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {inscripcionesPaginadas.map((ins) => (
                <tr key={ins.id_inscripcion} className="hover:bg-neutral-800/30 transition">
                  <td className="p-3 font-mono font-bold text-purple-400">
                    #{ins.id_inscripcion}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-white text-sm">
                      {ins.estudiante?.nombre_estudiante} {ins.estudiante?.apellido_estudiante}
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      CI: {ins.estudiante?.ci_estudiante} &bull; {ins.estudiante?.tipo_estudiante}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-mono font-bold text-white bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      {ins.paralelo?.codigo_paralelo}
                    </span>
                    <p className="text-[11px] text-sky-400 font-semibold mt-0.5">
                      {ins.paralelo?.nivel?.programa?.idioma?.nombre_idioma}
                    </p>
                  </td>
                  <td className="p-3 text-neutral-300">
                    {ins.paralelo?.nivel?.nombre_nivel} ({ins.paralelo?.nivel?.programa?.nombre_programa})
                  </td>
                  <td className="p-3 font-mono text-neutral-400">
                    {ins.fecha_inscripcion}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(ins.libros_avance || []).map((la: any) => (
                        <span
                          key={la.id_inscripcion_libro}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            la.estado_libro === 'Aprobado'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : la.estado_libro === 'En curso'
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold'
                              : 'bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          {la.libro?.nombre_libro || `Libro ${la.id_libro}`} ({la.estado_libro})
                        </span>
                      ))}
                      {(ins.libros_avance || []).length === 0 && (
                        <span className="text-[10px] text-neutral-500">Sin avance registrado</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {ins.estado_inscripcion}
                    </span>
                  </td>
                </tr>
              ))}
              {inscripcionesFiltradas.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    No se encontraron inscripciones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {inscripcionesFiltradas.length > PER_PAGE && (
          <div className="flex items-center justify-between p-3 border-t border-neutral-800 text-xs text-neutral-400 bg-neutral-950/40">
            <span>Página {page} de {totalPages}</span>
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
