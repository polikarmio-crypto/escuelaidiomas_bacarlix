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
  ChevronRight
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
        fetch('http://localhost:8000/api/v1/docentes'),
        fetch('http://localhost:8000/api/v1/docentes/alertas/rotacion'),
        fetch('http://localhost:8000/api/v1/catalogos/idiomas'),
        fetch('http://localhost:8000/api/v1/paralelos'),
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
        ? `http://localhost:8000/api/v1/docentes/${idDocenteSeleccionado}`
        : 'http://localhost:8000/api/v1/docentes';
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
      const res = await fetch('http://localhost:8000/api/v1/docentes/rotar', {
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
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
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
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/50 bg-amber-950/30 text-sm">
          <Clock className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
          <div className="flex-1">
            <span className="font-bold text-amber-300">
              {alertasRotacion.length} relevo(s) pendiente(s)
            </span>
            <span className="text-neutral-400 ml-2 text-xs">
              Docentes con ≥14 días continuos en aula
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertasRotacion.slice(0, 4).map((a, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const par = paralelos.find((p) => p.codigo_paralelo === a.paralelo);
                  setParaleloARotar(par || { id_paralelo: a.id_asignacion, codigo_paralelo: a.paralelo, idioma: a.idioma });
                  setModalRotar(true);
                }}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow"
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
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar docente por nombre, CI o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white"
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
                <p className="font-bold text-white text-base font-mono">{paraleloARotar.codigo_paralelo}</p>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Seleccionar Docente Entrante (Debe estar habilitado en el idioma)
                </label>
                <select
                  value={docenteNuevoId}
                  onChange={(e) => setDocenteNuevoId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                  required
                >
                  <option value="">Seleccione docente de relevo...</option>
                  {docentes.map((d) => (
                    <option key={d.id_docente} value={d.id_docente}>
                      {d.nombre_completo} ({d.idiomas?.join(', ')})
                    </option>
                  ))}
                </select>
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
                  className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition shadow"
                >
                  Confirmar Relevo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
