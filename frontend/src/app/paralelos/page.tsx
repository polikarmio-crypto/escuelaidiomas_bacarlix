'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Calendar,
  Users,
  Search,
  Filter,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  GraduationCap,
  ShieldAlert,
  RefreshCw,
  DoorOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

const PER_PAGE = 9;

export default function ParalelosPage() {
  const { esJefeAcademico, esDocente, esAdmin, rolConfig, usuario } = useAuthRole();
  const puedeCrear = esJefeAcademico || esAdmin;

  const [loading, setLoading] = useState(false);
  const [paralelos, setParalelos] = useState<any[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [aulas, setAulas] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [modalidades, setModalidades] = useState<any[]>([]);
  const [gestiones, setGestiones] = useState<any[]>([]);
  const [niveles, setNiveles] = useState<any[]>([]);

  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);

  const [modalApertura, setModalApertura] = useState(false);
  const [formParalelo, setFormParalelo] = useState({
    codigo_paralelo: '',
    id_nivel: 1,
    id_aula: 1,
    id_horario: 1,
    id_modalidad: 1,
    id_gestion: 1,
    id_docente_inicial: 1,
    capacidad_maxima: 30,
    capacidad_minima: 10,
  });

  const mostrarMensaje = (tipo: 'ok' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 5000);
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resPar, resDoc, resCat, resProg] = await Promise.all([
        fetch('http://localhost:8000/api/v1/paralelos'),
        fetch('http://localhost:8000/api/v1/docentes'),
        fetch('http://localhost:8000/api/v1/catalogos'),
        fetch('http://localhost:8000/api/v1/estructura/programas'),
      ]);

      if (resPar.ok) setParalelos(await resPar.json() || []);
      if (resDoc.ok) setDocentes(await resDoc.json() || []);
      if (resCat.ok) {
        const cat = await resCat.json();
        setAulas(cat.aulas || []);
        setHorarios(cat.horarios || []);
        setModalidades(cat.modalidades || []);
        setGestiones(cat.gestiones || []);
      }
      if (resProg.ok) {
        const prog = await resProg.json();
        const todosNiveles: any[] = [];
        prog.forEach((pr: any) => {
          (pr.niveles || []).forEach((n: any) => {
            todosNiveles.push({
              ...n,
              programa_nombre: pr.nombre_programa,
              idioma_nombre: pr.idioma?.nombre_idioma,
            });
          });
        });
        setNiveles(todosNiveles);
        if (todosNiveles.length > 0 && formParalelo.id_nivel === 1) {
          setFormParalelo((f) => ({ ...f, id_nivel: todosNiveles[0].id_nivel }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleAperturarParalelo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/v1/paralelos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo_paralelo: formParalelo.codigo_paralelo,
          id_nivel: formParalelo.id_nivel,
          id_aula: formParalelo.id_aula,
          id_horario: formParalelo.id_horario,
          id_modalidad: formParalelo.id_modalidad,
          id_gestion: formParalelo.id_gestion,
          id_docente_inicial: formParalelo.id_docente_inicial,
          capacidad_maxima_paralelo: formParalelo.capacidad_maxima,
          capacidad_minima_apertura: formParalelo.capacidad_minima,
          estado_paralelo: 'Abierto',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al aperturar paralelo.');

      mostrarMensaje('ok', data.message || 'Paralelo aperturado exitosamente con docente asignado.');
      setModalApertura(false);
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [busqueda]);

  const paralelosVisibles = useMemo(() => {
    return paralelos.filter((p) => {
      if (esDocente) {
        const nombreDocente = p.docente_actual?.nombre_docente || '';
        return nombreDocente.toLowerCase().includes(usuario.nombre.toLowerCase().split(' ')[1] || '');
      }
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      return (
        p.codigo_paralelo?.toLowerCase().includes(q) ||
        p.nivel?.programa?.idioma?.nombre_idioma?.toLowerCase().includes(q) ||
        p.aula?.nombre_aula?.toLowerCase().includes(q)
      );
    });
  }, [paralelos, esDocente, usuario.nombre, busqueda]);

  const totalPages = Math.max(1, Math.ceil(paralelosVisibles.length / PER_PAGE));
  const paralelosPaginados = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return paralelosVisibles.slice(start, start + PER_PAGE);
  }, [paralelosVisibles, page]);

  if (!puedeCrear && !esDocente) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-8 text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-neutral-300 max-w-xl mx-auto">
            La apertura de paralelos y asignación docente corresponde a la <strong className="text-sky-400">Jefatura Académica</strong>.
            Los docentes tienen acceso en modo consulta para verificar sus asignaciones.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
              <span>SACA</span>
              <span>/</span>
              <span className="text-purple-400 font-semibold">Paralelos</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              {esDocente ? 'Mis Paralelos Asignados' : 'Apertura y Asignación de Paralelos'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
          {puedeCrear && (
            <button
              onClick={() => setModalApertura(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" />
              + Aperturar Nuevo Paralelo
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por código de paralelo, idioma o aula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white"
          />
        </div>
        <span className="text-xs text-neutral-500">
          Mostrando <strong className="text-white">{paralelosVisibles.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, paralelosVisibles.length)}</strong> de <strong className="text-white">{paralelosVisibles.length}</strong> paralelos
        </span>
      </div>

      {paralelosPaginados.length === 0 ? (
        <div className="p-12 text-center text-neutral-500 border border-neutral-800/80 rounded-2xl bg-neutral-900/30">
          No se encontraron paralelos registrados o que coincidan con la búsqueda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paralelosPaginados.map((p) => {
            const inscritos = p.inscripciones_count || 0;
            const capMax = p.capacidad_maxima_paralelo || 30;
            const cuposDisp = p.cupos_disponibles ?? Math.max(0, capMax - inscritos);
            const porcentaje = Math.min(100, Math.round((inscritos / capMax) * 100));

            return (
              <div
                key={p.id_paralelo}
                className="bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 space-y-4 transition shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800/70 pb-3">
                    <span className="text-base font-extrabold font-mono text-sky-400">
                      {p.codigo_paralelo}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.estado_paralelo === 'Abierto' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {p.estado_paralelo}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-white text-sm">
                      {p.nivel?.programa?.idioma?.nombre_idioma}
                    </p>
                    <p className="text-neutral-400">
                      {p.nivel?.programa?.nombre_programa} &bull; <span className="text-sky-300 font-semibold">{p.nivel?.nombre_nivel}</span>
                    </p>
                    <div className="pt-2 border-t border-neutral-800/60 space-y-1 text-neutral-300">
                      <p className="flex items-center gap-2">
                        <DoorOpen className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        Aula: <strong className="text-white">{p.aula?.nombre_aula}</strong>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        Horario: <span className="font-mono text-neutral-200">{p.horario?.hora_inicio_horario} - {p.horario?.hora_fin_horario}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        Docente: <strong className="text-emerald-300 truncate">
                          {p.docente_actual ? `${p.docente_actual.nombre_docente} ${p.docente_actual.apellido_docente}` : 'Sin asignar'}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                    <span>Ocupación: <strong className="text-white font-mono">{inscritos}/{capMax}</strong></span>
                    <span>Disponibles: <strong className="text-emerald-400 font-mono font-bold">{cuposDisp}</strong></span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        porcentaje >= 90 ? 'bg-red-500' : porcentaje >= 70 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-500">
                    <span>Mín. apertura: {p.capacidad_minima_apertura} alumnos</span>
                    <span>{porcentaje}% cubierto</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {paralelosVisibles.length > PER_PAGE && (
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/40 border border-neutral-800 rounded-xl text-xs text-neutral-400">
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

      {modalApertura && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">Apertura de Nuevo Paralelo</h3>
              <button onClick={() => setModalApertura(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAperturarParalelo} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 block mb-1">Código del Paralelo</label>
                <input
                  type="text"
                  placeholder="Ej: ING-101-A, FRA-201-B"
                  value={formParalelo.codigo_paralelo}
                  onChange={(e) => setFormParalelo({ ...formParalelo, codigo_paralelo: e.target.value.toUpperCase() })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-300 block mb-1">Nivel Curricular e Idioma</label>
                <select
                  value={formParalelo.id_nivel}
                  onChange={(e) => setFormParalelo({ ...formParalelo, id_nivel: parseInt(e.target.value) || 1 })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                >
                  {niveles.map((n) => (
                    <option key={n.id_nivel} value={n.id_nivel}>
                      {n.idioma_nombre} — {n.nombre_nivel} ({n.programa_nombre})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 block mb-1">Aula Asignada</label>
                  <select
                    value={formParalelo.id_aula}
                    onChange={(e) => setFormParalelo({ ...formParalelo, id_aula: parseInt(e.target.value) || 1 })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                  >
                    {aulas.map((a) => (
                      <option key={a.id_aula} value={a.id_aula}>
                        {a.nombre_aula} (Cap: {a.capacidad_aula})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-neutral-300 block mb-1">Horario / Turno</label>
                  <select
                    value={formParalelo.id_horario}
                    onChange={(e) => setFormParalelo({ ...formParalelo, id_horario: parseInt(e.target.value) || 1 })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                  >
                    {horarios.map((h) => (
                      <option key={h.id_horario} value={h.id_horario}>
                        {h.hora_inicio_horario} - {h.hora_fin_horario}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1">Docente Inicial Asignado</label>
                <select
                  value={formParalelo.id_docente_inicial}
                  onChange={(e) => setFormParalelo({ ...formParalelo, id_docente_inicial: parseInt(e.target.value) || 1 })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                >
                  {docentes.map((d) => (
                    <option key={d.id_docente} value={d.id_docente}>
                      {d.nombre_completo} ({d.idiomas?.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 block mb-1">Capacidad Máxima (Aforo)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={formParalelo.capacidad_maxima}
                    onChange={(e) => setFormParalelo({ ...formParalelo, capacidad_maxima: parseInt(e.target.value) || 30 })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-300 block mb-1">Capacidad Mínima</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formParalelo.capacidad_minima}
                    onChange={(e) => setFormParalelo({ ...formParalelo, capacidad_minima: parseInt(e.target.value) || 10 })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalApertura(false)}
                  className="px-3 py-1.5 rounded bg-neutral-800 text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow"
                >
                  Aperturar Paralelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
