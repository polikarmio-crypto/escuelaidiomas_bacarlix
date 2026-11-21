'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Users,
  Search,
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
  ChevronRight,
  UserCheck,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

const PER_PAGE = 7;

export default function ParalelosPage() {
  const { rolActivo, esJefeAcademico, esDocente, esAdmin, usuario } = useAuthRole();
  const puedeCrear = esJefeAcademico || esAdmin;
  const puedeAsignar = esJefeAcademico || esAdmin;

  const [loading, setLoading] = useState(false);
  const [paralelos, setParalelos] = useState<any[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [aulas, setAulas] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [modalidades, setModalidades] = useState<any[]>([]);
  const [gestiones, setGestiones] = useState<any[]>([]);
  const [niveles, setNiveles] = useState<any[]>([]);

  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);

  const [modalApertura, setModalApertura] = useState(false);
  const [modalDocente, setModalDocente] = useState<{ paralelo: any } | null>(null);
  const [modalEstudiante, setModalEstudiante] = useState<{ paralelo: any } | null>(null);
  const [modalBajaParalelo, setModalBajaParalelo] = useState<{ id: number; codigo: string; estado: string } | null>(null);
  const [modalEliminarParalelo, setModalEliminarParalelo] = useState<{ id: number; codigo: string } | null>(null);
  const [idDocenteSeleccionado, setIdDocenteSeleccionado] = useState('');
  const [idEstudianteSeleccionado, setIdEstudianteSeleccionado] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [formParalelo, setFormParalelo] = useState({
    codigo_paralelo: '',
    id_nivel: 1,
    id_aula: 1,
    id_horario: 1,
    id_modalidad: 1,
    id_gestion: 1,
    id_docente_inicial: '',
    capacidad_maxima: 30,
    capacidad_minima: 10,
  });

  const [paraleloSeleccionado, setParaleloSeleccionado] = useState<any | null>(null);

  const mostrarMensaje = (tipo: 'ok' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 5000);
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const idDocenteParam = usuario.id_docente || (esDocente ? 1 : null);
      const urlParalelos = esDocente && idDocenteParam
        ? `/api/v1/paralelos?id_docente=${idDocenteParam}&email_docente=${encodeURIComponent(usuario.email || '')}`
        : '/api/v1/paralelos';
      const [resPar, resDoc, resEst, resCat, resProg] = await Promise.all([
        fetch(urlParalelos),
        fetch('/api/v1/docentes'),
        fetch('/api/v1/estudiantes?per_page=500'),
        fetch('/api/v1/catalogos'),
        fetch('/api/v1/estructura/programas'),
      ]);

      if (resPar.ok) {
        let lista = await resPar.json() || [];
        if (esDocente) {
          const docId = usuario.id_docente || 1;
          lista = lista.filter((p: any) => Number(p.id_docente_actual) === Number(docId));
        }
        setParalelos(lista);
      }
      if (resDoc.ok) setDocentes(await resDoc.json() || []);
      if (resEst.ok) {
        const estData = await resEst.json();
        setEstudiantes(Array.isArray(estData) ? estData : (estData.data || []));
      }
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
  }, [esDocente, usuario.id_docente, usuario.email, rolActivo]);

  const handleAperturarParalelo = async (e: React.FormEvent) => {
    e.preventDefault();

    const cod = formParalelo.codigo_paralelo.trim().toUpperCase();
    if (cod.length < 5 || !/^[A-Z0-9\-\_]{5,}$/.test(cod)) {
      mostrarMensaje('error', 'El código de paralelo debe contener al menos 5 caracteres alfanuméricos (ej: ING-101-A).');
      return;
    }

    try {
      const body: any = {
        codigo_paralelo: cod,
        id_nivel: formParalelo.id_nivel,
        id_aula: formParalelo.id_aula,
        id_horario: formParalelo.id_horario,
        id_modalidad: formParalelo.id_modalidad,
        id_gestion: formParalelo.id_gestion,
        capacidad_maxima_paralelo: formParalelo.capacidad_maxima,
        capacidad_minima_apertura: formParalelo.capacidad_minima,
        estado_paralelo: 'Abierto',
      };
      if (formParalelo.id_docente_inicial) {
        body.id_docente_inicial = parseInt(formParalelo.id_docente_inicial);
      }
      const res = await fetch('/api/v1/paralelos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al aperturar paralelo.');

      mostrarMensaje('ok', data.message || 'Paralelo aperturado exitosamente.');
      setModalApertura(false);
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleConfirmarBajaParalelo = async () => {
    if (!modalBajaParalelo) return;
    try {
      const res = await fetch(`/api/v1/paralelos/${modalBajaParalelo.id}/baja-logica`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar estado del paralelo.');
      mostrarMensaje('ok', data.message || 'Estado del paralelo actualizado.');
      setModalBajaParalelo(null);
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleConfirmarEliminarParalelo = async () => {
    if (!modalEliminarParalelo) return;
    try {
      const res = await fetch(`/api/v1/paralelos/${modalEliminarParalelo.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar paralelo.');
      mostrarMensaje('ok', data.message || 'Paralelo eliminado definitivamente.');
      setModalEliminarParalelo(null);
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleAsignarDocente = async () => {
    if (!modalDocente || !idDocenteSeleccionado) return;
    setGuardando(true);
    try {
      const res = await fetch(`/api/v1/paralelos/${modalDocente.paralelo.id_paralelo}/asignar-docente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_docente: parseInt(idDocenteSeleccionado) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al asignar docente.');
      mostrarMensaje('ok', `Docente asignado a ${modalDocente.paralelo.codigo_paralelo}.`);
      setModalDocente(null);
      setIdDocenteSeleccionado('');
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleInscribirEstudiante = async () => {
    if (!modalEstudiante || !idEstudianteSeleccionado) return;
    setGuardando(true);
    try {
      const res = await fetch('/api/v1/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_estudiante: parseInt(idEstudianteSeleccionado),
          id_paralelo: modalEstudiante.paralelo.id_paralelo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al inscribir estudiante.');
      mostrarMensaje('ok', `Estudiante inscrito en ${modalEstudiante.paralelo.codigo_paralelo}.`);
      setModalEstudiante(null);
      setIdEstudianteSeleccionado('');
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    } finally {
      setGuardando(false);
    }
  };

  const docentesParaAsignar = useMemo(() => {
    if (!modalDocente?.paralelo) return docentes;
    const p = modalDocente.paralelo;
    const idm = (
      p.idioma ||
      p.nivel?.programa?.idioma?.nombre_idioma ||
      (p.codigo_paralelo?.startsWith('ING') ? 'Inglés' :
       p.codigo_paralelo?.startsWith('FRA') ? 'Francés' :
       p.codigo_paralelo?.startsWith('ALE') ? 'Alemán' :
       p.codigo_paralelo?.startsWith('POR') ? 'Portugués' :
       p.codigo_paralelo?.startsWith('CHI') || p.codigo_paralelo?.startsWith('MAN') ? 'Mandarín' :
       p.codigo_paralelo?.startsWith('RUS') ? 'Ruso' :
       p.codigo_paralelo?.startsWith('QUE') ? 'Quechua' :
       p.codigo_paralelo?.startsWith('AYM') ? 'Aymara' : '')
    ).toLowerCase().trim();

    return docentes.filter((d) => {
      if (!idm) return true;
      return d.idiomas?.some((i: string) => {
        const lang = i.toLowerCase().trim();
        return lang.includes(idm) || idm.includes(lang);
      });
    });
  }, [modalDocente, docentes]);

  const estudiantesParaAsignar = useMemo(() => {
    if (!modalEstudiante?.paralelo) return [];
    const p = modalEstudiante.paralelo;
    const idPar = p.id_paralelo;
    const codPar = p.codigo_paralelo;
    const idm = (
      p.idioma ||
      p.nivel?.programa?.idioma?.nombre_idioma ||
      (p.codigo_paralelo?.startsWith('ING') ? 'Inglés' :
       p.codigo_paralelo?.startsWith('FRA') ? 'Francés' :
       p.codigo_paralelo?.startsWith('ALE') ? 'Alemán' :
       p.codigo_paralelo?.startsWith('POR') ? 'Portugués' :
       p.codigo_paralelo?.startsWith('CHI') || p.codigo_paralelo?.startsWith('MAN') ? 'Mandarín' :
       p.codigo_paralelo?.startsWith('RUS') ? 'Ruso' :
       p.codigo_paralelo?.startsWith('QUE') ? 'Quechua' :
       p.codigo_paralelo?.startsWith('AYM') ? 'Aymara' : '')
    ).toLowerCase().trim();

    return estudiantes.filter((est: any) => {
      // 1. Excluir estudiantes ya asignados o inscritos a este paralelo
      if (est.id_paralelo_actual === idPar || est.paralelo === codPar) return false;
      if (Array.isArray(est.inscripciones_ids) && est.inscripciones_ids.includes(idPar)) return false;

      // 2. Solo estudiantes inscritos o correspondientes al idioma del paralelo
      const idiomaEst = (est.idiomaActual || '').toLowerCase().trim();
      const idiomasInscritos = Array.isArray(est.idiomas_inscritos)
        ? est.idiomas_inscritos.map((i: string) => i.toLowerCase().trim())
        : [];

      const perteneceAlIdioma = idiomaEst === idm ||
        idiomasInscritos.includes(idm) ||
        (idm && (idiomaEst.includes(idm) || idm.includes(idiomaEst)));

      return perteneceAlIdioma;
    });
  }, [modalEstudiante, estudiantes]);

  useEffect(() => {
    setPage(1);
  }, [busqueda]);

  const paralelosVisibles = useMemo(() => {
    return paralelos.filter((p) => {
      const docenteStr = typeof p.docente_actual === 'string'
        ? p.docente_actual
        : (p.docente_actual?.nombre_docente ? `${p.docente_actual.nombre_docente} ${p.docente_actual.apellido_docente}` : '');
      const aulaStr = typeof p.aula === 'string' ? p.aula : (p.aula?.nombre_aula || '');
      const idiomaStr = typeof p.idioma === 'string' ? p.idioma : (p.nivel?.programa?.idioma?.nombre_idioma || '');
      const programaStr = typeof p.programa === 'string' ? p.programa : (p.nivel?.programa?.nombre_programa || '');
      const nivelStr = typeof p.nivel === 'string' ? p.nivel : (p.nivel?.nombre_nivel || '');

      if (esDocente) {
        // Aislamiento estricto: El docente solo debe ver SUS paralelos asignados
        const idDoc = usuario.id_docente || 1;
        const coincideId = p.id_docente_actual === idDoc;
        const docenteNombreRef = (usuario.nombre || 'Fernando Ríos').toLowerCase();
        const coincideNombre = docenteStr.toLowerCase().includes(docenteNombreRef) ||
          (docenteNombreRef.includes('fernando') && docenteStr.toLowerCase().includes('fernando'));

        if (!coincideId && !coincideNombre) {
          return false;
        }

        if (!busqueda.trim()) return true;
        const q = busqueda.toLowerCase().trim();
        return (
          p.codigo_paralelo?.toLowerCase().includes(q) ||
          idiomaStr.toLowerCase().includes(q) ||
          aulaStr.toLowerCase().includes(q)
        );
      }
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      return (
        p.codigo_paralelo?.toLowerCase().includes(q) ||
        idiomaStr.toLowerCase().includes(q) ||
        programaStr.toLowerCase().includes(q) ||
        nivelStr.toLowerCase().includes(q) ||
        aulaStr.toLowerCase().includes(q) ||
        docenteStr.toLowerCase().includes(q)
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
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Strip Utility Bar */}
      <div className="strip-utility-bar" style={{ height: 'auto', minHeight: '44px', flexShrink: 0, padding: '0 0.75rem', gap: '0.5rem' }}>
        <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          <Layers className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
          <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>SACA / Paralelos</span>
          <span style={{ color: 'var(--text-muted)' }}>—</span>
          <span style={{ color: 'var(--text-main)' }}>{esDocente ? 'Mis Paralelos' : 'Apertura y Asignación'}</span>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por código, idioma, aula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[3px] border"
            style={{ background: 'var(--bg-base)', borderColor: 'var(--border-fine)', color: 'var(--text-main)' }}
          />
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          {paralelosVisibles.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, paralelosVisibles.length)} / {paralelosVisibles.length}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={cargarDatos}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[3px] border transition"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-fine)', color: 'var(--text-main)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
        {puedeCrear && (
          <button
            onClick={() => setModalApertura(true)}
            className="btn btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            Aperturar Paralelo
          </button>
        )}
      </div>

      {alerta && (
        <div className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b flex-shrink-0 ${alerta.tipo === 'ok' ? 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300' : 'bg-red-950/40 border-red-700/40 text-red-300'}`}>
          {alerta.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{alerta.mensaje}</span>
        </div>
      )}

      {/* Split Workspace */}
      <div className="split-workspace" style={{ flex: 1, minHeight: 0 }}>
        {/* Panel Izquierdo: Tabla compacta */}
        <div className="workspace-main-panel">
          <div className="workspace-table-container">
            {paralelosPaginados.length === 0 ? (
              <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
                <div className="text-center space-y-2">
                  <Layers className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs">No se encontraron paralelos</p>
                </div>
              </div>
            ) : (
              <table className="compact-table w-full">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Idioma / Nivel</th>
                    <th>Docente</th>
                    <th>Aula</th>
                    <th>Inscritos</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {paralelosPaginados.map((p) => {
                    const inscritos = p.inscritos ?? p.inscripciones_count ?? 0;
                    const capMax = p.capacidad_maxima ?? p.capacidad_maxima_paralelo ?? 30;
                    const estadoTexto = p.estado || p.estado_paralelo || 'Abierto';
                    const nombreIdioma = typeof p.idioma === 'string' ? p.idioma : (p.nivel?.programa?.idioma?.nombre_idioma || 'Idioma');
                    const nombreNivel = typeof p.nivel === 'string' ? p.nivel : (p.nivel?.nombre_nivel || 'Nivel');
                    const nombreAula = typeof p.aula === 'string' ? p.aula : (p.aula?.nombre_aula || '—');
                    const nombreDocente = typeof p.docente_actual === 'string'
                      ? p.docente_actual
                      : (p.docente_actual?.nombre_docente ? `${p.docente_actual.nombre_docente} ${p.docente_actual.apellido_docente}` : '—');
                    const isSelected = paraleloSeleccionado?.id_paralelo === p.id_paralelo;
                    return (
                      <tr
                        key={p.id_paralelo}
                        onClick={() => setParaleloSeleccionado(isSelected ? null : p)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'var(--color-primary)' : undefined,
                          color: isSelected ? '#fff' : undefined,
                        }}
                      >
                        <td><span className="font-mono font-bold text-sky-400 text-[11px]">{p.codigo_paralelo}</span></td>
                        <td>
                          <div className="font-semibold text-[11px]" style={{ color: isSelected ? '#fff' : 'var(--text-main)' }}>{nombreIdioma}</div>
                          <div className="text-[10px]" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>{nombreNivel}</div>
                        </td>
                        <td className="text-[11px]" style={{ color: isSelected ? '#fff' : 'var(--text-main)' }}>{nombreDocente !== '—' ? nombreDocente : <span style={{ color: '#f59e0b' }}>Sin asignar</span>}</td>
                        <td className="text-[11px] font-mono" style={{ color: isSelected ? '#fff' : 'var(--text-muted)' }}>{nombreAula}</td>
                        <td className="text-center font-mono text-[11px]">
                          <span style={{ color: isSelected ? '#fff' : 'var(--text-main)' }}>{inscritos}</span>
                          <span style={{ color: isSelected ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>/{capMax}</span>
                        </td>
                        <td>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] ${estadoTexto === 'Abierto' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-700/40 text-neutral-400'}`}>
                            {estadoTexto}
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
              Pág. {page} / {totalPages} &bull; {paralelosVisibles.length} registros
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

        {/* Panel Derecho: Dossier del paralelo */}
        <div className="workspace-side-panel p-3 space-y-3" style={{ background: 'var(--bg-surface)' }}>
          {paraleloSeleccionado ? (() => {
            const p = paraleloSeleccionado;
            const inscritos = p.inscritos ?? p.inscripciones_count ?? 0;
            const capMax = p.capacidad_maxima ?? p.capacidad_maxima_paralelo ?? 30;
            const cuposDisp = Math.max(0, capMax - inscritos);
            const porcentaje = Math.min(100, Math.round((inscritos / capMax) * 100));
            const estadoTexto = p.estado || p.estado_paralelo || 'Abierto';
            const nombreIdioma = typeof p.idioma === 'string' ? p.idioma : (p.nivel?.programa?.idioma?.nombre_idioma || 'Idioma');
            const nombrePrograma = p.programa || p.nivel?.programa?.nombre_programa || 'Plan de Idioma';
            const nombreNivel = typeof p.nivel === 'string' ? p.nivel : (p.nivel?.nombre_nivel || 'Nivel');
            const nombreAula = typeof p.aula === 'string' ? p.aula : (p.aula?.nombre_aula || 'Aula Principal');
            const horarioTexto = typeof p.horario === 'string' ? p.horario : (p.horario ? `${p.horario.hora_inicio_horario} - ${p.horario.hora_fin_horario}` : 'Turno Regular');
            const nombreDocente = typeof p.docente_actual === 'string'
              ? p.docente_actual
              : (p.docente_actual?.nombre_docente ? `${p.docente_actual.nombre_docente} ${p.docente_actual.apellido_docente}` : 'Sin asignar');
            const sinDocente = nombreDocente === 'Sin asignar';
            return (
              <>
                {/* Header código */}
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-fine)' }}>
                  <span className="font-mono font-black text-lg text-sky-400">{p.codigo_paralelo}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[2px] ${estadoTexto === 'Abierto' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-700/40 text-neutral-400'}`}>
                    {estadoTexto}
                  </span>
                </div>

                {/* Idioma y Nivel */}
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{nombreIdioma}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{nombrePrograma} · {nombreNivel}</p>
                </div>

                {/* Stats Ocupación */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Inscritos', val: inscritos, col: 'var(--text-main)' },
                    { label: 'Cupos', val: cuposDisp, col: '#10b981' },
                    { label: 'Máx.', val: capMax, col: 'var(--text-muted)' },
                  ].map((s) => (
                    <div key={s.label} className="p-2 rounded-[2px] text-center border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-fine)' }}>
                      <p className="font-black font-mono text-base" style={{ color: s.col }}>{s.val}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-0.5">
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-fine)' }}>
                    <div className="h-full rounded-full" style={{ width: `${porcentaje}%`, background: porcentaje >= 90 ? '#ef4444' : porcentaje >= 70 ? '#f59e0b' : '#10b981' }} />
                  </div>
                  <p className="text-[10px] text-right font-mono" style={{ color: 'var(--text-muted)' }}>{porcentaje}% cubierto</p>
                </div>

                {/* Info rows */}
                <div className="space-y-1.5 text-xs border-t pt-2" style={{ borderColor: 'var(--border-fine)' }}>
                  <div className="flex items-start gap-2">
                    <GraduationCap className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${sinDocente ? 'text-amber-400' : 'text-emerald-400'}`} />
                    <div>
                      <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Docente</span>
                      <p className={`font-semibold ${sinDocente ? 'text-amber-400' : ''}`} style={!sinDocente ? { color: 'var(--text-main)' } : {}}>{nombreDocente}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <DoorOpen className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Aula</span>
                      <p className="font-semibold font-mono" style={{ color: 'var(--text-main)' }}>{nombreAula}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Horario</span>
                      <p className="font-semibold font-mono" style={{ color: 'var(--text-main)' }}>{horarioTexto}</p>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                {puedeAsignar && (
                  <div className="space-y-1.5 border-t pt-2" style={{ borderColor: 'var(--border-fine)' }}>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => { setModalDocente({ paralelo: p }); setIdDocenteSeleccionado(p.id_docente_actual ? String(p.id_docente_actual) : ''); }}
                        className="flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-[2px] border border-sky-700/40 bg-sky-900/30 text-sky-300 hover:bg-sky-800/40 transition"
                      >
                        <UserCheck className="w-3 h-3" /> Docente
                      </button>
                      <button
                        onClick={() => { setModalEstudiante({ paralelo: p }); setIdEstudianteSeleccionado(''); }}
                        className="flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-[2px] border border-emerald-700/40 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-800/40 transition"
                      >
                        <UserPlus className="w-3 h-3" /> Alumno
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setModalBajaParalelo({ id: p.id_paralelo, codigo: p.codigo_paralelo, estado: p.estado || 'Abierto' })}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold rounded-[2px] transition ${p.estado === 'Inactivo' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'}`}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        {p.estado === 'Inactivo' ? 'Reactivar' : 'Dar Baja'}
                      </button>
                      {p.estado === 'Inactivo' && (
                        <button
                          onClick={() => setModalEliminarParalelo({ id: p.id_paralelo, codigo: p.codigo_paralelo })}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold rounded-[2px] bg-red-950/60 text-red-300 hover:bg-red-900 border border-red-800/40 transition"
                        >
                          <Trash2 className="w-3 h-3" /> Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            );
          })() : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4" style={{ color: 'var(--text-muted)' }}>
              <Layers className="w-10 h-10 opacity-20" />
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>Selecciona un paralelo</p>
                <p className="text-[11px] mt-1">Haz clic en una fila de la tabla para ver el dossier completo y las acciones disponibles.</p>
              </div>
            </div>
          )}
        </div>
      </div>

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
                <label className="text-neutral-300 block mb-1">Código del Paralelo * (mín. 5 caracteres, ej: ING-101-A)</label>
                <input
                  type="text"
                  placeholder="Ej: ING-101-A, FRA-201-B"
                  minLength={5}
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
                <label className="text-neutral-300 block mb-1">Docente Inicial (opcional)</label>
                <select
                  value={formParalelo.id_docente_inicial}
                  onChange={(e) => setFormParalelo({ ...formParalelo, id_docente_inicial: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                >
                  <option value="">— Sin asignar por ahora —</option>
                  {docentes.map((d) => (
                    <option key={d.id_docente} value={d.id_docente}>
                      {d.nombre_completo} ({d.idiomas?.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 block mb-1">Capacidad Máxima</label>
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

      {modalDocente && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Asignar Docente</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Paralelo: <span className="text-sky-400 font-mono font-bold">{modalDocente.paralelo.codigo_paralelo}</span> &bull; Idioma: <span className="text-emerald-400 font-semibold">{modalDocente.paralelo.idioma}</span>
                </p>
              </div>
              <button onClick={() => setModalDocente(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-300 block">Docente de {modalDocente.paralelo.idioma || 'Especialidad'}</label>
                  <span className="text-[11px] text-sky-400 font-semibold">{docentesParaAsignar.length} docente(s) habilitado(s)</span>
                </div>
                <select
                  value={idDocenteSeleccionado}
                  onChange={(e) => setIdDocenteSeleccionado(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                >
                  <option value="">
                    {docentesParaAsignar.length > 0
                      ? `— Selecciona un docente de ${modalDocente.paralelo.idioma || 'idioma'} —`
                      : `— No hay docentes habilitados para ${modalDocente.paralelo.idioma} —`}
                  </option>
                  {docentesParaAsignar.map((d) => (
                    <option key={d.id_docente} value={d.id_docente}>
                      {d.nombre_completo} ({d.idiomas?.join(', ')})
                    </option>
                  ))}
                </select>
                {docentesParaAsignar.length === 0 && (
                  <p className="text-amber-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    No hay docentes registrados habilitados en el idioma {modalDocente.paralelo.idioma}.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  onClick={() => setModalDocente(null)}
                  className="px-3 py-1.5 rounded bg-neutral-800 text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAsignarDocente}
                  disabled={!idDocenteSeleccionado || guardando || docentesParaAsignar.length === 0}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Confirmar Asignación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalEstudiante && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Inscribir Estudiante</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Paralelo: <span className="text-emerald-400 font-mono font-bold">{modalEstudiante.paralelo.codigo_paralelo}</span> &bull; Idioma: <span className="text-sky-400 font-semibold">{modalEstudiante.paralelo.idioma}</span>
                </p>
              </div>
              <button onClick={() => setModalEstudiante(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-300 block">Estudiante ({modalEstudiante.paralelo.idioma || 'Idioma'})</label>
                  <span className="text-[11px] text-emerald-400 font-semibold">{estudiantesParaAsignar.length} pendiente(s)</span>
                </div>
                <select
                  value={idEstudianteSeleccionado}
                  onChange={(e) => setIdEstudianteSeleccionado(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white"
                >
                  <option value="">
                    {estudiantesParaAsignar.length > 0
                      ? `— Selecciona estudiante de ${modalEstudiante.paralelo.idioma || 'idioma'} (${estudiantesParaAsignar.length} disponibles) —`
                      : `— No hay estudiantes pendientes para ${modalEstudiante.paralelo.idioma} —`}
                  </option>
                  {estudiantesParaAsignar.map((est: any) => (
                    <option key={est.id_estudiante} value={est.id_estudiante}>
                      {est.nombre_completo || `${est.nombre_estudiante || ''} ${est.apellido_estudiante || ''}`.trim()} — {est.ci || est.ci_estudiante || ''} ({est.tipo || est.tipo_estudiante || 'Civil'})
                    </option>
                  ))}
                </select>
                {estudiantesParaAsignar.length === 0 ? (
                  <p className="text-amber-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    No hay más estudiantes registrados de {modalEstudiante.paralelo.idioma} pendientes de inscripción a este paralelo.
                  </p>
                ) : (
                  <p className="text-neutral-400 text-[11px] mt-1">
                    Filtrado por idioma: Solo se muestran los estudiantes registrados en {modalEstudiante.paralelo.idioma} que aún no pertenecen a este paralelo.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  onClick={() => setModalEstudiante(null)}
                  className="px-3 py-1.5 rounded bg-neutral-800 text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInscribirEstudiante}
                  disabled={!idEstudianteSeleccionado || guardando || estudiantesParaAsignar.length === 0}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow disabled:opacity-50"
                >
                  {guardando ? 'Inscribiendo...' : 'Confirmar Inscripción'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Baja Lógica del Paralelo */}
      {modalBajaParalelo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-solemn-fade">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">
                {modalBajaParalelo.estado === 'Inactivo' ? 'Reactivar Paralelo' : 'Baja Lógica de Paralelo'}
              </h3>
            </div>
            <p className="text-xs text-neutral-300">
              ¿Confirma cambiar el estado del paralelo <strong className="text-sky-400 font-mono">{modalBajaParalelo.codigo}</strong> a {modalBajaParalelo.estado === 'Inactivo' ? 'Abierto' : 'Inactivo'}?
            </p>
            <p className="text-[11px] text-neutral-400 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              {modalBajaParalelo.estado === 'Inactivo'
                ? 'El paralelo volverá a estar habilitado para docencia e inscripciones.'
                : 'El paralelo quedará inactivo. No se permitirá nuevas inscripciones ni llamadas a lista.'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalBajaParalelo(null)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarBajaParalelo}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Baja Física Definitiva del Paralelo */}
      {modalEliminarParalelo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/60 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-solemn-fade">
            <div className="flex items-center gap-3 text-red-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Baja Física Definitiva de Paralelo</h3>
            </div>
            <p className="text-xs text-neutral-300">
              ¿Confirma la eliminación física y definitiva del paralelo <strong className="text-sky-400 font-mono">{modalEliminarParalelo.codigo}</strong>?
            </p>
            <div className="text-[11px] text-red-200 bg-red-950/40 p-3 rounded-lg border border-red-800/60 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                ADVERTENCIA IRREVERSIBLE
              </p>
              <p>
                Esta acción eliminará permanentemente el paralelo y sus asignaciones docentes de la base de datos. Solo es permitida si el paralelo está inactivo y no tiene estudiantes matriculados.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalEliminarParalelo(null)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminarParalelo}
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
