'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Shield,
  Search,
  Filter,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  RefreshCw,
  Edit,
  Trash2,
  X,
  Languages,
  ShieldAlert,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Check
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

const PER_PAGE = 7;

export default function DocentesPage() {
  const { esJefeAcademico, esAdmin, rolConfig } = useAuthRole();
  const puedeAdministrar = esJefeAcademico || esAdmin;

  const [loading, setLoading] = useState(false);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [alertasRotacion, setAlertasRotacion] = useState<any[]>([]);
  const [idiomasCatalogo, setIdiomasCatalogo] = useState<any[]>([]);
  const [paralelos, setParalelos] = useState<any[]>([]);

  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);

  const [modalDocente, setModalDocente] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idDocenteSeleccionado, setIdDocenteSeleccionado] = useState<number | null>(null);
  const [modalBajaDocente, setModalBajaDocente] = useState<{ id: number; nombre: string; estado: string } | null>(null);
  const [modalEliminarFisicoDocente, setModalEliminarFisicoDocente] = useState<{ id: number; nombre: string } | null>(null);

  const [modalRotar, setModalRotar] = useState(false);
  const [paraleloARotar, setParaleloARotar] = useState<any | null>(null);
  const [docenteNuevoId, setDocenteNuevoId] = useState<string>('');
  const [ejecutandoAsignacion, setEjecutandoAsignacion] = useState(false);
  const [resultadoAsignacion, setResultadoAsignacion] = useState<any | null>(null);
  const [modalResultadoAsignacion, setModalResultadoAsignacion] = useState(false);

  const [ejecutandoRotacionMasiva, setEjecutandoRotacionMasiva] = useState(false);
  const [resultadoRotacionMasiva, setResultadoRotacionMasiva] = useState<any | null>(null);
  const [modalResultadoRotacion, setModalResultadoRotacion] = useState(false);

  const handleRotarTodosPendientes = async () => {
    setEjecutandoRotacionMasiva(true);
    try {
      const res = await fetch('/api/v1/docentes/rotar-pendientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setResultadoRotacionMasiva(data);
        setModalResultadoRotacion(true);
        mostrarMensaje('ok', data.message || `Rotación completada: ${data.total_rotados} relevos ejecutados.`);
        cargarDatos();
      } else {
        mostrarMensaje('error', data.error || 'Error al ejecutar rotación masiva.');
      }
    } catch (e) {
      mostrarMensaje('error', 'Error de conexión con el servidor al rotar pendientes.');
    } finally {
      setEjecutandoRotacionMasiva(false);
    }
  };

  const ejecutarAsignacionAutomatica = async () => {
    setEjecutandoAsignacion(true);
    try {
      const res = await fetch('/api/v1/docentes/asignacion-automatica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setResultadoAsignacion(data);
        setModalResultadoAsignacion(true);
        cargarDatos();
      } else {
        mostrarMensaje('error', data.error || 'Error al ejecutar asignación automática.');
      }
    } catch (e) {
      mostrarMensaje('error', 'Error de conexión con el servidor.');
    } finally {
      setEjecutandoAsignacion(false);
    }
  };

  const [formDoc, setFormDoc] = useState({
    ci_docente: '',
    nombre_docente: '',
    apellido_docente: '',
    telefono_docente: '',
    email_docente: '',
    estado_docente: 'Activo',
    idiomas_ids: [] as number[],
  });

  const [docenteDetalleSeleccionado, setDocenteDetalleSeleccionado] = useState<any | null>(null);

  const mostrarMensaje = (tipo: 'ok' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 5000);
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resDoc, resAlertas, resIdm, resPar] = await Promise.all([
        fetch('/api/v1/docentes'),
        fetch('/api/v1/docentes/alertas/rotacion'),
        fetch('/api/v1/catalogos/idiomas'),
        fetch('/api/v1/paralelos'),
      ]);

      if (resDoc.ok) setDocentes(await resDoc.json() || []);
      if (resAlertas.ok) {
        const dAlertas = await resAlertas.json();
        setAlertasRotacion(dAlertas.alertas || []);
      }
      if (resIdm.ok) setIdiomasCatalogo(await resIdm.json() || []);
      if (resPar.ok) setParalelos(await resPar.json() || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setIdDocenteSeleccionado(null);
    setFormDoc({
      ci_docente: '',
      nombre_docente: '',
      apellido_docente: '',
      telefono_docente: '',
      email_docente: '',
      estado_docente: 'Activo',
      idiomas_ids: idiomasCatalogo.length > 0 ? [idiomasCatalogo[0].id_idioma] : [],
    });
    setModalDocente(true);
  };

  const abrirModalEditar = (doc: any) => {
    setModoEdicion(true);
    setIdDocenteSeleccionado(doc.id_docente);
    const nombres = (doc.nombre_completo || '').split(' ');
    const primerNombre = nombres[0] || '';
    const restoApellidos = nombres.slice(1).join(' ') || '';

    const idsIdiomas = (doc.idiomas || []).map((nom: string) => {
      const match = idiomasCatalogo.find((ic: any) => ic.nombre_idioma.toLowerCase() === nom.toLowerCase());
      return match ? match.id_idioma : null;
    }).filter(Boolean);

    setFormDoc({
      ci_docente: doc.ci_docente || '',
      nombre_docente: doc.nombre_docente || primerNombre,
      apellido_docente: doc.apellido_docente || restoApellidos,
      telefono_docente: doc.telefono || '',
      email_docente: doc.email || '',
      estado_docente: doc.estado || 'Activo',
      idiomas_ids: idsIdiomas.length > 0 ? idsIdiomas : (idiomasCatalogo.length > 0 ? [idiomasCatalogo[0].id_idioma] : []),
    });
    setModalDocente(true);
  };

  const handleGuardarDocente = async (e: React.FormEvent) => {
    e.preventDefault();

    const ci = formDoc.ci_docente.trim();
    if (ci.length < 5 || !/^\d{5,}/.test(ci)) {
      mostrarMensaje('error', 'El CI debe contener al menos 5 dígitos numéricos.');
      return;
    }
    const nom = formDoc.nombre_docente.trim();
    const ape = formDoc.apellido_docente.trim();
    if (nom.length < 3 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nom)) {
      mostrarMensaje('error', 'El nombre debe contener al menos 3 letras (sin caracteres especiales).');
      return;
    }
    if (ape.length < 3 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(ape)) {
      mostrarMensaje('error', 'El apellido debe contener al menos 3 letras (sin caracteres especiales).');
      return;
    }
    if (formDoc.telefono_docente) {
      const tel = formDoc.telefono_docente.trim();
      if (tel.length < 7 || !/^[0-9\+\-\s]{7,}$/.test(tel)) {
        mostrarMensaje('error', 'El teléfono debe contener al menos 7 dígitos numéricos.');
        return;
      }
    }
    if (formDoc.idiomas_ids.length === 0) {
      mostrarMensaje('error', 'Debe seleccionar al menos un idioma de habilitación.');
      return;
    }

    try {
      const url = modoEdicion
        ? `/api/v1/docentes/${idDocenteSeleccionado}`
        : '/api/v1/docentes';
      const method = modoEdicion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDoc),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar docente.');

      mostrarMensaje('ok', data.message || 'Docente guardado con éxito.');
      setModalDocente(false);
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleConfirmarBajaDocente = async () => {
    if (!modalBajaDocente) return;
    try {
      const res = await fetch(`/api/v1/docentes/${modalBajaDocente.id}/baja-logica`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar estado del docente.');
      mostrarMensaje('ok', data.message || 'Estado actualizado con éxito.');
      setModalBajaDocente(null);
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleConfirmarEliminacionFisica = async () => {
    if (!modalEliminarFisicoDocente) return;
    try {
      const res = await fetch(`/api/v1/docentes/${modalEliminarFisicoDocente.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al ejecutar baja física.');
      mostrarMensaje('ok', data.message || 'Docente eliminado definitivamente.');
      setModalEliminarFisicoDocente(null);
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleEjecutarRotacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paraleloARotar || !docenteNuevoId) return;

    try {
      const res = await fetch('/api/v1/docentes/rotar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_paralelo: paraleloARotar.id_paralelo,
          id_docente_nuevo: parseInt(docenteNuevoId),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al rotar docente.');

      mostrarMensaje('ok', data.message || 'Rotación obligatoria ejecutada exitosamente.');
      setModalRotar(false);
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const docentesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return docentes;
    const q = busqueda.toLowerCase().trim();
    return docentes.filter((d) =>
      d.nombre_completo?.toLowerCase().includes(q) ||
      d.ci_docente?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q)
    );
  }, [docentes, busqueda]);

  const totalPages = Math.max(1, Math.ceil(docentesFiltrados.length / PER_PAGE));
  const docentesPaginados = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return docentesFiltrados.slice(start, start + PER_PAGE);
  }, [docentesFiltrados, page]);

  const idiomaParaleloRelevo = useMemo(() => {
    if (!paraleloARotar) return '';
    if (paraleloARotar.idioma) return paraleloARotar.idioma;
    if (paraleloARotar.nivel?.programa?.idioma?.nombre_idioma) return paraleloARotar.nivel.programa.idioma.nombre_idioma;
    const cod = (paraleloARotar.codigo_paralelo || '').toUpperCase();
    if (cod.startsWith('ING')) return 'Inglés';
    if (cod.startsWith('FRA')) return 'Francés';
    if (cod.startsWith('ALE')) return 'Alemán';
    if (cod.startsWith('POR')) return 'Portugués';
    if (cod.startsWith('CHI') || cod.startsWith('MAN')) return 'Mandarín';
    if (cod.startsWith('RUS')) return 'Ruso';
    if (cod.startsWith('QUE')) return 'Quechua';
    if (cod.startsWith('AYM')) return 'Aymara';
    return '';
  }, [paraleloARotar]);

  const docentesCandidatosRelevo = useMemo(() => {
    if (!paraleloARotar) return docentes;
    const idm = idiomaParaleloRelevo.toLowerCase().trim();
    const docActualId = paraleloARotar.id_docente || paraleloARotar.id_docente_actual;
    const docActualNombre = (paraleloARotar.docente_actual || '').toLowerCase().trim();

    return docentes.filter((d) => {
      if (docActualId && d.id_docente === docActualId) return false;
      if (docActualNombre && d.nombre_completo?.toLowerCase() === docActualNombre) return false;
      if (!idm) return true;
      return d.idiomas?.some((i: string) => {
        const lang = i.toLowerCase().trim();
        return lang.includes(idm) || idm.includes(lang);
      });
    });
  }, [paraleloARotar, idiomaParaleloRelevo, docentes]);

  useEffect(() => {
    setPage(1);
  }, [busqueda]);

  if (!puedeAdministrar) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-8 text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-neutral-300 max-w-xl mx-auto">
            El registro de docentes y programación del ciclo de rotación corresponde a la{' '}
            <strong className="text-sky-400">Jefatura Académica</strong>.
            Tu rol activo es <span className="px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-semibold">{rolConfig.titulo}</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Strip Utility Bar */}
      <div className="strip-utility-bar" style={{ height: 'auto', minHeight: '44px', flexShrink: 0, padding: '0 0.75rem', gap: '0.5rem' }}>
        <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          <GraduationCap className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
          <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>SACA / Cuerpo Docente</span>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, CI o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[3px] border"
            style={{ background: 'var(--bg-base)', borderColor: 'var(--border-fine)', color: 'var(--text-main)' }}
          />
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          {docentesFiltrados.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, docentesFiltrados.length)} / {docentesFiltrados.length}
        </span>
        <div style={{ flex: 1 }} />
        {alertasRotacion.length > 0 && (
          <button
            onClick={handleRotarTodosPendientes}
            disabled={ejecutandoRotacionMasiva}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[3px] transition"
            style={{ background: '#b59449', color: '#0d120f' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${ejecutandoRotacionMasiva ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{ejecutandoRotacionMasiva ? 'Rotando...' : `Rotar (${alertasRotacion.length})`}</span>
          </button>
        )}
        <button
          onClick={cargarDatos}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[3px] border transition"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-fine)', color: 'var(--text-main)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
        <button
          onClick={ejecutarAsignacionAutomatica}
          disabled={ejecutandoAsignacion}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[3px] border transition"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-fine)', color: 'var(--color-accent)' }}
          title="Asignación Automática de Docentes"
        >
          <Wand2 className={`w-3.5 h-3.5 ${ejecutandoAsignacion ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Auto</span>
        </button>
        <button
          onClick={abrirModalNuevo}
          className="btn btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          Registrar Docente
        </button>
      </div>

      {alerta && (
        <div className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b flex-shrink-0 ${alerta.tipo === 'ok' ? 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300' : 'bg-red-950/40 border-red-700/40 text-red-300'}`}>
          {alerta.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{alerta.mensaje}</span>
        </div>
      )}

      {alertasRotacion.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-1.5 text-xs border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: '#f59e0b40', background: '#451a0320' }}>
          <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
          <span className="font-bold text-amber-300 flex-shrink-0">{alertasRotacion.length} relevo(s) pendiente(s)</span>
          <div className="flex gap-1.5 ml-1">
            {alertasRotacion.slice(0, 4).map((a, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const par = paralelos.find((p) => p.codigo_paralelo === a.paralelo);
                  setParaleloARotar(par || { id_paralelo: a.id_paralelo || a.id_asignacion, codigo_paralelo: a.paralelo, idioma: a.idioma, id_docente: a.id_docente, docente_actual: a.docente_actual });
                  setDocenteNuevoId('');
                  setModalRotar(true);
                }}
                className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] flex items-center gap-1"
                style={{ background: '#b59449', color: '#0d120f' }}
              >
                <ArrowRightLeft className="w-2.5 h-2.5" />{a.paralelo} ({a.dias_en_aula}d)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Split Workspace */}
      <div className="split-workspace" style={{ flex: 1, minHeight: 0 }}>
        {/* Panel Izquierdo: Tabla compacta */}
        <div className="workspace-main-panel">
          <div className="workspace-table-container">
            {docentesPaginados.length === 0 && !loading ? (
              <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
                <div className="text-center space-y-2">
                  <GraduationCap className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs">No se encontraron docentes</p>
                </div>
              </div>
            ) : (
              <table className="compact-table w-full">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>CI</th>
                    <th>Idiomas</th>
                    <th>Paralelo</th>
                    <th className="text-center">Días</th>
                    <th className="text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {docentesPaginados.map((doc) => {
                    const alerta = alertasRotacion.find((a) => a.id_docente === doc.id_docente);
                    const isSelected = docenteDetalleSeleccionado?.id_docente === doc.id_docente;
                    return (
                      <tr
                        key={doc.id_docente}
                        onClick={() => setDocenteDetalleSeleccionado(isSelected ? null : doc)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'var(--color-primary)' : undefined,
                          color: isSelected ? '#fff' : undefined,
                        }}
                      >
                        <td>
                          <div className="flex items-center gap-1.5">
                            {alerta && <span title="Alerta de rotación"><AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" /></span>}
                            <span className="font-semibold text-[11px]" style={{ color: isSelected ? '#fff' : 'var(--text-main)' }}>{doc.nombre_completo}</span>
                          </div>
                        </td>
                        <td className="font-mono text-[11px]" style={{ color: isSelected ? '#fff' : 'var(--text-muted)' }}>{doc.ci_docente}</td>
                        <td>
                          <div className="flex flex-wrap gap-0.5">
                            {(doc.idiomas || []).slice(0, 2).map((idm: string, i: number) => (
                              <span key={i} className="text-[9px] font-bold px-1 py-0.5 rounded-[2px]"
                                style={{ background: isSelected ? 'rgba(255,255,255,0.15)' : 'var(--bg-surface)', color: isSelected ? '#fff' : '#10b981', border: `1px solid ${isSelected ? 'rgba(255,255,255,0.2)' : '#10b98130'}` }}>
                                {idm}
                              </span>
                            ))}
                            {(doc.idiomas || []).length > 2 && <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>+{(doc.idiomas || []).length - 2}</span>}
                          </div>
                        </td>
                        <td className="font-mono text-[10px]">
                          {doc.paralelo_actual
                            ? <span className="text-sky-400 font-bold">{doc.paralelo_actual}</span>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td className="text-center font-mono text-[11px]">
                          <span className={doc.dias_en_aula >= 14 ? 'text-amber-400 font-bold' : ''} style={{ color: doc.dias_en_aula >= 14 ? '#f59e0b' : (isSelected ? '#fff' : 'var(--text-muted)') }}>
                            {doc.dias_en_aula}d
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] ${doc.estado === 'Activo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-700/40 text-neutral-400'}`}>
                            {doc.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {/* Tactical Pagination */}
          <div className="tactical-pagination">
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              Pág. {page} / {totalPages} &bull; {docentesFiltrados.length} registros
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded-[2px] border disabled:opacity-30 transition"
                style={{ borderColor: 'var(--border-fine)', color: 'var(--text-main)', background: 'var(--bg-surface)' }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page - 2 + i;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className="w-6 h-6 rounded-[2px] text-[10px] font-mono font-bold transition"
                    style={{
                      background: pg === page ? 'var(--color-primary)' : 'var(--bg-surface)',
                      color: pg === page ? '#fff' : 'var(--text-main)',
                      border: `1px solid ${pg === page ? 'var(--color-primary)' : 'var(--border-fine)'}`,
                    }}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded-[2px] border disabled:opacity-30 transition"
                style={{ borderColor: 'var(--border-fine)', color: 'var(--text-main)', background: 'var(--bg-surface)' }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Dossier del docente */}
        <div className="workspace-side-panel p-3 space-y-3" style={{ background: 'var(--bg-surface)' }}>
          {docenteDetalleSeleccionado ? (() => {
            const doc = docenteDetalleSeleccionado;
            const alertaDoc = alertasRotacion.find((a) => a.id_docente === doc.id_docente);
            const paralelosDocente = paralelos.filter((p: any) =>
              p.id_docente_actual === doc.id_docente ||
              (typeof p.docente_actual === 'string' && p.docente_actual.toLowerCase().includes((doc.nombre_completo || '').toLowerCase().split(' ')[0]))
            );
            return (
              <>
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-fine)' }}>
                  <div>
                    <p className="font-black text-sm" style={{ color: 'var(--text-main)' }}>{doc.nombre_completo}</p>
                    <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>CI: {doc.ci_docente}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[2px] ${doc.estado === 'Activo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-700/40 text-neutral-400'}`}>
                    {doc.estado}
                  </span>
                </div>

                {/* Alerta de rotación */}
                {alertaDoc && (
                  <div className="flex items-center gap-2 p-2 rounded-[2px] text-xs border" style={{ background: '#451a0330', borderColor: '#f59e0b40', color: '#f59e0b' }}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Relevo obligatorio — {alertaDoc.dias_en_aula} días en aula ({alertaDoc.paralelo})</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-2 rounded-[2px] text-center border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-fine)' }}>
                    <p className="font-black font-mono text-base" style={{ color: 'var(--text-main)' }}>{doc.dias_en_aula}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Días en Aula</p>
                  </div>
                  <div className="p-2 rounded-[2px] text-center border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-fine)' }}>
                    <p className="font-black font-mono text-base" style={{ color: '#10b981' }}>{paralelosDocente.length}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Paralelos</p>
                  </div>
                </div>

                {/* Contacto */}
                <div className="space-y-1.5 text-xs border-t pt-2" style={{ borderColor: 'var(--border-fine)' }}>
                  <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Contacto</p>
                  {doc.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <span className="font-mono" style={{ color: 'var(--text-main)' }}>{doc.telefono}</span>
                    </div>
                  )}
                  {doc.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <span className="font-mono text-[10px]" style={{ color: 'var(--text-main)' }}>{doc.email}</span>
                    </div>
                  )}
                </div>

                {/* Idiomas */}
                <div className="space-y-1.5 border-t pt-2" style={{ borderColor: 'var(--border-fine)' }}>
                  <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Idiomas Habilitados</p>
                  <div className="flex flex-wrap gap-1">
                    {(doc.idiomas || []).map((idm: string, i: number) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] border"
                        style={{ background: 'var(--bg-card)', borderColor: '#10b98130', color: '#10b981' }}>
                        {idm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Paralelo actual */}
                {doc.paralelo_actual && (
                  <div className="border-t pt-2" style={{ borderColor: 'var(--border-fine)' }}>
                    <p className="text-[10px] uppercase font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Paralelo Actual</p>
                    <span className="font-mono font-black text-sky-400">{doc.paralelo_actual}</span>
                  </div>
                )}

                {/* Acciones */}
                <div className="space-y-1.5 border-t pt-2" style={{ borderColor: 'var(--border-fine)' }}>
                  <button
                    onClick={() => abrirModalEditar(doc)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-[2px] border border-sky-700/40 bg-sky-900/30 text-sky-300 hover:bg-sky-800/40 transition"
                  >
                    <Edit className="w-3 h-3" /> Editar Ficha
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setModalBajaDocente({ id: doc.id_docente, nombre: doc.nombre_completo, estado: doc.estado })}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold rounded-[2px] transition ${doc.estado === 'Activo' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                    >
                      <ShieldAlert className="w-3 h-3" />
                      {doc.estado === 'Activo' ? 'Dar Baja' : 'Reactivar'}
                    </button>
                    {doc.estado === 'Inactivo' && (
                      <button
                        onClick={() => setModalEliminarFisicoDocente({ id: doc.id_docente, nombre: doc.nombre_completo })}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold rounded-[2px] bg-red-950/60 text-red-300 hover:bg-red-900 border border-red-800/40 transition"
                      >
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </>
            );
          })() : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4" style={{ color: 'var(--text-muted)' }}>
              <GraduationCap className="w-10 h-10 opacity-20" />
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>Selecciona un docente</p>
                <p className="text-[11px] mt-1">Haz clic en una fila de la tabla para ver el expediente completo y las acciones disponibles.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalDocente && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {modoEdicion ? 'Editar Ficha del Docente' : 'Registro de Nuevo Docente'}
              </h3>
              <button onClick={() => setModalDocente(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarDocente} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 block mb-1">Cédula de Identidad (CI) * (mín. 5 dígitos)</label>
                  <input
                    type="text"
                    placeholder="Ej: 5849201"
                    minLength={5}
                    value={formDoc.ci_docente}
                    onChange={(e) => setFormDoc({ ...formDoc, ci_docente: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-300 block mb-1">Estado</label>
                  <select
                    value={formDoc.estado_docente}
                    onChange={(e) => setFormDoc({ ...formDoc, estado_docente: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 block mb-1">Nombres * (mín. 3 letras)</label>
                  <input
                    type="text"
                    placeholder="Ej: Fernando"
                    minLength={3}
                    value={formDoc.nombre_docente}
                    onChange={(e) => setFormDoc({ ...formDoc, nombre_docente: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-300 block mb-1">Apellidos * (mín. 3 letras)</label>
                  <input
                    type="text"
                    placeholder="Ej: Ríos Torrico"
                    minLength={3}
                    value={formDoc.apellido_docente}
                    onChange={(e) => setFormDoc({ ...formDoc, apellido_docente: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 block mb-1">Teléfono (mín. 7 dígitos)</label>
                  <input
                    type="text"
                    placeholder="Ej: 71548920"
                    minLength={7}
                    value={formDoc.telefono_docente}
                    onChange={(e) => setFormDoc({ ...formDoc, telefono_docente: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-300 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="Ej: f.rios@ejercito.mil.bo"
                    value={formDoc.email_docente}
                    onChange={(e) => setFormDoc({ ...formDoc, email_docente: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1">Idiomas Habilitados para Enseñar</label>
                <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-3 rounded-lg border border-neutral-800 max-h-32 overflow-y-auto">
                  {idiomasCatalogo.map((idm) => {
                    const marcado = formDoc.idiomas_ids.includes(idm.id_idioma);
                    return (
                      <label key={idm.id_idioma} className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormDoc({ ...formDoc, idiomas_ids: [...formDoc.idiomas_ids, idm.id_idioma] });
                            } else {
                              setFormDoc({ ...formDoc, idiomas_ids: formDoc.idiomas_ids.filter((i) => i !== idm.id_idioma) });
                            }
                          }}
                          className="rounded border-neutral-700 bg-neutral-900 text-emerald-500"
                        />
                        <span>{idm.nombre_idioma}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalDocente(false)}
                  className="px-3 py-1.5 rounded bg-neutral-800 text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow"
                >
                  {modoEdicion ? 'Actualizar Ficha' : 'Guardar Docente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalRotar && paraleloARotar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/50 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                Ejecución de Relevo Docente (15 Días)
              </h3>
              <button onClick={() => setModalRotar(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEjecutarRotacion} className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Paralelo a Relevar</span>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white text-base font-mono">{paraleloARotar.codigo_paralelo}</p>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                    Idioma: {idiomaParaleloRelevo || 'Todos'}
                  </span>
                </div>
                {paraleloARotar.docente_actual && (
                  <p className="text-[11px] text-neutral-400">
                    Docente saliente: <span className="text-amber-300 font-semibold">{paraleloARotar.docente_actual}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Docente Entrante Habilitado en {idiomaParaleloRelevo || 'el Idioma'}
                </label>
                <select
                  value={docenteNuevoId}
                  onChange={(e) => setDocenteNuevoId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                  required
                >
                  <option value="">
                    {docentesCandidatosRelevo.length > 0
                      ? `— Seleccione docente de relevo (${docentesCandidatosRelevo.length} disponibles) —`
                      : `— No hay docentes disponibles para ${idiomaParaleloRelevo} —`}
                  </option>
                  {docentesCandidatosRelevo.map((d) => (
                    <option key={d.id_docente} value={d.id_docente}>
                      {d.nombre_completo} ({d.idiomas?.join(', ')})
                    </option>
                  ))}
                </select>
                {docentesCandidatosRelevo.length === 0 && (
                  <p className="text-amber-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    No hay otros docentes activos habilitados en {idiomaParaleloRelevo} para relevar este paralelo.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalRotar(false)}
                  className="px-3 py-1.5 rounded bg-neutral-800 text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={docentesCandidatosRelevo.length === 0}
                  className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold transition shadow"
                >
                  Confirmar Relevo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modalResultadoAsignacion && resultadoAsignacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white animate-solemn-fade">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Wand2 className="w-5 h-5" />
                <h3 className="font-bold text-base">Asignación Automatizada de Periodo</h3>
              </div>
              <button
                onClick={() => setModalResultadoAsignacion(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              {resultadoAsignacion.message}
            </p>

            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-semibold">Total Asignaciones Realizadas:</span>
                <span className="text-emerald-400 font-bold text-sm">{resultadoAsignacion.total_asignados}</span>
              </div>

              {resultadoAsignacion.asignaciones && resultadoAsignacion.asignaciones.length > 0 && (
                <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {resultadoAsignacion.asignaciones.map((asig: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-300">{asig.paralelo} ({asig.idioma})</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {asig.aula}
                        </span>
                      </div>
                      <div className="text-neutral-300 mt-1">
                        Docente: <strong className="text-white">{asig.docente}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setModalResultadoAsignacion(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {modalResultadoRotacion && resultadoRotacionMasiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-amber-500/50 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white animate-solemn-fade">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <ArrowRightLeft className="w-5 h-5" />
                <h3 className="font-bold text-base">Rotación Automática Masiva de Periodo</h3>
              </div>
              <button
                onClick={() => setModalResultadoRotacion(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              {resultadoRotacionMasiva.message}
            </p>

            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-semibold">Total Relevos Realizados:</span>
                <span className="text-emerald-400 font-bold text-sm">{resultadoRotacionMasiva.total_rotados}</span>
              </div>

              {resultadoRotacionMasiva.rotaciones && resultadoRotacionMasiva.rotaciones.length > 0 && (
                <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {resultadoRotacionMasiva.rotaciones.map((rot: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-300">{rot.paralelo} ({rot.idioma})</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                          Relevado tras {rot.dias_anteriores} días
                        </span>
                      </div>
                      <div className="text-neutral-300 mt-1 flex flex-col gap-0.5">
                        <div>Saliente: <strong className="text-neutral-400">{rot.docente_saliente}</strong></div>
                        <div>Entrante: <strong className="text-emerald-300">{rot.docente_entrante}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {resultadoRotacionMasiva.no_rotados && resultadoRotacionMasiva.no_rotados.length > 0 && (
                <div className="mt-2 p-2 bg-amber-950/40 border border-amber-800/40 rounded text-[11px] text-amber-300 space-y-1">
                  <span className="font-bold">Avisos ({resultadoRotacionMasiva.no_rotados.length}):</span>
                  {resultadoRotacionMasiva.no_rotados.map((nr: any, i: number) => (
                    <p key={i}>• {nr.paralelo}: {nr.motivo}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setModalResultadoRotacion(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Baja Lógica del Docente */}
      {modalBajaDocente && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-solemn-fade">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">
                {modalBajaDocente.estado === 'Activo' ? 'Baja Lógica de Docente' : 'Reactivación de Docente'}
              </h3>
            </div>
            <p className="text-xs text-neutral-300">
              ¿Confirma {modalBajaDocente.estado === 'Activo' ? 'dar de baja lógica' : 'reactivar'} al docente <strong className="text-white">{modalBajaDocente.nombre}</strong>?
            </p>
            <p className="text-[11px] text-neutral-400 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              {modalBajaDocente.estado === 'Activo'
                ? 'El docente pasará a estado Inactivo. Sus antecedentes académicos y partes de asistencia previos quedarán intactos.'
                : 'El docente volverá a estar habilitado para asignaciones académicas activas.'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalBajaDocente(null)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarBajaDocente}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Baja Física Definitiva del Docente */}
      {modalEliminarFisicoDocente && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/60 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-solemn-fade">
            <div className="flex items-center gap-3 text-red-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Baja Física Definitiva</h3>
            </div>
            <p className="text-xs text-neutral-300">
              ¿Está completamente seguro de eliminar de forma física y definitiva al docente <strong className="text-white">{modalEliminarFisicoDocente.nombre}</strong>?
            </p>
            <div className="text-[11px] text-red-200 bg-red-950/40 p-3 rounded-lg border border-red-800/60 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                ADVERTENCIA IRREVERSIBLE
              </p>
              <p>
                Esta acción borrará de manera definitiva el registro del docente, sus asociaciones idiomáticas y asignaciones pasadas de la base de datos institucional.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalEliminarFisicoDocente(null)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminacionFisica}
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