'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Sun,
  Moon,
  Eye,
  Type,
  CheckCircle2,
  Home,
  ArrowLeft,
  ArrowRight,
  Shield,
  Sparkles,
  ChevronRight,
  Monitor
} from 'lucide-react';

export default function ConfiguracionPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>('light');
  const [fontSize, setFontSize] = useState<'normal' | 'medium' | 'large'>('normal');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('eie_theme') as any;
      if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'high-contrast') {
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
      const savedFontSize = localStorage.getItem('eie_font_size') as any;
      if (savedFontSize === 'normal' || savedFontSize === 'medium' || savedFontSize === 'large') {
        setFontSize(savedFontSize);
        document.documentElement.setAttribute('data-font-size', savedFontSize);
      }
    } catch (e) {}
  }, []);

  const aplicarTema = (nuevo: 'light' | 'dark' | 'high-contrast') => {
    setTheme(nuevo);
    try {
      localStorage.setItem('eie_theme', nuevo);
      document.documentElement.setAttribute('data-theme', nuevo);
    } catch (e) {}
  };

  const aplicarFontSize = (nuevaEscala: 'normal' | 'medium' | 'large') => {
    setFontSize(nuevaEscala);
    try {
      localStorage.setItem('eie_font_size', nuevaEscala);
      document.documentElement.setAttribute('data-font-size', nuevaEscala);
    } catch (e) {}
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="rounded-2xl border p-6 shadow-sm transition-all bg-white dark:bg-[#121d2b] border-slate-200 dark:border-[#24354a]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Configuración & Accesibilidad
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Personalice la apariencia visual, contraste, escala tipográfica y experiencia de navegación del sistema.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-6 shadow-sm bg-white dark:bg-[#121d2b] border-slate-200 dark:border-[#24354a]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Tema Visual Institucional
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Seleccione la paleta de colores para la interfaz de trabajo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => aplicarTema('light')}
            className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
              theme === 'light'
                ? 'border-[#1b4332] bg-amber-50/40 ring-2 ring-[#1b4332]/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Modo Claro Institucional</h3>
                  <span className="text-[11px] text-slate-500">Fondo limpio y tonos académicos</span>
                </div>
              </div>
              {theme === 'light' && <CheckCircle2 className="w-5 h-5 text-[#1b4332]" />}
            </div>
            <p className="text-xs text-slate-600">
              Ideal para ambientes con iluminación natural diurna. Diseñado con verdes militares profundos y dorados sobrios.
            </p>
          </button>

          <button
            type="button"
            onClick={() => aplicarTema('dark')}
            className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
              theme === 'dark'
                ? 'border-amber-400 bg-slate-900/60 ring-2 ring-amber-400/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-300 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Modo Oscuro Militar</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Naval táctico (#0b131f)</span>
                </div>
              </div>
              {theme === 'dark' && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reduce la fatiga ocular durante jornadas prolongadas en pantalla. Acentos dorados y contraste calibrado sin saturación.
            </p>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border p-6 shadow-sm bg-white dark:bg-[#121d2b] border-slate-200 dark:border-[#24354a]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Modo Alto Contraste (Accesibilidad Visual)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aumenta la legibilidad del texto y la nitidez de los bordes sin alterar ni romper la composición.
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            theme === 'high-contrast' ? 'bg-amber-400 text-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {theme === 'high-contrast' ? 'Activado' : 'Desactivado'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Activar Alto Contraste Optimizado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
              Aplica fondo ultra oscuro, texto blanco de alta nitidez y contornos definidos para usuarios que requieren máxima claridad óptica sin saturación.
            </p>
          </div>
          <button
            type="button"
            onClick={() => aplicarTema(theme === 'high-contrast' ? 'light' : 'high-contrast')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              theme === 'high-contrast'
                ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-md'
                : 'bg-[#1b4332] hover:bg-[#245842] text-white shadow-sm'
            }`}
          >
            {theme === 'high-contrast' ? 'Desactivar Alto Contraste' : 'Activar Alto Contraste'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border p-6 shadow-sm bg-white dark:bg-[#121d2b] border-slate-200 dark:border-[#24354a]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Escala de Texto y Tipografía
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ajuste el tamaño de la fuente para optimizar la lectura según la resolución de su monitor.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'normal', label: 'Normal (100%)', sample: 'Texto base a 15px', icon: 'A' },
            { id: 'medium', label: 'Mediano (+16%)', sample: 'Texto ampliado a 17.5px', icon: 'A+' },
            { id: 'large', label: 'Grande (+33%)', sample: 'Texto ampliado a 20px', icon: 'A++' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => aplicarFontSize(item.id as any)}
              className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                fontSize === item.id
                  ? 'border-[#1b4332] bg-amber-50/40 dark:bg-slate-900/60 ring-2 ring-[#1b4332]/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {item.label}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {item.sample}
                </span>
              </div>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                fontSize === item.id ? 'bg-[#1b4332] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {item.icon}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border p-6 shadow-sm bg-white dark:bg-[#121d2b] border-slate-200 dark:border-[#24354a]">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Navegación Estratégica del Sistema
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Los controles de desplazamiento se ubican en la parte superior izquierda de cada panel para navegación rápida:
        </p>
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 w-fit">
          <div className="flex items-center gap-1 p-0.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
            <span className="p-1.5 text-slate-600 dark:text-slate-300" title="Atrás"><ArrowLeft className="w-3.5 h-3.5" /></span>
            <span className="p-1.5 text-slate-600 dark:text-slate-300" title="Adelante"><ArrowRight className="w-3.5 h-3.5" /></span>
            <span className="p-1.5 text-slate-600 dark:text-slate-300" title="Inicio"><Home className="w-3.5 h-3.5" /></span>
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Permiten regresar o avanzar entre vistas del sistema con un solo clic.
          </span>
        </div>
      </div>
    </div>
  );
}
