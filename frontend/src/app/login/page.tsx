'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Home,
  Shield,
  UserCheck,
  AlertCircle,
  Lock,
  Mail,
  UserPlus,
  CheckCircle2
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

export default function LoginPage() {
  const router = useRouter();
  const { cambiarRol } = useAuthRole();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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
      if (typeof window !== 'undefined' && window.navigator && 'credentials' in window.navigator) {
        try {
          (window.navigator as any).credentials?.preventSilentAccess?.();
        } catch (e) {}
      }
      localStorage.setItem('eie_auth', 'true');
      localStorage.setItem('eie_role', rol);
      localStorage.setItem('eie_email', emailTrim);
      setPassword('');
      cambiarRol(rol);
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
                placeholder="usuario@idiomas.ejercito.mil.bo"
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-lpignore="true"
                data-form-type="other"
                autoFocus
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
                name="military_session_auth_field"
                id="military_session_auth_field"
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

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '1.75rem', paddingTop: '1rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
            &ldquo;Subordinación y Constancia &bull; ¡Viva Bolivia hacia el mar!&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

