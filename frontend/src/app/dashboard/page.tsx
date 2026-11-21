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
      const misParalelosVal = kpis?.docente_personal?.mis_paralelos_count ?? 1;
      const alumnosEnAulaVal = kpis?.docente_personal?.estudiantes_en_aula ?? 18;
      const califPendientesVal = kpis?.docente_personal?.calificaciones_pendientes ?? 0;
      return {
        subtitulo: 'Mis paralelos asignados, control de asistencia y calificaciones.',
        kpiCards: [
          { label: 'Mis Paralelos', value: misParalelosVal, sub: 'Asignados esta gestión', icon: Layers, color: '#10b981' },
          { label: 'Estudiantes en Aula', value: alumnosEnAulaVal, sub: 'En mis cursos asignados', icon: Users, color: '#3b82f6' },
          { label: 'Calificaciones', value: califPendientesVal, sub: 'Pendientes de registro', icon: Award, color: '#f59e0b' },
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
      const misCursosVal = kpis?.estudiante_personal?.mis_cursos_count ?? 0;
      const promedioRaw = kpis?.estudiante_personal?.promedio_general;
      const promedioVal = (promedioRaw !== null && promedioRaw !== undefined && promedioRaw !== '')
        ? promedioRaw
        : '--';
      const asistenciaRaw = kpis?.estudiante_personal?.asistencia_porcentaje;
      const asistenciaVal = (asistenciaRaw !== null && asistenciaRaw !== undefined && misCursosVal > 0)
        ? `${asistenciaRaw}%`
        : '--';
      return {
        subtitulo: 'Tu avance académico, asignaturas cursadas y turnos en caja.',
        kpiCards: [
          { label: 'Mis Cursos', value: misCursosVal, sub: 'Inscritos actualmente', icon: BookOpen, color: '#3b82f6' },
          { label: 'Promedio', value: promedioVal, sub: (promedioRaw !== null && promedioRaw !== undefined && promedioRaw !== '') ? 'General acumulado' : 'Sin materias evaluadas', icon: Star, color: '#f59e0b' },
          { label: 'Asistencia', value: asistenciaVal, sub: misCursosVal > 0 ? 'Asistencia regular' : 'Sin cursos activos', icon: CheckCircle2, color: '#10b981' },
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
      const params = new URLSearchParams();
      if (rolActivo === 'ESTUDIANTE') {
        if (usuario.id_estudiante) {
          params.set('id_estudiante', usuario.id_estudiante.toString());
        }
        if (usuario.email) params.set('email', usuario.email);
        if (usuario.ci) params.set('ci', usuario.ci);
      } else if (rolActivo === 'DOCENTE') {
        const idDoc = usuario.id_docente || 1;
        params.set('id_docente', idDoc.toString());
        if (usuario.email) params.set('email', usuario.email);
      }
      params.set('rol', rolActivo);
      const url = `/api/v1/dashboard?${params.toString()}`;
      const res = await fetch(url);
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
  }, [rolActivo, usuario.id_estudiante, usuario.id_docente, usuario.email]);

  const kpisData = { ...(data?.kpis || {}), estudiante_personal: data?.estudiante_personal, docente_personal: data?.docente_personal };
  const config = getDashboardConfig(rolActivo, kpisData);

  return (
    <div className="w-full max-w-[1550px] mx-auto space-y-6 pb-12" style={{ height: '100%', overflowY: 'auto' }}>
      {/* Encabezado Institucional Táctico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-fine)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[3px] bg-[var(--bg-surface)] border border-[var(--border-fine)] flex items-center justify-center p-1.5 shrink-0 shadow-xs">
            <img
              src="/images/logos/logo-eie.png"
              alt="Logo Escuela de Idiomas del Ejército"
              className="w-full h-full object-contain filter drop-shadow-xs"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="badge-bolivia-tricolor shadow-none text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                <span className="text-[var(--text-main)] font-bold">SACA &bull; CEDMIL</span>
              </span>
              <span className="text-xs font-semibold text-[var(--color-accent)] font-mono">
                Gestión {data?.gestion_activa || '2026'} • Escuela de Idiomas del Ejército
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
              Bienvenido, {usuario.nombre}
            </h1>
            <p className="text-xs text-[var(--text-muted)] max-w-2xl mt-0.5">
              {config.subtitulo}
            </p>
          </div>
        </div>

        <button
          onClick={cargarDashboard}
          disabled={loading}
          className="btn-primary text-xs font-semibold px-4 py-2 rounded-[3px] flex items-center gap-2 transition shrink-0 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* Tira de Ledger KPI Institucional (Reemplazo de Bento Grid) */}
      <div className="border border-[var(--border-fine)] rounded-[3px] bg-[var(--bg-card)] shadow-xs overflow-hidden">
        <div className="bg-[var(--bg-surface)] px-4 py-2 border-b border-[var(--border-fine)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-[1px] bg-[var(--color-accent)]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
              Indicadores de Operación & Rendimiento
            </span>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] hidden sm:inline-block">
            SACA &bull; Registros en Línea
          </span>
        </div>
        <div className={`grid divide-y md:divide-y-0 md:divide-x divide-[var(--border-fine)] ${
          config.kpiCards.length <= 3
            ? 'grid-cols-1 md:grid-cols-3'
            : config.kpiCards.length === 4
            ? 'grid-cols-2 md:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
        }`}>
          {config.kpiCards.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div
                key={i}
                className="p-3.5 bg-[var(--bg-card)] hover:bg-[var(--bg-surface)]/50 transition-colors"
              >
                <div className="flex items-center justify-between text-[var(--text-muted)] mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate font-sans">{kpi.label}</span>
                  <div className="w-5 h-5 rounded-[2px] flex items-center justify-center bg-[var(--bg-surface)] border border-[var(--border-fine)]">
                    <Icon className="w-3 h-3 shrink-0 text-[var(--color-accent)]" />
                  </div>
                </div>
                <p className="text-2xl font-black font-mono text-[var(--text-main)] my-0.5 tracking-tight">
                  {kpi.value}
                </p>
                {kpi.sub && (
                  <span className="text-[11px] text-[var(--text-muted)] font-mono truncate block">
                    {kpi.sub}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Directorio de Módulos Operativos (Reemplazo editorial con orden táctico) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-fine)]">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <FolderTree className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              Módulos del Sistema
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-[2px] bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-fine)] font-mono font-bold">
              {config.modulos.length} disponibles
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono hidden sm:inline-block">
            Régimen de Acceso Académico-Militar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {config.modulos.map((m, idx) => {
            const Icon = m.icon;
            const code = (idx + 1).toString().padStart(2, '0');
            return (
              <Link
                key={m.href}
                href={m.href}
                className="p-3.5 rounded-[3px] border border-[var(--border-fine)] bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] hover:border-[var(--color-accent)] transition-all flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-[var(--color-accent)]">
                      MOD-{code}
                    </span>
                    <div className="w-6 h-6 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-fine)] flex items-center justify-center text-[var(--color-primary)] dark:text-[var(--color-accent)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-[var(--text-main)] text-xs mb-1 group-hover:text-[var(--color-primary)] dark:group-hover:text-[var(--color-accent)] transition truncate">
                    {m.titulo}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[var(--border-fine)] text-[10.5px]">
                  <span className="text-[var(--color-primary)] dark:text-[var(--color-accent)] font-semibold font-mono flex items-center gap-1">
                    Ingresar &rarr;
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-1 group-hover:text-[var(--color-accent)] transition" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Paneles de Expediente, Normativa y Doctrina Institucional */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
        {/* Panel 1: Planes Oficiales */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-fine)] rounded-[3px] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-fine)]">
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              Planes de Idioma Oficiales
            </h3>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">7 Planes</span>
          </div>
          <div className="divide-y divide-[var(--border-fine)]">
            {PLANES_OFICIALES.slice(0, 4).map((p, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                <div>
                  <p className="font-bold text-[var(--text-main)]">{p.nombre}</p>
                  <p className="text-[10.5px] text-[var(--text-muted)] font-mono">{p.niveles}</p>
                </div>
                <span className="text-[10px] font-bold font-mono text-[var(--color-primary)] dark:text-[var(--color-accent)] px-2 py-0.5 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-fine)]">
                  {p.estado}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Específico por Rol */}
        {rolActivo === 'ESTUDIANTE' ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-fine)] rounded-[3px] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-fine)]">
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <BookOpen className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                Mi Asignatura y Horario
              </h3>
              {data?.estudiante_personal?.cursos && data.estudiante_personal.cursos.length > 0 ? (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  Activo ({data.estudiante_personal.cursos.length})
                </span>
              ) : (
                <span className="text-[10px] text-[var(--color-accent)] font-mono font-bold">
                  Sin Cursos
                </span>
              )}
            </div>
            <div className="space-y-2">
              {data?.estudiante_personal?.cursos && data.estudiante_personal.cursos.length > 0 ? (
                data.estudiante_personal.cursos.map((c: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-fine)] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-main)] font-mono">{c.codigo_paralelo} • {c.idioma}</span>
                      <span className="text-[10px] font-bold font-mono text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-[2px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                        {c.estado}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[var(--text-muted)]">{c.nivel} ({c.programa})</p>
                    <div className="pt-1 flex flex-col gap-0.5 text-[10.5px] text-[var(--text-muted)] border-t border-[var(--border-fine)] font-mono">
                      <span><strong>Aula:</strong> {c.aula}</span>
                      <span><strong>Horario:</strong> {c.horario}</span>
                      <span><strong>Docente:</strong> {c.docente}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-[2px] bg-[var(--bg-surface)] border border-dashed border-[var(--border-fine)] text-center space-y-2">
                  <BookOpen className="w-5 h-5 text-[var(--text-muted)] mx-auto" />
                  <p className="text-xs font-semibold text-[var(--text-main)]">
                    Sin asignaturas ni paralelos inscritos actualmente
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                    Acérquese a Ventanilla de Caja para formalizar su matrícula académica y asignación de paralelo curricular.
                  </p>
                  <Link
                    href="/cajas"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold font-mono text-[var(--color-accent)] hover:underline pt-1"
                  >
                    Solicitar Turno en Caja &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : rolActivo === 'DOCENTE' ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-fine)] rounded-[3px] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-fine)]">
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <GraduationCap className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                Mi Asignación y Aula Docente
              </h3>
              <span className="text-[10px] text-[var(--color-accent)] font-mono font-bold">Titular</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-fine)] space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-main)] font-mono">ING-101-A • Inglés</span>
                  <span className="text-[10px] font-bold font-mono text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded-[2px] bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                    En Aula (6 d.)
                  </span>
                </div>
                <p className="text-[10.5px] text-[var(--text-muted)]">Básico A1/A2 • Aula 102 (Pabellón Alfa)</p>
                <div className="pt-1 flex flex-col gap-0.5 text-[10.5px] text-[var(--text-muted)] border-t border-[var(--border-fine)] font-mono">
                  <span><strong>Horario:</strong> 08:30 - 10:00 (Turno Mañana)</span>
                  <span><strong>Estudiantes:</strong> 18 alumnos matriculados</span>
                  <span><strong>Próximo Relevo:</strong> En 9 días pedagógicos</span>
                </div>
              </div>
            </div>
          </div>
        ) : rolActivo === 'JEFE_ACADEMICO' ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-fine)] rounded-[3px] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-fine)]">
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Layers className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                Supervisión Académica y Cursos
              </h3>
              <span className="text-[10px] text-[var(--color-accent)] font-mono font-bold">26 Cursos</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-fine)] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[var(--text-main)]">Rotaciones Obligatorias (15 Días)</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Docentes que alcanzaron el límite de rotación</p>
                </div>
                <span className="text-[11px] font-bold font-mono text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-[2px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  {data?.kpis?.docentes?.alertas_rotacion_15d ?? 1} pendientes
                </span>
              </div>
              <div className="p-2 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-fine)] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[var(--text-main)]">Ocupación Promedio de Paralelos</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Aforo máximo promedio: 30 plazas</p>
                </div>
                <span className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-[2px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  60% cubierto
                </span>
              </div>
            </div>
          </div>
        ) : rolActivo === 'ALMACENERO' ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-fine)] rounded-[3px] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-fine)]">
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Package className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                Control de Textos y Depósito
              </h3>
              <span className="text-[10px] text-[var(--color-accent)] font-mono font-bold">Depósito Central</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-fine)] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[var(--text-main)]">Títulos Bajo Umbral de Reorden</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Requieren orden de reposición de imprenta</p>
                </div>
                <span className="text-[11px] font-bold font-mono text-red-600 dark:text-red-400 px-2 py-0.5 rounded-[2px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                  {data?.kpis?.almacen?.alertas_reorden ?? 12} títulos
                </span>
              </div>
              <div className="p-2 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-fine)] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[var(--text-main)]">Stock Total en Inventario</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Total ejemplares físicos en estantería</p>
                </div>
                <span className="text-[11px] font-bold font-mono text-[var(--color-primary)] dark:text-[var(--color-accent)] px-2 py-0.5 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-fine)]">
                  {data?.kpis?.almacen?.total_unidades ?? 673} unidades
                </span>
              </div>
            </div>
          </div>
        ) : rolActivo === 'CAJERO' ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-fine)] rounded-[3px] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-fine)]">
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Building2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                Ventanillas de Caja Activas
              </h3>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">3 Cajas</span>
            </div>
            <div className="divide-y divide-[var(--border-fine)]">
              {[
                { nombre: 'Ventanilla 1 - Personal Militar', ubicacion: 'Hall Central Bloque A' },
                { nombre: 'Ventanilla 2 - Estudiantes Civiles', ubicacion: 'Hall Central Bloque B' },
                { nombre: 'Ventanilla 3 - Textos y Libros', ubicacion: 'Planta Baja Almacén' },
              ].map((v, i) => (
                <div key={i} className="py-2 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                  <div>
                    <p className="font-bold text-[var(--text-main)]">{v.nombre}</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono">{v.ubicacion}</p>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-[var(--color-primary)] dark:text-[var(--color-accent)] px-2 py-0.5 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-fine)]">
                    Operativa
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[var(--bg-card)] border border-[var(--border-fine)] rounded-[3px] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-fine)]">
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                Panel de Supervisión General
              </h3>
            </div>
            <div className="space-y-2 text-xs text-[var(--text-muted)]">
              <p>Métricas y estado general del sistema SACA CEDMIL operando bajo régimen normal.</p>
            </div>
          </div>
        )}

        {/* Panel 3: Doctrina y Régimen Académico */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-fine)] rounded-[3px] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-fine)]">
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Clock className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              Doctrina y Régimen Académico
            </h3>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">CEDMIL</span>
          </div>
          <div className="text-xs space-y-2 text-[var(--text-muted)]">
            <div className="p-2.5 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-fine)] space-y-1">
              <div className="flex items-center justify-between font-bold text-[var(--text-main)] text-[11px]">
                <span>Rotación Pedagógica Docente</span>
                <span className="text-[var(--color-accent)] font-mono">Cada 15 días</span>
              </div>
              <p className="text-[10.5px] text-[var(--text-muted)]">
                Adaptación continua a acentos internacionales y desarrollo de fluidez auditiva militar.
              </p>
            </div>
            <div className="p-2.5 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-fine)] space-y-1">
              <div className="flex items-center justify-between font-bold text-[var(--text-main)] text-[11px]">
                <span>Certificación Lingüística</span>
                <span className="text-[var(--color-primary)] dark:text-[var(--color-accent)] font-mono">STANAG 6001</span>
              </div>
              <p className="text-[10.5px] text-[var(--text-muted)]">
                Evaluaciones estandarizadas en 4 destrezas: escuchar, hablar, leer y redactar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
