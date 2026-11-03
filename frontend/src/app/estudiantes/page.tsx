'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Filter,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

interface EstudianteItem {
  id: number;
  id_estudiante: number;
  codigoMatricula: string;
  nombres: string;
  apellidos: string;
  ci: string;
  expedido?: string;
  tipo: 'MILITAR' | 'CIVIL';
  gradoMilitar?: string;
  unidadMilitar?: string;
  idiomaActual?: string;
  nivelActual?: string;
  paralelo?: string;
  telefono: string;
  correo: string;
  direccion?: string;
  estado: string;
  promedio?: number | null;
}

export default function EstudiantesPage() {
  const { esJefeAcademico, esAdmin, rolConfig } = useAuthRole();
  const puedeAdministrar = esJefeAcademico || esAdmin;

  const [estudiantes, setEstudiantes] = useState<EstudianteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);

  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'MILITAR' | 'CIVIL'>('TODOS');
  const [filtroIdioma, setFiltroIdioma] = useState('');
  const [filtroParalelo, setFiltroParalelo] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [idiomasDisponibles, setIdiomasDisponibles] = useState<string[]>([]);
  const [paralelosDisponibles, setParalelosDisponibles] = useState<string[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    ci_estudiante: '',
    nombre_estudiante: '',
    apellido_estudiante: '',
    fecha_nacimiento_estudiante: '2000-01-01',
    telefono_estudiante: '',
    email_estudiante: '',
    direccion_estudiante: '',
    tipo_estudiante: 'Civil' as 'Civil' | 'Militar',
    grado_militar: '',
    unidad_militar: '',
    id_militar_estudiante: '',
  });

  const mostrarMensaje = (tipo: 'ok' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 5000);
  };

  const cargarEstudiantes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', '15');
      if (filtroTipo !== 'TODOS') params.append('tipo', filtroTipo);
      if (filtroIdioma) params.append('idioma', filtroIdioma);
      if (filtroParalelo) params.append('paralelo', filtroParalelo);
      if (busqueda.trim()) params.append('q', busqueda.trim());

      const res = await fetch(`http://localhost:8000/api/v1/estudiantes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEstudiantes(data.data || []);
        setTotal(data.total || 0);

        const idSet = new Set<string>();
        const parSet = new Set<string>();
        (data.data || []).forEach((e: EstudianteItem) => {
          if (e.idiomaActual && e.idiomaActual !== 'Sin asignar') idSet.add(e.idiomaActual);
          if (e.paralelo && e.paralelo !== 'Sin asignar') parSet.add(e.paralelo);
        });
        if (idiomasDisponibles.length === 0) setIdiomasDisponibles(Array.from(idSet));
        if (paralelosDisponibles.length === 0) setParalelosDisponibles(Array.from(parSet));
      }
    } catch (e) {
      console.error(e);
      mostrarMensaje('error', 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstudiantes();
  }, [page, filtroTipo, filtroIdioma, filtroParalelo]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    cargarEstudiantes();
  };

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setIdSeleccionado(null);
    setFormData({
      ci_estudiante: '',
      nombre_estudiante: '',
      apellido_estudiante: '',
      fecha_nacimiento_estudiante: '2000-01-01',
      telefono_estudiante: '',
      email_estudiante: '',
      direccion_estudiante: '',
      tipo_estudiante: 'Civil',
      grado_militar: '',
      unidad_militar: '',
      id_militar_estudiante: '',
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (est: EstudianteItem) => {
    setModoEdicion(true);
    setIdSeleccionado(est.id_estudiante || est.id);
    setFormData({
      ci_estudiante: est.ci,
      nombre_estudiante: est.nombres,
      apellido_estudiante: est.apellidos,
      fecha_nacimiento_estudiante: '2000-01-01',
      telefono_estudiante: est.telefono,
      email_estudiante: est.correo,
      direccion_estudiante: est.direccion || '',
      tipo_estudiante: est.tipo === 'MILITAR' ? 'Militar' : 'Civil',
      grado_militar: est.gradoMilitar || '',
      unidad_militar: est.unidadMilitar || '',
      id_militar_estudiante: est.codigoMatricula || '',
    });
    setModalAbierto(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = modoEdicion
        ? `http://localhost:8000/api/v1/estudiantes/${idSeleccionado}`
        : 'http://localhost:8000/api/v1/estudiantes';
      const method = modoEdicion ? 'PUT' : 'POST';

      const payload: any = {
        ci_estudiante: formData.ci_estudiante,
        nombre_estudiante: formData.nombre_estudiante,
        apellido_estudiante: formData.apellido_estudiante,
        fecha_nacimiento_estudiante: formData.fecha_nacimiento_estudiante,
        telefono_estudiante: formData.telefono_estudiante,
        email_estudiante: formData.email_estudiante,
        direccion_estudiante: formData.direccion_estudiante,
        tipo_estudiante: formData.tipo_estudiante,
      };

      if (formData.tipo_estudiante === 'Militar') {
        payload.grado_militar = formData.grado_militar;
        payload.unidad_militar = formData.unidad_militar;
        payload.id_militar_estudiante = formData.id_militar_estudiante;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar estudiante.');

      mostrarMensaje('ok', data.message || 'Operación completada exitosamente.');
      setModalAbierto(false);
      cargarEstudiantes();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleBajaLogica = async (id: number) => {
    if (!confirm('¿Confirma dar de baja lógica al estudiante? Sus registros académicos se preservarán.')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/estudiantes/${id}/baja-logica`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar baja lógica.');
      mostrarMensaje('ok', data.message);
      cargarEstudiantes();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  if (!puedeAdministrar) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-8 text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-neutral-300 max-w-xl mx-auto">
            El registro y administración de expedientes de estudiantes corresponde a la{' '}
            <strong className="text-sky-400">Jefatura Académica</strong>.
            Tu rol actual es <span className="px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-semibold">{rolConfig.titulo}</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
              <span>SACA</span>
              <span>/</span>
              <span className="text-sky-400 font-semibold">Estudiantes</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              Expedientes de Estudiantes
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={cargarEstudiantes}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={abrirModalNuevo}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-md shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" />
            + Nuevo Estudiante
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
          {alerta.tipo === 'ok' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{alerta.mensaje}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-1 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            {(['TODOS', 'MILITAR', 'CIVIL'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setFiltroTipo(t); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filtroTipo === t
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {t === 'TODOS' ? 'Todos' : t === 'MILITAR' ? 'Militares (FFAA)' : 'Civiles'}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-neutral-800 hidden sm:block mx-1" />

          <select
            value={filtroIdioma}
            onChange={(e) => { setFiltroIdioma(e.target.value); setPage(1); }}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white"
          >
            <option value="">Todos los Idiomas</option>
            {idiomasDisponibles.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>

          <select
            value={filtroParalelo}
            onChange={(e) => { setFiltroParalelo(e.target.value); setPage(1); }}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white"
          >
            <option value="">Todos los Cursos/Paralelos</option>
            {paralelosDisponibles.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {(filtroIdioma || filtroParalelo || busqueda) && (
            <button
              onClick={() => { setFiltroIdioma(''); setFiltroParalelo(''); setBusqueda(''); setPage(1); }}
              className="text-sky-400 hover:text-sky-300 text-xs font-medium underline px-1"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleBuscar} className="flex items-center gap-2 w-full sm:w-72">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Buscar por CI, nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Buscar
            </button>
          </form>
          <span className="text-neutral-500 text-[11px] whitespace-nowrap hidden md:inline">
            Total: <strong className="text-white">{total}</strong>
          </span>
        </div>
      </div>

      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-3">Matrícula / ID</th>
                <th className="p-3">Estudiante</th>
                <th className="p-3">Cédula (CI)</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Curso & Idioma Actual</th>
                <th className="p-3">Contacto</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {estudiantes.map((est) => (
                <tr key={est.id_estudiante || est.id} className="hover:bg-neutral-800/30 transition">
                  <td className="p-3 font-mono text-[11px] text-sky-400 font-semibold">
                    {est.codigoMatricula}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-white text-sm">
                      {est.nombres} {est.apellidos}
                    </div>
                    {est.tipo === 'MILITAR' && est.gradoMilitar && (
                      <p className="text-[11px] text-amber-400 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> {est.gradoMilitar} &bull; {est.unidadMilitar}
                      </p>
                    )}
                  </td>
                  <td className="p-3 font-mono text-neutral-300 font-semibold">
                    {est.ci}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                        est.tipo === 'MILITAR'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {est.tipo}
                    </span>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-white">{est.idiomaActual || 'Sin asignar'}</p>
                    <p className="text-[11px] text-neutral-400">
                      Paralelo: <span className="font-mono text-sky-400">{est.paralelo || 'Sin asignar'}</span>
                    </p>
                  </td>
                  <td className="p-3 text-[11px] space-y-0.5 text-neutral-400">
                    <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-neutral-500" /> {est.telefono}</p>
                    <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-neutral-500" /> {est.correo}</p>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => abrirModalEditar(est)}
                        className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition"
                        title="Editar Datos"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleBajaLogica(est.id_estudiante || est.id)}
                        className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/40 transition"
                        title="Baja Lógica"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {estudiantes.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    No se encontraron estudiantes con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-3 border-t border-neutral-800 text-xs text-neutral-400">
          <span>Página {page} de {Math.max(1, Math.ceil(total / 15))}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 15 >= total}
              className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {modoEdicion ? 'Editar Expediente de Estudiante' : 'Registro de Nuevo Estudiante'}
                </h3>
                <p className="text-xs text-neutral-400">
                  Filiación y datos personales. Las notas se cargan en Calificaciones.
                </p>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4 text-xs">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Clasificación de Estudiante</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo_estudiante: 'Civil' })}
                    className={`py-2 rounded-lg font-bold border text-center transition ${
                      formData.tipo_estudiante === 'Civil'
                        ? 'bg-sky-600 text-white border-sky-500'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    Estudiante Civil
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo_estudiante: 'Militar' })}
                    className={`py-2 rounded-lg font-bold border text-center transition flex items-center justify-center gap-2 ${
                      formData.tipo_estudiante === 'Militar'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Estudiante Militar (FFAA)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 block mb-1">Cédula de Identidad (CI)</label>
                  <input
                    type="text"
                    placeholder="Ej: 6849201"
                    value={formData.ci_estudiante}
                    onChange={(e) => setFormData({ ...formData, ci_estudiante: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-300 block mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={formData.fecha_nacimiento_estudiante}
                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento_estudiante: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 block mb-1">Nombres</label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos Fernando"
                    value={formData.nombre_estudiante}
                    onChange={(e) => setFormData({ ...formData, nombre_estudiante: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-300 block mb-1">Apellidos</label>
                  <input
                    type="text"
                    placeholder="Ej: Mamani Quispe"
                    value={formData.apellido_estudiante}
                    onChange={(e) => setFormData({ ...formData, apellido_estudiante: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 block mb-1">Teléfono / Celular</label>
                  <input
                    type="text"
                    placeholder="Ej: 71548920"
                    value={formData.telefono_estudiante}
                    onChange={(e) => setFormData({ ...formData, telefono_estudiante: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-300 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="Ej: alumno@ejercito.mil.bo"
                    value={formData.email_estudiante}
                    onChange={(e) => setFormData({ ...formData, email_estudiante: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1">Dirección Domiciliaria</label>
                <input
                  type="text"
                  placeholder="Ej: Av. Saavedra N° 1420, Miraflores"
                  value={formData.direccion_estudiante}
                  onChange={(e) => setFormData({ ...formData, direccion_estudiante: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              {formData.tipo_estudiante === 'Militar' && (
                <div className="bg-amber-950/30 border border-amber-600/40 rounded-xl p-3.5 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                    <Shield className="w-3.5 h-3.5" /> Ficha Militar Institucional
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="text-neutral-300 block mb-1">Grado Militar</label>
                      <input
                        type="text"
                        placeholder="Ej: Capitán, Subteniente"
                        value={formData.grado_militar}
                        onChange={(e) => setFormData({ ...formData, grado_militar: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-neutral-300 block mb-1">Unidad Militar</label>
                      <input
                        type="text"
                        placeholder="Ej: Regimiento Colorados"
                        value={formData.unidad_militar}
                        onChange={(e) => setFormData({ ...formData, unidad_militar: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-neutral-300 block mb-1">Código Militar</label>
                      <input
                        type="text"
                        placeholder="Ej: MIL-INF-4820"
                        value={formData.id_militar_estudiante}
                        onChange={(e) => setFormData({ ...formData, id_militar_estudiante: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-md shadow-sky-600/20"
                >
                  {modoEdicion ? 'Actualizar Expediente' : 'Registrar Estudiante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
