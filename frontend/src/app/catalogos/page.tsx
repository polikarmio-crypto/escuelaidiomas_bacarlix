'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Calendar,
  Languages,
  DoorOpen,
  Clock,
  Layers,
  CreditCard,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Edit,
  Save,
  X,
  RefreshCw
} from 'lucide-react';
import { useAuthRole } from '@/context/AuthRoleContext';

type TabCat = 'gestiones' | 'idiomas' | 'aulas' | 'horarios' | 'tipos_programa' | 'modalidades' | 'tipos_pago';

export default function CatalogosPage() {
  const { esAdmin, rolConfig } = useAuthRole();
  const [tab, setTab] = useState<TabCat>('gestiones');
  const [loading, setLoading] = useState(false);
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);

  const [gestiones, setGestiones] = useState<any[]>([]);
  const [idiomas, setIdiomas] = useState<any[]>([]);
  const [aulas, setAulas] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [tiposPrograma, setTiposPrograma] = useState<any[]>([]);
  const [modalidades, setModalidades] = useState<any[]>([]);
  const [tiposPago, setTiposPago] = useState<any[]>([]);

  const [formGestion, setFormGestion] = useState({ anio: new Date().getFullYear(), estado: 'Activa' });
  const [formIdioma, setFormIdioma] = useState({ nombre: '' });
  const [formAula, setFormAula] = useState({ nombre: '', capacidad: 30 });
  const [formHorario, setFormHorario] = useState({ inicio: '08:00', fin: '09:30' });
  const [formTipoProg, setFormTipoProg] = useState({ nombre: '' });
  const [formMod, setFormMod] = useState({ nombre: '' });
  const [formTipoPago, setFormTipoPago] = useState({ nombre: '' });

  const cargarCatalogos = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/catalogos');
      if (res.ok) {
        const data = await res.json();
        setGestiones(data.gestiones || []);
        setIdiomas(data.idiomas || []);
        setAulas(data.aulas || []);
        setHorarios(data.horarios || []);
        setTiposPrograma(data.tipos_programa || []);
        setModalidades(data.modalidades || []);
        setTiposPago(data.tipos_pago || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const mostrarMensaje = (tipo: 'ok' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 6000);
  };

  const handleCrearGestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/v1/catalogos/gestiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anio_gestion: formGestion.anio, estado_gestion: formGestion.estado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar gestión.');
      mostrarMensaje('ok', data.message || 'Gestión registrada exitosamente.');
      cargarCatalogos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleCrearIdioma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIdioma.nombre.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/catalogos/idiomas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_idioma: formIdioma.nombre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar idioma.');
      mostrarMensaje('ok', data.message || 'Idioma registrado con éxito.');
      setFormIdioma({ nombre: '' });
      cargarCatalogos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleCrearAula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAula.nombre.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/catalogos/aulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_aula: formAula.nombre, capacidad_aula: formAula.capacidad }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar aula.');
      mostrarMensaje('ok', data.message || 'Aula registrada.');
      setFormAula({ nombre: '', capacidad: 30 });
      cargarCatalogos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleCrearHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/v1/catalogos/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hora_inicio_horario: formHorario.inicio, hora_fin_horario: formHorario.fin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar franja horaria.');
      mostrarMensaje('ok', data.message || 'Horario registrado.');
      cargarCatalogos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleCrearTipoPrograma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTipoProg.nombre.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/catalogos/tipos-programa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_tipo_programa: formTipoProg.nombre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error.');
      mostrarMensaje('ok', data.message);
      setFormTipoProg({ nombre: '' });
      cargarCatalogos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const handleCrearTipoPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTipoPago.nombre.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/catalogos/tipos-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_tipo_pago: formTipoPago.nombre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error.');
      mostrarMensaje('ok', data.message);
      setFormTipoPago({ nombre: '' });
      cargarCatalogos();
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  const eliminarElemento = async (ruta: string, id: number) => {
    if (!confirm('¿Confirma eliminar este elemento del catálogo base?')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/catalogos/${ruta}/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        mostrarMensaje('ok', 'Elemento eliminado.');
        cargarCatalogos();
      } else {
        const d = await res.json();
        mostrarMensaje('error', d.error || 'No se puede eliminar porque tiene registros asociados.');
      }
    } catch (err: any) {
      mostrarMensaje('error', err.message);
    }
  };

  if (!esAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-8 text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-neutral-300 max-w-xl mx-auto">
            Este apartado corresponde exclusivamente al <strong className="text-amber-400">Administrador del Sistema</strong>.
            Tu rol activo es <span className="px-2 py-0.5 rounded bg-neutral-800 text-sky-400 font-semibold">{rolConfig.titulo}</span>.
          </p>
          <p className="text-xs text-neutral-400">
            Para gestionar gestiones, idiomas, aulas, horarios y tipos de pago, inicie sesión con la cuenta de Administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
              <span>SACA</span>
              <span>/</span>
              <span className="text-amber-400 font-semibold">Catálogos</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              Parametrizaciones Generales
            </h1>
          </div>
        </div>
        <button
          onClick={cargarCatalogos}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar Catálogos
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

      <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-3">
        {[
          { id: 'gestiones', label: 'Gestiones Anuales', icon: Calendar, count: gestiones.length },
          { id: 'idiomas', label: 'Idiomas Ofertados', icon: Languages, count: idiomas.length },
          { id: 'aulas', label: 'Aulas y Capacidad', icon: DoorOpen, count: aulas.length },
          { id: 'horarios', label: 'Horarios / Turnos', icon: Clock, count: horarios.length },
          { id: 'tipos_programa', label: 'Tipos de Programa', icon: Layers, count: tiposPrograma.length },
          { id: 'tipos_pago', label: 'Tipos de Pago / Aranceles', icon: CreditCard, count: tiposPago.length },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as TabCat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                active
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-neutral-950 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-400" />
            {tab === 'gestiones' && 'Añadir Gestión Académica'}
            {tab === 'idiomas' && 'Añadir Idioma Ofertado'}
            {tab === 'aulas' && 'Añadir Aula / Ambiente'}
            {tab === 'horarios' && 'Añadir Franja Horaria'}
            {tab === 'tipos_programa' && 'Añadir Tipo de Programa'}
            {tab === 'tipos_pago' && 'Añadir Concepto de Pago'}
          </h3>


          {tab === 'gestiones' && (
            <form onSubmit={handleCrearGestion} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-300 block mb-1">Año de la Gestión</label>
                <input
                  type="number"
                  min="2020"
                  max="2040"
                  value={formGestion.anio}
                  onChange={(e) => setFormGestion({ ...formGestion, anio: parseInt(e.target.value) || 2026 })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-neutral-300 block mb-1">Estado</label>
                <select
                  value={formGestion.estado}
                  onChange={(e) => setFormGestion({ ...formGestion, estado: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="Activa">Activa</option>
                  <option value="Cerrada">Cerrada</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition"
              >
                Guardar Gestión
              </button>
            </form>
          )}

          {tab === 'idiomas' && (
            <form onSubmit={handleCrearIdioma} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-300 block mb-1">Nombre del Idioma</label>
                <input
                  type="text"
                  placeholder="Ej: Italiano, Ruso..."
                  value={formIdioma.nombre}
                  onChange={(e) => setFormIdioma({ nombre: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition"
              >
                Guardar Idioma
              </button>
            </form>
          )}

          {tab === 'aulas' && (
            <form onSubmit={handleCrearAula} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-300 block mb-1">Nombre o Código del Aula</label>
                <input
                  type="text"
                  placeholder="Ej: Aula 104 - Pabellón A"
                  value={formAula.nombre}
                  onChange={(e) => setFormAula({ ...formAula, nombre: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-neutral-300 block mb-1">Capacidad Máxima (Aforo)</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={formAula.capacidad}
                  onChange={(e) => setFormAula({ ...formAula, capacidad: parseInt(e.target.value) || 30 })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition"
              >
                Guardar Aula
              </button>
            </form>
          )}

          {tab === 'horarios' && (
            <form onSubmit={handleCrearHorario} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-neutral-300 block mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={formHorario.inicio}
                    onChange={(e) => setFormHorario({ ...formHorario, inicio: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-300 block mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={formHorario.fin}
                    onChange={(e) => setFormHorario({ ...formHorario, fin: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition"
              >
                Guardar Franja Horaria
              </button>
            </form>
          )}

          {tab === 'tipos_programa' && (
            <form onSubmit={handleCrearTipoPrograma} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-300 block mb-1">Tipo de Programa</label>
                <input
                  type="text"
                  placeholder="Ej: Regular, Niños, Intensivo"
                  value={formTipoProg.nombre}
                  onChange={(e) => setFormTipoProg({ nombre: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition"
              >
                Guardar Tipo de Programa
              </button>
            </form>
          )}

          {tab === 'tipos_pago' && (
            <form onSubmit={handleCrearTipoPago} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-300 block mb-1">Concepto / Tipo de Pago</label>
                <input
                  type="text"
                  placeholder="Ej: Matrícula, Mensualidad, Libro"
                  value={formTipoPago.nombre}
                  onChange={(e) => setFormTipoPago({ nombre: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition"
              >
                Guardar Concepto
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Registros en Base de Datos</h3>

          </div>

          {tab === 'gestiones' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Año Gestión</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                {gestiones.map((g) => (
                  <tr key={g.id_gestion} className="hover:bg-neutral-800/40">
                    <td className="p-3 font-mono text-neutral-500">#{g.id_gestion}</td>
                    <td className="p-3 font-bold text-white">{g.anio_gestion}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${g.estado_gestion === 'Activa' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>
                        {g.estado_gestion}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => eliminarElemento('gestiones', g.id_gestion)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'idiomas' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nombre del Idioma</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                {idiomas.map((i) => (
                  <tr key={i.id_idioma} className="hover:bg-neutral-800/40">
                    <td className="p-3 font-mono text-neutral-500">#{i.id_idioma}</td>
                    <td className="p-3 font-bold text-white">{i.nombre_idioma}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => eliminarElemento('idiomas', i.id_idioma)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'aulas' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nombre del Aula</th>
                  <th className="p-3">Capacidad Máx. (Aforo)</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                {aulas.map((a) => (
                  <tr key={a.id_aula} className="hover:bg-neutral-800/40">
                    <td className="p-3 font-mono text-neutral-500">#{a.id_aula}</td>
                    <td className="p-3 font-bold text-white">{a.nombre_aula}</td>
                    <td className="p-3 text-sky-400 font-semibold">{a.capacidad_aula} estudiantes</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => eliminarElemento('aulas', a.id_aula)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'horarios' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Hora Inicio</th>
                  <th className="p-3">Hora Fin</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                {horarios.map((h) => (
                  <tr key={h.id_horario} className="hover:bg-neutral-800/40">
                    <td className="p-3 font-mono text-neutral-500">#{h.id_horario}</td>
                    <td className="p-3 text-white font-mono">{h.hora_inicio_horario}</td>
                    <td className="p-3 text-white font-mono">{h.hora_fin_horario}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => eliminarElemento('horarios', h.id_horario)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'tipos_programa' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nombre del Tipo de Programa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                {tiposPrograma.map((tp) => (
                  <tr key={tp.id_tipo_programa}>
                    <td className="p-3 font-mono text-neutral-500">#{tp.id_tipo_programa}</td>
                    <td className="p-3 font-bold text-white">{tp.nombre_tipo_programa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'tipos_pago' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Concepto / Tipo de Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                {tiposPago.map((tp) => (
                  <tr key={tp.id_tipo_pago}>
                    <td className="p-3 font-mono text-neutral-500">#{tp.id_tipo_pago}</td>
                    <td className="p-3 font-bold text-white">{tp.nombre_tipo_pago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
