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

const PER_PAGE = 10;

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

  const handleGuardarDocente = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
              <span>SACA</span>
              <span>/</span>
              <span className="text-emerald-400 font-semibold">Cuerpo Docente</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              Gestión y Rotación de Docentes
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
          <button
            onClick={ejecutarAsignacionAutomatica}
            disabled={ejecutandoAsignacion || !puedeAdministrar}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-md shadow-amber-600/20"
            title="Asigna automáticamente docentes a paralelos sin docente según especialidad y carga lectiva"
          >
            <Wand2 className={`w-3.5 h-3.5 ${ejecutandoAsignacion ? 'animate-spin' : ''}`} />
            <span>{ejecutandoAsignacion ? 'Asignando...' : 'Asignación Automática'}</span>
          </button>
          <button
            onClick={abrirModalNuevo}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            + Registrar Docente
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

      {alertasRotacion.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl border border-amber-500/50 bg-amber-950/30 text-sm">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
            <div>
              <span className="font-bold text-amber-300">
                {alertasRotacion.length} relevo(s) pendiente(s)
              </span>
              <span className="text-neutral-400 ml-2 text-xs">
                Docentes con ≥14 días continuos en aula
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRotarTodosPendientes}
              disabled={ejecutandoRotacionMasiva}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold rounded-lg text-xs transition shadow-md disabled:opacity-50"
              title="Ejecuta de forma automática todas las rotaciones pendientes asignando docentes del mismo idioma"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${ejecutandoRotacionMasiva ? 'animate-spin' : ''}`} />
              <span>{ejecutandoRotacionMasiva ? 'Rotando todas...' : 'Rotar Todas las Pendientes'}</span>
            </button>
            <div className="h-4 w-px bg-amber-700/50 hidden sm:block mx-1" />
            {alertasRotacion.slice(0, 4).map((a, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const par = paralelos.find((p) => p.codigo_paralelo === a.paralelo);
                  setParaleloARotar(par || {
                    id_paralelo: a.id_paralelo || a.id_asignacion,
                    codigo_paralelo: a.paralelo,
                    idioma: a.idioma,
                    id_docente: a.id_docente,
                    docente_actual: a.docente_actual,
                  });
                  setDocenteNuevoId('');
                  setModalRotar(true);
                }}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow"
                title={`Relevar manualmente ${a.paralelo} (${a.idioma})`}
              >
                <ArrowRightLeft className="w-3 h-3" />
                {a.paralelo} ({a.dias_en_aula}d)
              </button>
            ))}
            {alertasRotacion.length > 4 && (
              <span className="text-xs text-amber-400 self-center">+{alertasRotacion.length - 4} más</span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar docente por nombre, CI o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-3 py-1.5 text-xs text-white"
          />
        </div>
        <span className="text-xs text-neutral-500">
          Mostrando <strong className="text-white">{docentesFiltrados.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, docentesFiltrados.length)}</strong> de <strong className="text-white">{docentesFiltrados.length}</strong> docentes
        </span>
      </div>

      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-3">Docente</th>
                <th className="p-3">Cédula (CI)</th>
                <th className="p-3">Idiomas Habilitados</th>
                <th className="p-3">Paralelo Asignado</th>
                <th className="p-3 text-center">Días en Aula</th>
                <th className="p-3">Contacto</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {docentesPaginados.map((doc) => (
                <tr key={doc.id_docente} className="hover:bg-neutral-800/30 transition">
                  <td className="p-3">
                    <div className="font-bold text-white text-sm">
                      {doc.nombre_completo}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-neutral-300 font-semibold">
                    {doc.ci_docente}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(doc.idiomas || []).map((idm: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          {idm}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    {doc.paralelo_actual ? (
                      <span className="font-mono text-sky-400 font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                        {doc.paralelo_actual}
                      </span>
                    ) : (
                      <span className="text-neutral-500 text-[11px]">En reserva / Sin paralelo</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`font-mono font-bold text-sm ${doc.dias_en_aula >= 14 ? 'text-amber-400' : 'text-neutral-300'}`}>
                      {doc.dias_en_aula} d.
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-neutral-400 space-y-0.5">
                    <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {doc.telefono}</p>
                    <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {doc.email}</p>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      doc.estado === 'Activo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {doc.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {docentesPaginados.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    No se encontraron docentes con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-3 border-t border-neutral-800 text-xs text-neutral-400">
          <span>Página {page} de {totalPages} &bull; {docentesFiltrados.length} registros</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {modalDocente && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">Registro de Nuevo Docente</h3>
              <button onClick={() => setModalDocente(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarDocente} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 block mb-1">Cédula de Identidad (CI)</label>
                  <input
                    type="text"
                    placeholder="Ej: 5849201"
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
                  <label className="text-neutral-300 block mb-1">Nombres</label>
                  <input
                    type="text"
                    placeholder="Ej: Fernando"
                    value={formDoc.nombre_docente}
                    onChange={(e) => setFormDoc({ ...formDoc, nombre_docente: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-300 block mb-1">Apellidos</label>
                  <input
                    type="text"
                    placeholder="Ej: Ríos Torrico"
                    value={formDoc.apellido_docente}
                    onChange={(e) => setFormDoc({ ...formDoc, apellido_docente: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: 71548920"
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
                  Guardar Docente
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
    </div>
  );
}