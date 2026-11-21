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
  BookOpen,
  KeyRound,
  Copy,
  Printer
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
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<EstudianteItem | null>(null);
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
  const [modalCredenciales, setModalCredenciales] = useState(false);
  const [credencialesCreadas, setCredencialesCreadas] = useState<any | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [modalConfirmarBaja, setModalConfirmarBaja] = useState<{ id: number; nombre: string } | null>(null);
  const [modalConfirmarFisica, setModalConfirmarFisica] = useState<{ id: number; nombre: string } | null>(null);

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
      params.append('per_page', '7');
      if (filtroTipo !== 'TODOS') params.append('tipo', filtroTipo);
      if (filtroIdioma) params.append('idioma', filtroIdioma);
      if (filtroParalelo) params.append('paralelo', filtroParalelo);
      if (busqueda.trim()) params.append('q', busqueda.trim());

      const res = await fetch(`/api/v1/estudiantes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const lista = data.data || [];
        setEstudiantes(lista);
        setTotal(data.total || 0);

        if (lista.length > 0) {
          setEstudianteSeleccionado((prev) => {
            if (!prev || !lista.some((e: EstudianteItem) => (e.id_estudiante || e.id) === (prev.id_estudiante || prev.id))) {
              return lista[0];
            }
            return prev;
          });
        } else {
          setEstudianteSeleccionado(null);
        }

        const idSet = new Set<string>();
        const parSet = new Set<string>();
        lista.forEach((e: EstudianteItem) => {
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

    const ci = formData.ci_estudiante.trim();
    if (ci.length < 5 || !/^\d{5,}/.test(ci)) {
      mostrarMensaje('error', 'El CI debe contener al menos 5 dígitos numéricos.');
      return;
    }
    const nom = formData.nombre_estudiante.trim();
    const ape = formData.apellido_estudiante.trim();
    if (nom.length < 3 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nom)) {
      mostrarMensaje('error', 'El nombre debe tener al menos 3 caracteres alfabéticos.');
      return;
    }
    if (ape.length < 3 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(ape)) {
      mostrarMensaje('error', 'El apellido debe tener al menos 3 caracteres alfabéticos.');
      return;
    }
    if (formData.telefono_estudiante) {
      const tel = formData.telefono_estudiante.trim();
      if (tel.length < 7 || !/^[0-9\+\-\s]{7,}$/.test(tel)) {
        mostrarMensaje('error', 'El teléfono debe contener al menos 7 dígitos.');
        return;
      }
    }
    if (formData.tipo_estudiante === 'Militar') {
      if (!formData.grado_militar || formData.grado_militar.trim().length < 2) {
        mostrarMensaje('error', 'Debe especificar el grado militar del estudiante.');
        return;
      }
      if (!formData.unidad_militar || formData.unidad_militar.trim().length < 3) {
        mostrarMensaje('error', 'Debe especificar la unidad militar de procedencia.');
        return;
      }
    }

    try {
      const url = modoEdicion
        ? `/api/v1/estudiantes/${idSeleccionado}`
        : '/api/v1/estudiantes';
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

      if (!modoEdicion && data.credenciales_iniciales) {
        setCredencialesCreadas({
          ...data.credenciales_iniciales,
          nombre_completo: `${formData.nombre_estudiante} ${formData.apellido_estudiante}`,
          ci: formData.ci_estudiante,
          tipo: formData.tipo_estudiante,
        });
        setModalCredenciales(true);
      }
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const confirmarBajaLogica = async () => {
    if (!modalConfirmarBaja) return;
    try {
      const res = await fetch(`/api/v1/estudiantes/${modalConfirmarBaja.id}/baja-logica`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar baja lógica.');
      mostrarMensaje('ok', data.message || 'Estado del estudiante actualizado.');
      setModalConfirmarBaja(null);
      cargarEstudiantes();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const confirmarBajaFisica = async () => {
    if (!modalConfirmarFisica) return;
    try {
      const res = await fetch(`/api/v1/estudiantes/${modalConfirmarFisica.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al ejecutar baja física.');
      mostrarMensaje('ok', data.message || 'Estudiante eliminado definitivamente.');
      setModalConfirmarFisica(null);
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

  const totalPages = Math.max(1, Math.ceil(total / 7));

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* FRANJA SUPERIOR COMPACTA (44px): Breadcrumb + Filtros Inline + Buscador */}
      <div className="strip-utility-bar">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--military-green-subtle)] border border-[var(--border-accent)] text-[var(--military-green-primary)] dark:text-[var(--military-gold-primary)] font-mono text-[11px] font-bold shrink-0">
            <Users className="w-3.5 h-3.5" />
            <span>SACA / Estudiantes</span>
          </div>

          <div className="h-4 w-[1px] bg-[var(--border-fine)] shrink-0" />

          {/* Filtro Tipo: TODOS / MILITAR / CIVIL */}
          <div className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] p-0.5 rounded border border-[var(--border-subtle)] shrink-0">
            {(['TODOS', 'MILITAR', 'CIVIL'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setFiltroTipo(t); setPage(1); }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  filtroTipo === t
                    ? 'bg-[var(--military-green-primary)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {t === 'TODOS' ? 'Todos' : t === 'MILITAR' ? 'Militares' : 'Civiles'}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            <select
              value={filtroIdioma}
              onChange={(e) => { setFiltroIdioma(e.target.value); setPage(1); }}
              className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded px-2 py-0.5 text-xs text-[var(--text-main)] outline-none"
            >
              <option value="">Todos los Idiomas</option>
              {idiomasDisponibles.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>

            <select
              value={filtroParalelo}
              onChange={(e) => { setFiltroParalelo(e.target.value); setPage(1); }}
              className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded px-2 py-0.5 text-xs text-[var(--text-main)] outline-none"
            >
              <option value="">Todos los Cursos</option>
              {paralelosDisponibles.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <form onSubmit={handleBuscar} className="relative w-36 sm:w-52">
            <Search className="w-3.5 h-3.5 text-[var(--text-dim)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar CI, nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded pl-8 pr-2 py-1 text-xs text-[var(--text-main)] outline-none"
            />
          </form>

          <button
            onClick={abrirModalNuevo}
            className="btn btn-primary"
            style={{ padding: '0.2rem 0.65rem', fontSize: '0.72rem', height: '28px' }}
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">Nuevo Estudiante</span>
          </button>

          <button
            onClick={cargarEstudiantes}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', height: '28px' }}
            title="Actualizar listado"
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
        {/* PANEL PRINCIPAL: TABLA COMPACTA (7 REGISTROS) */}
        <div className="workspace-main-panel">
          <div className="workspace-table-container">
            <table className="compact-table">
              <thead>
                <tr>
                  <th>Matrícula / ID</th>
                  <th>Estudiante</th>
                  <th>Cédula (CI)</th>
                  <th>Categoría</th>
                  <th>Curso & Idioma</th>
                  <th>Contacto</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((est) => {
                  const esActivo = (estudianteSeleccionado?.id_estudiante || estudianteSeleccionado?.id) === (est.id_estudiante || est.id);

                  return (
                    <tr
                      key={est.id_estudiante || est.id}
                      onClick={() => setEstudianteSeleccionado(est)}
                      className={`cursor-pointer transition ${esActivo ? 'selected' : ''}`}
                    >
                      <td className="font-mono text-[11px] text-[var(--military-gold-primary)] font-bold whitespace-nowrap">
                        {est.codigoMatricula}
                      </td>
                      <td>
                        <div className="font-bold text-[var(--text-main)] truncate max-w-[190px]">
                          {est.nombres} {est.apellidos}
                        </div>
                        {est.tipo === 'MILITAR' && est.gradoMilitar ? (
                          <p className="text-[10px] text-[var(--military-gold-primary)] flex items-center gap-1 font-mono">
                            <Shield className="w-2.5 h-2.5" /> {est.gradoMilitar} &bull; {est.unidadMilitar || 'FFAA'}
                          </p>
                        ) : (
                          <span className="text-[10px] text-[var(--text-dim)] font-mono">ESTUDIANTE CIVIL</span>
                        )}
                      </td>
                      <td className="font-mono text-[var(--text-muted)] font-semibold text-xs whitespace-nowrap">
                        {est.ci}
                      </td>
                      <td className="whitespace-nowrap">
                        <span className={`badge ${est.tipo === 'MILITAR' ? 'badge-gold' : 'badge-civil'}`}>
                          {est.tipo}
                        </span>
                      </td>
                      <td className="truncate max-w-[160px]">
                        <div className="font-medium text-[var(--text-main)] text-xs">
                          {est.idiomaActual || 'Sin asignar'}
                        </div>
                        <div className="text-[10px] text-[var(--text-dim)] font-mono">
                          Par: {est.paralelo || 'Sin asignar'}
                        </div>
                      </td>
                      <td className="text-[11px] text-[var(--text-muted)] font-mono whitespace-nowrap">
                        <div>{est.telefono || '—'}</div>
                      </td>
                      <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => abrirModalEditar(est)}
                            className="btn btn-secondary"
                            style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem', height: '24px' }}
                            title="Editar Datos"
                          >
                            <Edit className="w-3 h-3 text-[var(--military-gold-primary)]" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => setModalConfirmarBaja({ id: est.id_estudiante || est.id, nombre: `${est.nombres} ${est.apellidos}` })}
                            className="btn btn-secondary"
                            style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem', height: '24px' }}
                            title="Baja Lógica / Reactivar"
                          >
                            <ShieldAlert className="w-3 h-3 text-[var(--status-danger)]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {estudiantes.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[var(--text-dim)]">
                      No se encontraron estudiantes con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN TÁCTICA FIJA INFERIOR */}
          <div className="tactical-pagination">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--military-gold-primary)]">TOTAL:</span>
              <span>{total} EXPEDIENTES</span>
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

        {/* PANEL LATERAL DERECHO: DOSSIER ACTIVO DEL ESTUDIANTE */}
        <div className="workspace-side-panel">
          {estudianteSeleccionado ? (
            <div className="flex flex-col h-full gap-2.5">
              {/* Encabezado del expediente */}
              <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--border-subtle)]">
                <div className="w-10 h-10 rounded bg-[var(--military-green-primary)] text-[var(--military-gold-primary)] font-bold font-mono text-sm flex items-center justify-center shrink-0 border border-[var(--border-accent)]">
                  {estudianteSeleccionado.tipo === 'MILITAR' ? (
                    <Shield className="w-5 h-5" />
                  ) : (
                    estudianteSeleccionado.nombres.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-xs text-[var(--text-main)] truncate leading-tight">
                    {estudianteSeleccionado.nombres} {estudianteSeleccionado.apellidos}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-dim)] font-mono mt-0.5">
                    <span>CI: {estudianteSeleccionado.ci}</span>
                    <span>&bull;</span>
                    <span className="text-[var(--military-gold-primary)] font-bold">
                      {estudianteSeleccionado.gradoMilitar || 'CIVIL'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ficha de datos del estudiante */}
              <div className="flex flex-col gap-2 flex-1">
                <div className="bg-[var(--bg-surface-elevated)] p-2 rounded border border-[var(--border-fine)]">
                  <div className="text-[10px] uppercase font-bold text-[var(--text-dim)] font-mono">Código de Matrícula</div>
                  <div className="text-sm font-bold text-[var(--military-gold-primary)] font-mono mt-0.5">
                    {estudianteSeleccionado.codigoMatricula}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-[var(--bg-surface-elevated)] p-2 rounded border border-[var(--border-fine)]">
                    <div className="text-[9px] uppercase font-bold text-[var(--text-dim)]">Curso / Paralelo</div>
                    <div className="text-xs font-bold text-[var(--text-main)] font-mono truncate mt-0.5">
                      {estudianteSeleccionado.paralelo || 'Sin asignar'}
                    </div>
                  </div>

                  <div className="bg-[var(--bg-surface-elevated)] p-2 rounded border border-[var(--border-fine)]">
                    <div className="text-[9px] uppercase font-bold text-[var(--text-dim)]">Idioma Actual</div>
                    <div className="text-xs font-bold text-[var(--text-main)] truncate mt-0.5">
                      {estudianteSeleccionado.idiomaActual || 'Sin asignar'}
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--bg-surface-elevated)] p-2 rounded border border-[var(--border-fine)] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-dim)]">Teléfono:</span>
                    <span className="font-mono text-[var(--text-main)]">{estudianteSeleccionado.telefono || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-dim)]">Correo:</span>
                    <span className="font-mono text-[var(--text-main)] truncate max-w-[180px]">{estudianteSeleccionado.correo || '—'}</span>
                  </div>
                  {estudianteSeleccionado.tipo === 'MILITAR' && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--text-dim)]">Unidad:</span>
                      <span className="font-mono text-[var(--military-gold-primary)] font-bold">{estudianteSeleccionado.unidadMilitar || 'FFAA'}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-dim)]">Estado:</span>
                    <span className={`badge ${estudianteSeleccionado.estado === 'Activo' ? 'badge-military' : 'badge-danger'}`}>
                      {estudianteSeleccionado.estado}
                    </span>
                  </div>
                </div>

                {/* Acciones del Expediente */}
                <div className="flex flex-col gap-1.5 mt-auto">
                  <button
                    onClick={() => abrirModalEditar(estudianteSeleccionado)}
                    className="btn btn-primary w-full"
                    style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar Expediente</span>
                  </button>

                  <button
                    onClick={() => setModalConfirmarBaja({ id: estudianteSeleccionado.id_estudiante || estudianteSeleccionado.id, nombre: `${estudianteSeleccionado.nombres} ${estudianteSeleccionado.apellidos}` })}
                    className="btn btn-secondary w-full"
                    style={{ padding: '0.35rem', fontSize: '0.72rem', color: 'var(--status-danger)' }}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{estudianteSeleccionado.estado === 'Activo' ? 'Dar de Baja' : 'Reactivar Estudiante'}</span>
                  </button>

                  {estudianteSeleccionado.estado === 'Inactivo' && (
                    <button
                      onClick={() => setModalConfirmarFisica({ id: estudianteSeleccionado.id_estudiante || estudianteSeleccionado.id, nombre: `${estudianteSeleccionado.nombres} ${estudianteSeleccionado.apellidos}` })}
                      className="btn btn-secondary w-full"
                      style={{ padding: '0.35rem', fontSize: '0.72rem', borderColor: 'var(--status-danger)', color: 'var(--status-danger)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminación Definitiva</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 text-[var(--text-dim)]">
              <Users className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs">Seleccione un estudiante de la tabla para ver su expediente y acciones rápidas.</p>
            </div>
          )}
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
                  <label className="text-neutral-300 block mb-1">Cédula de Identidad (CI) * (mín. 5 dígitos)</label>
                  <input
                    type="text"
                    placeholder="Ej: 6849201"
                    minLength={5}
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
                  <label className="text-neutral-300 block mb-1">Nombres * (mín. 3 letras)</label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos Fernando"
                    minLength={3}
                    value={formData.nombre_estudiante}
                    onChange={(e) => setFormData({ ...formData, nombre_estudiante: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-300 block mb-1">Apellidos * (mín. 3 letras)</label>
                  <input
                    type="text"
                    placeholder="Ej: Mamani Quispe"
                    minLength={3}
                    value={formData.apellido_estudiante}
                    onChange={(e) => setFormData({ ...formData, apellido_estudiante: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 block mb-1">Teléfono / Celular (mín. 7 dígitos)</label>
                  <input
                    type="text"
                    placeholder="Ej: 71548920"
                    minLength={7}
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
      {modalCredenciales && credencialesCreadas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white animate-solemn-fade">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-bold text-base">Credenciales de Acceso Institucional</h3>
              </div>
              <button
                onClick={() => setModalCredenciales(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              Se ha dado de alta exitosamente la cuenta del estudiante en el sistema SACA.
              Entregue esta ficha de acceso de manera reservada:
            </p>

            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2.5 font-mono text-xs">
              <div>
                <span className="text-neutral-500 block">Estudiante:</span>
                <span className="text-white font-bold">{credencialesCreadas.nombre_completo}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">C.I. / Identificación:</span>
                <span className="text-white">{credencialesCreadas.ci} ({credencialesCreadas.tipo})</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Correo Institucional (Usuario):</span>
                <span className="text-emerald-400 font-bold select-all">{credencialesCreadas.email_institucional}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Contraseña Temporal:</span>
                <span className="text-amber-400 font-bold text-sm tracking-wider select-all">{credencialesCreadas.password_temporal}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Rol Asignado:</span>
                <span className="text-sky-400">{credencialesCreadas.rol}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const texto = `EIE - CEDMIL | CREDENCIALES DE ACCESO SACA\nEstudiante: ${credencialesCreadas.nombre_completo}\nUsuario: ${credencialesCreadas.email_institucional}\nContraseña Temporal: ${credencialesCreadas.password_temporal}`;
                  navigator.clipboard.writeText(texto);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 3000);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-amber-300 rounded-lg border border-neutral-700 transition"
              >
                <Copy className="w-4 h-4" />
                <span>{copiado ? '¡Copiado!' : 'Copiar Credenciales'}</span>
              </button>

              <button
                type="button"
                onClick={() => setModalCredenciales(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition"
              >
                Aceptar y Finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Baja Lógica Estudiante */}
      {modalConfirmarBaja && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-solemn-fade">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Baja Lógica de Estudiante</h3>
            </div>
            <p className="text-xs text-neutral-300">
              ¿Confirma procesar la baja lógica del estudiante <strong className="text-white">{modalConfirmarBaja.nombre}</strong>?
            </p>
            <p className="text-[11px] text-neutral-400 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              El estudiante será desactivado del sistema. Su historial de calificaciones, inscripciones y avance curricular se mantendrá preservado en la base de datos.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmarBaja(null)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarBajaLogica}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow"
              >
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Baja Física Estudiante */}
      {modalConfirmarFisica && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/60 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-solemn-fade">
            <div className="flex items-center gap-3 text-red-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Baja Física Definitiva</h3>
            </div>
            <p className="text-xs text-neutral-300">
              ¿Confirma eliminar definitivamente de la base de datos al estudiante <strong className="text-white">{modalConfirmarFisica.nombre}</strong>?
            </p>
            <div className="text-[11px] text-red-200 bg-red-950/40 p-3 rounded-lg border border-red-800/60 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                ADVERTENCIA IRREVERSIBLE
              </p>
              <p>
                Esta acción removerá físicamente el expediente del estudiante y su usuario de acceso. Solo es permitida porque el estudiante ya cuenta con baja lógica previa.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmarFisica(null)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarBajaFisica}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow"
              >
                Sí, Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}