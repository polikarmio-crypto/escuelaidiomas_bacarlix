'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LucideIcon,
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  ClipboardEdit,
  Award,
  Landmark,
  Package,
  Menu,
  X,
  Shield,
  Sun,
  Moon,
  Eye,
  Type,
  Lock,
  User,
  LogOut,
  ChevronRight,
  CheckCircle,
  FileText,
  KeyRound,
  ShieldAlert,
  UserCheck,
  LineChart,
  Database,
  FolderTree,
  Globe,
  ArrowLeft,
  ArrowRight,
  Home,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { useAuthRole, RolUsuario, ROLES_CONFIG } from '@/context/AuthRoleContext';

export interface InfoRol {
  id: RolUsuario;
  titulo: string;
  badge: string;
  nombrePorDefecto: string;
  emailPorDefecto: string;
  pinSeguridad: string;
  palabraClave: string;
  descripcion: string;
  color: string;
  rutasPermitidas: string[];
}

const EMAIL_PREFIX_TO_ROLE: Record<string, RolUsuario> = {
  'admin': 'ADMIN',
  'jef':   'JEFE_ACADEMICO',
  'doc':   'DOCENTE',
  'caj':   'CAJERO',
  'alm':   'ALMACENERO',
  'est':   'ESTUDIANTE',
};

function detectarRolPorEmail(email: string): RolUsuario {
  const emailLower = email.toLowerCase().trim();
  try {
    if (typeof window !== 'undefined') {
      const regList = JSON.parse(localStorage.getItem('eie_registered_users') || '[]');
      const found = regList.find((u: any) => u.email && u.email.toLowerCase() === emailLower);
      if (found && found.rol && ROLES_CONFIG[found.rol as RolUsuario]) {
        return found.rol as RolUsuario;
      }
    }
  } catch (e) {}

  for (const [prefix, rol] of Object.entries(EMAIL_PREFIX_TO_ROLE)) {
    if (
      emailLower.startsWith(`${prefix}.`) ||
      emailLower.startsWith(`${prefix}@`) ||
      emailLower.startsWith(`${prefix}_`) ||
      emailLower.startsWith(`${prefix}-`) ||
      emailLower.includes(prefix)
    ) {
      return rol;
    }
  }
  return 'ESTUDIANTE';
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/catalogos', label: 'Catálogos Base', icon: Database },
  { href: '/estructura', label: 'Estructura Académica', icon: FolderTree },
  { href: '/docentes', label: 'Docentes', icon: GraduationCap },
  { href: '/estudiantes', label: 'Estudiantes', icon: Users },
  { href: '/paralelos', label: 'Paralelos', icon: Layers },
  { href: '/inscripciones', label: 'Inscripciones', icon: ClipboardEdit },
  { href: '/calificaciones', label: 'Calificaciones', icon: Award },
  { href: '/cajas', label: 'Cajas y Recaudaciones', icon: Landmark },
  { href: '/almacen', label: 'Almacén de Libros', icon: Package },
  { href: '/metodos-numericos', label: 'Analítica y Métodos', icon: LineChart },
];

export type ThemeMode = 'dark' | 'light' | 'high-contrast';
export type TextScale = 'normal' | 'medium' | 'large';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const { data: session, status } = useSession();
  const [demoAuth, setDemoAuth] = useState(false);
  const isAuthenticated = status === 'authenticated' || demoAuth;
  const isAuthenticating = status === 'loading';
  const [authStep, setAuthStep] = useState<string>('');
  const [authTab, setAuthTab] = useState<'login' | 'registro'>('login');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginEmailError, setLoginEmailError] = useState<string | null>(null);

  const [regForm, setRegForm] = useState({
    nombres: '',
    apellidos: '',
    ci: '',
    expedido: 'LP',
    telefono: '',
    rol: 'ESTUDIANTE' as RolUsuario,
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const { rolActivo, rolConfig, esAdmin, cambiarRol } = useAuthRole();

  const [modalCambioRol, setModalCambioRol] = useState(false);
  const [rolObjetivo, setRolObjetivo] = useState<RolUsuario | null>(null);
  const [pinIngresado, setPinIngresado] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eie_theme') as ThemeMode;
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'high-contrast')) {
        return saved;
      }
    }
    return 'light';
  });
  const [fontSize, setFontSize] = useState<TextScale>('normal');

  const cambiarTema = (nuevoTema: ThemeMode) => {
    setTheme(nuevoTema);
    try {
      localStorage.setItem('eie_theme', nuevoTema);
      document.documentElement.setAttribute('data-theme', nuevoTema);
      if (nuevoTema === 'dark' || nuevoTema === 'high-contrast') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [transPhase, setTransPhase] = useState<'idle' | 'entering' | 'holding' | 'leaving'>('idle');
  const [transLabel, setTransLabel] = useState<string>('');
  const [TransIcon, setTransIcon] = useState<LucideIcon | null>(null);
  const prevPathRef = useRef(pathname);
  const expectedPathname = useRef<string | null>(null);

  const navItems = ALL_NAV_ITEMS.filter((item) => rolConfig.rutasPermitidas.includes(item.href));

  useEffect(() => {
    if (transPhase === 'entering' || transPhase === 'holding') {
      const failsafe = setTimeout(() => {
        setTransPhase('leaving');
        setTimeout(() => setTransPhase('idle'), 180);
      }, 1200);
      return () => clearTimeout(failsafe);
    }
  }, [transPhase]);

  const handleNavClick = (e: React.MouseEvent, item: NavItem) => {
    if (pathname === item.href) {
      e.preventDefault();
      setMobileMenuOpen(false);
      return;
    }
    e.preventDefault();
    setMobileMenuOpen(false);

    setTransLabel(item.label);
    setTransIcon(() => item.icon);
    setTransPhase('entering');
    expectedPathname.current = item.href;

    router.push(item.href);
  };

  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    if (transPhase !== 'idle') {
      setTransPhase('leaving');
      const timer = setTimeout(() => {
        setTransPhase('idle');
        expectedPathname.current = null;
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-font-size', fontSize);
    if (theme === 'dark' || theme === 'high-contrast') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, fontSize]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthStep('Redirigiendo a autenticación institucional con Google...');
    signIn('google');
  };

  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('eie_auth');
      const savedRole = localStorage.getItem('eie_role');
      const savedEmail = localStorage.getItem('eie_email');
      if (savedAuth === 'true') {
        setDemoAuth(true);
        if (savedRole && ROLES_CONFIG[savedRole as RolUsuario]) {
          cambiarRol(savedRole as RolUsuario);
        }
        if (savedEmail) {
          setLoginEmail(savedEmail);
        }
      }
    } catch (e) {
    }
  }, []);

  const triggerCurtain = (label: string, icon: LucideIcon, onMidpoint: () => void) => {
    setTransLabel(label);
    setTransIcon(() => icon);
    setTransPhase('entering');

    setTimeout(() => {
      onMidpoint();
      setTransPhase('leaving');
    }, 300);

    setTimeout(() => {
      setTransPhase('idle');
    }, 650);
  };

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginEmailError(null);

    const emailTrim = loginEmail.trim();
    if (!emailTrim || emailTrim.length < 3) {
      setLoginEmailError('Por favor ingrese su correo electrónico institucional o registrado.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setLoginEmailError('El formato de correo no es válido (ej: usuario@idiomas.ejercito.mil.bo).');
      return;
    }
    if (!loginPassword || loginPassword.length < 4) {
      setLoginEmailError('Por favor ingrese su contraseña institucional (mínimo 4 caracteres).');
      return;
    }

    const rolDetectado = detectarRolPorEmail(emailTrim);
    const config = ROLES_CONFIG[rolDetectado];
    triggerCurtain(`Acceso Concedido: ${config.titulo}`, Shield, () => {
      cambiarRol(rolDetectado);
      setDemoAuth(true);

      try {
        localStorage.setItem('eie_auth', 'true');
        localStorage.setItem('eie_role', rolDetectado);
        localStorage.setItem('eie_email', emailTrim);
      } catch (err) {}
    });
  };

  const handleRegistroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const nombresTrim = regForm.nombres.trim();
    if (!nombresTrim || nombresTrim.length < 3) {
      errors.nombres = 'El nombre debe tener al menos 3 caracteres (no se permite una sola letra).';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombresTrim)) {
      errors.nombres = 'El campo nombres solo debe admitir letras.';
    }

    const apellidosTrim = regForm.apellidos.trim();
    if (!apellidosTrim || apellidosTrim.length < 3) {
      errors.apellidos = 'Los apellidos deben tener al menos 3 caracteres.';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(apellidosTrim)) {
      errors.apellidos = 'El campo apellidos solo debe admitir letras.';
    }

    const ciTrim = regForm.ci.trim();
    if (!ciTrim || ciTrim.length < 5 || ciTrim.length > 10) {
      errors.ci = 'La Cédula de Identidad debe tener entre 5 y 10 dígitos numéricos.';
    } else if (!/^\d+$/.test(ciTrim)) {
      errors.ci = 'El C.I. solo admite dígitos numéricos.';
    }

    const telTrim = regForm.telefono.trim();
    if (!telTrim || telTrim.length !== 8) {
      errors.telefono = 'El teléfono celular debe contener exactamente 8 dígitos.';
    } else if (!/^\d+$/.test(telTrim)) {
      errors.telefono = 'El teléfono solo admite dígitos numéricos.';
    }

    const emailTrim = regForm.email.trim();
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      errors.email = 'Ingrese una dirección de correo electrónico válida.';
    }

    if (!regForm.password || regForm.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (regForm.password !== regForm.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }

    setRegErrors({});
    try {
      const regList = JSON.parse(localStorage.getItem('eie_registered_users') || '[]');
      regList.push({
        nombres: nombresTrim,
        apellidos: apellidosTrim,
        ci: `${ciTrim} ${regForm.expedido}`,
        telefono: telTrim,
        email: emailTrim,
        rol: regForm.rol,
        fecha: new Date().toISOString(),
      });
      localStorage.setItem('eie_registered_users', JSON.stringify(regList));
    } catch (err) {}

    setRegSuccess('¡Cuenta registrada exitosamente! Ahora puede iniciar sesión con sus credenciales.');
    setLoginEmail(emailTrim);
    setLoginPassword(regForm.password);
    setTimeout(() => {
      setAuthTab('login');
      setRegSuccess(null);
    }, 1800);
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      const rolDetectado = detectarRolPorEmail(session.user.email);
      if (rolDetectado) {
        cambiarRol(rolDetectado);
      }
    }
  }, [status, session]);

  const handleLogout = () => {
    triggerCurtain('Cierre de Sesión Operativa', LogOut, () => {
      setDemoAuth(false);
      setLoginEmail('');
      setLoginEmailError(null);
      try {
        localStorage.removeItem('eie_auth');
        localStorage.removeItem('eie_role');
        localStorage.removeItem('eie_email');
      } catch (e) {}
      signOut({ redirect: false });
      router.push('/');
    });
  };

  const handleSeleccionarRol = (targetRol: RolUsuario) => {
    cambiarRol(targetRol);
    setModalCambioRol(false);
    setRolObjetivo(null);
    setPinError(null);
    setPinIngresado('');
  };

  const handleConfirmarPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rolObjetivo) return;

    const config = ROLES_CONFIG[rolObjetivo];
    const valorLimpio = pinIngresado.trim().toUpperCase();

    if (valorLimpio === config.pinSeguridad) {
      cambiarRol(rolObjetivo);
      setModalCambioRol(false);
      setRolObjetivo(null);
      setPinIngresado('');
      setPinError(null);
    } else {
      setPinError(`PIN de seguridad incorrecto para ${config.titulo}.`);
    }
  };

  if (pathname === '/') {
    return (
      <>
        {transPhase !== 'idle' && (
          <div
            className={`military-curtain-backdrop curtain-${transPhase}`}
            onClick={() => setTransPhase('idle')}
            title="Haz clic para continuar de inmediato"
          >
            <div className="military-curtain-panel">
              <div className="curtain-tactical-grid" />
              <div className="curtain-hud-corner curtain-hud-top-left" />
              <div className="curtain-hud-corner curtain-hud-top-right" />
              <div className="curtain-hud-corner curtain-hud-bottom-left" />
              <div className="curtain-hud-corner curtain-hud-bottom-right" />
              <div className="curtain-core">
                <div className="curtain-radar-ring">
                  <div className="curtain-radar-dial" />
                  <div className="curtain-radar-dial-inner" />
                  <div className="curtain-emblem-badge">
                    <img src="/images/logos/logo-eie.png" alt="EIE" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                  </div>
                </div>
                <div className="curtain-module-tag">Sistema Académico EIE</div>
                <h2 className="curtain-module-title">{transLabel}</h2>
                <div className="curtain-divider-gold" />
                <p className="curtain-institution">Escuela de Idiomas del Ejército &bull; CEDMIL</p>
                <div className="curtain-status-indicator">
                  <div className="curtain-status-dot" />
                  <span>CARGANDO...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {children}
      </>
    );
  }

  return (
    <div>
      {!isAuthenticated ? (
        <div className="login-screen-wrapper">
          <div className="login-card animate-solemn-fade" style={{ maxWidth: '580px', width: '100%' }}>
            <div className="tricolor-stripe" />

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <img
                src="/images/logos/logo-eie.png"
                alt="Logo EIE"
                style={{
                  width: 56,
                  height: 56,
                  margin: '0 auto 0.5rem',
                  objectFit: 'contain',
                }}
              />
              <h2 className="font-solemn" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.15rem' }}>
                ESCUELA DE IDIOMAS DEL EJÉRCITO
              </h2>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--military-gold-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Comando de Educación y Doctrina Militar &bull; CEDMIL
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Sistema Académico de Control y Aprendizaje (SACA)
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '1.25rem', background: 'var(--bg-surface-elevated)', padding: '0.3rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setLoginEmailError(null); }}
                className="btn"
                style={{
                  padding: '0.55rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: authTab === 'login' ? '#15803d' : 'transparent',
                  color: authTab === 'login' ? '#ffffff' : 'var(--text-muted)',
                  border: authTab === 'login' ? '1px solid #16a34a' : 'none',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <LogIn size={14} />
                <span>Iniciar Sesión</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('registro'); setRegErrors({}); }}
                className="btn"
                style={{
                  padding: '0.55rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: authTab === 'registro' ? '#b91c1c' : 'transparent',
                  color: authTab === 'registro' ? '#ffffff' : 'var(--text-muted)',
                  border: authTab === 'registro' ? '1px solid #dc2626' : 'none',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <UserPlus size={14} />
                <span>Registrar Nueva Cuenta</span>
              </button>
            </div>

            {isAuthenticating ? (
              <div className="military-loader animate-solemn-fade">
                <div className="military-crest-spinner">
                  <div className="spinner-outer-ring" />
                  <div className="spinner-inner-ring" />
                  <div className="spinner-center-symbol">
                    <img src="/images/logos/logo-eie.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Autenticando en Servidor Militar...
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--military-gold-primary)' }}>
                    {authStep}
                  </p>
                </div>
              </div>
            ) : authTab === 'login' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-solemn-fade">
                <form onSubmit={handleDemoLogin} style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem' }}>
                      Correo Institucional o Registrado *
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => { setLoginEmail(e.target.value); setLoginEmailError(null); }}
                      placeholder="usuario@idiomas.ejercito.mil.bo o su correo registrado"
                      className="input"
                      required
                      autoFocus
                      style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem' }}>
                      Contraseña Institucional *
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => { setLoginPassword(e.target.value); setLoginEmailError(null); }}
                      placeholder="Contraseña de acceso"
                      className="input"
                      required
                      style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem' }}
                    />
                  </div>

                  {loginEmailError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171', fontSize: '0.75rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <AlertCircle size={15} style={{ flexShrink: 0 }} />
                      <span>{loginEmailError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-bolivia-green"
                    style={{ width: '100%', padding: '0.7rem', fontWeight: 700, fontSize: '0.82rem', marginTop: '0.3rem' }}
                  >
                    <UserCheck size={16} /> Ingresar al Sistema SACA
                  </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.1rem 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    O Autenticación con Google Workspace
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                </div>

                <form onSubmit={handleLoginSubmit}>
                  <button
                    type="submit"
                    className="btn"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: '#ffffff',
                      color: '#3c4043',
                      border: '1px solid #dadce0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      fontWeight: 600,
                      borderRadius: '6px'
                    }}
                  >
                    <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                    <span>Ingresar con Google (Cuenta Institucional)</span>
                  </button>
                </form>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    &ldquo;Subordinación y Constancia &bull; ¡Viva Bolivia hacia el mar!&rdquo;
                  </p>
                </div>
              </div>
            ) : (
              <div className="animate-solemn-fade">
                <form onSubmit={handleRegistroSubmit} style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  {regSuccess && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.75rem', padding: '0.6rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                      <span>{regSuccess}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                        Nombres *
                      </label>
                      <input
                        type="text"
                        value={regForm.nombres}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
                          setRegForm({ ...regForm, nombres: val });
                          if (regErrors.nombres) setRegErrors({ ...regErrors, nombres: '' });
                        }}
                        placeholder="Sus nombres completos"
                        className="input"
                        required
                        style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }}
                      />
                      {regErrors.nombres && (
                        <span style={{ color: '#f87171', fontSize: '0.68rem', display: 'block', marginTop: '0.2rem' }}>
                          {regErrors.nombres}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        value={regForm.apellidos}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
                          setRegForm({ ...regForm, apellidos: val });
                          if (regErrors.apellidos) setRegErrors({ ...regErrors, apellidos: '' });
                        }}
                        placeholder="Sus apellidos"
                        className="input"
                        required
                        style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }}
                      />
                      {regErrors.apellidos && (
                        <span style={{ color: '#f87171', fontSize: '0.68rem', display: 'block', marginTop: '0.2rem' }}>
                          {regErrors.apellidos}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                        Cédula de Identidad (C.I.) *
                      </label>
                      <input
                        type="text"
                        value={regForm.ci}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setRegForm({ ...regForm, ci: val });
                          if (regErrors.ci) setRegErrors({ ...regErrors, ci: '' });
                        }}
                        placeholder="Solo números (ej: 6849201)"
                        className="input"
                        required
                        style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem', fontFamily: 'monospace' }}
                      />
                      {regErrors.ci && (
                        <span style={{ color: '#f87171', fontSize: '0.68rem', display: 'block', marginTop: '0.2rem' }}>
                          {regErrors.ci}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                        Expedido
                      </label>
                      <select
                        value={regForm.expedido}
                        onChange={(e) => setRegForm({ ...regForm, expedido: e.target.value })}
                        className="input"
                        style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }}
                      >
                        {['LP', 'CB', 'SC', 'OR', 'PT', 'TJ', 'CH', 'BE', 'PA'].map((dep) => (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                        Teléfono WhatsApp *
                      </label>
                      <input
                        type="tel"
                        value={regForm.telefono}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                          setRegForm({ ...regForm, telefono: val });
                          if (regErrors.telefono) setRegErrors({ ...regErrors, telefono: '' });
                        }}
                        placeholder="8 dígitos (ej: 71928401)"
                        className="input"
                        required
                        style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem', fontFamily: 'monospace' }}
                      />
                      {regErrors.telefono && (
                        <span style={{ color: '#f87171', fontSize: '0.68rem', display: 'block', marginTop: '0.2rem' }}>
                          {regErrors.telefono}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                        Perfil / Condición *
                      </label>
                      <select
                        value={regForm.rol}
                        onChange={(e) => setRegForm({ ...regForm, rol: e.target.value as RolUsuario })}
                        className="input"
                        style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }}
                      >
                        <option value="ESTUDIANTE">Estudiante Civil</option>
                        <option value="ESTUDIANTE">Personal Militar (Estudiante)</option>
                        <option value="DOCENTE">Docente / Catedrático</option>
                        <option value="JEFE_ACADEMICO">Jefatura Académica</option>
                        <option value="CAJERO">Caja / Recaudaciones</option>
                        <option value="ALMACENERO">Almacén y Libros</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      value={regForm.email}
                      onChange={(e) => {
                        setRegForm({ ...regForm, email: e.target.value });
                        if (regErrors.email) setRegErrors({ ...regErrors, email: '' });
                      }}
                      placeholder="ejemplo@gmail.com o correo institucional"
                      className="input"
                      required
                      style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }}
                    />
                    {regErrors.email && (
                      <span style={{ color: '#f87171', fontSize: '0.68rem', display: 'block', marginTop: '0.2rem' }}>
                        {regErrors.email}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                        Contraseña *
                      </label>
                      <input
                        type="password"
                        value={regForm.password}
                        onChange={(e) => {
                          setRegForm({ ...regForm, password: e.target.value });
                          if (regErrors.password) setRegErrors({ ...regErrors, password: '' });
                        }}
                        placeholder="Mínimo 6 caracteres"
                        className="input"
                        required
                        style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }}
                      />
                      {regErrors.password && (
                        <span style={{ color: '#f87171', fontSize: '0.68rem', display: 'block', marginTop: '0.2rem' }}>
                          {regErrors.password}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                        Confirmar Contraseña *
                      </label>
                      <input
                        type="password"
                        value={regForm.confirmPassword}
                        onChange={(e) => {
                          setRegForm({ ...regForm, confirmPassword: e.target.value });
                          if (regErrors.confirmPassword) setRegErrors({ ...regErrors, confirmPassword: '' });
                        }}
                        placeholder="Repita la contraseña"
                        className="input"
                        required
                        style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }}
                      />
                      {regErrors.confirmPassword && (
                        <span style={{ color: '#f87171', fontSize: '0.68rem', display: 'block', marginTop: '0.2rem' }}>
                          {regErrors.confirmPassword}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-bolivia-red"
                    style={{ width: '100%', padding: '0.7rem', fontWeight: 700, fontSize: '0.82rem', marginTop: '0.4rem' }}
                  >
                    <UserPlus size={16} /> Registrar Cuenta Institucional
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="layout">
          <div
            className={`sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="sidebar-logo">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img src="/images/logos/logo-eie.png" alt="EIE" style={{ width: 34, height: 34, objectFit: 'contain' }} />
                </div>
                <div>
                  <p className="font-solemn" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                    EIE &bull; CEDMIL
                  </p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Escuela de Idiomas</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="btn-icon btn-ghost"
                style={{ display: mobileMenuOpen ? 'flex' : 'none' }}
                aria-label="Cerrar navegación"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="sidebar-nav">
              <div
                style={{
                  padding: '0.5rem 0.85rem 0.25rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-dim)',
                  letterSpacing: '0.08em',
                }}
              >
                Módulos del Sistema
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={16} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {isActive && <ChevronRight size={14} />}
                  </Link>
                );
              })}

              <div
                style={{
                  padding: '0.75rem 0.85rem 0.25rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-dim)',
                  letterSpacing: '0.08em',
                  marginTop: '0.5rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                Ajustes & Sistema
              </div>

              <Link
                href="/configuracion"
                onClick={() => setMobileMenuOpen(false)}
                className={`nav-item ${pathname === '/configuracion' ? 'active' : ''}`}
              >
                <Sliders size={16} />
                <span style={{ flex: 1 }}>Configuración & Accesibilidad</span>
                {pathname === '/configuracion' && <ChevronRight size={14} />}
              </Link>
            </nav>

            <div style={{ padding: '0.75rem 0.85rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface-elevated)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--military-green-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                  {(session?.user?.name || rolConfig.nombrePorDefecto).slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session?.user?.name || rolConfig.nombrePorDefecto}
                  </p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session?.user?.email || rolConfig.emailPorDefecto}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--status-danger)', borderColor: 'var(--status-danger)', borderRadius: '8px' }}
                title="Cerrar Sesión y volver al Portal"
              >
                <LogOut size={14} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </aside>

          <div className="main-content">
            <div className="tricolor-stripe" />
            <header className="topbar" style={{ padding: '0.5rem 1.25rem', height: 'auto', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="btn btn-secondary btn-icon"
                  style={{ display: 'none' }}
                  id="mobile-menu-trigger"
                  aria-label="Abrir menú"
                >
                  <Menu size={18} />
                </button>
                <style>{`
                  @media (max-width: 860px) {
                    #mobile-menu-trigger { display: inline-flex !important; }
                  }
                `}</style>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-surface)', padding: '0.2rem 0.35rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem 0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                    title="Página anterior (Atrás)"
                    aria-label="Atrás"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => router.forward()}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem 0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                    title="Página siguiente (Adelante)"
                    aria-label="Adelante"
                  >
                    <ArrowRight size={14} />
                  </button>
                  <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)', margin: '0 0.15rem' }} />
                  <Link
                    href="/dashboard"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem 0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                    title="Inicio SACA"
                    aria-label="Inicio SACA"
                  >
                    <Home size={14} />
                  </Link>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span>SACA</span>
                  <span>/</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 700, textTransform: 'capitalize' }}>
                    {pathname.replace('/', '') || 'Dashboard'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Link
                  href="/configuracion"
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  title="Configurar tema, alto contraste y tamaño de texto"
                >
                  <Sliders size={13} style={{ color: 'var(--military-gold-primary)' }} />
                  <span>Accesibilidad</span>
                </Link>

                <button
                  type="button"
                  onClick={() => cambiarTema(theme === 'light' ? 'dark' : 'light')}
                  className="btn btn-secondary btn-icon"
                  style={{ padding: '0.3rem', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title={`Cambiar a ${theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}`}
                  aria-label="Alternar tema claro y oscuro"
                >
                  {theme === 'light' ? <Sun size={14} style={{ color: '#b8860b' }} /> : <Moon size={14} style={{ color: '#f3c759' }} />}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border-subtle)' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--military-green-primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {(session?.user?.name || rolConfig.nombrePorDefecto).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
                      {session?.user?.name || rolConfig.nombrePorDefecto}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            <main className="page-content">
              <div key={pathname} className="page-transition-wrapper">
                {children}
              </div>
            </main>
          </div>
        </div>
      )}

      {modalCambioRol && esAdmin && (
        <div className="modal-overlay" onClick={() => { setModalCambioRol(false); setRolObjetivo(null); }}>
          <div className="modal-card animate-solemn-fade" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={18} style={{ color: 'var(--military-gold-primary)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Cambio de Rol (Administrador)
                </h3>
              </div>
              <button onClick={() => { setModalCambioRol(false); setRolObjetivo(null); }} className="btn-icon btn-ghost">
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
              Como Administrador del sistema, puede asumir cualquier rol institucional directamente sin verificación adicional.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(Object.keys(ROLES_CONFIG) as RolUsuario[]).map((rolKey) => {
                const rol = ROLES_CONFIG[rolKey];
                const esActual = rolActivo === rolKey;

                return (
                  <div
                    key={rolKey}
                    onClick={() => handleSeleccionarRol(rolKey)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '6px',
                      border: `1px solid ${esActual ? rol.color : 'var(--border-subtle)'}`,
                      background: esActual ? `${rol.color}15` : 'var(--bg-surface-elevated)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: rol.color }}>
                          {rol.titulo}
                        </span>
                        {esActual && (
                          <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '3px', background: rol.color, color: '#fff', fontWeight: 700 }}>
                            ACTUAL
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                        {rol.descripcion}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--status-active)', fontWeight: 600 }}>
                        Acceso Directo ✓
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {transPhase !== 'idle' && TransIcon && (
        <div
          className={`military-curtain-backdrop curtain-${transPhase}`}
          onClick={() => setTransPhase('idle')}
          title="Haz clic para continuar de inmediato"
        >
          <div className="military-curtain-panel">
            <div className="curtain-tactical-grid" />

            <div className="curtain-hud-corner curtain-hud-top-left" />
            <div className="curtain-hud-corner curtain-hud-top-right" />
            <div className="curtain-hud-corner curtain-hud-bottom-left" />
            <div className="curtain-hud-corner curtain-hud-bottom-right" />

            <div className="curtain-core">
              <div className="curtain-radar-ring">
                <div className="curtain-radar-dial" />
                <div className="curtain-radar-dial-inner" />
                <div className="curtain-emblem-badge">
                  <img src="/images/logos/logo-eie.png" alt="EIE" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                </div>
              </div>

              <div className="curtain-module-tag">Sistema Académico EIE</div>

              <h2 className="curtain-module-title">{transLabel}</h2>

              <div className="curtain-divider-gold" />

              <p className="curtain-institution">
                Escuela de Idiomas del Ejército &bull; CEDMIL
              </p>

              <div className="curtain-status-indicator">
                <div className="curtain-status-dot" />
                <span>CARGANDO...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
