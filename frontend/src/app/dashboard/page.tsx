'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  Layers,
  ClipboardEdit,
  Landmark,
  Package,
  LineChart,
  Database,
  FolderTree,
  Award,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Wallet,
  BookOpen,
  Star,
  BookMarked,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Building2,
  Clock
} from 'lucide-react';
import { useAuthRole, RolUsuario } from '@/context/AuthRoleContext';

interface KpiCard {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  color: string;
}

interface ModuloCard {
  href: string;
  titulo: string;
  desc: string;
  icon: any;
}

const PLANES_OFICIALES = [
  { nombre: 'Plan de Idioma Inglés', codigo: 'ING', niveles: '6 Niveles • STANAG 6001', estado: 'Vigente' },
  { nombre: 'Plan de Idioma Francés', codigo: 'FRA', niveles: '4 Niveles • Cooperación', estado: 'Vigente' },
  { nombre: 'Plan de Idioma Ruso', codigo: 'RUS', niveles: '4 Niveles • Técnico Táctico', estado: 'Vigente' },
  { nombre: 'Plan de Idioma Mandarín', codigo: 'MAN', niveles: '3 Niveles • HSK Acreditado', estado: 'Vigente' },
  { nombre: 'Plan de Idioma Quechua', codigo: 'QUE', niveles: '2 Niveles • Intercultural', estado: 'Vigente' },
  { nombre: 'Plan de Idioma Alemán', codigo: 'ALE', niveles: '3 Niveles • Académico', estado: 'Vigente' },
  { nombre: 'Plan de Idioma Portugués', codigo: 'POR', niveles: '2 Niveles • Mercosur', estado: 'Vigente' },
];

function getDashboardConfig(rol: RolUsuario, kpis: any) {
  switch (rol) {
    case 'ADMIN':
      return {
        subtitulo: 'Visión integral del sistema: gestión institucional, financiera, logística y académica.',
        kpiCards: [
          { label: 'Estudiantes', value: kpis?.estudiantes?.total || 450, sub: `${kpis?.estudiantes?.militares || 280} mil. • ${kpis?.estudiantes?.civiles || 170} civ.`, icon: Users, color: '#10b981' },
          { label: 'Docentes', value: kpis?.docentes?.activos || 22, sub: 'Cuerpo activo', icon: GraduationCap, color: '#3b82f6' },
          { label: 'Paralelos', value: kpis?.paralelos?.activos || 26, sub: 'Aperturados', icon: Layers, color: '#f59e0b' },
          { label: 'Inscripciones', value: kpis?.inscripciones?.activas || 450, sub: 'Matriculados activos', icon: ClipboardEdit, color: '#8b5cf6' },
          { label: 'En Espera Cajas', value: kpis?.cajas?.en_espera || 0, sub: 'En sala de espera', icon: Landmark, color: '#ef4444' },
          { label: 'Stock Textos', value: kpis?.almacen?.total_unidades || 673, sub: `${kpis?.almacen?.alertas_reorden || 12} por reponer`, icon: Package, color: '#64748b' },
        ] as KpiCard[],
        modulos: [
          { href: '/catalogos', titulo: 'Catálogos Base', desc: 'Gestiones, idiomas, horarios, aulas y tipos de pago.', icon: Database },
          { href: '/estructura', titulo: 'Estructura Académica', desc: 'Planes de idioma, niveles y libros de texto asignados.', icon: FolderTree },
          { href: '/docentes', titulo: 'Gestión de Docentes', desc: 'Datos, competencias y rotación pedagógica cada 15 días.', icon: GraduationCap },
          { href: '/estudiantes', titulo: 'Gestión de Estudiantes', desc: 'Expedientes civiles y militares y altas de usuario.', icon: Users },
          { href: '/paralelos', titulo: 'Paralelos', desc: 'Apertura sin cruces de aula y asignación de cátedra.', icon: Layers },
          { href: '/inscripciones', titulo: 'Inscripciones', desc: 'Matriculación formal y avance curricular.', icon: ClipboardEdit },
          { href: '/calificaciones', titulo: 'Calificaciones', desc: 'Actas de evaluación y promedio institucional.', icon: Award },
          { href: '/asistencia', titulo: 'Control de Asistencia', desc: 'Partes de asistencia por paralelo y reportes con previsualización.', icon: UserCheck },
          { href: '/cajas', titulo: 'Cajas y Recaudaciones', desc: 'Atención en ventanilla, turnos convocados y comprobantes.', icon: Landmark },
          { href: '/almacen', titulo: 'Almacén de Libros', desc: 'Inventario, existencias en depósito y órdenes de reposición.', icon: Package },
          { href: '/metodos-numericos', titulo: 'Modelos y Proyecciones', desc: 'Estimación de demanda, capacidad operativa y flujo.', icon: LineChart },
        ] as ModuloCard[],
      };

    case 'JEFE_ACADEMICO':
      return {
        subtitulo: 'Supervisión académica: planes de idiomas, docentes, inscripciones y calificaciones.',
        kpiCards: [
          { label: 'Estudiantes', value: kpis?.estudiantes?.total || 450, sub: 'Total inscritos', icon: Users, color: '#10b981' },
          { label: 'Docentes', value: kpis?.docentes?.activos || 22, sub: 'Activos en gestión', icon: GraduationCap, color: '#3b82f6' },
          { label: 'Paralelos', value: kpis?.paralelos?.activos || 26, sub: 'Cursos vigentes', icon: Layers, color: '#f59e0b' },
          { label: 'Inscripciones', value: kpis?.inscripciones?.activas || 450, sub: 'Matriculados activos', icon: ClipboardEdit, color: '#8b5cf6' },
        ] as KpiCard[],
        modulos: [
          { href: '/estructura', titulo: 'Estructura Académica', desc: 'Planes de idioma, niveles y contenidos.', icon: FolderTree },
          { href: '/docentes', titulo: 'Gestión de Docentes', desc: 'Competencias y rotación pedagógica.', icon: GraduationCap },
          { href: '/estudiantes', titulo: 'Estudiantes', desc: 'Expedientes y filtros por paralelo.', icon: Users },
          { href: '/paralelos', titulo: 'Paralelos', desc: 'Apertura y asignación docente.', icon: Layers },
          { href: '/inscripciones', titulo: 'Inscripciones', desc: 'Matriculación formal y avance.', icon: ClipboardEdit },
          { href: '/calificaciones', titulo: 'Calificaciones', desc: 'Actas y supervisión de notas.', icon: Award },
          { href: '/asistencia', titulo: 'Control de Asistencia', desc: 'Partes de asistencia por paralelo y reportes oficiales.', icon: UserCheck },
          { href: '/metodos-numericos', titulo: 'Modelos y Proyecciones', desc: 'Monitoreo preventivo y rendimiento académico.', icon: LineChart },
        ] as ModuloCard[],
      };

    case 'DOCENTE':
      return {
        subtitulo: 'Mis paralelos asignados, control de asistencia y calificaciones.',
        kpiCards: [
          { label: 'Mis Paralelos', value: kpis?.paralelos?.activos || 2, sub: 'Asignados esta gestión', icon: Layers, color: '#10b981' },
          { label: 'Estudiantes', value: kpis?.estudiantes?.total || 45, sub: 'En mis cursos', icon: Users, color: '#3b82f6' },
          { label: 'Calificaciones', value: kpis?.calificaciones_pendientes || 0, sub: 'Pendientes de registro', icon: Award, color: '#f59e0b' },
        ] as KpiCard[],
        modulos: [
          { href: '/paralelos', titulo: 'Mis Paralelos', desc: 'Consulta tus cursos y horarios asignados.', icon: Layers },
          { href: '/calificaciones', titulo: 'Calificaciones', desc: 'Registra calificaciones bajo normativa institucional.', icon: Award },
          { href: '/asistencia', titulo: 'Control de Asistencia', desc: 'Registra el parte diario de asistencia de tu aula.', icon: UserCheck },
        ] as ModuloCard[],
      };

    case 'CAJERO':
      return {
        subtitulo: 'Atención en ventanilla, cobros de aranceles y comprobantes oficiales.',
        kpiCards: [
          { label: 'En Sala de Espera', value: kpis?.cajas?.en_espera || 0, sub: 'Esperando atención', icon: Timer, color: '#ef4444' },
          { label: 'Atendidos Hoy', value: kpis?.cajas?.atendidas_hoy || 0, sub: 'Turnos completados', icon: CheckCircle2, color: '#10b981' },
          { label: 'Recaudación', value: `Bs ${kpis?.financiero?.ingresos_mes_bs || 375}`, sub: 'Registrado en el periodo', icon: Wallet, color: '#f59e0b' },
        ] as KpiCard[],
        modulos: [
          { href: '/cajas', titulo: 'Cajas y Recaudaciones', desc: 'Llamada a ventanilla, cobros y comprobantes.', icon: Landmark },
        ] as ModuloCard[],
      };

    case 'ALMACENERO':
      return {
        subtitulo: 'Existencias de textos, control de movimientos y órdenes de reposición.',
        kpiCards: [
          { label: 'Stock Total', value: kpis?.almacen?.total_unidades || 673, sub: 'Unidades en depósito', icon: Package, color: '#3b82f6' },
          { label: 'Por Reponer', value: kpis?.almacen?.alertas_reorden || 12, sub: 'Títulos bajo umbral', icon: AlertTriangle, color: '#ef4444' },
          { label: 'Salidas Mes', value: kpis?.almacen?.salidas_mes || 0, sub: 'Entregas por paralelo', icon: BookMarked, color: '#10b981' },
        ] as KpiCard[],
        modulos: [
          { href: '/almacen', titulo: 'Almacén de Libros', desc: 'Inventario, movimientos de depósito y reposición.', icon: Package },
        ] as ModuloCard[],
      };

    case 'ESTUDIANTE':
    default:
      return {
        subtitulo: 'Tu avance académico, asignaturas cursadas y turnos en caja.',
        kpiCards: [
          { label: 'Mis Cursos', value: kpis?.inscripciones?.activas || 1, sub: 'Inscritos actualmente', icon: BookOpen, color: '#3b82f6' },
          { label: 'Promedio', value: kpis?.promedio_general || '84.5', sub: 'General acumulado', icon: Star, color: '#f59e0b' },
          { label: 'Mi Turno', value: kpis?.cajas?.mi_turno || 'Activo', sub: 'Estado de atención', icon: Timer, color: '#10b981' },
        ] as KpiCard[],
        modulos: [
          { href: '/inscripciones', titulo: 'Mis Inscripciones', desc: 'Consulta cursos inscritos y avance curricular.', icon: ClipboardEdit },
          { href: '/calificaciones', titulo: 'Mis Calificaciones', desc: 'Revisa tus calificaciones y desempeño.', icon: Award },
          { href: '/cajas', titulo: 'Turnos en Caja', desc: 'Solicita tu ficha de atención para trámites en ventanilla.', icon: Landmark },
        ] as ModuloCard[],
      };
  }
}

export default function DashboardSacaPage() {
  const { rolActivo, usuario } = useAuthRole();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/dashboard');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  const kpisData = data?.kpis || data;
  const config = getDashboardConfig(rolActivo, kpisData);

  return (
    <div className="w-full max-w-[1550px] mx-auto space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-amber-400/40 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
            <img
              src="/images/logos/logo-eie.png"
              alt="Logo Escuela de Idiomas del Ejército"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="badge-bolivia-tricolor shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                <span className="text-slate-800 dark:text-slate-200">SACA &bull; CEDMIL</span>
              </span>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 font-mono">
                Gestión {data?.gestion_activa || '2026'} • Escuela de Idiomas del Ejército
              </span>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Bienvenido, {usuario.nombre}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
              {config.subtitulo}
            </p>
          </div>
        </div>

        <button
          onClick={cargarDashboard}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg btn-bolivia-green text-white text-xs font-semibold transition shadow-sm shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      <div className={`grid gap-3.5 ${
        config.kpiCards.length <= 3
          ? 'grid-cols-1 sm:grid-cols-3'
          : config.kpiCards.length === 4
          ? 'grid-cols-2 lg:grid-cols-4'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      }`}>
        {config.kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-[#121d2b] border border-slate-200 dark:border-[#24354a] p-3.5 rounded-xl shadow-xs transition hover:border-slate-300 dark:hover:border-[#364d68]"
            >
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold truncate uppercase tracking-wider">{kpi.label}</span>
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-100 dark:bg-neutral-900">
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: kpi.color }} />
                </div>
              </div>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white my-0.5">
                {kpi.value}
              </p>
              {kpi.sub && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                  {kpi.sub}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-amber-500" />
              Módulos del Sistema
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-400 border border-slate-200 dark:border-neutral-800 font-mono font-bold">
              {config.modulos.length} disponibles
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {config.modulos.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="p-4 rounded-xl border bg-white dark:bg-[#121d2b] border-slate-200 dark:border-[#24354a] hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-[#1a2738] transition flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex items-center justify-center text-amber-500 shrink-0 group-hover:scale-105 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-amber-500 transition truncate">
                      {m.titulo}
                    </h3>
                  </div>
                  <p className="text-[11.5px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-neutral-800/60 text-[11px]">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ingresar
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 group-hover:translate-x-1 transition group-hover:text-amber-500" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
        <div className="bg-white dark:bg-[#121d2b] border border-slate-200 dark:border-[#24354a] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Planes de Idioma Oficiales
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">7 Planes</span>
          </div>
          <div className="space-y-2">
            {PLANES_OFICIALES.slice(0, 4).map((p, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-neutral-900/40 border border-slate-100 dark:border-neutral-800/60">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{p.nombre}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{p.niveles}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  {p.estado}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#121d2b] border border-slate-200 dark:border-[#24354a] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              Ventanillas de Caja Activas
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">3 Cajas</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-neutral-900/40 border border-slate-100 dark:border-neutral-800/60">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Ventanilla 1 - Personal Militar</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Hall Central Bloque A</p>
              </div>
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                Operativa
              </span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-neutral-900/40 border border-slate-100 dark:border-neutral-800/60">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Ventanilla 2 - Estudiantes Civiles</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Hall Central Bloque B</p>
              </div>
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                Operativa
              </span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-neutral-900/40 border border-slate-100 dark:border-neutral-800/60">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Ventanilla 3 - Textos y Libros</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Planta Baja Almacén</p>
              </div>
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                Operativa
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121d2b] border border-slate-200 dark:border-[#24354a] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Doctrina y Régimen Académico
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">CEDMIL</span>
          </div>
          <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-neutral-900/40 border border-slate-100 dark:border-neutral-800/60 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                <span>Rotación Pedagógica Docente</span>
                <span className="text-amber-600 dark:text-amber-400">Cada 15 días</span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                Adaptación continua a acentos internacionales y desarrollo de fluidez auditiva militar.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-neutral-900/40 border border-slate-100 dark:border-neutral-800/60 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                <span>Certificación Lingüística</span>
                <span className="text-emerald-600 dark:text-emerald-400">STANAG 6001</span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                Evaluaciones estandarizadas en 4 destrezas: escuchar, hablar, leer y redactar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
