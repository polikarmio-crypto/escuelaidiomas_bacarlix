'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Layers,
  BookOpen,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ChevronRight,
  FolderTree,
  Languages,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

export default function EstructuraAcademicaPage() {
  const { esJefeAcademico, esAdmin, rolConfig } = useAuthRole();
  const puedeGestionar = esJefeAcademico || esAdmin;

  const [loading, setLoading] = useState(false);
  const [programas, setProgramas] = useState<any[]>([]);
  const [idiomas, setIdiomas] = useState<any[]>([]);
  const [tiposPrograma, setTiposPrograma] = useState<any[]>([]);
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);

  const [programaSeleccionado, setProgramaSeleccionado] = useState<any | null>(null);
  const [nivelSeleccionado, setNivelSeleccionado] = useState<any | null>(null);

  const [formProg, setFormProg] = useState({
    nombre: '',
    id_idioma: '',
    id_tipo_programa: '',
    duracion: 1,
  });
  const [formNivel, setFormNivel] = useState({
    numero: 1,
    nombre: '',
    cantidad_libros: 6,
  });
  const [formLibro, setFormLibro] = useState({
    numero: 1,
    nombre: '',
  });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resProg, resCat] = await Promise.all([
        fetch('http://localhost:8000/api/v1/estructura/programas'),
        fetch('http://localhost:8000/api/v1/catalogos'),
      ]);
      if (resProg.ok) {
        const dataProg = await resProg.json();
        setProgramas(dataProg || []);
        if (dataProg.length > 0 && !programaSeleccionado) {
          setProgramaSeleccionado(dataProg[0]);
          if (dataProg[0].niveles?.length > 0) {
            setNivelSeleccionado(dataProg[0].niveles[0]);
          }
        }
      }
      if (resCat.ok) {
        const dataCat = await resCat.json();
        setIdiomas(dataCat.idiomas || []);
        setTiposPrograma(dataCat.tipos_programa || []);
        if (dataCat.idiomas?.length > 0) setFormProg((f) => ({ ...f, id_idioma: dataCat.idiomas[0].id_idioma }));
        if (dataCat.tipos_programa?.length > 0) setFormProg((f) => ({ ...f, id_tipo_programa: dataCat.tipos_programa[0].id_tipo_programa }));
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

  const mostrarMensaje = (tipo: 'ok' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 6000);
  };

  const handleCrearPrograma = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/v1/estructura/programas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_programa: formProg.nombre,
          id_idioma: formProg.id_idioma,
          id_tipo_programa: formProg.id_tipo_programa,
          duracion_anios_programa: formProg.duracion,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear programa');
      mostrarMensaje('ok', data.message);
      setFormProg({ ...formProg, nombre: '' });
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleCrearNivel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programaSeleccionado) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/estructura/niveles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_programa: programaSeleccionado.id_programa,
          numero_nivel: formNivel.numero,
          nombre_nivel: formNivel.nombre,
          cantidad_libros_nivel: formNivel.cantidad_libros,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear nivel');
      mostrarMensaje('ok', data.message);
      setFormNivel({ numero: formNivel.numero + 1, nombre: '', cantidad_libros: 6 });
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleCrearLibro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nivelSeleccionado) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/estructura/libros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_nivel: nivelSeleccionado.id_nivel,
          numero_libro: formLibro.numero,
          nombre_libro: formLibro.nombre,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al asignar libro');
      mostrarMensaje('ok', data.message);
      setFormLibro({ numero: formLibro.numero + 1, nombre: '' });
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  if (!puedeGestionar) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-8 text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-neutral-300 max-w-xl mx-auto">
            La creación de la malla curricular, niveles y asignación de libros corresponde exclusivamente al{' '}
            <strong className="text-sky-400">Jefe Académico</strong>.
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
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm shrink-0">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
              <span>SACA</span>
              <span>/</span>
              <span className="text-sky-400 font-semibold">Estructura Académica</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              Malla Curricular y Contenidos
            </h1>
          </div>
        </div>
        <button
          onClick={cargarDatos}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar Malla
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-sky-400" />
              1. Programas ({programas.length})
            </h3>
          </div>

          <form onSubmit={handleCrearPrograma} className="space-y-2 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800 text-xs">
            <input
              type="text"
              placeholder="Nombre del programa (ej: Inglés Militar)"
              value={formProg.nombre}
              onChange={(e) => setFormProg({ ...formProg, nombre: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={formProg.id_idioma}
                onChange={(e) => setFormProg({ ...formProg, id_idioma: e.target.value })}
                className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-white"
              >
                {idiomas.map((i) => (
                  <option key={i.id_idioma} value={i.id_idioma}>{i.nombre_idioma}</option>
                ))}
              </select>
              <select
                value={formProg.id_tipo_programa}
                onChange={(e) => setFormProg({ ...formProg, id_tipo_programa: e.target.value })}
                className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-white"
              >
                {tiposPrograma.map((tp) => (
                  <option key={tp.id_tipo_programa} value={tp.id_tipo_programa}>{tp.nombre_tipo_programa}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition"
            >
              + Crear Programa
            </button>
          </form>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {programas.map((p) => {
              const selected = programaSeleccionado?.id_programa === p.id_programa;
              return (
                <div
                  key={p.id_programa}
                  onClick={() => {
                    setProgramaSeleccionado(p);
                    setNivelSeleccionado(p.niveles?.[0] || null);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                    selected
                      ? 'bg-sky-950/40 border-sky-500/60 shadow-sm'
                      : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{p.nombre_programa}</h4>
                    <p className="text-[11px] text-neutral-400">
                      {p.idioma?.nombre_idioma} • {p.tipo_programa?.nombre_tipo_programa || p.tipoPrograma?.nombre_tipo_programa}
                    </p>
                    <span className="text-[10px] text-sky-400 font-mono">
                      {p.niveles?.length || 0} niveles configurados
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${selected ? 'text-sky-400' : 'text-neutral-600'}`} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              2. Niveles de: <span className="text-sky-400 truncate max-w-[140px]">{programaSeleccionado?.nombre_programa || 'Seleccione'}</span>
            </h3>
          </div>

          {programaSeleccionado ? (
            <>
              <form onSubmit={handleCrearNivel} className="space-y-2 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="N° Nivel"
                    value={formNivel.numero}
                    onChange={(e) => setFormNivel({ ...formNivel, numero: parseInt(e.target.value) || 1 })}
                    className="bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Cant. Libros"
                    value={formNivel.cantidad_libros}
                    onChange={(e) => setFormNivel({ ...formNivel, cantidad_libros: parseInt(e.target.value) || 6 })}
                    className="bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Nombre nivel (ej: Básico 1 / Nivel 1)"
                  value={formNivel.nombre}
                  onChange={(e) => setFormNivel({ ...formNivel, nombre: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition"
                >
                  + Añadir Nivel Secuencial
                </button>
              </form>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {(programaSeleccionado.niveles || []).map((n: any) => {
                  const selected = nivelSeleccionado?.id_nivel === n.id_nivel;
                  return (
                    <div
                      key={n.id_nivel}
                      onClick={() => setNivelSeleccionado(n)}
                      className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                        selected
                          ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                          : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          Nivel {n.numero_nivel}: {n.nombre_nivel}
                        </h4>
                        <p className="text-[11px] text-neutral-400">
                          {n.libros?.length || 0} de {n.cantidad_libros_nivel} libros asignados
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${selected ? 'text-emerald-400' : 'text-neutral-600'}`} />
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-xs text-neutral-500">Seleccione un programa a la izquierda.</p>
          )}
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              3. Libros de: <span className="text-emerald-400 truncate max-w-[140px]">{nivelSeleccionado?.nombre_nivel || 'Seleccione'}</span>
            </h3>
          </div>

          {nivelSeleccionado ? (
            <>
              <form onSubmit={handleCrearLibro} className="space-y-2 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="N°"
                    value={formLibro.numero}
                    onChange={(e) => setFormLibro({ ...formLibro, numero: parseInt(e.target.value) || 1 })}
                    className="bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Título del Libro (ej: Book 1)"
                    value={formLibro.nombre}
                    onChange={(e) => setFormLibro({ ...formLibro, nombre: e.target.value })}
                    className="col-span-2 bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs transition"
                >
                  + Asignar Libro al Nivel
                </button>
              </form>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {(nivelSeleccionado.libros || []).map((lib: any) => (
                  <div
                    key={lib.id_libro}
                    className="p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono text-[10px] font-bold">
                        {lib.numero_libro}
                      </span>
                      <span className="font-semibold text-white">{lib.nombre_libro}</span>
                    </div>
                  </div>
                ))}
                {(nivelSeleccionado.libros || []).length === 0 && (
                  <p className="text-xs text-neutral-500 p-2">No hay libros asignados aún a este nivel.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-neutral-500">Seleccione un nivel al medio.</p>
          )}
        </div>
      </div>
    </div>
  );
}
