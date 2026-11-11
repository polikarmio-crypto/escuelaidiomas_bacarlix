'use client';

import React, { useState } from 'react';
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
    const rol = detectarRol(emailTrim);

    try {
      let nombreFinal = '';
      let ciFinal = '';
      let idEstFinal: number | null = null;
      let idDocFinal: number | null = null;

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
          const partes = emailTrim.split('@')[0].split(/[._-]/);
          nombreFinal = partes.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        }
      } else if (rol === 'DOCENTE') {
        try {
          const res = await fetch('/api/v1/docentes');
          if (res.ok) {
            const list = await res.json();
            const match = list.find((d: any) => (d.email || d.email_docente || '').toLowerCase() === emailTrim.toLowerCase());
            if (match) {
              idDocFinal = match.id_docente;
              nombreFinal = match.nombre_completo;
              ciFinal = match.ci_docente || '';
            }
          }
        } catch (e) {}
        if (!nombreFinal) {
          nombreFinal = 'Prof. ' + emailTrim.split('@')[0];
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
    <div className="login-screen-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'radial-gradient(ellipse at top, #0c1a12 0%, #060c08 100%)' }}>
      <div className="login-card animate-solemn-fade" style={{ maxWidth: '520px', width: '100%', background: '#121814', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '12px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
          >
            <ArrowLeft size={14} />
            <span>Volver atrás</span>
          </button>
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#d4af37', fontWeight: 600, textDecoration: 'none' }}
          >
            <Home size={14} />
            <span>Volver a la página de inicio</span>
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img
            src="/images/logos/logo-eie.png"
            alt="Escuela de Idiomas del Ejército"
            style={{ width: 64, height: 64, margin: '0 auto 0.75rem', objectFit: 'contain' }}
          />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em', margin: 0 }}>
            ESCUELA DE IDIOMAS DEL EJÉRCITO
          </h1>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d4af37', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
            Comando de Educación y Doctrina Militar &bull; CEDMIL
          </p>
          <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.2rem' }}>
            Sistema Académico de Control y Aprendizaje (SACA)
          </p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" data-form-type="other" noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }} aria-hidden="true">
            <input type="text" name="fake_username_remember" tabIndex={-1} autoComplete="off" />
            <input type="password" name="fake_password_remember" tabIndex={-1} autoComplete="new-password" />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e5e7eb', display: 'block', marginBottom: '0.35rem' }}>
              Correo Electrónico Institucional o Registrado *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                type="email"
                name="institutional_access_identity"
                id="institutional_access_identity"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="ej: est.perez@ejercito.mil.bo o c.ramos@ejercito.mil.bo"
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-form-type="other"
                style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', fontSize: '0.85rem', background: '#0a0f0c', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#ffffff', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e5e7eb', display: 'block', marginBottom: '0.35rem' }}>
              Contraseña de Acceso *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
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
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-form-type="other"
                style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', fontSize: '0.85rem', background: '#0a0f0c', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#ffffff', outline: 'none' }}
              />
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontSize: '0.78rem', padding: '0.6rem 0.8rem', background: 'rgba(239, 68, 68, 0.12)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.8rem', fontWeight: 700, fontSize: '0.88rem', background: '#15803d', border: '1px solid #16a34a', color: '#ffffff', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', transition: 'all 0.2s ease' }}
          >
            <UserCheck size={18} />
            <span>{loading ? 'Accediendo...' : 'Iniciar Sesión Institucional SACA'}</span>
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0 0.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            O Autenticación con Google Workspace
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' }, { prompt: 'select_account' })}
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
            borderRadius: '6px',
            fontSize: '0.85rem',
            cursor: 'pointer'
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

        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#9ca3af' }}>
          <Shield size={14} color="#d4af37" />
          <span>Acceso cifrado y registrado bajo normativa institucional CEDMIL</span>
        </div>
      </div>
    </div>
  );
}
