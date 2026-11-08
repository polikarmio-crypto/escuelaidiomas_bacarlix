'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Printer,
  X,
  Search,
  Shield,
  RefreshCw,
  Award,
  Users
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

interface EstudianteAsistencia {
  id_inscripcion: number;
  id_estudiante: number;
  nombre_completo: string;
  ci: string;
  tipo: string;
  grado_militar?: string | null;
  id_asistencia?: number | null;
  estado_asistencia: 'Presente' | 'Falta' | 'Atraso' | 'Licencia';
  observacion: string;
}

export default function AsistenciaPage() {
  const { esDocente, esJefeAcademico, esAdmin, rolConfig } = useAuthRole();
  const puedeRegistrar = esDocente || esJefeAcademico || esAdmin;

  const [paralelos, setParalelos] = useState<any[]>([]);
  const [idParaleloSeleccionado, setIdParaleloSeleccionado] = useState<string>('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [infoParalelo, setInfoParalelo] = useState<any | null>(null);
  const [estudiantes, setEstudiantes] = useState<EstudianteAsistencia[]>([]);
  const [resumen, setResumen] = useState<any | null>(null);
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);

  const [modalPdf, setModalPdf] = useState(false);
  const [reportePdf, setReportePdf] = useState<any | null>(null);
  const [cargandoPdf, setCargandoPdf] = useState(false);

  const mostrarMensaje = (tipo: 'ok' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 5000);
  };

  const cargarParalelos = async () => {
    try {
      const res = await fetch('/api/v1/paralelos');
      if (res.ok) {
        const data = await res.json();
        const lista = Array.isArray(data) ? data : (data.data || []);
        setParalelos(lista);
        if (lista.length > 0 && !idParaleloSeleccionado) {
          setIdParaleloSeleccionado(lista[0].id_paralelo.toString());
        }
      }
    } catch (e) {
      mostrarMensaje('error', 'Error al cargar paralelos.');
    }
  };

  const cargarAsistencia = async () => {
    if (!idParaleloSeleccionado) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/asistencia?id_paralelo=${idParaleloSeleccionado}&fecha=${fechaSeleccionada}`);
      if (res.ok) {
        const data = await res.json();
        setInfoParalelo(data.paralelo);
        setEstudiantes(data.estudiantes || []);
        setResumen(data.resumen || null);
      } else {
        const err = await res.json();
        mostrarMensaje('error', err.error || 'No se pudo cargar la lista de asistencia.');
      }
    } catch (e) {
      mostrarMensaje('error', 'Fallo de conexión al cargar asistencia.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarParalelos();
  }, []);

  useEffect(() => {
    if (idParaleloSeleccionado) {
      cargarAsistencia();
    }
  }, [idParaleloSeleccionado, fechaSeleccionada]);

  const cambiarEstadoAlumno = (idInscripcion: number, nuevoEstado: 'Presente' | 'Falta' | 'Atraso' | 'Licencia') => {
    setEstudiantes((prev) =>
      prev.map((e) => (e.id_inscripcion === idInscripcion ? { ...e, estado_asistencia: nuevoEstado } : e))
    );
  };

  const marcarTodos = (estado: 'Presente' | 'Falta' | 'Atraso' | 'Licencia') => {
    setEstudiantes((prev) => prev.map((e) => ({ ...e, estado_asistencia: estado })));
  };

  const handleGuardarAsistencia = async () => {
    if (!idParaleloSeleccionado || estudiantes.length === 0) return;
    setGuardando(true);
    try {
      const payload = {
        id_paralelo: parseInt(idParaleloSeleccionado, 10),
        fecha_asistencia: fechaSeleccionada,
        id_docente: infoParalelo?.id_docente || null,
        asistencias: estudiantes.map((e) => ({
          id_inscripcion: e.id_inscripcion,
          id_estudiante: e.id_estudiante,
          estado_asistencia: e.estado_asistencia,
          observacion: e.observacion || null,
        })),
      };

      const res = await fetch('/api/v1/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        mostrarMensaje('ok', data.message || 'Parte de asistencia registrado correctamente.');
        cargarAsistencia();
      } else {
        throw new Error(data.error || 'No se pudo guardar la asistencia.');
      }
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    } finally {
      setGuardando(false);
    }
  };

  const abrirReportePdf = async () => {
    if (!idParaleloSeleccionado) return;
    setCargandoPdf(true);
    try {
      const res = await fetch(`/api/v1/asistencia/reporte/${idParaleloSeleccionado}`);
      if (res.ok) {
        const data = await res.json();
        setReportePdf(data);
        setModalPdf(true);
      } else {
        mostrarMensaje('error', 'Error al generar el reporte de asistencia.');
      }
    } catch (e) {
      mostrarMensaje('error', 'Fallo al conectar con el servicio de reportes.');
    } finally {
      setCargandoPdf(false);
    }
  };

  if (!puedeRegistrar) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-8 text-center space-y-4">
          <Shield className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-neutral-300 max-w-xl mx-auto">
            El control de asistencia institucional está reservado para el personal docente y jefatura académica.
          </p>
        </div>
      </div>
    );
  }

  const conteoLocal = {
    presentes: estudiantes.filter((e) => e.estado_asistencia === 'Presente').length,
    faltas: estudiantes.filter((e) => e.estado_asistencia === 'Falta').length,
    atrasos: estudiantes.filter((e) => e.estado_asistencia === 'Atraso').length,
    licencias: estudiantes.filter((e) => e.estado_asistencia === 'Licencia').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
              <span>SACA</span>
              <span>/</span>
              <span className="text-emerald-400 font-semibold">Gestión Académica</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              Control Diario de Asistencia
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={abrirReportePdf}
            disabled={cargandoPdf || !idParaleloSeleccionado}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-bold border border-amber-500/30 transition shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>{cargandoPdf ? 'Generando...' : 'Previsualizar Reporte Oficial (PDF)'}</span>
          </button>

          <button
            onClick={handleGuardarAsistencia}
            disabled={guardando || estudiantes.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20"
          >
            <CheckCircle2 className={`w-4 h-4 ${guardando ? 'animate-spin' : ''}`} />
            <span>{guardando ? 'Guardando...' : 'Guardar Registro del Día'}</span>
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

      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
              Paralelo / Idioma
            </label>
            <select
              value={idParaleloSeleccionado}
              onChange={(e) => setIdParaleloSeleccionado(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {paralelos.map((p) => {
                const nombreIdioma = typeof p.idioma === 'string' ? p.idioma : (p.nivel?.programa?.idioma?.nombre_idioma || 'Idioma');
                const nombreNivel = typeof p.nivel === 'string' ? p.nivel : (p.nivel?.nombre_nivel || 'Nivel');
                return (
                  <option key={p.id_paralelo} value={p.id_paralelo}>
                    {p.codigo_paralelo} - {nombreIdioma} ({nombreNivel})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
              Fecha de la Sesión
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="date"
                value={fechaSeleccionada}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => marcarTodos('Presente')}
              className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-emerald-950/60 text-emerald-400 border border-neutral-700 hover:border-emerald-500/50 rounded-lg text-xs font-bold transition"
            >
              Marcar Todos Presentes
            </button>
            <button
              onClick={cargarAsistencia}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-neutral-700 transition"
              title="Refrescar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {infoParalelo && (
          <div className="mt-4 pt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400">
            <div>
              <span className="font-semibold text-neutral-300">Docente Titular:</span>{' '}
              <span className="text-emerald-400 font-bold">{infoParalelo.docente}</span>
            </div>
            <div>
              <span className="font-semibold text-neutral-300">Aula:</span>{' '}
              <span className="text-white">{infoParalelo.aula}</span>
            </div>
            <div>
              <span className="font-semibold text-neutral-300">Horario:</span>{' '}
              <span className="text-white">{infoParalelo.horario}</span>
            </div>
            <div>
              <span className="font-semibold text-neutral-300">Total Alumnos:</span>{' '}
              <span className="text-white font-bold">{estudiantes.length}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-300 font-semibold">Presentes</div>
            <div className="text-xl font-bold text-emerald-400">{conteoLocal.presentes}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">P</span>
        </div>

        <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-red-300 font-semibold">Faltas</div>
            <div className="text-xl font-bold text-red-400">{conteoLocal.faltas}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">F</span>
        </div>

        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-300 font-semibold">Atrasos</div>
            <div className="text-xl font-bold text-amber-400">{conteoLocal.atrasos}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">A</span>
        </div>

        <div className="bg-sky-950/30 border border-sky-500/30 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-sky-300 font-semibold">Licencias</div>
            <div className="text-xl font-bold text-sky-400">{conteoLocal.licencias}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">L</span>
        </div>
      </div>

      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Cédula / Matrícula</th>
                <th className="p-3">Estudiante</th>
                <th className="p-3">Condición</th>
                <th className="p-3 text-center">Estado de Asistencia</th>
                <th className="p-3">Observación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    Cargando nómina de estudiantes...
                  </td>
                </tr>
              ) : estudiantes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    No se encontraron inscripciones activas para este paralelo.
                  </td>
                </tr>
              ) : (
                estudiantes.map((est, index) => (
                  <tr key={est.id_inscripcion} className="hover:bg-neutral-800/40 transition">
                    <td className="p-3 font-mono text-neutral-500">{index + 1}</td>
                    <td className="p-3 font-mono text-neutral-300">{est.ci}</td>
                    <td className="p-3">
                      <div className="font-bold text-white">{est.nombre_completo}</div>
                      {est.grado_militar && (
                        <div className="text-xs text-amber-400 font-semibold">{est.grado_militar}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          est.tipo === 'Militar' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {est.tipo}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => cambiarEstadoAlumno(est.id_inscripcion, 'Presente')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            est.estado_asistencia === 'Presente'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                          }`}
                        >
                          Presente
                        </button>
                        <button
                          type="button"
                          onClick={() => cambiarEstadoAlumno(est.id_inscripcion, 'Falta')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            est.estado_asistencia === 'Falta'
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                          }`}
                        >
                          Falta
                        </button>
                        <button
                          type="button"
                          onClick={() => cambiarEstadoAlumno(est.id_inscripcion, 'Atraso')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            est.estado_asistencia === 'Atraso'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                          }`}
                        >
                          Atraso
                        </button>
                        <button
                          type="button"
                          onClick={() => cambiarEstadoAlumno(est.id_inscripcion, 'Licencia')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            est.estado_asistencia === 'Licencia'
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                          }`}
                        >
                          Licencia
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={est.observacion}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEstudiantes((prev) =>
                            prev.map((item) => (item.id_inscripcion === est.id_inscripcion ? { ...item, observacion: val } : item))
                          );
                        }}
                        placeholder="Nota u observación..."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalPdf && reportePdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white text-neutral-900 rounded-xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200">
            <div className="sticky top-0 bg-neutral-100 px-6 py-4 border-b border-neutral-300 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-neutral-900">
                  Previsualización de Reporte Oficial de Asistencia
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir / Guardar PDF
                </button>
                <button
                  onClick={() => setModalPdf(false)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 printable-report">
              <div className="text-center border-b-2 border-neutral-800 pb-4">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <img src="/images/logos/logo-eie.png" alt="EIE" className="w-14 h-14 object-contain" />
                  <div>
                    <h2 className="text-base font-extrabold tracking-wider text-neutral-900 uppercase">
                      {reportePdf.institucion.entidad}
                    </h2>
                    <h3 className="text-xs font-semibold text-neutral-700 tracking-wide uppercase">
                      {reportePdf.institucion.subtitulo}
                    </h3>
                    <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      Acta Oficial N°: {reportePdf.institucion.codigo_reporte} &bull; Emisión: {reportePdf.institucion.fecha_emision}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-xs">
                <div>
                  <span className="font-bold text-neutral-600 block">Paralelo:</span>
                  <span className="font-bold text-neutral-900">{reportePdf.paralelo.codigo}</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-600 block">Idioma / Nivel:</span>
                  <span className="font-semibold text-neutral-800">{reportePdf.paralelo.idioma} - {reportePdf.paralelo.nivel}</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-600 block">Horario / Aula:</span>
                  <span className="text-neutral-800">{reportePdf.paralelo.horario} ({reportePdf.paralelo.aula})</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-600 block">Promedio Asistencia:</span>
                  <span className="font-bold text-emerald-700 text-sm">{reportePdf.resumen_general.promedio_asistencia_paralelo}%</span>
                </div>
              </div>

              <div>
                <table className="w-full text-left text-xs border border-neutral-300">
                  <thead className="bg-neutral-200 text-neutral-800 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border border-neutral-300 text-center">#</th>
                      <th className="p-2 border border-neutral-300">C.I.</th>
                      <th className="p-2 border border-neutral-300">Estudiante</th>
                      <th className="p-2 border border-neutral-300 text-center">Clases</th>
                      <th className="p-2 border border-neutral-300 text-center text-emerald-800">P</th>
                      <th className="p-2 border border-neutral-300 text-center text-red-800">F</th>
                      <th className="p-2 border border-neutral-300 text-center text-amber-800">A</th>
                      <th className="p-2 border border-neutral-300 text-center text-sky-800">L</th>
                      <th className="p-2 border border-neutral-300 text-center">% Asist.</th>
                      <th className="p-2 border border-neutral-300 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {reportePdf.estudiantes.map((alu: any, idx: number) => (
                      <tr key={alu.id_inscripcion} className="odd:bg-white even:bg-neutral-50">
                        <td className="p-2 border border-neutral-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border border-neutral-300 font-mono">{alu.codigo}</td>
                        <td className="p-2 border border-neutral-300 font-medium">
                          {alu.estudiante}
                          {alu.grado && <span className="block text-[10px] text-amber-700 font-semibold">{alu.grado}</span>}
                        </td>
                        <td className="p-2 border border-neutral-300 text-center">{alu.total_clases}</td>
                        <td className="p-2 border border-neutral-300 text-center font-bold text-emerald-700">{alu.presentes}</td>
                        <td className="p-2 border border-neutral-300 text-center font-bold text-red-700">{alu.faltas}</td>
                        <td className="p-2 border border-neutral-300 text-center font-bold text-amber-700">{alu.atrasos}</td>
                        <td className="p-2 border border-neutral-300 text-center font-bold text-sky-700">{alu.licencias}</td>
                        <td className="p-2 border border-neutral-300 text-center font-bold">{alu.porcentaje_asistencia}%</td>
                        <td className="p-2 border border-neutral-300 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              alu.estado_asistencia_general === 'REGULAR'
                                ? 'bg-emerald-100 text-emerald-800'
                                : alu.estado_asistencia_general === 'OBSERVADO'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {alu.estado_asistencia_general}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-16 pb-4 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="border-t border-neutral-800 pt-2 font-bold text-neutral-900">
                    {reportePdf.firmas.docente.nombre}
                  </div>
                  <div className="text-[10px] text-neutral-600">{reportePdf.firmas.docente.cargo}</div>
                </div>

                <div>
                  <div className="border-t border-neutral-800 pt-2 font-bold text-neutral-900">
                    {reportePdf.firmas.jefe_academico.nombre}
                  </div>
                  <div className="text-[10px] text-neutral-600">{reportePdf.firmas.jefe_academico.cargo}</div>
                </div>

                <div>
                  <div className="border-t border-neutral-800 pt-2 font-bold text-neutral-900">
                    {reportePdf.firmas.direccion.nombre}
                  </div>
                  <div className="text-[10px] text-neutral-600">{reportePdf.firmas.direccion.cargo}</div>
                </div>
              </div>

              <div className="text-center text-[10px] text-neutral-400 border-t border-neutral-200 pt-2 italic">
                Documento de Control y Auditoría Académica &bull; Sistema Académico de Control y Aprendizaje (SACA)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

