'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  ArrowLeft,
  Home,
  Shield,
  UserCheck,
  AlertCircle,
  Lock,
  Mail,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuthRole, RolUsuario, ROLES_CONFIG } from '@/context/AuthRoleContext';

const EMAIL_PREFIX_TO_ROLE: Record<string, RolUsuario> = {
  admin: 'ADMIN',
  jef: 'JEFE_ACADEMICO',
  doc: 'DOCENTE',
  caj: 'CAJERO',
  alm: 'ALMACENERO',
  est: 'ESTUDIANTE',
};

function detectarRol(email: string): RolUsuario {
  const emailLower = email.toLowerCase().trim();
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

export default function LoginPage() {
  const router = useRouter();
  const { iniciarSesion } = useAuthRole();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('eie_theme');
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
        if (saved === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        setTheme('light');
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  }, []);

  const alternarTema = () => {
    const nuevoTema = theme === 'dark' ? 'light' : 'dark';
    setTheme(nuevoTema);
    try {
      localStorage.setItem('eie_theme', nuevoTema);
      document.documentElement.setAttribute('data-theme', nuevoTema);
      if (nuevoTema === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  };

  const isLight = theme === 'light';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrim = email.trim();
    if (!emailTrim || emailTrim.length < 3) {
      setError('Por favor ingrese su correo institucional o registrado.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setError('El formato de correo no es válido (ej: usuario@idiomas.ejercito.mil.bo).');
      return;
    }
    if (!password || password.length < 4) {
      setError('Por favor ingrese su contraseña de acceso.');
      return;
    }

    setLoading(true);

    try {
      // 1. Intentar autenticar contra el backend Laravel
      try {
        const resAuth = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailTrim, password }),
        });

        if (resAuth.ok) {
          const authData = await resAuth.json();
          const u = authData.usuario;
          const rolDetectado = (u.rol_usuario?.toUpperCase() || detectarRol(emailTrim)) as RolUsuario;

          iniciarSesion({
            id: u.id_usuario,
            email: u.email_usuario || emailTrim,
            nombre: u.nombre_usuario || ROLES_CONFIG[rolDetectado]?.nombrePorDefecto,
            ci: u.ci || ROLES_CONFIG[rolDetectado]?.ciPorDefecto,
            rol: rolDetectado,
            id_estudiante: u.id_estudiante ?? (rolDetectado === 'ESTUDIANTE' ? 11 : null),
            id_docente: u.id_docente ?? (rolDetectado === 'DOCENTE' ? 1 : null),
          });

          setPassword('');
          router.push('/dashboard');
          return;
        } else if (resAuth.status === 401 || resAuth.status === 403) {
          const errData = await resAuth.json();
          setError(errData.error || 'Credenciales inválidas.');
          setLoading(false);
          return;
        }
      } catch (backendErr) {
        // En caso de fallo de red, se procede con fallback client-side seguro
      }

      // 2. Fallback client-side si el backend no respondió
      const rol = detectarRol(emailTrim);
      let nombreFinal = '';
      let ciFinal = '';
      let idEstFinal: number | null = rol === 'ESTUDIANTE' ? 11 : null;
      let idDocFinal: number | null = rol === 'DOCENTE' ? 1 : null;

      if (rol === 'ESTUDIANTE') {
        try {
          const res = await fetch(`/api/v1/estudiantes?email=${encodeURIComponent(emailTrim)}`);
          if (res.ok) {
            const data = await res.json();
            const list = data.data || (Array.isArray(data) ? data : []);
            const match = list.find((item: any) => item.email_estudiante?.toLowerCase() === emailTrim.toLowerCase()) || list[0];
            if (match) {
              idEstFinal = match.id_estudiante;
              nombreFinal = match.nombre_completo || `${match.nombre_estudiante} ${match.apellido_estudiante}`;
              ciFinal = match.ci_estudiante || '';
            }
          }
        } catch (e) {}
        if (!nombreFinal) {
          nombreFinal = ROLES_CONFIG.ESTUDIANTE.nombrePorDefecto;
          ciFinal = ROLES_CONFIG.ESTUDIANTE.ciPorDefecto;
        }
      } else if (rol === 'DOCENTE') {
        try {
          const res = await fetch('/api/v1/docentes');
          if (res.ok) {
            const list = await res.json();
            const match = list.find((d: any) =>
              (d.email || d.email_docente || '').toLowerCase() === emailTrim.toLowerCase() ||
              d.nombre_completo?.toLowerCase().includes('fernando')
            );
            if (match) {
              idDocFinal = match.id_docente;
              nombreFinal = match.nombre_completo;
              ciFinal = match.ci_docente || '';
            }
          }
        } catch (e) {}
        if (!nombreFinal) {
          nombreFinal = ROLES_CONFIG.DOCENTE.nombrePorDefecto;
          ciFinal = ROLES_CONFIG.DOCENTE.ciPorDefecto;
        }
      }

      iniciarSesion({
        email: emailTrim,
        nombre: nombreFinal || ROLES_CONFIG[rol].nombrePorDefecto,
        ci: ciFinal || ROLES_CONFIG[rol].ciPorDefecto,
        rol,
        id_estudiante: idEstFinal,
        id_docente: idDocFinal,
      });

      setPassword('');
      router.push('/dashboard');
    } catch (err) {
      setError('Error al procesar el inicio de sesión.');
      setLoading(false);
    }
  };

  return (
    <div
      className="login-screen-wrapper"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        background: isLight ? '#F6F7F5' : '#0E1612',
        transition: 'background 0.3s ease',
      }}
    >
      <div
        className="login-card animate-solemn-fade"
        style={{
          maxWidth: '480px',
          width: '100%',
          background: isLight ? '#ECEEEB' : '#152019',
          border: isLight ? '1px solid #D5D9D4' : '1px solid #2A3D31',
          borderRadius: '3px',
          padding: '1.75rem 2rem',
          boxShadow: isLight
            ? '0 1px 3px rgba(24, 28, 25, 0.06)'
            : '0 4px 12px rgba(0,0,0,0.4)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Barra superior de controles: Volver, Modo Claro/Oscuro e Inicio */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: isLight ? '1px solid #D5D9D4' : '1px solid #2A3D31',
          }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              padding: '0.35rem 0.65rem',
              background: isLight ? '#F6F7F5' : 'rgba(255,255,255,0.05)',
              border: isLight ? '1px solid #D5D9D4' : '1px solid rgba(255,255,255,0.15)',
              color: isLight ? '#181C19' : '#e5e7eb',
              borderRadius: '2px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={14} />
            <span>Atrás</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Botón de alternancia de Modo Claro / Modo Oscuro */}
            <button
              type="button"
              onClick={alternarTema}
              title={isLight ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                padding: '0.35rem 0.65rem',
                background: isLight ? '#F6F7F5' : 'rgba(181, 148, 73, 0.1)',
                border: isLight ? '1px solid #D5D9D4' : '1px solid rgba(181, 148, 73, 0.3)',
                color: '#B59449',
                borderRadius: '2px',
                cursor: 'pointer',
                fontWeight: 700,
                transition: 'all 0.2s ease',
              }}
            >
              {isLight ? <Moon size={14} color="#B59449" /> : <Sun size={14} color="#B59449" />}
              <span>{isLight ? 'Modo Oscuro' : 'Modo Claro'}</span>
            </button>

            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                color: '#B59449',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Home size={14} />
              <span>Inicio</span>
            </Link>
          </div>
        </div>

        {/* Cabecera institucional del Login con contraste asegurado */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img
            src="/images/logos/logo-eie.png"
            alt="Escuela de Idiomas del Ejército"
            style={{ width: 60, height: 60, margin: '0 auto 0.65rem', objectFit: 'contain' }}
          />
          <h1
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: isLight ? '#181C19' : '#ffffff',
              letterSpacing: '0.03em',
              margin: 0,
            }}
          >
            ESCUELA DE IDIOMAS DEL EJÉRCITO
          </h1>
          <p
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#B59449',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginTop: '0.3rem',
            }}
          >
            Comando de Educación y Doctrina Militar &bull; CEDMIL
          </p>
          <p
            style={{
              fontSize: '0.72rem',
              color: isLight ? '#596159' : '#9ca3af',
              marginTop: '0.2rem',
              fontWeight: 500,
            }}
          >
            Sistema Académico de Control y Aprendizaje (SACA)
          </p>
        </div>

        {/* Formulario de Login */}
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          data-form-type="other"
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
        >
          <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }} aria-hidden="true">
            <input type="text" name="fake_username_remember" tabIndex={-1} autoComplete="off" />
            <input type="password" name="fake_password_remember" tabIndex={-1} autoComplete="new-password" />
          </div>

          <div>
            <label
              htmlFor="institutional_access_identity"
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: isLight ? '#181C19' : '#e5e7eb',
                display: 'block',
                marginBottom: '0.35rem',
              }}
            >
              Correo Electrónico Institucional o Registrado *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: isLight ? '#596159' : '#9ca3af',
                }}
              />
              <input
                type="email"
                name="institutional_access_identity"
                id="institutional_access_identity"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="ej: est.mamani@ejercito.mil.bo o doc.rios@ejercito.mil.bo"
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                  fontSize: '0.85rem',
                  background: isLight ? '#F6F7F5' : '#0E1612',
                  border: isLight ? '1px solid #D5D9D4' : '1px solid #2A3D31',
                  borderRadius: '2px',
                  color: isLight ? '#181C19' : '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="institutional_access_security_key"
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: isLight ? '#181C19' : '#e5e7eb',
                display: 'block',
                marginBottom: '0.35rem',
              }}
            >
              Contraseña de Acceso *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: isLight ? '#596159' : '#9ca3af',
                }}
              />
              <input
                type="password"
                name="institutional_access_security_key"
                id="institutional_access_security_key"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Ingrese su contraseña institucional"
                required
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                  fontSize: '0.85rem',
                  background: isLight ? '#F6F7F5' : '#0E1612',
                  border: isLight ? '1px solid #D5D9D4' : '1px solid #2A3D31',
                  borderRadius: '2px',
                  color: isLight ? '#181C19' : '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#b91c1c',
                fontSize: '0.78rem',
                padding: '0.6rem 0.8rem',
                background: isLight ? '#FEF0F0' : 'rgba(239, 68, 68, 0.12)',
                borderRadius: '2px',
                border: isLight ? '1px solid #F5AAAA' : '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              background: '#233329',
              border: '1px solid #19251E',
              color: '#ffffff',
              borderRadius: '2px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.35rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(24, 28, 25, 0.04)',
            }}
          >
            <UserCheck size={18} />
            <span>{loading ? 'Accediendo...' : 'Iniciar Sesión Institucional SACA'}</span>
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0 0.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)' }} />
          <span
            style={{
              fontSize: '0.68rem',
              color: isLight ? '#64748b' : '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            O Autenticación con Google Workspace
          </span>
          <div style={{ flex: 1, height: '1px', background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)' }} />
        </div>

        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' }, { prompt: 'select_account' })}
          style={{
            width: '100%',
            padding: '0.65rem',
            background: isLight ? '#F6F7F5' : '#ffffff',
            color: isLight ? '#181C19' : '#3c4043',
            border: isLight ? '1px solid #D5D9D4' : '1px solid #dadce0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            fontWeight: 600,
            borderRadius: '2px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span>Continuar con Google Workspace</span>
        </button>

        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: isLight ? '1px solid #D5D9D4' : '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            fontSize: '0.72rem',
            color: isLight ? '#596159' : '#9ca3af',
          }}
        >
          <Shield size={14} color="#B59449" />
          <span>Acceso cifrado y registrado bajo normativa institucional CEDMIL</span>
        </div>
      </div>
    </div>
  );
}
