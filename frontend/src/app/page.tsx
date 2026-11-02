'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  Home,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  KeyRound,
  ExternalLink,
  Menu,
  X,
  LogIn
} from 'lucide-react';

export default function IndexPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('eie_theme');
      if (saved === 'dark' || saved === 'light') {
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
    } catch (e) {
      setTheme('light');
    }
  }, []);

  const alternarTema = () => {
    const nuevo = theme === 'light' ? 'dark' : 'light';
    setTheme(nuevo);
    try {
      localStorage.setItem('eie_theme', nuevo);
      document.documentElement.setAttribute('data-theme', nuevo);
      if (nuevo === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  };

  const slides = [
    {
      id: 1,
      titulo: 'Nuevas Inscripciones — American Language Course (ALC)',
      subtitulo: 'Programa integral de capacitación en idioma inglés bajo estándares técnico-militares. Metodología de alta exigencia, textos oficiales ALC y laboratorios multimedia para personal militar y civil.',
      imagen: '/images/carousel/inscripciones-banner.jpg',
      aspect: 'horizontal',
      infoExtra: 'WhatsApp Oficial: 72005358 • Sede Central Estado Mayor General (Miraflores)',
      ctaText: 'Inscribirme en Línea',
      ctaHref: '#inscripciones',
      labelMiniatura: 'Inscripciones II-2026',
    },
    {
      id: 2,
      titulo: 'Docentes Altamente Calificados con Metodología Militar de Precisión',
      subtitulo: 'Te enseñamos a dominar el idioma con metodología de precisión y rotación pedagógica cada 15 días, permitiendo una rápida adaptación a múltiples acentos y fluidez auditiva.',
      imagen: '/images/carousel/docentes-calificados.jpg',
      aspect: 'vertical',
      infoExtra: 'Catedráticos titulados con certificación en lingüística aplicada y preparación STANAG 6001',
      ctaText: 'Ver Plan de 36 Libros',
      ctaHref: '#oferta-academica',
      labelMiniatura: 'Docentes Calificados',
    },
    {
      id: 3,
      titulo: 'Instalaciones Modernas y Aulas Climatizadas en La Paz',
      subtitulo: 'Frontis y dependencias de la Escuela de Idiomas del Ejército en el Cuartel General de Miraflores (Av. Saavedra), ofreciendo ambientes confortables, seguros y disciplinados para el aprendizaje.',
      imagen: '/images/carousel/fachada-escuela.jpg',
      aspect: 'horizontal',
      infoExtra: 'Turnos continuos: Mañanas (07:00), Tardes (14:30), Noches (18:00) y Cursos Sabatinos',
      ctaText: 'Canales y Contacto',
      ctaHref: '#contacto',
      labelMiniatura: 'Sede Central Miraflores',
    },
    {
      id: 4,
      titulo: 'Actos de Graduación y Titulación de Técnico Superior',
      subtitulo: 'Solemne entrega de diplomas en provisión nacional y acreditaciones lingüísticas avaladas por el Comando de Educación y Doctrina Militar (CEDMIL) para profesionales militares y civiles.',
      imagen: '/images/carousel/ceremonia-academica.jpg',
      aspect: 'horizontal',
      infoExtra: 'Régimen académico estructurado en 6 niveles secuenciales y 36 libros continuos',
      ctaText: 'Solicitar Correo Oficial',
      ctaHref: '#correo-institucional',
      labelMiniatura: 'Acto de Graduación',
    },
    {
      id: 5,
      titulo: 'Filial Cochabamba y Despliegue en 9 Sedes a Nivel Nacional',
      subtitulo: 'Presencia académica en La Paz, El Alto, Viacha, Achacachi, Cochabamba, Santa Cruz, Tarija, Uncía y Riberalta. Formando líderes bilingües con el lema institucional "Think Globally, Act Locally".',
      imagen: '/images/carousel/filial-cochabamba.jpg',
      aspect: 'horizontal',
      infoExtra: '"Leaders in Teaching National and Foreign Languages" • Guarniciones Militares de Bolivia',
      ctaText: 'Ver Red de Filiales',
      ctaHref: '#filiales',
      labelMiniatura: 'Filial Cochabamba',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const [formInscripcion, setFormInscripcion] = useState({
    tipo_estudiante: 'Civil' as 'Civil' | 'Militar',
    grado_militar: '',
    unidad_militar: '',
    id_militar_estudiante: '',
    ci_estudiante: '',
    expedido: 'LP',
    nombre_estudiante: '',
    apellido_estudiante: '',
    fecha_nacimiento: '2002-05-15',
    telefono_estudiante: '',
    email_estudiante: '',
    direccion_estudiante: '',
    sede: 'La Paz - Sede Central Miraflores',
    idioma: 'Inglés',
    nivel: 'Nivel 1 (Libros 1 al 6)',
    turno: 'Noche (18:00 - 19:30)',
  });

  const [erroresFormulario, setErroresFormulario] = useState<Record<string, string>>({});

  const [comprobanteInscripcion, setComprobanteInscripcion] = useState<{
    codigo: string;
    nombre: string;
    ci: string;
    idioma: string;
    sede: string;
    fecha: string;
    tipo: string;
  } | null>(null);

  const [errorInscripcion, setErrorInscripcion] = useState<string | null>(null);

  const handleInscripcionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInscripcion(null);
    const errors: Record<string, string> = {};

    const nombres = formInscripcion.nombre_estudiante.trim();
    if (!nombres || nombres.length < 3) {
      errors.nombre_estudiante = 'El nombre debe tener al menos 3 caracteres (no se permite una sola letra).';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombres)) {
      errors.nombre_estudiante = 'El campo nombres solo admite letras y espacios.';
    }

    const apellidos = formInscripcion.apellido_estudiante.trim();
    if (!apellidos || apellidos.length < 3) {
      errors.apellido_estudiante = 'Los apellidos deben tener al menos 3 caracteres.';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(apellidos)) {
      errors.apellido_estudiante = 'El campo apellidos solo admite letras y espacios.';
    }

    const ci = formInscripcion.ci_estudiante.trim();
    if (!ci || ci.length < 5 || ci.length > 10) {
      errors.ci_estudiante = 'La Cédula de Identidad debe tener entre 5 y 10 dígitos numéricos.';
    } else if (!/^\d+$/.test(ci)) {
      errors.ci_estudiante = 'La C.I. solo admite números sin letras.';
    }

    const tel = formInscripcion.telefono_estudiante.trim();
    if (!tel || tel.length !== 8) {
      errors.telefono_estudiante = 'El teléfono WhatsApp debe tener exactamente 8 dígitos.';
    } else if (!/^\d+$/.test(tel)) {
      errors.telefono_estudiante = 'El teléfono solo admite números.';
    }

    const email = formInscripcion.email_estudiante.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email_estudiante = 'Ingrese una dirección de correo electrónico válida.';
    }

    if (formInscripcion.tipo_estudiante === 'Militar') {
      if (!formInscripcion.grado_militar.trim() || formInscripcion.grado_militar.trim().length < 3) {
        errors.grado_militar = 'Indique su grado militar completo (mínimo 3 caracteres).';
      }
      if (!formInscripcion.unidad_militar.trim() || formInscripcion.unidad_militar.trim().length < 3) {
        errors.unidad_militar = 'Indique su unidad o recinto militar (mínimo 3 caracteres).';
      }
    }

    if (Object.keys(errors).length > 0) {
      setErroresFormulario(errors);
      setErrorInscripcion('Por favor corrija los campos marcados en rojo antes de continuar.');
      return;
    }

    setErroresFormulario({});

    const ciCompleto = `${ci} ${formInscripcion.expedido}`;

    try {
      const res = await fetch('http://localhost:8000/api/v1/estudiantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          ci_estudiante: ciCompleto,
          nombre_estudiante: nombres,
          apellido_estudiante: apellidos,
          fecha_nacimiento_estudiante: formInscripcion.fecha_nacimiento || '2000-01-01',
          telefono_estudiante: tel,
          email_estudiante: email,
          direccion_estudiante: formInscripcion.direccion_estudiante.trim() || 'Dirección registrada en preinscripción',
          tipo_estudiante: formInscripcion.tipo_estudiante,
          grado_militar: formInscripcion.tipo_estudiante === 'Militar' ? formInscripcion.grado_militar : null,
          unidad_militar: formInscripcion.tipo_estudiante === 'Militar' ? formInscripcion.unidad_militar : null,
          id_militar_estudiante: formInscripcion.tipo_estudiante === 'Militar' ? formInscripcion.id_militar_estudiante : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al procesar la inscripción en la base de datos');
      }

      const estudianteCreado = data.data || data;
      const codigoMat = estudianteCreado.codigoMatricula || `EIE-2026-${estudianteCreado.id_estudiante || Math.floor(1000 + Math.random() * 9000)}`;

      setComprobanteInscripcion({
        codigo: codigoMat,
        nombre: `${nombres} ${apellidos}`,
        ci: ciCompleto,
        idioma: formInscripcion.idioma,
        sede: formInscripcion.sede,
        fecha: new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' }),
        tipo: formInscripcion.tipo_estudiante,
      });

      setCiBusquedaCorreo(ciCompleto);
    } catch (err: any) {
      setErrorInscripcion(err.message || 'Error de conexión con el servidor institucional');
    }
  };

  const [ciBusquedaCorreo, setCiBusquedaCorreo] = useState('');
  const [resultadoCorreo, setResultadoCorreo] = useState<{
    estudiante: any;
    emailGenerado: string;
    passwordTemporal: string;
    fechaEmision: string;
    yaExistia: boolean;
  } | null>(null);
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const handleSolicitarCorreo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCorreo(null);
    setResultadoCorreo(null);
    setCopiado(false);

    const q = ciBusquedaCorreo.trim();
    if (!q || q.length < 4) {
      setErrorCorreo('Por favor ingrese un número de C.I. o Código de Inscripción válido (al menos 4 caracteres).');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/v1/estudiantes?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('No se pudo verificar la inscripción');
      const json = await res.json();
      const lista = json.data || [];
      const coincidencia = lista.length > 0 ? lista[0] : null;

      if (!coincidencia) {
        setErrorCorreo('No se encontró ninguna inscripción activa con ese documento o código en la base de datos.');
        return;
      }

      const nombres = coincidencia.nombre_estudiante || coincidencia.nombres || '';
      const apellidos = coincidencia.apellido_estudiante || coincidencia.apellidos || '';
      const ci = coincidencia.ci_estudiante || coincidencia.ci || '';

      const primerNombre = (nombres.split(' ')[0] || 'est').toLowerCase().replace(/[^a-z0-9]/g, '');
      const primerApellido = (apellidos.split(' ')[0] || 'militar').toLowerCase().replace(/[^a-z0-9]/g, '');
      const emailOficial = `est.${primerNombre}.${primerApellido}@idiomas.ejercito.mil.bo`;

      const ciNumerico = ci.replace(/\D/g, '').slice(-4) || '2026';
      const passTemporal = `Eie.${ciNumerico}*!`;

      setResultadoCorreo({
        estudiante: coincidencia,
        emailGenerado: emailOficial,
        passwordTemporal: passTemporal,
        fechaEmision: new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' }),
        yaExistia: false,
      });
    } catch (err: any) {
      setErrorCorreo(err.message || 'Error al conectar con la base de datos');
    }
  };

  const handleCopiarCredenciales = () => {
    if (!resultadoCorreo) return;
    const texto = `CUENTA INSTITUCIONAL - ESCUELA DE IDIOMAS DEL EJÉRCITO\nUsuario: ${resultadoCorreo.emailGenerado}\nContraseña Temporal: ${resultadoCorreo.passwordTemporal}\nPortal de Acceso: https://accounts.google.com`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const [tabIdioma, setTabIdioma] = useState<'INGLES' | 'NATIVOS' | 'EXTRANJEROS'>('INGLES');

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'light' ? 'bg-[#f4f6f8] text-[#1e293b]' : 'bg-[#0b131f] text-slate-100'
    }`}>

      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-all ${
        theme === 'light'
          ? 'bg-white/95 border-slate-200 shadow-sm'
          : 'bg-[#0b131f]/95 border-[#24354a] shadow-lg'
      }`}>
        <div className="tricolor-stripe" />
        <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
            
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <a href="#inicio" className="flex items-center gap-2.5 sm:gap-3 group">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border p-1 shadow-sm flex items-center justify-center transition shrink-0 ${
                  theme === 'light' ? 'bg-slate-50 border-amber-400/50' : 'bg-[#121d2b] border-[#b8860b]/60'
                }`}>
                  <img
                    src="/images/logos/logo-eie.png"
                    alt="Escudo de la Escuela de Idiomas del Ejército"
                    className="w-full h-full object-contain filter drop-shadow"
                  />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase whitespace-nowrap ${
                    theme === 'light' ? 'text-[#855810]' : 'text-[#d4af37]'
                  }`}>
                    THINK GLOBALLY, ACT LOCALLY
                  </span>
                  <span className={`text-xs sm:text-sm lg:text-[15px] font-extrabold tracking-tight leading-snug whitespace-nowrap transition ${
                    theme === 'light' ? 'text-[#0f172a] group-hover:text-[#1b4332]' : 'text-white group-hover:text-amber-300'
                  }`}>
                    ESCUELA DE IDIOMAS DEL EJÉRCITO
                  </span>
                  <span className="text-[10px] text-slate-500 hidden md:block whitespace-nowrap">
                    CEDMIL &bull; Bolivia
                  </span>
                </div>
              </a>

              <div className="hidden lg:flex items-center gap-1 ml-1 pl-2.5 border-l border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className={`p-1.5 rounded-lg border transition ${
                    theme === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-[#121d2b] hover:bg-[#1a2738] border-[#24354a] text-slate-300'
                  }`}
                  title="Página anterior (Atrás)"
                  aria-label="Atrás"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => router.forward()}
                  className={`p-1.5 rounded-lg border transition ${
                    theme === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-[#121d2b] hover:bg-[#1a2738] border-[#24354a] text-slate-300'
                  }`}
                  title="Página siguiente (Adelante)"
                  aria-label="Adelante"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <a
                  href="#inicio"
                  className={`p-1.5 rounded-lg border transition ${
                    theme === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-[#121d2b] hover:bg-[#1a2738] border-[#24354a] text-slate-300'
                  }`}
                  title="Volver al Inicio"
                  aria-label="Inicio"
                >
                  <Home className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <nav className={`hidden xl:flex items-center gap-3.5 2xl:gap-6 text-xs font-semibold ${
              theme === 'light' ? 'text-slate-700' : 'text-slate-300'
            }`}>
              <a href="#mision-vision" className="whitespace-nowrap hover:text-amber-600 dark:hover:text-amber-400 transition py-1">Misión</a>
              <a href="#carrusel" className="whitespace-nowrap hover:text-amber-600 dark:hover:text-amber-400 transition py-1">Galería</a>
              <a href="#oferta-academica" className="whitespace-nowrap hover:text-amber-600 dark:hover:text-amber-400 transition py-1">Idiomas</a>
              <a href="#filiales" className="whitespace-nowrap hover:text-amber-600 dark:hover:text-amber-400 transition py-1">Sedes</a>
              <a href="#inscripciones" className="whitespace-nowrap hover:text-amber-600 dark:hover:text-amber-400 transition py-1">Inscripción</a>
              <a href="#correo-institucional" className="whitespace-nowrap hover:text-amber-600 dark:hover:text-amber-400 transition py-1">Correo</a>
              <a href="#contacto" className="whitespace-nowrap hover:text-amber-600 dark:hover:text-amber-400 transition py-1">Contacto</a>
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              
              <button
                type="button"
                onClick={alternarTema}
                className={`p-2 rounded-xl border transition shadow-sm flex items-center justify-center shrink-0 ${
                  theme === 'light'
                    ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                    : 'bg-[#121d2b] border-[#364d68] text-amber-300 hover:bg-[#1a2738]'
                }`}
                title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
                aria-label="Cambiar tema de color"
              >
                {theme === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-600" />
                ) : (
                  <Moon className="w-4 h-4 text-amber-300" />
                )}
              </button>

              <Link
                href="/dashboard"
                className={`hidden sm:inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition shrink-0 ${
                  theme === 'light'
                    ? 'bg-white border-amber-500/40 text-slate-800 hover:bg-slate-100 shadow-sm'
                    : 'bg-[#0f1d33] border-amber-500/40 text-amber-300 hover:bg-[#162a4a]'
                }`}
                title="Iniciar Sesión o Registro"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-500" />
                <span>Ingresar</span>
              </Link>

              <Link
                href="/dashboard"
                className="whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white btn-bolivia-green shadow-sm hover:shadow transition shrink-0"
                title="Acceder a la plataforma SACA"
              >
                <span>Acceder a SACA</span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-200" />
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`xl:hidden p-2 rounded-xl border transition shrink-0 ${
                  theme === 'light' ? 'bg-white border-slate-300 text-slate-700' : 'bg-[#121d2b] border-[#24354a] text-slate-300'
                }`}
                aria-label="Abrir menú de navegación"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className={`xl:hidden border-t py-4 space-y-1.5 animate-solemn-fade ${
              theme === 'light' ? 'bg-white border-slate-200 shadow-lg' : 'bg-[#0b131f] border-[#24354a] shadow-lg'
            }`}>
              <div className="flex items-center gap-2 px-3 pb-2 mb-2 border-b border-slate-200 dark:border-[#24354a]">
                <button
                  type="button"
                  onClick={() => { router.back(); setMobileMenuOpen(false); }}
                  className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Atrás
                </button>
                <button
                  type="button"
                  onClick={() => { router.forward(); setMobileMenuOpen(false); }}
                  className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1"
                >
                  Adelante <ArrowRight className="w-3 h-3" />
                </button>
                <a
                  href="#inicio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1"
                >
                  <Home className="w-3 h-3" /> Inicio
                </a>
                <button
                  type="button"
                  onClick={alternarTema}
                  className="ml-auto px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1"
                >
                  {theme === 'light' ? <Sun className="w-3 h-3 text-amber-600" /> : <Moon className="w-3 h-3 text-amber-300" />}
                  <span>{theme === 'light' ? 'Claro' : 'Oscuro'}</span>
                </button>
              </div>

              <a href="#mision-vision" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-[#121d2b]">Misión y Visión</a>
              <a href="#carrusel" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-[#121d2b]">Galería Institucional</a>
              <a href="#oferta-academica" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-[#121d2b]">Oferta de Idiomas</a>
              <a href="#filiales" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-[#121d2b]">Sedes en Bolivia</a>
              <a href="#inscripciones" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-[#121d2b]">Pre-Inscripción Digital</a>
              <a href="#correo-institucional" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-[#121d2b]">Correo Institucional</a>
              <a href="#contacto" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-[#121d2b]">Contacto</a>
              
              <div className="pt-2 sm:hidden border-t border-slate-200 dark:border-[#24354a]">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#121d2b] border border-slate-300 dark:border-[#364d68]"
                >
                  Ingresar al Sistema
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16 flex-1 w-full">

        <section id="inicio" className={`relative overflow-hidden rounded-3xl border p-6 md:p-10 transition-all ${
          theme === 'light'
            ? 'bg-white border-slate-200 shadow-md'
            : 'bg-[#121d2b] border-[#24354a] shadow-2xl'
        }`}>
          <div className="tricolor-stripe absolute top-0 left-0 right-0" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
            
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="badge-bolivia-tricolor shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                  <span className="w-2 h-2 rounded-full bg-[#15803d]" />
                  <span className="text-slate-800 dark:text-slate-200">Fuerzas Armadas de Bolivia &bull; CEDMIL</span>
                </span>
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#1b4332] dark:text-[#74c69d]">
                  COMANDO DE EDUCACIÓN Y DOCTRINA MILITAR
                </span>
              </div>

              <h1 className={`text-3xl md:text-5xl font-extrabold tracking-tight leading-tight ${
                theme === 'light' ? 'text-[#0f172a]' : 'text-white'
              }`}>
                Excelencia Lingüística para la Soberanía y el Futuro
              </h1>

              <p className={`text-sm md:text-base leading-relaxed max-w-3xl ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-300'
              }`}>
                La Escuela de Idiomas del Ejército es la máxima institución de formación lingüística de las Fuerzas Armadas del Estado Plurinacional de Bolivia. Capacitamos a personal de cuadros militares y ciudadanos civiles bajo rigurosos estándares pedagógicos, rotación docente cada 15 días y certificación internacional STANAG 6001.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#inscripciones"
                  className="px-5 py-3 rounded-xl text-xs md:text-sm font-bold btn-bolivia-red inline-flex items-center gap-2 shadow-md"
                >
                  <span>Inscribirme en Línea (II-2026)</span>
                  <ChevronRight className="w-4 h-4 text-white" />
                </a>

                <a
                  href="#carrusel"
                  className="px-5 py-3 rounded-xl text-xs md:text-sm font-bold btn-bolivia-navy inline-flex items-center gap-2 shadow-sm"
                >
                  <span>Ver Galería y Convocatorias</span>
                </a>

                <a
                  href="#oferta-academica"
                  className="text-xs md:text-sm text-[#15803d] dark:text-[#4ade80] font-bold transition px-2 py-2 hover:underline inline-flex items-center gap-1"
                >
                  <span>Catálogo de 36 Libros</span>
                  <span>&rarr;</span>
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200 dark:border-[#24354a]">
                <div className={`p-3.5 rounded-xl border border-l-4 border-l-[#dc2626] ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0b131f] border-[#24354a]'
                }`}>
                  <p className="text-xl md:text-2xl font-bold font-mono text-[#dc2626] dark:text-[#f87171]">36 Libros</p>
                  <p className="text-xs text-slate-500 font-medium">Plan Continuo ALC</p>
                </div>
                <div className={`p-3.5 rounded-xl border border-l-4 border-l-[#f59e0b] ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0b131f] border-[#24354a]'
                }`}>
                  <p className="text-xl md:text-2xl font-bold font-mono text-[#d97706] dark:text-[#fbbf24]">15 Días</p>
                  <p className="text-xs text-slate-500 font-medium">Rotación Docente</p>
                </div>
                <div className={`p-3.5 rounded-xl border border-l-4 border-l-[#15803d] ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0b131f] border-[#24354a]'
                }`}>
                  <p className="text-xl md:text-2xl font-bold font-mono text-[#15803d] dark:text-[#4ade80]">9 Filiales</p>
                  <p className="text-xs text-slate-500 font-medium">Cobertura Nacional</p>
                </div>
                <div className={`p-3.5 rounded-xl border border-l-4 border-l-[#1e3a8a] ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0b131f] border-[#24354a]'
                }`}>
                  <p className="text-xl md:text-2xl font-bold font-mono text-[#1e3a8a] dark:text-[#60a5fa]">STANAG</p>
                  <p className="text-xs text-slate-500 font-medium">Norma 6001 / TOEFL</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center">
              <div className={`p-6 rounded-2xl border text-center max-w-xs w-full shadow-lg relative overflow-hidden ${
                theme === 'light' ? 'bg-slate-50 border-slate-300' : 'bg-[#0b131f] border-[#24354a]'
              }`}>
                <div className="tricolor-stripe absolute top-0 left-0 right-0" />
                <div className={`w-28 h-28 mx-auto mt-2 mb-4 p-2 rounded-2xl border flex items-center justify-center shadow-md ${
                  theme === 'light' ? 'bg-white border-amber-400/60' : 'bg-[#121d2b] border-[#b8860b]/60'
                }`}>
                  <img
                    src="/images/logos/logo-eie.png"
                    alt="Escudo Oficial de la EIE"
                    className="w-full h-full object-contain filter drop-shadow"
                  />
                </div>
                <h2 className={`text-xs font-bold uppercase tracking-wider ${
                  theme === 'light' ? 'text-slate-800' : 'text-white'
                }`}>
                  ESCUELA DE IDIOMAS DEL EJÉRCITO
                </h2>
                <p className="text-[11px] font-mono mt-1 font-bold text-[#b8860b]">
                  &ldquo;THINK GLOBALLY, ACT LOCALLY&rdquo;
                </p>
                <div className="my-3 h-[1px] bg-slate-200 dark:bg-[#24354a]" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dependiente del Comando de Educación y Doctrina Militar &bull; Formación con disciplina y honor patrio.
                </p>
              </div>
            </div>

          </div>
        </section>

        <section id="carrusel" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#b8860b]">
                Galería y Convocatorias Oficiales
              </p>
              <h2 className={`text-2xl md:text-3xl font-extrabold mt-1 ${
                theme === 'light' ? 'text-[#0f172a]' : 'text-white'
              }`}>
                Nuestra Realidad Institucional en Imágenes
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 mr-2">
                {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
              <button
                onClick={prevSlide}
                className={`p-2.5 rounded-xl border transition shadow-sm ${
                  theme === 'light'
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-[#121d2b] border-[#24354a] text-slate-300 hover:bg-[#1a2738]'
                }`}
                aria-label="Diapositiva anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className={`p-2.5 rounded-xl border transition shadow-sm ${
                  theme === 'light'
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-[#121d2b] border-[#24354a] text-slate-300 hover:bg-[#1a2738]'
                }`}
                aria-label="Siguiente diapositiva"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`rounded-3xl border overflow-hidden transition-all ${
            theme === 'light'
              ? 'bg-white border-slate-200 shadow-md'
              : 'bg-[#121d2b] border-[#24354a] shadow-2xl'
          }`}>
            {slides.map((s, idx) => {
              if (idx !== currentSlide) return null;
              return (
                <div key={s.id} className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch animate-solemn-fade">
                  
                  <div className="lg:col-span-6 p-6 md:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <h3 className={`text-2xl md:text-3xl font-extrabold leading-tight ${
                        theme === 'light' ? 'text-[#0f172a]' : 'text-white'
                      }`}>
                        {s.titulo}
                      </h3>

                      <p className={`text-xs md:text-sm leading-relaxed ${
                        theme === 'light' ? 'text-slate-600' : 'text-slate-300'
                      }`}>
                        {s.subtitulo}
                      </p>

                      <div className={`p-3.5 rounded-xl border text-xs font-mono font-medium ${
                        theme === 'light'
                          ? 'bg-slate-50 border-slate-200 text-[#855810]'
                          : 'bg-[#0b131f] border-[#24354a] text-[#d4af37]'
                      }`}>
                        {s.infoExtra}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <a
                        href={s.ctaHref}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#b8860b] hover:bg-[#c59b27] text-white transition shadow-sm inline-flex items-center gap-2"
                      >
                        <span>{s.ctaText}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href="#contacto"
                        className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition ${
                          theme === 'light'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            : 'bg-[#1a2738] hover:bg-[#223247] text-slate-300 border-[#364d68]'
                        }`}
                      >
                        Consultar en Ventanilla
                      </a>
                    </div>
                  </div>

                  <div className={`lg:col-span-6 border-t lg:border-t-0 lg:border-l relative flex items-center justify-center p-3 md:p-6 min-h-[320px] md:min-h-[440px] ${
                    theme === 'light'
                      ? 'bg-slate-100/70 border-slate-200'
                      : 'bg-[#070d15] border-[#24354a]'
                  }`}>
                    <div className={`w-full h-full max-h-[460px] rounded-2xl overflow-hidden border flex items-center justify-center shadow-sm ${
                      theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0b131f] border-[#24354a]'
                    }`}>
                      <img
                        src={s.imagen}
                        alt={s.titulo}
                        className="w-full h-full object-contain md:object-cover transition-transform duration-700 hover:scale-[1.02]"
                      />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
            {slides.map((slideItem, i) => (
              <button
                key={slideItem.id}
                onClick={() => setCurrentSlide(i)}
                className={`p-2.5 rounded-xl border text-left transition flex items-center gap-3 ${
                  i === currentSlide
                    ? theme === 'light'
                      ? 'border-[#b8860b] bg-amber-50/60 ring-2 ring-[#b8860b]/30 shadow-sm'
                      : 'border-[#b8860b] bg-[#1a2738] ring-2 ring-[#b8860b]/40 shadow-md'
                    : theme === 'light'
                      ? 'border-slate-200 bg-white hover:bg-slate-50 opacity-80 hover:opacity-100'
                      : 'border-[#24354a] bg-[#121d2b]/60 hover:bg-[#121d2b] opacity-75 hover:opacity-100'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border ${
                  theme === 'light' ? 'border-slate-200 bg-slate-100' : 'border-[#24354a] bg-[#0b131f]'
                }`}>
                  <img
                    src={slideItem.imagen}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="overflow-hidden">
                  <span className={`text-xs font-bold truncate block ${
                    theme === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>
                    {slideItem.labelMiniatura}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate block">
                    Escuela de Idiomas
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section id="mision-vision" className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#b8860b]">
              Doctrina Institucional
            </p>
            <h2 className={`text-2xl md:text-3xl font-extrabold ${
              theme === 'light' ? 'text-[#0f172a]' : 'text-white'
            }`}>
              Misión y Visión
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              Pilares estratégicos que fundamentan el liderazgo académico y ético de la Escuela de Idiomas del Ejército.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className={`rounded-2xl border border-t-4 border-t-[#15803d] p-7 shadow-sm transition flex flex-col justify-between ${
              theme === 'light'
                ? 'bg-white border-slate-200 hover:border-[#15803d]'
                : 'bg-[#121d2b] border-[#24354a] hover:border-[#2d6a4f]'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#24354a]">
                  <span className="text-xs font-mono font-bold text-[#15803d] dark:text-[#4ade80] uppercase">
                    Cometido Institucional
                  </span>
                  <span className="text-xs font-mono text-slate-400">Constitución Política</span>
                </div>
                <h3 className={`text-xl md:text-2xl font-bold ${
                  theme === 'light' ? 'text-[#0f172a]' : 'text-white'
                }`}>
                  Misión
                </h3>
                <p className={`text-xs md:text-sm leading-relaxed text-justify ${
                  theme === 'light' ? 'text-slate-600' : 'text-slate-300'
                }`}>
                  La Escuela de Idiomas del Ejército planifica, coordina y desarrolla de forma permanente el sistema de enseñanza y aprendizaje de idiomas extranjeros y nativos en sus distintas filiales en todo el territorio nacional. Su objetivo es capacitar al recurso humano del Ejército y al personal civil con un elevado nivel de dominio lingüístico para satisfacer sus requerimientos y cumplir con la misión educativa del Comando de Institutos Militares y su función constitucional.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-200 dark:border-[#24354a] flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>CEDMIL &bull; Ejército de Bolivia</span>
                <span className="text-[#15803d] dark:text-[#4ade80] font-semibold">Función Constitucional</span>
              </div>
            </div>

            <div className={`rounded-2xl border border-t-4 border-t-[#dc2626] p-7 shadow-sm transition flex flex-col justify-between ${
              theme === 'light'
                ? 'bg-white border-slate-200 hover:border-[#dc2626]'
                : 'bg-[#121d2b] border-[#24354a] hover:border-[#ef4444]'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#24354a]">
                  <span className="text-xs font-mono font-bold text-[#b8860b] uppercase">
                    Horizonte Estratégico
                  </span>
                  <span className="text-xs font-mono text-slate-400">Proyección 2030</span>
                </div>
                <h3 className={`text-xl md:text-2xl font-bold ${
                  theme === 'light' ? 'text-[#0f172a]' : 'text-white'
                }`}>
                  Visión
                </h3>
                <p className={`text-xs md:text-sm leading-relaxed text-justify ${
                  theme === 'light' ? 'text-slate-600' : 'text-slate-300'
                }`}>
                  Es una institución líder y competitiva en la enseñanza de idiomas nativos y extranjeros con excelencia académica, que forma talento humano especializado en lingüística capaz de afrontar los desafíos de un mundo globalizado y competitivo, consolidando además la interculturalidad a través de su personal académico y profesional.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-200 dark:border-[#24354a] flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Liderazgo &bull; Competitividad</span>
                <span className="text-[#b8860b] font-semibold">Interculturalidad y Excelencia</span>
              </div>
            </div>

          </div>
        </section>

        <section id="oferta-academica" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#1b4332] dark:text-[#74c69d]">
                Oferta Formativa
              </p>
              <h2 className={`text-2xl md:text-3xl font-extrabold mt-1 ${
                theme === 'light' ? 'text-[#0f172a]' : 'text-white'
              }`}>
                Catálogo de Idiomas y Programas
              </h2>
            </div>

            <div className={`inline-flex border p-1 rounded-xl text-xs font-semibold ${
              theme === 'light' ? 'bg-slate-100 border-slate-300' : 'bg-[#0b131f] border-[#24354a]'
            }`}>
              <button
                onClick={() => setTabIdioma('INGLES')}
                className={`px-3.5 py-1.5 rounded-lg transition ${
                  tabIdioma === 'INGLES'
                    ? 'bg-[#d97706] text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Inglés ALC (36 Libros)
              </button>
              <button
                onClick={() => setTabIdioma('NATIVOS')}
                className={`px-3.5 py-1.5 rounded-lg transition ${
                  tabIdioma === 'NATIVOS'
                    ? 'bg-[#15803d] text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Lenguas Nativas
              </button>
              <button
                onClick={() => setTabIdioma('EXTRANJEROS')}
                className={`px-3.5 py-1.5 rounded-lg transition ${
                  tabIdioma === 'EXTRANJEROS'
                    ? 'bg-[#b91c1c] text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Idiomas Extranjeros
              </button>
            </div>
          </div>

          {tabIdioma === 'INGLES' && (
            <div className={`border rounded-2xl p-6 md:p-8 space-y-6 shadow-sm ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#121d2b] border-[#24354a]'
            }`}>
              <div className="pb-3 border-b border-slate-200 dark:border-[#24354a]">
                <p className="text-xs font-bold text-[#b8860b] uppercase tracking-wider">
                  Plan Curricular de Inglés
                </p>
                <h3 className={`text-xl md:text-2xl font-bold ${
                  theme === 'light' ? 'text-[#0f172a]' : 'text-white'
                }`}>
                  Inglés Técnico Superior &bull; 36 Libros y 6 Niveles Formativos
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Estructura secuencial con rotación pedagógica cada 15 días y evaluaciones de nivel al completar cada bloque de 6 libros.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { nivel: 'Nivel 1', libros: 'Libros 1 al 6', tit: 'Inglés Elemental / Básico', eval: 'Examen de Nivel en Libro 6', border: 'border-l-4 border-l-[#15803d]' },
                  { nivel: 'Nivel 2', libros: 'Libros 7 al 12', tit: 'Inglés Pre-Intermedio', eval: 'Examen de Nivel en Libro 12', border: 'border-l-4 border-l-[#15803d]' },
                  { nivel: 'Nivel 3', libros: 'Libros 13 al 18', tit: 'Inglés Intermedio', eval: 'Examen de Nivel en Libro 18', border: 'border-l-4 border-l-[#f59e0b]' },
                  { nivel: 'Nivel 4', libros: 'Libros 19 al 24', tit: 'Inglés Intermedio Alto', eval: 'Examen de Nivel en Libro 24', border: 'border-l-4 border-l-[#f59e0b]' },
                  { nivel: 'Nivel 5', libros: 'Libros 25 al 30', tit: 'Inglés Avanzado Profesional', eval: 'Examen de Nivel en Libro 30', border: 'border-l-4 border-l-[#dc2626]' },
                  { nivel: 'Nivel 6', libros: 'Libros 31 al 36', tit: 'Suficiencia & Especialidad Militar', eval: 'Defensa de Grado Técnico Superior', border: 'border-l-4 border-l-[#1e3a8a] dark:border-l-[#38bdf8]' },
                ].map((item, idx) => (
                  <div key={idx} className={`border p-4 rounded-xl space-y-2 ${item.border} ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-[#0b131f] border-[#24354a]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#b8860b]">{item.nivel}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        theme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-[#1a2738] text-slate-300'
                      }`}>
                        {item.libros}
                      </span>
                    </div>
                    <h4 className={`text-sm font-bold ${
                      theme === 'light' ? 'text-slate-800' : 'text-white'
                    }`}>
                      {item.tit}
                    </h4>
                    <p className="text-xs text-slate-500">{item.eval}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tabIdioma === 'NATIVOS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  idioma: 'Aymara',
                  sub: 'Jach\'a Qhana',
                  desc: 'Lengua originaria hablada en la cuenca del Altiplano boliviano. Formación con enfoque comunicativo, gramatical e intercultural.',
                  niveles: 'Básico, Intermedio y Avanzado (6 módulos)',
                },
                {
                  idioma: 'Quechua',
                  sub: 'Runasimi',
                  desc: 'Idioma de los valles interandinos y el sur del país. Enseñanza estructurada con docentes certificados para la integración social.',
                  niveles: 'Básico, Intermedio y Avanzado (6 módulos)',
                },
                {
                  idioma: 'Guaraní',
                  sub: 'Ñe\'ẽ Porã',
                  desc: 'Lengua originaria del Chaco y la Amazonía boliviana. Vocabulario técnico, identidad cultural y aplicación comunitaria.',
                  niveles: 'Básico, Intermedio y Avanzado (6 módulos)',
                },
              ].map((nat, i) => (
                <div key={i} className={`border rounded-2xl p-6 space-y-3 shadow-sm ${
                  theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#121d2b] border-[#24354a]'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-bold ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                      {nat.idioma}
                    </h3>
                    <span className="text-xs font-mono text-slate-500">{nat.sub}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${
                    theme === 'light' ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    {nat.desc}
                  </p>
                  <p className="text-xs text-slate-500 font-mono pt-2 border-t border-slate-200 dark:border-[#24354a]">
                    Estructura: {nat.niveles}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tabIdioma === 'EXTRANJEROS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { lang: 'Portugués', pais: 'Brasil / CPLP', enfoque: 'Integración Regional y Fronteriza' },
                { lang: 'Francés', pais: 'Francia / Francofonía', enfoque: 'Diplomacia y Misiones de Paz ONU' },
                { lang: 'Ruso', pais: 'Federación Rusa', enfoque: 'Cooperación Técnica Militar' },
                { lang: 'Chino Mandarín', pais: 'R.P. China', enfoque: 'Comercio y Relaciones Bilaterales' },
              ].map((ext, idx) => (
                <div key={idx} className={`border p-4 rounded-xl space-y-1.5 ${
                  theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#121d2b] border-[#24354a]'
                }`}>
                  <h4 className={`font-bold text-sm ${
                    theme === 'light' ? 'text-slate-800' : 'text-white'
                  }`}>
                    {ext.lang}
                  </h4>
                  <p className="text-xs font-mono text-[#b8860b]">{ext.pais}</p>
                  <p className="text-xs text-slate-500">{ext.enfoque}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="filiales" className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#b8860b]">
              Presencia Territorial
            </p>
            <h2 className={`text-2xl md:text-3xl font-extrabold ${
              theme === 'light' ? 'text-[#0f172a]' : 'text-white'
            }`}>
              Nuestras 9 Sedes y Filiales en Bolivia
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              Infraestructura académica y laboratorios de idiomas en guarniciones de todo el territorio nacional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { ciudad: 'La Paz (Sede Central)', dir: 'Av. Saavedra Nro. 1420, Miraflores (Cuartel General)', tel: '2-2223401' },
              { ciudad: 'El Alto', dir: 'Ciudad Satélite, Plan 405 (Guarnición Militar El Alto)', tel: '2-2819034' },
              { ciudad: 'Viacha', dir: 'Regimiento de Artillería 1 Cnl. Max Toledo', tel: '2-2801944' },
              { ciudad: 'Achacachi', dir: 'Regimiento de Infantería 8 Ayacucho', tel: '2-2891044' },
              { ciudad: 'Cochabamba', dir: 'Av. Ramón Rivero y Calle Heroínas', tel: '4-4259102' },
              { ciudad: 'Santa Cruz', dir: 'Av. Ejército Nro. 520 (Colegio Militar de Aviación)', tel: '3-3349102' },
              { ciudad: 'Tarija', dir: 'Barrio El Tejar, Av. Las Américas', tel: '4-6649102' },
              { ciudad: 'Uncía (Potosí)', dir: 'Regimiento de Caballería 7 Chichas', tel: '2-5810294' },
              { ciudad: 'Riberalta (Beni)', dir: 'Guarnición Militar de la Amazonía', tel: '3-8529104' },
            ].map((sede, i) => (
              <div key={i} className={`border p-4 rounded-xl space-y-1.5 transition ${
                theme === 'light'
                  ? 'bg-white border-slate-200 hover:border-slate-400'
                  : 'bg-[#121d2b] border-[#24354a] hover:border-slate-500'
              }`}>
                <h4 className={`font-bold text-sm ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {sede.ciudad}
                </h4>
                <p className="text-xs text-slate-500">{sede.dir}</p>
                <p className="text-xs font-mono font-medium text-[#1b4332] dark:text-[#74c69d]">Central: {sede.tel}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="inscripciones" className="space-y-6">
          <div className={`border rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#121d2b] border-[#24354a]'
          }`}>
            <div className="tricolor-stripe absolute top-0 left-0 right-0" />
            <div className="max-w-2xl space-y-1 mb-8 pt-2">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#b8860b]">
                Matriculación Digital II-2026
              </p>
              <h2 className={`text-2xl md:text-3xl font-extrabold ${
                theme === 'light' ? 'text-[#0f172a]' : 'text-white'
              }`}>
                Inscripción en Línea / Pre-Matrícula
              </h2>
              <p className="text-xs md:text-sm text-slate-500">
                Complete el formulario oficial con sus datos verídicos para reservar su cupo en el curso seleccionado.
                Todos los campos cuentan con validación estricta de formato.
              </p>
            </div>

            {comprobanteInscripcion ? (
              <div className={`border-2 rounded-2xl p-6 md:p-8 space-y-5 animate-solemn-fade ${
                theme === 'light'
                  ? 'bg-emerald-50/50 border-emerald-500'
                  : 'bg-[#0b131f] border-[#2d6a4f]'
              }`}>
                <div className="flex items-center gap-3 text-emerald-600 dark:text-[#74c69d]">
                  <CheckCircle2 className="w-8 h-8 shrink-0" />
                  <div>
                    <h3 className={`text-xl font-bold ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                      ¡Pre-Inscripción Registrada Exitosamente!
                    </h3>
                    <p className="text-xs text-slate-500">Su solicitud ha sido asentada en la base de datos de la Escuela de Idiomas del Ejército.</p>
                  </div>
                </div>

                <div className={`border rounded-xl p-5 space-y-4 ${
                  theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#121d2b] border-[#24354a]'
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#24354a] pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <img src="/images/logos/logo-eie.png" alt="Logo" className="w-9 h-9 object-contain" />
                      <div>
                        <p className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                          BOLETA OFICIAL DE PRE-INSCRIPCIÓN
                        </p>
                        <p className="text-xs text-[#b8860b] font-mono">Gestión Académica II-2026</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-mono">CÓDIGO DE TRÁMITE</span>
                      <span className="text-base font-extrabold text-[#1b4332] dark:text-[#74c69d] font-mono">
                        {comprobanteInscripcion.codigo}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Estudiante:</span>
                      <strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>
                        {comprobanteInscripcion.nombre}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Cédula de Identidad:</span>
                      <strong className={`font-mono ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                        {comprobanteInscripcion.ci}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Condición:</span>
                      <strong className="text-[#b8860b]">{comprobanteInscripcion.tipo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Programa / Idioma:</span>
                      <strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>
                        {comprobanteInscripcion.idioma}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Sede Asignada:</span>
                      <strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>
                        {comprobanteInscripcion.sede}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Fecha de Emisión:</span>
                      <strong className="text-slate-500 font-mono">{comprobanteInscripcion.fecha}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#correo-institucional"
                    onClick={() => setCiBusquedaCorreo(comprobanteInscripcion.ci)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1b4332] hover:bg-[#245842] text-white shadow-md inline-flex items-center gap-2"
                  >
                    <span>Proceder a Solicitar mi Correo Institucional</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => setComprobanteInscripcion(null)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-medium border ${
                      theme === 'light'
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        : 'bg-[#1a2738] border-[#364d68] text-slate-300 hover:bg-[#223247]'
                    }`}
                  >
                    Registrar Otra Pre-Inscripción
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInscripcionSubmit} className="space-y-6">
                {errorInscripcion && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{errorInscripcion}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-2">
                    Tipo de Postulante:
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <button
                      type="button"
                      onClick={() => setFormInscripcion({ ...formInscripcion, tipo_estudiante: 'Civil' })}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition ${
                        formInscripcion.tipo_estudiante === 'Civil'
                          ? 'border-[#b8860b] bg-amber-50 dark:bg-[#b8860b]/20 text-amber-900 dark:text-white'
                          : 'border-slate-300 dark:border-[#24354a] text-slate-500'
                      }`}
                    >
                      Estudiante Civil
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormInscripcion({ ...formInscripcion, tipo_estudiante: 'Militar' })}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition ${
                        formInscripcion.tipo_estudiante === 'Militar'
                          ? 'border-[#1b4332] bg-emerald-50 dark:bg-[#1b4332]/40 text-[#1b4332] dark:text-white'
                          : 'border-slate-300 dark:border-[#24354a] text-slate-500'
                      }`}
                    >
                      Personal Militar (FF.AA.)
                    </button>
                  </div>
                </div>

                {formInscripcion.tipo_estudiante === 'Militar' && (
                  <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border ${
                    theme === 'light' ? 'bg-slate-50 border-slate-300' : 'bg-[#0b131f] border-[#2d6a4f]'
                  }`}>
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Grado Militar *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Subteniente de Infantería"
                        value={formInscripcion.grado_militar}
                        onChange={(e) => {
                          setFormInscripcion({ ...formInscripcion, grado_militar: e.target.value });
                          if (erroresFormulario.grado_militar) setErroresFormulario({ ...erroresFormulario, grado_militar: '' });
                        }}
                        required
                        className="w-full input text-xs p-2.5 rounded-lg"
                      />
                      {erroresFormulario.grado_militar && (
                        <span className="text-[11px] text-red-500 mt-1 block">{erroresFormulario.grado_militar}</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Unidad o Recinto Militar *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Regimiento Colorados"
                        value={formInscripcion.unidad_militar}
                        onChange={(e) => {
                          setFormInscripcion({ ...formInscripcion, unidad_militar: e.target.value });
                          if (erroresFormulario.unidad_militar) setErroresFormulario({ ...erroresFormulario, unidad_militar: '' });
                        }}
                        required
                        className="w-full input text-xs p-2.5 rounded-lg"
                      />
                      {erroresFormulario.unidad_militar && (
                        <span className="text-[11px] text-red-500 mt-1 block">{erroresFormulario.unidad_militar}</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Código de Escalafón Militar
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: MIL-INF-2024"
                        value={formInscripcion.id_militar_estudiante}
                        onChange={(e) => setFormInscripcion({ ...formInscripcion, id_militar_estudiante: e.target.value })}
                        className="w-full input text-xs p-2.5 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      placeholder="Sus nombres completos"
                      value={formInscripcion.nombre_estudiante}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
                        setFormInscripcion({ ...formInscripcion, nombre_estudiante: val });
                        if (erroresFormulario.nombre_estudiante) setErroresFormulario({ ...erroresFormulario, nombre_estudiante: '' });
                      }}
                      required
                      className="w-full input text-xs p-2.5 rounded-lg"
                    />
                    {erroresFormulario.nombre_estudiante && (
                      <span className="text-[11px] text-red-500 mt-1 block">{erroresFormulario.nombre_estudiante}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      placeholder="Sus apellidos"
                      value={formInscripcion.apellido_estudiante}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
                        setFormInscripcion({ ...formInscripcion, apellido_estudiante: val });
                        if (erroresFormulario.apellido_estudiante) setErroresFormulario({ ...erroresFormulario, apellido_estudiante: '' });
                      }}
                      required
                      className="w-full input text-xs p-2.5 rounded-lg"
                    />
                    {erroresFormulario.apellido_estudiante && (
                      <span className="text-[11px] text-red-500 mt-1 block">{erroresFormulario.apellido_estudiante}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Cédula de Identidad (C.I.) *
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Solo números"
                        value={formInscripcion.ci_estudiante}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormInscripcion({ ...formInscripcion, ci_estudiante: val });
                          if (erroresFormulario.ci_estudiante) setErroresFormulario({ ...erroresFormulario, ci_estudiante: '' });
                        }}
                        required
                        className="w-full input text-xs p-2.5 rounded-lg font-mono"
                      />
                      <select
                        value={formInscripcion.expedido}
                        onChange={(e) => setFormInscripcion({ ...formInscripcion, expedido: e.target.value })}
                        className="input text-xs p-2 rounded-lg font-mono"
                      >
                        {['LP', 'CB', 'SC', 'OR', 'PT', 'TJ', 'CH', 'BE', 'PA'].map((dep) => (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </select>
                    </div>
                    {erroresFormulario.ci_estudiante && (
                      <span className="text-[11px] text-red-500 mt-1 block">{erroresFormulario.ci_estudiante}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Teléfono WhatsApp *
                    </label>
                    <input
                      type="tel"
                      placeholder="8 dígitos (ej: 71928401)"
                      value={formInscripcion.telefono_estudiante}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                        setFormInscripcion({ ...formInscripcion, telefono_estudiante: val });
                        if (erroresFormulario.telefono_estudiante) setErroresFormulario({ ...erroresFormulario, telefono_estudiante: '' });
                      }}
                      required
                      className="w-full input text-xs p-2.5 rounded-lg font-mono"
                    />
                    {erroresFormulario.telefono_estudiante && (
                      <span className="text-[11px] text-red-500 mt-1 block">{erroresFormulario.telefono_estudiante}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Correo Electrónico Personal *
                    </label>
                    <input
                      type="email"
                      placeholder="ejemplo@gmail.com"
                      value={formInscripcion.email_estudiante}
                      onChange={(e) => {
                        setFormInscripcion({ ...formInscripcion, email_estudiante: e.target.value });
                        if (erroresFormulario.email_estudiante) setErroresFormulario({ ...erroresFormulario, email_estudiante: '' });
                      }}
                      required
                      className="w-full input text-xs p-2.5 rounded-lg"
                    />
                    {erroresFormulario.email_estudiante && (
                      <span className="text-[11px] text-red-500 mt-1 block">{erroresFormulario.email_estudiante}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Dirección Domiciliaria
                    </label>
                    <input
                      type="text"
                      placeholder="Zona, Avenida o Calle"
                      value={formInscripcion.direccion_estudiante}
                      onChange={(e) => setFormInscripcion({ ...formInscripcion, direccion_estudiante: e.target.value })}
                      className="w-full input text-xs p-2.5 rounded-lg"
                    />
                  </div>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0b131f] border-[#24354a]'
                }`}>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-500">
                      Sede o Filial
                    </label>
                    <select
                      value={formInscripcion.sede}
                      onChange={(e) => setFormInscripcion({ ...formInscripcion, sede: e.target.value })}
                      className="w-full input text-xs p-2 rounded-lg"
                    >
                      <option value="La Paz - Sede Central Miraflores">La Paz - Sede Central Miraflores</option>
                      <option value="El Alto - Ciudad Satélite">El Alto - Ciudad Satélite</option>
                      <option value="Viacha - Regimiento Max Toledo">Viacha - Regimiento Max Toledo</option>
                      <option value="Achacachi - Regimiento Ayacucho">Achacachi - Regimiento Ayacucho</option>
                      <option value="Cochabamba - Filial Cbba">Cochabamba - Filial Cbba</option>
                      <option value="Santa Cruz - Colegio Militar de Aviación">Santa Cruz - Colegio Militar de Aviación</option>
                      <option value="Tarija - Filial Tarija">Tarija - Filial Tarija</option>
                      <option value="Uncía - Regimiento Chichas">Uncía - Regimiento Chichas</option>
                      <option value="Riberalta - Guarnición Amazonía">Riberalta - Guarnición Amazonía</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-500">
                      Idioma
                    </label>
                    <select
                      value={formInscripcion.idioma}
                      onChange={(e) => setFormInscripcion({ ...formInscripcion, idioma: e.target.value })}
                      className="w-full input text-xs p-2 rounded-lg"
                    >
                      <option value="Inglés">Inglés (36 Libros)</option>
                      <option value="Aymara">Aymara</option>
                      <option value="Quechua">Quechua</option>
                      <option value="Guaraní">Guaraní</option>
                      <option value="Portugués">Portugués</option>
                      <option value="Francés">Francés</option>
                      <option value="Árabe">Árabe</option>
                      <option value="Chino Mandarín">Chino Mandarín</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-500">
                      Nivel Inicial
                    </label>
                    <select
                      value={formInscripcion.nivel}
                      onChange={(e) => setFormInscripcion({ ...formInscripcion, nivel: e.target.value })}
                      className="w-full input text-xs p-2 rounded-lg"
                    >
                      <option value="Nivel 1 (Libros 1 al 6)">Nivel 1 (Libros 1 al 6)</option>
                      <option value="Nivel 2 (Libros 7 al 12)">Nivel 2 (Libros 7 al 12)</option>
                      <option value="Nivel 3 (Libros 13 al 18)">Nivel 3 (Libros 13 al 18)</option>
                      <option value="Examen de Clasificación">Examen de Clasificación</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-500">
                      Turno de Clases
                    </label>
                    <select
                      value={formInscripcion.turno}
                      onChange={(e) => setFormInscripcion({ ...formInscripcion, turno: e.target.value })}
                      className="w-full input text-xs p-2 rounded-lg"
                    >
                      <option value="Mañana (07:00 - 08:30)">Mañana (07:00 - 08:30)</option>
                      <option value="Mañana (08:30 - 10:00)">Mañana (08:30 - 10:00)</option>
                      <option value="Tarde (14:30 - 16:00)">Tarde (14:30 - 16:00)</option>
                      <option value="Tarde (16:00 - 17:30)">Tarde (16:00 - 17:30)</option>
                      <option value="Noche (18:00 - 19:30)">Noche (18:00 - 19:30)</option>
                      <option value="Noche (19:30 - 21:00)">Noche (19:30 - 21:00)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full md:w-auto px-8 py-3 rounded-xl font-bold text-xs md:text-sm btn-bolivia-green text-white shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <Send className="w-4 h-4 text-amber-200" />
                    <span>Confirmar Pre-Inscripción y Emitir Comprobante</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <section id="correo-institucional" className="space-y-6">
          <div className={`border rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#121d2b] border-[#24354a]'
          }`}>
            <div className="tricolor-stripe absolute top-0 left-0 right-0" />
            <div className="max-w-2xl space-y-1 mb-6 pt-2">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#1b4332] dark:text-[#74c69d]">
                Google Workspace Institucional
              </p>
              <h2 className={`text-2xl md:text-3xl font-extrabold ${
                theme === 'light' ? 'text-[#0f172a]' : 'text-white'
              }`}>
                Solicitud y Activación de Correo Institucional
              </h2>
              <p className="text-xs md:text-sm text-slate-500">
                Tras formalizar su preinscripción, solicite aquí su cuenta de correo con dominio oficial
                <strong className="text-[#b8860b]"> @idiomas.ejercito.mil.bo</strong> para ingresar al aula virtual y material académico.
              </p>
            </div>

            <form onSubmit={handleSolicitarCorreo} className="max-w-xl space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Cédula de Identidad (C.I.) o Código de Inscripción:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej: 6849201 LP o EIE-2026-..."
                    value={ciBusquedaCorreo}
                    onChange={(e) => {
                      setCiBusquedaCorreo(e.target.value);
                      setErrorCorreo(null);
                    }}
                    required
                    className="flex-1 input text-xs md:text-sm p-3 rounded-xl font-mono"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-xl text-xs font-bold btn-bolivia-navy text-amber-300 shrink-0 flex items-center gap-2 transition shadow-sm"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Tramitar Correo</span>
                  </button>
                </div>
              </div>

              {errorCorreo && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorCorreo}</span>
                </div>
              )}
            </form>

            {resultadoCorreo && (
              <div className={`mt-8 border rounded-2xl p-6 md:p-8 space-y-5 max-w-2xl animate-solemn-fade shadow-sm ${
                theme === 'light' ? 'bg-slate-50 border-slate-300' : 'bg-[#0b131f] border-[#b8860b]/50'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#24354a] pb-4">
                  <div>
                    <h3 className={`text-base md:text-lg font-bold ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                      Credenciales de Correo Institucional
                    </h3>
                    <p className="text-xs text-slate-500">
                      Habilitado para: <strong>{resultadoCorreo.estudiante.nombre_estudiante} {resultadoCorreo.estudiante.apellido_estudiante}</strong>
                    </p>
                  </div>
                  <span className="text-xs bg-emerald-100 dark:bg-[#1b4332] text-emerald-800 dark:text-[#74c69d] px-2.5 py-1 rounded-md font-mono font-bold">
                    ACTIVO
                  </span>
                </div>

                <div className="space-y-3">
                  <div className={`border p-3.5 rounded-xl flex items-center justify-between ${
                    theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#121d2b] border-[#24354a]'
                  }`}>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">DIRECCIÓN DE CORREO:</span>
                      <strong className="text-sm font-mono text-[#1b4332] dark:text-[#74c69d] break-all">
                        {resultadoCorreo.emailGenerado}
                      </strong>
                    </div>
                  </div>

                  <div className={`border p-3.5 rounded-xl flex items-center justify-between ${
                    theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#121d2b] border-[#24354a]'
                  }`}>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">CONTRASEÑA TEMPORAL:</span>
                      <strong className="text-sm font-mono text-[#b8860b]">{resultadoCorreo.passwordTemporal}</strong>
                    </div>
                    <span className="text-xs text-slate-400">Cambiar al primer acceso</span>
                  </div>

                  <div className={`p-3 rounded-lg space-y-1 text-xs text-slate-500 ${
                    theme === 'light' ? 'bg-slate-100' : 'bg-[#121d2b]/60'
                  }`}>
                    <p><strong>Pasos para Iniciar Sesión:</strong></p>
                    <p>1. Ingrese a <a href="https://mail.google.com" target="_blank" rel="noreferrer" className="text-sky-600 underline">mail.google.com</a> con su cuenta.</p>
                    <p>2. Escriba la contraseña temporal y configure su nueva clave personal.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleCopiarCredenciales}
                    className={`text-xs px-4 py-2.5 rounded-xl font-semibold border flex items-center gap-2 transition ${
                      theme === 'light'
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        : 'bg-[#1a2738] border-[#364d68] text-slate-200 hover:bg-[#223247]'
                    }`}
                  >
                    {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiado ? '¡Copiado!' : 'Copiar Credenciales'}</span>
                  </button>

                  <a
                    href="https://accounts.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-5 py-2.5 rounded-xl font-bold bg-[#1b4332] hover:bg-[#245842] text-white flex items-center gap-2 transition shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                    <span>Abrir Google Workspace</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

      <footer id="contacto" className={`border-t text-xs pt-12 pb-8 mt-16 transition-colors relative ${
        theme === 'light'
          ? 'bg-white border-slate-200 text-slate-600'
          : 'bg-[#070d15] border-[#24354a] text-slate-400'
      }`}>
        <div className="tricolor-stripe absolute top-0 left-0 right-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border p-1 flex items-center justify-center shrink-0 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-300' : 'bg-[#121d2b] border-[#b8860b]/40'
                }`}>
                  <img src="/images/logos/logo-eie.png" alt="Escudo EIE" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className={`font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    ESCUELA DE IDIOMAS DEL EJÉRCITO
                  </p>
                  <p className="text-[10px] text-[#b8860b] font-mono">CEDMIL &bull; Bolivia</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-justify text-slate-500">
                Máxima entidad de capacitación lingüística de las Fuerzas Armadas del Estado Plurinacional de Bolivia. Formación en idiomas nativos y extranjeros con rigor, disciplina y excelencia académica.
              </p>
              <div className="text-xs font-mono font-bold text-[#b8860b]">
                &ldquo;THINK GLOBALLY, ACT LOCALLY&rdquo;
              </div>
            </div>

            <div className="space-y-3">
              <p className={`font-bold uppercase text-[11px] tracking-wider border-b pb-2 ${
                theme === 'light' ? 'text-slate-900 border-slate-200' : 'text-white border-[#24354a]'
              }`}>
                Canales de Atención
              </p>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Dirección Central:</span>
                  <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-200'}>
                    Av. Saavedra Nro. 1420 (frente al Estado Mayor General del Ejército). Zona Miraflores, La Paz - Bolivia.
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">WhatsApp de Información Oficial:</span>
                  <strong className="text-[#b8860b] font-mono text-sm">72005358</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Central Telefónica y Cajas:</span>
                  <span className="font-mono text-slate-500">(591-2) 2223401 &bull; 2223402</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Horarios de Atención:</span>
                  <span className="text-slate-500">
                    Lunes a Viernes: 07:30 a 21:30<br />
                    Sábados: 08:00 a 14:00 (Cursos Intensivos)
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className={`font-bold uppercase text-[11px] tracking-wider border-b pb-2 ${
                theme === 'light' ? 'text-slate-900 border-slate-200' : 'text-white border-[#24354a]'
              }`}>
                Navegación y Trámites
              </p>
              <ul className="space-y-2 text-xs">
                <li><a href="#inicio" className="hover:text-amber-600 dark:hover:text-amber-400 transition">Inicio Institucional</a></li>
                <li><a href="#mision-vision" className="hover:text-amber-600 dark:hover:text-amber-400 transition">Misión y Visión</a></li>
                <li><a href="#carrusel" className="hover:text-amber-600 dark:hover:text-amber-400 transition">Galería y Convocatorias</a></li>
                <li><a href="#oferta-academica" className="hover:text-amber-600 dark:hover:text-amber-400 transition">Oferta Curricular (36 Libros)</a></li>
                <li><a href="#filiales" className="hover:text-amber-600 dark:hover:text-amber-400 transition">Filiales en Guarniciones</a></li>
                <li><a href="#inscripciones" className="hover:text-amber-600 dark:hover:text-amber-400 transition">Pre-Inscripción Digital</a></li>
                <li><a href="#correo-institucional" className="hover:text-amber-600 dark:hover:text-amber-400 transition">Solicitar Correo Oficial</a></li>
                <li><Link href="/dashboard" className="text-[#b8860b] font-semibold hover:underline">Acceder al Sistema SACA</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className={`font-bold uppercase text-[11px] tracking-wider border-b pb-2 ${
                theme === 'light' ? 'text-slate-900 border-slate-200' : 'text-white border-[#24354a]'
              }`}>
                Filiales y Marco Jurídico
              </p>
              <div className="space-y-2 text-xs">
                <p className="text-slate-500">
                  <strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>Filiales Nacionales:</strong><br />
                  La Paz &bull; El Alto &bull; Viacha &bull; Achacachi &bull; Cochabamba &bull; Santa Cruz &bull; Tarija &bull; Uncía &bull; Riberalta.
                </p>
                <div className="pt-2 border-t border-slate-200 dark:border-[#24354a]">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Acreditación académica normada por el Comando General del Ejército, Ley N° 164, Ley SAFCO 1178 y Constitución Política del Estado (Art. 103).
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="border-t border-slate-200 dark:border-[#24354a] pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p className="text-center md:text-left">
              &copy; 2026 Escuela de Idiomas del Ejército &bull; Comando de Educación y Doctrina Militar (CEDMIL). Todos los derechos reservados.
            </p>
            <p className="text-center md:text-right font-mono text-[10px]">
              Estado Plurinacional de Bolivia &bull; Sistema SACA v2.4
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
