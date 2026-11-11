'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type RolUsuario =
  | 'ADMIN'
  | 'JEFE_ACADEMICO'
  | 'DOCENTE'
  | 'CAJERO'
  | 'ALMACENERO'
  | 'ESTUDIANTE';

export interface UsuarioActual {
  id: number;
  nombre: string;
  email: string;
  ci: string;
  rol: RolUsuario;
  tituloRol: string;
  subtitulo: string;
  id_estudiante?: number | null;
  id_docente?: number | null;
}

export interface InfoRolConfig {
  id: RolUsuario;
  titulo: string;
  badge: string;
  nombrePorDefecto: string;
  emailPorDefecto: string;
  ciPorDefecto: string;
  pinSeguridad: string;
  descripcion: string;
  color: string;
  rutasPermitidas: string[];
}

export const ROLES_CONFIG: Record<RolUsuario, InfoRolConfig> = {
  ADMIN: {
    id: 'ADMIN',
    titulo: 'Administrador del Sistema',
    badge: 'Administrador del Sistema',
    nombrePorDefecto: 'Cnl. DAEN. Roberto Méndez Silva',
    emailPorDefecto: 'admin@ejercito.mil.bo',
    ciPorDefecto: '3490218 LP',
    pinSeguridad: '9999',
    descripcion: 'Administra los catálogos base del sistema: gestiones, idiomas, aulas y aforos, horarios, modalidades, tipos de programa y tipos de pago.',
    color: '#eab308',
    rutasPermitidas: ['/', '/login', '/dashboard', '/catalogos', '/estructura', '/docentes', '/estudiantes', '/paralelos', '/inscripciones', '/calificaciones', '/asistencia', '/cajas', '/almacen', '/metodos-numericos'],
  },
  JEFE_ACADEMICO: {
    id: 'JEFE_ACADEMICO',
    titulo: 'Jefe Académico',
    badge: 'Jefatura Académica y Curricular',
    nombrePorDefecto: 'Tcnl. DEM. Hugo Banzer Rivera',
    emailPorDefecto: 'jefe.academico@ejercito.mil.bo',
    ciPorDefecto: '2948102 LP',
    pinSeguridad: '5050',
    descripcion: 'Planifica programas, niveles y libros; registra docentes e idiomas; inscribe alumnos validando cupos; apertura paralelos y supervisa actas y exámenes de nivel.',
    color: '#3b82f6',
    rutasPermitidas: ['/', '/login', '/dashboard', '/estructura', '/docentes', '/estudiantes', '/paralelos', '/inscripciones', '/calificaciones', '/asistencia', '/metodos-numericos'],
  },
  DOCENTE: {
    id: 'DOCENTE',
    titulo: 'Docente / Catedrático',
    badge: 'Cuerpo Docente y Evaluación',
    nombrePorDefecto: 'Prof. Fernando Ríos Torrico',
    emailPorDefecto: 'doc.rios@ejercito.mil.bo',
    ciPorDefecto: '4820194 CB',
    pinSeguridad: '1010',
    descripcion: 'Consulta sus paralelos y su cronograma de rotación; registra partes de asistencia y calificaciones bajo normativa institucional.',
    color: '#10b981',
    rutasPermitidas: ['/', '/login', '/dashboard', '/paralelos', '/calificaciones', '/asistencia'],
  },
  CAJERO: {
    id: 'CAJERO',
    titulo: 'Cajero / Ventanilla',
    badge: 'Gestión de Cajas y Recaudaciones',
    nombrePorDefecto: 'Sof. My. David Choquehuanca',
    emailPorDefecto: 'cajero@ejercito.mil.bo',
    ciPorDefecto: '5920148 LP',
    pinSeguridad: '3030',
    descripcion: 'Controla el flujo de atención en ventanilla, atiende turnos convocados, procesa cobros y emite comprobantes oficiales.',
    color: '#f59e0b',
    rutasPermitidas: ['/', '/login', '/dashboard', '/cajas'],
  },
  ALMACENERO: {
    id: 'ALMACENERO',
    titulo: 'Encargado de Almacén',
    badge: 'Almacén e Inventario de Textos',
    nombrePorDefecto: 'Sgto. 2do. Marcelo Justiniano',
    emailPorDefecto: 'almacen@ejercito.mil.bo',
    ciPorDefecto: '6019284 SC',
    pinSeguridad: '4040',
    descripcion: 'Supervisa las existencias físicas de textos, registra movimientos de entrada y salida de depósito y gestiona órdenes de reposición.',
    color: '#ec4899',
    rutasPermitidas: ['/', '/login', '/dashboard', '/almacen'],
  },
  ESTUDIANTE: {
    id: 'ESTUDIANTE',
    titulo: 'Estudiante (Civil / Militar)',
    badge: 'Consultas Académicas y Turnos en Caja',
    nombrePorDefecto: 'Cad. Carlos Fernando Mamani',
    emailPorDefecto: 'est.mamani@ejercito.mil.bo',
    ciPorDefecto: '6849201 LP',
    pinSeguridad: '',
    descripcion: 'Consulta su historial de avance curricular y calificaciones, sus cursos inscritos, y solicita turnos digitales para trámites en ventanilla.',
    color: '#06b6d4',
    rutasPermitidas: ['/', '/login', '/dashboard', '/calificaciones', '/cajas', '/inscripciones'],
  },
};

interface AuthRoleContextType {
  usuario: UsuarioActual;
  autenticado: boolean;
  rolActivo: RolUsuario;
  rolConfig: InfoRolConfig;
  esAdmin: boolean;
  esJefeAcademico: boolean;
  esDocente: boolean;
  esCajero: boolean;
  esAlmacenero: boolean;
  esEstudiante: boolean;
  canAccessRoute: (pathname: string) => boolean;
  cambiarRol: (nuevoRol: RolUsuario) => void;
  iniciarSesion: (datos: Partial<UsuarioActual> & { rol: RolUsuario }) => void;
  cerrarSesion: () => void;
}

const AuthRoleContext = createContext<AuthRoleContextType | undefined>(undefined);

export function AuthRoleProvider({ children }: { children: React.ReactNode }) {
  const [autenticado, setAutenticado] = useState(false);
  const [rolActivo, setRolActivo] = useState<RolUsuario>('ESTUDIANTE');
  const [usuarioPersonalizado, setUsuarioPersonalizado] = useState<Partial<UsuarioActual> | null>(null);

  useEffect(() => {
    try {
      const auth = sessionStorage.getItem('eie_auth');
      const userJson = sessionStorage.getItem('eie_user');
      if (auth === 'true' && userJson) {
        const u = JSON.parse(userJson);
        setAutenticado(true);
        if (u.rol && ROLES_CONFIG[u.rol as RolUsuario]) {
          setRolActivo(u.rol as RolUsuario);
        }
        setUsuarioPersonalizado(u);
      } else {
        setAutenticado(false);
        setUsuarioPersonalizado(null);
      }
    } catch (e) {
      setAutenticado(false);
    }
  }, []);

  const iniciarSesion = (datos: Partial<UsuarioActual> & { rol: RolUsuario }) => {
    setAutenticado(true);
    setRolActivo(datos.rol);
    setUsuarioPersonalizado(datos);
    try {
      sessionStorage.setItem('eie_auth', 'true');
      sessionStorage.setItem('eie_user', JSON.stringify(datos));
      localStorage.removeItem('eie_auth');
      localStorage.removeItem('eie_role');
      localStorage.removeItem('eie_email');
      localStorage.removeItem('eie_rol_activo');
      localStorage.removeItem('eie_registered_users');
    } catch (e) {}
  };

  const cambiarRol = (nuevoRol: RolUsuario) => {
    if (ROLES_CONFIG[nuevoRol]) {
      setRolActivo(nuevoRol);
      setUsuarioPersonalizado((prev) => (prev ? { ...prev, rol: nuevoRol } : null));
      try {
        if (sessionStorage.getItem('eie_auth') === 'true') {
          const userJson = sessionStorage.getItem('eie_user');
          const current = userJson ? JSON.parse(userJson) : {};
          current.rol = nuevoRol;
          sessionStorage.setItem('eie_user', JSON.stringify(current));
        }
      } catch (e) {}
    }
  };

  const cerrarSesion = () => {
    setAutenticado(false);
    setRolActivo('ESTUDIANTE');
    setUsuarioPersonalizado(null);
    try {
      sessionStorage.clear();
      localStorage.removeItem('eie_auth');
      localStorage.removeItem('eie_role');
      localStorage.removeItem('eie_email');
      localStorage.removeItem('eie_rol_activo');
      localStorage.removeItem('eie_registered_users');
    } catch (e) {}
  };

  const rolConfig = ROLES_CONFIG[rolActivo];

  const usuario: UsuarioActual = {
    id: usuarioPersonalizado?.id || 1,
    nombre: usuarioPersonalizado?.nombre || rolConfig.nombrePorDefecto,
    email: usuarioPersonalizado?.email || rolConfig.emailPorDefecto,
    ci: usuarioPersonalizado?.ci || rolConfig.ciPorDefecto,
    rol: rolActivo,
    tituloRol: rolConfig.titulo,
    subtitulo: rolConfig.badge,
    id_estudiante: usuarioPersonalizado?.id_estudiante ?? null,
    id_docente: usuarioPersonalizado?.id_docente ?? null,
  };

  const canAccessRoute = (pathname: string): boolean => {
    if (pathname === '/' || pathname === '/login') return true;
    if (!autenticado) return false;
    return rolConfig.rutasPermitidas.some(
      (r) => r === pathname || (r !== '/' && pathname.startsWith(r))
    );
  };

  return (
    <AuthRoleContext.Provider
      value={{
        usuario,
        autenticado,
        rolActivo,
        rolConfig,
        esAdmin: rolActivo === 'ADMIN',
        esJefeAcademico: rolActivo === 'JEFE_ACADEMICO',
        esDocente: rolActivo === 'DOCENTE',
        esCajero: rolActivo === 'CAJERO',
        esAlmacenero: rolActivo === 'ALMACENERO',
        esEstudiante: rolActivo === 'ESTUDIANTE',
        canAccessRoute,
        cambiarRol,
        iniciarSesion,
        cerrarSesion,
      }}
    >
      {children}
    </AuthRoleContext.Provider>
  );
}

export function useAuthRole() {
  const ctx = useContext(AuthRoleContext);
  if (!ctx) {
    throw new Error('useAuthRole debe ser usado dentro de un AuthRoleProvider');
  }
  return ctx;
}
