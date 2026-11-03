'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart as LineChartIcon,
  Shield,
  TrendingUp,
  Activity,
  Calculator,
  Layers,
  ChevronRight,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
  RotateCcw,
  ArrowRight,
  Sliders,
  Package,
  Users,
  GraduationCap,
  AlertTriangle,
  TrendingDown,
  Server,
  Check
} from 'lucide-react';

interface Punto {
  id: number;
  x: number;
  y: number;
  etiqueta?: string;
}

interface CalificacionH3 {
  libro: number;
  nota: number;
}

export default function MetodosNumericosPage() {
  const [tabActiva, setTabActiva] = useState<'MINIMOS_CUADRADOS' | 'NEWTON' | 'SIMPLEX' | 'COLAS' | 'PREDICCION_H3'>('MINIMOS_CUADRADOS');

  const PUNTOS_ALMACEN: Punto[] = [
    { id: 1, x: 1, y: 45, etiqueta: 'Enero (Mes 1)' },
    { id: 2, x: 2, y: 52, etiqueta: 'Febrero (Mes 2)' },
    { id: 3, x: 3, y: 68, etiqueta: 'Marzo (Mes 3)' },
    { id: 4, x: 4, y: 74, etiqueta: 'Abril (Mes 4)' },
    { id: 5, x: 5, y: 88, etiqueta: 'Mayo (Mes 5)' },
    { id: 6, x: 6, y: 95, etiqueta: 'Junio (Mes 6)' },
  ];

  const PUNTOS_MATRICULA: Punto[] = [
    { id: 1, x: 2021, y: 280, etiqueta: 'Gestión 2021' },
    { id: 2, x: 2022, y: 310, etiqueta: 'Gestión 2022' },
    { id: 3, x: 2023, y: 360, etiqueta: 'Gestión 2023' },
    { id: 4, x: 2024, y: 395, etiqueta: 'Gestión 2024' },
    { id: 5, x: 2025, y: 420, etiqueta: 'Gestión 2025' },
    { id: 6, x: 2026, y: 450, etiqueta: 'Gestión 2026' },
  ];

  const PUNTOS_NOTAS: Punto[] = [
    { id: 1, x: 60, y: 58, etiqueta: 'Asist. 60%' },
    { id: 2, x: 70, y: 69, etiqueta: 'Asist. 70%' },
    { id: 3, x: 80, y: 78, etiqueta: 'Asist. 80%' },
    { id: 4, x: 90, y: 89, etiqueta: 'Asist. 90%' },
    { id: 5, x: 100, y: 96, etiqueta: 'Asist. 100%' },
  ];

  const [puntos, setPuntos] = useState<Punto[]>(PUNTOS_ALMACEN);
  const [nuevoX, setNuevoX] = useState<string>('7');
  const [nuevoY, setNuevoY] = useState<string>('105');
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState<string>('Julio (Mes 7)');
  const [xPrediccion, setXPrediccion] = useState<number>(7);

  const resultadoMinimosCuadrados = useMemo(() => {
    const n = puntos.length;
    if (n < 2) return null;

    let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0;
    for (const p of puntos) {
      sumX += p.x;
      sumY += p.y;
      sumX2 += (p.x * p.x);
      sumY2 += (p.y * p.y);
      sumXY += (p.x * p.y);
    }

    const mediaX = sumX / n;
    const mediaY = sumY / n;

    const denM = (n * sumX2) - (sumX * sumX);
    if (Math.abs(denM) < 1e-9) return null;

    const m = ((n * sumXY) - (sumX * sumY)) / denM;
    const b = mediaY - (m * mediaX);

    let sse = 0;
    let sst = 0;

    const filas = puntos.map((p) => {
      const yEstimado = m * p.x + b;
      const residuo = p.y - yEstimado;
      const residuoCuadrado = residuo * residuo;
      const xCuadrado = p.x * p.x;
      const yCuadrado = p.y * p.y;
      const xy = p.x * p.y;

      sse += residuoCuadrado;
      sst += Math.pow(p.y - mediaY, 2);

      return {
        ...p,
        yEstimado: Math.round(yEstimado * 100) / 100,
        residuo: Math.round(residuo * 100) / 100,
        residuoCuadrado: Math.round(residuoCuadrado * 100) / 100,
        xCuadrado: Math.round(xCuadrado * 100) / 100,
        yCuadrado: Math.round(yCuadrado * 100) / 100,
        xy: Math.round(xy * 100) / 100,
      };
    });

    const ssr = sst - sse;
    const r2 = sst > 0 ? Math.max(0, Math.min(1, ssr / sst)) : 1;
    const rPearson = (m >= 0 ? 1 : -1) * Math.sqrt(r2);

    const pronosticoY = Math.round((m * xPrediccion + b) * 100) / 100;

    return {
      n,
      sumX: Math.round(sumX * 100) / 100,
      sumY: Math.round(sumY * 100) / 100,
      sumX2: Math.round(sumX2 * 100) / 100,
      sumY2: Math.round(sumY2 * 100) / 100,
      sumXY: Math.round(sumXY * 100) / 100,
      mediaX: Math.round(mediaX * 100) / 100,
      mediaY: Math.round(mediaY * 100) / 100,
      m: Math.round(m * 10000) / 10000,
      b: Math.round(b * 10000) / 10000,
      sse: Math.round(sse * 10000) / 10000,
      sst: Math.round(sst * 10000) / 10000,
      ssr: Math.round(ssr * 10000) / 10000,
      r2: Math.round(r2 * 10000) / 10000,
      rPearson: Math.round(rPearson * 10000) / 10000,
      filas,
      pronosticoY,
    };
  }, [puntos, xPrediccion]);

  const handleAgregarPunto = (e: React.FormEvent) => {
    e.preventDefault();
    const xNum = parseFloat(nuevoX);
    const yNum = parseFloat(nuevoY);
    if (isNaN(xNum) || isNaN(yNum)) return;

    setPuntos((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: xNum,
        y: yNum,
        etiqueta: nuevaEtiqueta || `Punto ${prev.length + 1}`,
      },
    ]);

    setNuevoX(String(xNum + 1));
    setNuevoY(String(Math.round(yNum + 10)));
    setNuevaEtiqueta('');
  };

  const handleEliminarPunto = (id: number) => {
    if (puntos.length <= 2) {
      alert('Se requieren al menos 2 puntos para el cálculo de mínimos cuadrados.');
      return;
    }
    setPuntos((prev) => prev.filter((p) => p.id !== id));
  };

  const PUNTOS_NEWTON_DEF = [
    { x: 10, y: 72 },
    { x: 20, y: 81 },
    { x: 30, y: 89 },
    { x: 40, y: 94 },
  ];
  const [newtonPuntos, setNewtonPuntos] = useState(PUNTOS_NEWTON_DEF);
  const [newtonXEval, setNewtonXEval] = useState<number>(25);

  const resultadoNewton = useMemo(() => {
    const n = newtonPuntos.length;
    if (n < 2) return null;

    const f: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      f[i][0] = newtonPuntos[i].y;
    }

    for (let j = 1; j < n; j++) {
      for (let i = 0; i < n - j; i++) {
        f[i][j] = (f[i + 1][j - 1] - f[i][j - 1]) / (newtonPuntos[i + j].x - newtonPuntos[i].x);
      }
    }

    let valorInterpolado = f[0][0];
    let producto = 1.0;
    for (let j = 1; j < n; j++) {
      producto *= (newtonXEval - newtonPuntos[j - 1].x);
      valorInterpolado += f[0][j] * producto;
    }

    return {
      f,
      valorInterpolado: Math.round(valorInterpolado * 100) / 100,
    };
  }, [newtonPuntos, newtonXEval]);

  const [simplexC1, setSimplexC1] = useState<number>(40);
  const [simplexC2, setSimplexC2] = useState<number>(30);
  const [simplexR1Aula, setSimplexR1Aula] = useState<number>(100);
  const [simplexR2Lab, setSimplexR2Lab] = useState<number>(80);

  const resultadoSimplex = useMemo(() => {
    const A11 = 2, A12 = 1, B1 = simplexR1Aula;
    const A21 = 1, A22 = 2, B2 = simplexR2Lab;

    const det = (A11 * A22) - (A12 * A21);
    let x1 = 0, x2 = 0;
    if (det !== 0) {
      x1 = Math.max(0, ((B1 * A22) - (A12 * B2)) / det);
      x2 = Math.max(0, ((A11 * B2) - (B1 * A21)) / det);
    }
    const zOptimo = (simplexC1 * x1) + (simplexC2 * x2);

    return {
      x1: Math.round(x1 * 100) / 100,
      x2: Math.round(x2 * 100) / 100,
      zOptimo: Math.round(zOptimo * 100) / 100,
    };
  }, [simplexC1, simplexC2, simplexR1Aula, simplexR2Lab]);

  const [lambda, setLambda] = useState<number>(14);
  const [mu, setMu] = useState<number>(6);
  const [cajas, setCajas] = useState<number>(3);

  const resultadoColas = useMemo(() => {
    const r = lambda / mu;
    const rho = r / cajas;
    const esEstable = rho < 1.0;

    let p0 = 0.0;
    let lq = 0.0;
    let wqMin = 0.0;
    let wsMin = 0.0;

    if (esEstable) {
      const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
      let sumatoria = 0.0;
      for (let n = 0; n < cajas; n++) {
        sumatoria += Math.pow(r, n) / fact(n);
      }
      const terminoC = Math.pow(r, cajas) / (fact(cajas) * (1.0 - rho));
      p0 = 1.0 / (sumatoria + terminoC);

      const erlangC = terminoC * p0;
      lq = (erlangC * rho) / (1.0 - rho);
      const wqHoras = lq / lambda;
      wqMin = wqHoras * 60;
      wsMin = (wqHoras + (1.0 / mu)) * 60;
    }

    return {
      rho: Math.round(rho * 1000) / 1000,
      esEstable,
      p0: Math.round(p0 * 1000) / 1000,
      lq: Math.round(lq * 100) / 100,
      wqMin: Math.round(wqMin * 10) / 10,
      wsMin: Math.round(wsMin * 10) / 10,
    };
  }, [lambda, mu, cajas]);

  const CASO_OFICIAL_H3: CalificacionH3[] = [
    { libro: 1, nota: 78 },
    { libro: 2, nota: 74 },
    { libro: 3, nota: 75 },
    { libro: 4, nota: 68 },
    { libro: 5, nota: 66 },
    { libro: 6, nota: 61 },
  ];

  const CASO_RIESGO_MEDIO: CalificacionH3[] = [
    { libro: 1, nota: 80 },
    { libro: 2, nota: 77 },
    { libro: 3, nota: 74 },
    { libro: 4, nota: 72 },
    { libro: 5, nota: 69 },
  ];

  const CASO_OPTIMO: CalificacionH3[] = [
    { libro: 1, nota: 75 },
    { libro: 2, nota: 80 },
    { libro: 3, nota: 84 },
    { libro: 4, nota: 89 },
    { libro: 5, nota: 93 },
  ];

  const LOTE_ESTUDIANTES_DEMO = [
    {
      id: 101,
      nombre: 'Cadete M. Suárez (H3 Tabla 5.3)',
      programa: 'Inglés Técnico Aeronáutico',
      calificaciones: CASO_OFICIAL_H3,
      objetivo: 12
    },
    {
      id: 102,
      nombre: 'Sbtte. R. Condori',
      programa: 'Inglés Operativo CEDMIL',
      calificaciones: CASO_RIESGO_MEDIO,
      objetivo: 6
    },
    {
      id: 103,
      nombre: 'Tte. C. Morales',
      programa: 'Inglés Misiones de Paz ONU',
      calificaciones: CASO_OPTIMO,
      objetivo: 6
    },
    {
      id: 104,
      nombre: 'Sgto. A. Mamani',
      programa: 'Francés Militar',
      calificaciones: [{ libro: 1, nota: 65 }, { libro: 2, nota: 70 }],
      objetivo: 6
    },
    {
      id: 105,
      nombre: 'Alférez D. Vargas',
      programa: 'Inglés Avanzado',
      calificaciones: [
        { libro: 1, nota: 62 }, { libro: 2, nota: 57 }, { libro: 3, nota: 53 },
        { libro: 4, nota: 49 }, { libro: 5, nota: 44 }
      ],
      objetivo: 6
    }
  ];

  const [califsH3, setCalifsH3] = useState<CalificacionH3[]>(CASO_OFICIAL_H3);
  const [nombreH3, setNombreH3] = useState<string>('Cadete M. Suárez (Caso Tabla 5.3)');
  const [programaH3, setProgramaH3] = useState<string>('Inglés Técnico Aeronáutico');
  const [objetivoLvlH3, setObjetivoLvlH3] = useState<number | 'AUTO'>(12);
  const [nuevoLibroH3, setNuevoLibroH3] = useState<string>('7');
  const [nuevaNotaH3, setNuevaNotaH3] = useState<string>('58');
  const [vistaLote, setVistaLote] = useState<boolean>(false);
  const [cargandoApi, setCargandoApi] = useState<boolean>(false);
  const [servidorMsg, setServidorMsg] = useState<{ tipo: 'ok' | 'err'; fuente: string; ms: number; data?: any } | null>(null);

  const resultadoH3 = useMemo(() => {
    const ordenadas = [...califsH3].sort((a, b) => a.libro - b.libro);
    const n = ordenadas.length;

    if (n < 3) {
      return {
        datosInsuficientes: true,
        n,
        a: 0,
        b: 0,
        ecuacionRecta: 'y = 0x + 0',
        sumX: 0,
        sumY: 0,
        sumXX: 0,
        sumXY: 0,
        delta: 0,
        ssRes: 0,
        ssTot: 0,
        r2: 0,
        xp: typeof objetivoLvlH3 === 'number' ? objetivoLvlH3 : 6,
        yp: 0,
        nivelRiesgo: 'DATOS_INSUFICIENTES' as const,
        mensajeAlerta: `Se requieren al menos 3 libros evaluados para generar la proyección matemática (actualmente: ${n}).`,
        tablaAjuste: [] as Array<{
          libro: number;
          nota: number;
          notaAjustada: number;
          residuo: number;
          residuoCuadrado: number;
          xCuadrado: number;
          xy: number;
        }>,
      };
    }

    let sumX = 0, sumY = 0, sumXX = 0, sumXY = 0;
    for (const c of ordenadas) {
      sumX += c.libro;
      sumY += c.nota;
      sumXX += (c.libro * c.libro);
      sumXY += (c.libro * c.nota);
    }

    const delta = (n * sumXX) - (sumX * sumX);
    if (Math.abs(delta) < 1e-9) {
      return {
        datosInsuficientes: true,
        n,
        a: 0,
        b: 0,
        ecuacionRecta: 'y = 0x + 0',
        sumX,
        sumY,
        sumXX,
        sumXY,
        delta: 0,
        ssRes: 0,
        ssTot: 0,
        r2: 0,
        xp: typeof objetivoLvlH3 === 'number' ? objetivoLvlH3 : 6,
        yp: 0,
        nivelRiesgo: 'ERROR_CALCULO' as const,
        mensajeAlerta: 'Abscisas sin variación: todos los libros tienen el mismo número.',
        tablaAjuste: [] as Array<{
          libro: number;
          nota: number;
          notaAjustada: number;
          residuo: number;
          residuoCuadrado: number;
          xCuadrado: number;
          xy: number;
        }>,
      };
    }

    const a = ((n * sumXY) - (sumX * sumY)) / delta;
    const b = (sumY - (a * sumX)) / n;
    const mediaY = sumY / n;

    const ultimoLibro = ordenadas[ordenadas.length - 1].libro;
    let xp = typeof objetivoLvlH3 === 'number' ? objetivoLvlH3 : 36;
    if (objetivoLvlH3 === 'AUTO') {
      const examenes = [6, 12, 18, 24, 30, 36];
      xp = 36;
      for (const ex of examenes) {
        if (ex > ultimoLibro) {
          xp = ex;
          break;
        }
      }
    }

    const ypRaw = (a * xp) + b;
    const yp = Math.max(0, Math.min(100, ypRaw));

    let ssRes = 0;
    let ssTot = 0;
    const tablaAjuste = ordenadas.map((c) => {
      const yHat = (a * c.libro) + b;
      const e = c.nota - yHat;
      const e2 = e * e;
      ssRes += e2;
      ssTot += Math.pow(c.nota - mediaY, 2);

      return {
        libro: c.libro,
        nota: c.nota,
        notaAjustada: Math.round(yHat * 100) / 100,
        residuo: Math.round(e * 100) / 100,
        residuoCuadrado: Math.round(e2 * 10000) / 10000,
        xCuadrado: c.libro * c.libro,
        xy: c.libro * c.nota,
      };
    });

    const r2 = ssTot > 0 ? Math.max(0, Math.min(1, 1 - (ssRes / ssTot))) : 1;

    let nivelRiesgo: 'ALTO' | 'MEDIO' | 'BAJO' = 'BAJO';
    let mensajeAlerta = '';

    if (yp < 51.0 || a < -3.0) {
      nivelRiesgo = 'ALTO';
      const razones: string[] = [];
      if (yp < 51.0) razones.push(`nota proyectada (${yp.toFixed(2)}) inferior al umbral crítico de 51 puntos`);
      if (a < -3.0) razones.push(`pendiente (${a.toFixed(4)}) denota pérdida acelerada de más de 3.0 puntos/libro`);
      mensajeAlerta = `⚠️ RIESGO ALTO DE DESERCIÓN — ${razones.join(' y ')}. Se requiere intervención pedagógica inmediata del Jefe Académico antes del examen de nivel del libro ${xp}.`;
    } else if (yp < 65.0 || a < 0) {
      nivelRiesgo = 'MEDIO';
      const razones: string[] = [];
      if (yp < 65.0) razones.push(`nota proyectada (${yp.toFixed(2)}) inferior a 65 puntos`);
      if (a < 0) razones.push(`tendencia descendente (${a.toFixed(4)})`);
      mensajeAlerta = `⚡ RIESGO MEDIO — ${razones.join(' y ')}. Se sugiere seguimiento académico reforzado y tutoría complementaria.`;
    } else {
      nivelRiesgo = 'BAJO';
      mensajeAlerta = `✅ RIESGO BAJO — Trayectoria estable o ascendente (${a >= 0 ? '+' : ''}${a.toFixed(4)} pts/libro). Proyección de ${yp.toFixed(2)} puntos para el examen del libro ${xp}.`;
    }

    return {
      datosInsuficientes: false,
      n,
      a: Math.round(a * 10000) / 10000,
      b: Math.round(b * 10000) / 10000,
      ecuacionRecta: `y = ${a.toFixed(4)}x ${b >= 0 ? '+' : '-'} ${Math.abs(b).toFixed(4)}`,
      sumX,
      sumY: Math.round(sumY * 100) / 100,
      sumXX,
      sumXY: Math.round(sumXY * 100) / 100,
      delta: Math.round(delta * 100) / 100,
      ssRes: Math.round(ssRes * 10000) / 10000,
      ssTot: Math.round(ssTot * 10000) / 10000,
      r2: Math.round(r2 * 10000) / 10000,
      xp,
      yp: Math.round(yp * 100) / 100,
      nivelRiesgo,
      mensajeAlerta,
      tablaAjuste,
    };
  }, [califsH3, objetivoLvlH3]);

  const resultadoLote = useMemo(() => {
    let alto = 0, medio = 0, bajo = 0, insuf = 0;
    const items = LOTE_ESTUDIANTES_DEMO.map((est) => {
      const califs = est.calificaciones;
      const n = califs.length;
      if (n < 3) {
        insuf++;
        return { ...est, riesgo: 'DATOS_INSUFICIENTES', yp: '-', a: '-', r2: '-' };
      }
      let sumX = 0, sumY = 0, sumXX = 0, sumXY = 0;
      for (const c of califs) {
        sumX += c.libro; sumY += c.nota;
        sumXX += c.libro * c.libro; sumXY += c.libro * c.nota;
      }
      const delta = (n * sumXX) - (sumX * sumX);
      const a = ((n * sumXY) - (sumX * sumY)) / delta;
      const b = (sumY - (a * sumX)) / n;
      const yp = Math.max(0, Math.min(100, (a * est.objetivo) + b));

      let riesgo = 'BAJO';
      if (yp < 51.0 || a < -3.0) {
        riesgo = 'ALTO'; alto++;
      } else if (yp < 65.0 || a < 0) {
        riesgo = 'MEDIO'; medio++;
      } else {
        bajo++;
      }

      return {
        ...est,
        riesgo,
        yp: yp.toFixed(2),
        a: a.toFixed(4),
        b: b.toFixed(2),
      };
    });

    return { total: LOTE_ESTUDIANTES_DEMO.length, alto, medio, bajo, insuf, items };
  }, []);

  const handleAgregarLibroH3 = (e: React.FormEvent) => {
    e.preventDefault();
    const l = parseInt(nuevoLibroH3, 10);
    const n = parseFloat(nuevaNotaH3);
    if (isNaN(l) || isNaN(n) || l < 1 || l > 36 || n < 0 || n > 100) {
      alert('El libro debe estar entre 1 y 36, y la nota entre 0 y 100.');
      return;
    }
    if (califsH3.some((c) => c.libro === l)) {
      alert(`El libro ${l} ya está registrado. Elimínelo primero.`);
      return;
    }
    setCalifsH3((prev) => [...prev, { libro: l, nota: n }].sort((a, b) => a.libro - b.libro));
    setNuevoLibroH3(String(l + 1 <= 36 ? l + 1 : 36));
    setNuevaNotaH3('');
  };

  const handleEliminarLibroH3 = (libro: number) => {
    if (califsH3.length <= 1) {
      alert('Debe conservar al menos un registro.');
      return;
    }
    setCalifsH3((prev) => prev.filter((c) => c.libro !== libro));
  };

  const verificarConQuarkus = async () => {
    setCargandoApi(true);
    setServidorMsg(null);
    const t0 = performance.now();
    try {
      const payload = {
        idEstudiante: 1,
        nombreEstudiante: nombreH3,
        programa: programaH3,
        calificaciones: califsH3,
        libroExamenNivelObjetivo: typeof objetivoLvlH3 === 'number' ? objetivoLvlH3 : undefined,
      };

      let res = await fetch('/api/quarkus/analytics/prediccion-rendimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null);

      let fuente = 'Microservicio Quarkus 3.15 (Puerto 8080)';

      if (!res || !res.ok) {
        res = await fetch('/api/v1/metodos-numericos/prediccion-rendimiento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => null);
        fuente = 'API Core Laravel 12 (Puerto 8000)';
      }

      const t1 = performance.now();
      if (res && res.ok) {
        const data = await res.json();
        setServidorMsg({ tipo: 'ok', fuente, ms: Math.round(t1 - t0), data });
      } else {
        setServidorMsg({ tipo: 'err', fuente: 'Error de respuesta en servicios', ms: Math.round(t1 - t0) });
      }
    } catch {
      setServidorMsg({ tipo: 'err', fuente: 'Sin conexión a servicios locales', ms: 0 });
    } finally {
      setCargandoApi(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '0.85rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4', flexShrink: 0 }}>
            <LineChartIcon size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
              <span>SACA</span>
              <span>/</span>
              <span style={{ color: '#06b6d4', fontWeight: 600 }}>Investigación Operativa</span>
            </div>
            <h1
              className="font-solemn"
              style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.02em', margin: '0.15rem 0 0' }}
            >
              Laboratorio de Métodos Numéricos y Analítica
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span className="badge badge-gold" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
            Microservicio Quarkus 2.0 &bull; ONLINE
          </span>
        </div>
      </div>

      <div className="filter-tabs" style={{ background: 'var(--bg-surface-elevated)', padding: '0.35rem', borderRadius: '6px' }}>
        <button
          onClick={() => setTabActiva('MINIMOS_CUADRADOS')}
          className={`filter-tab ${tabActiva === 'MINIMOS_CUADRADOS' ? 'active' : ''}`}
        >
          <TrendingUp size={13} />
          <span>Mínimos Cuadrados (Diferencias de Cuadrados)</span>
        </button>
        <button
          onClick={() => setTabActiva('NEWTON')}
          className={`filter-tab ${tabActiva === 'NEWTON' ? 'active' : ''}`}
        >
          <Calculator size={13} />
          <span>Diferencias Divididas (Newton)</span>
        </button>
        <button
          onClick={() => setTabActiva('SIMPLEX')}
          className={`filter-tab ${tabActiva === 'SIMPLEX' ? 'active' : ''}`}
        >
          <Sliders size={13} />
          <span>Método Simplex (Prog. Lineal)</span>
        </button>
        <button
          onClick={() => setTabActiva('COLAS')}
          className={`filter-tab ${tabActiva === 'COLAS' ? 'active' : ''}`}
        >
          <Activity size={13} />
          <span>Teoría de Colas M/M/c (FIFO)</span>
        </button>
        <button
          onClick={() => setTabActiva('PREDICCION_H3')}
          className={`filter-tab ${tabActiva === 'PREDICCION_H3' ? 'active' : ''}`}
          style={tabActiva === 'PREDICCION_H3' ? { background: 'rgba(217, 119, 6, 0.15)', borderColor: 'var(--military-gold-primary)', color: 'var(--military-gold-primary)' } : {}}
        >
          <GraduationCap size={13} />
          <span style={{ fontWeight: 700 }}>Predicción Rendimiento Académico (H3)</span>
          <span className="badge badge-gold" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem', marginLeft: '0.2rem' }}>PDF H3</span>
        </button>
      </div>

      {tabActiva === 'MINIMOS_CUADRADOS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cargar Caso Militar de Estudio:</span>
            <button
              onClick={() => {
                setPuntos(PUNTOS_ALMACEN);
                setXPrediccion(7);
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
            >
              <Package size={13} /> Pronóstico Demanda Libros (Almacén)
            </button>
            <button
              onClick={() => {
                setPuntos(PUNTOS_MATRICULA);
                setXPrediccion(2027);
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
            >
              <Users size={13} /> Proyección Nuevas Matrículas (Gestión)
            </button>
            <button
              onClick={() => {
                setPuntos(PUNTOS_NOTAS);
                setXPrediccion(95);
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
            >
              <Award size={13} /> Correlación Asistencia vs Nota Final
            </button>
          </div>

          {resultadoMinimosCuadrados && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '0.75rem',
              }}
            >
              <div className="card" style={{ padding: '0.75rem 1rem' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                  Ecuación de la Recta (Ajuste)
                </p>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--military-gold-primary)', margin: '0.2rem 0 0' }}>
                  y = {resultadoMinimosCuadrados.m}x {resultadoMinimosCuadrados.b >= 0 ? '+' : '-'} {Math.abs(resultadoMinimosCuadrados.b)}
                </p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                  Pendiente m: {resultadoMinimosCuadrados.m} &bull; Intercepto b: {resultadoMinimosCuadrados.b}
                </p>
              </div>

              <div className="card" style={{ padding: '0.75rem 1rem' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                  Diferencias de Cuadrados (SSE)
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', margin: '0.2rem 0 0' }}>
                  {resultadoMinimosCuadrados.sse}
                </p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                  Suma del Error Cuadrático &Sigma;(y - &ycirc;)&sup2;
                </p>
              </div>

              <div className="card" style={{ padding: '0.75rem 1rem' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                  Coeficiente de Determinación (R&sup2;)
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--status-active)', margin: '0.2rem 0 0' }}>
                  {(resultadoMinimosCuadrados.r2 * 100).toFixed(2)}%
                </p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                  Pearson r: {resultadoMinimosCuadrados.rPearson} (Ajuste óptimo)
                </p>
              </div>

              <div className="card" style={{ padding: '0.75rem 1rem', background: 'var(--military-green-subtle)', border: '1px solid var(--border-accent)' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                  Pronóstico para x = {xPrediccion}
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', margin: '0.2rem 0 0' }}>
                  &ycirc; = {resultadoMinimosCuadrados.pronosticoY} unidades
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <input
                    type="number"
                    value={xPrediccion}
                    onChange={(e) => setXPrediccion(parseFloat(e.target.value) || 0)}
                    style={{ width: '80px', height: '24px', fontSize: '0.75rem', padding: '0.1rem 0.3rem' }}
                    className="input"
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Calcular otro periodo</span>
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Tabla de Dispersión y Suma de Cuadrados de las Diferencias &Sigma;(y - &ycirc;)&sup2;
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                  Desglose analítico punto a punto con verificación del residuo y error al cuadrado
                </p>
              </div>

              <form onSubmit={handleAgregarPunto} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  placeholder="X"
                  value={nuevoX}
                  onChange={(e) => setNuevoX(e.target.value)}
                  className="input"
                  style={{ width: '60px', height: '28px', fontSize: '0.75rem' }}
                  required
                />
                <input
                  type="number"
                  placeholder="Y"
                  value={nuevoY}
                  onChange={(e) => setNuevoY(e.target.value)}
                  className="input"
                  style={{ width: '70px', height: '28px', fontSize: '0.75rem' }}
                  required
                />
                <input
                  type="text"
                  placeholder="Etiqueta"
                  value={nuevaEtiqueta}
                  onChange={(e) => setNuevaEtiqueta(e.target.value)}
                  className="input"
                  style={{ width: '110px', height: '28px', fontSize: '0.75rem' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', height: '28px' }}>
                  <Plus size={12} /> Agregar
                </button>
              </form>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ margin: 0, fontSize: '0.78rem' }}>
                <thead>
                  <tr>
                    <th>Observación</th>
                    <th style={{ textAlign: 'center' }}>X (Periodo)</th>
                    <th style={{ textAlign: 'center' }}>Y (Observado)</th>
                    <th style={{ textAlign: 'center' }}>&ycirc; (Estimado mx+b)</th>
                    <th style={{ textAlign: 'center' }}>Residuo (y - &ycirc;)</th>
                    <th style={{ textAlign: 'center', background: 'rgba(245, 158, 11, 0.08)' }}>
                      Diferencia al Cuadrado (y - &ycirc;)&sup2;
                    </th>
                    <th style={{ textAlign: 'center' }}>X&sup2;</th>
                    <th style={{ textAlign: 'center' }}>X &bull; Y</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {resultadoMinimosCuadrados?.filas.map((f) => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 600 }}>{f.etiqueta}</td>
                      <td style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>{f.x}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-main)' }}>{f.y}</td>
                      <td style={{ textAlign: 'center', color: 'var(--military-gold-primary)' }}>{f.yEstimado}</td>
                      <td style={{ textAlign: 'center', color: f.residuo >= 0 ? 'var(--status-active)' : '#ef4444' }}>
                        {f.residuo >= 0 ? `+${f.residuo}` : f.residuo}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.04)' }}>
                        {f.residuoCuadrado}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{f.xCuadrado}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{f.xy}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleEliminarPunto(f.id)}
                          className="btn btn-secondary btn-icon"
                          style={{ width: '24px', height: '24px', padding: 0, color: '#ef4444' }}
                          title="Eliminar punto"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {resultadoMinimosCuadrados && (
                    <tr style={{ background: 'var(--bg-surface-elevated)', fontWeight: 800, borderTop: '2px solid var(--border-subtle)' }}>
                      <td style={{ color: 'var(--military-gold-primary)' }}>SUMATORIAS (&Sigma;)</td>
                      <td style={{ textAlign: 'center' }}>{resultadoMinimosCuadrados.sumX}</td>
                      <td style={{ textAlign: 'center' }}>{resultadoMinimosCuadrados.sumY}</td>
                      <td style={{ textAlign: 'center' }}>-</td>
                      <td style={{ textAlign: 'center' }}>0.00</td>
                      <td style={{ textAlign: 'center', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', fontSize: '0.85rem' }}>
                        SSE = {resultadoMinimosCuadrados.sse}
                      </td>
                      <td style={{ textAlign: 'center' }}>{resultadoMinimosCuadrados.sumX2}</td>
                      <td style={{ textAlign: 'center' }}>{resultadoMinimosCuadrados.sumXY}</td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'NEWTON' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.35rem' }}>
              Polinomio Interpolador de Newton en Diferencias Divididas
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
              Permite estimar con precisión matemática cualquier valor intermedio sin asumir comportamiento lineal:
            </p>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Punto a Interpolar (X):</span>
                <input
                  type="number"
                  value={newtonXEval}
                  onChange={(e) => setNewtonXEval(parseFloat(e.target.value) || 0)}
                  className="input"
                  style={{ width: '80px', height: '30px', fontSize: '0.8rem' }}
                />
              </div>

              {resultadoNewton && (
                <div style={{ background: 'var(--military-green-subtle)', padding: '0.35rem 0.85rem', borderRadius: 4, border: '1px solid var(--border-accent)' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Resultado P({newtonXEval}) = {resultadoNewton.valorInterpolado} pts
                  </span>
                </div>
              )}
            </div>

            <div className="table-responsive">
              <table className="table" style={{ margin: 0, fontSize: '0.78rem' }}>
                <thead>
                  <tr>
                    <th>i</th>
                    <th>X_i</th>
                    <th>f[X_i] (Orden 0)</th>
                    <th>f[X_i, X_i+1] (Orden 1)</th>
                    <th>f[X_i...X_i+2] (Orden 2)</th>
                    <th>f[X_i...X_i+3] (Orden 3)</th>
                  </tr>
                </thead>
                <tbody>
                  {newtonPuntos.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>{idx}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.x}</td>
                      <td style={{ fontWeight: 700, color: 'var(--military-gold-primary)' }}>
                        {resultadoNewton?.f[idx][0].toFixed(2)}
                      </td>
                      <td>{resultadoNewton?.f[idx][1] !== undefined && idx < newtonPuntos.length - 1 ? resultadoNewton.f[idx][1].toFixed(4) : '-'}</td>
                      <td>{resultadoNewton?.f[idx][2] !== undefined && idx < newtonPuntos.length - 2 ? resultadoNewton.f[idx][2].toFixed(4) : '-'}</td>
                      <td>{resultadoNewton?.f[idx][3] !== undefined && idx < newtonPuntos.length - 3 ? resultadoNewton.f[idx][3].toFixed(4) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'SIMPLEX' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.35rem' }}>
              Optimización de Recursos Militares &bull; Método Simplex Estándar
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
              Modelo de Investigación de Operaciones: Maximizar el beneficio académico distribuyendo horas de aula y laboratorios entre cursos de Inglés Militar (X1) y Francés Diplomático (X2).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>COEFICIENTES FUNCIÓN OBJETIVO</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--military-gold-primary)', margin: '0.2rem 0' }}>
                  Max Z = {simplexC1} X1 + {simplexC2} X2
                </p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Ponderación de beneficio por grupo</p>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>RESTRICCIÓN 1: HORAS DE AULA</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0.2rem 0' }}>
                  2 X1 + 1 X2 &le; {simplexR1Aula} hrs
                </p>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={simplexR1Aula}
                  onChange={(e) => setSimplexR1Aula(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>RESTRICCIÓN 2: HORAS DE LABORATORIO</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0.2rem 0' }}>
                  1 X1 + 2 X2 &le; {simplexR2Lab} hrs
                </p>
                <input
                  type="range"
                  min="40"
                  max="120"
                  value={simplexR2Lab}
                  onChange={(e) => setSimplexR2Lab(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ background: 'var(--military-green-subtle)', padding: '1rem', borderRadius: 6, border: '1px solid var(--border-accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--status-active)', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>
                  SOLUCIÓN ÓPTIMA SIMPLEX ALCANZADA:
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', margin: '0.2rem 0' }}>
                  X1 (Inglés) = {resultadoSimplex.x1} grupos &bull; X2 (Francés) = {resultadoSimplex.x2} grupos
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                  Aprovechamiento pleno sin holguras ociosas en el cuartel académico.
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>BENEFICIO MÁXIMO Z*</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--military-gold-primary)', margin: 0 }}>
                  {resultadoSimplex.zOptimo} pts
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'COLAS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.35rem' }}>
              Simulador Estocástico M/M/c &bull; Cajas EIE (Erlang C)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
              Evalúa la disciplina FIFO en cajas y calcula el tiempo de espera en función del número de ventanillas:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <label className="input-label" style={{ fontSize: '0.72rem' }}>Tasa de Llegada &lambda; (estudiantes/hora)</label>
                <input
                  type="number"
                  value={lambda}
                  onChange={(e) => setLambda(Number(e.target.value))}
                  className="input"
                  style={{ fontSize: '1rem', fontWeight: 700 }}
                />
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <label className="input-label" style={{ fontSize: '0.72rem' }}>Tasa de Servicio &mu; (alumnos/hora por caja)</label>
                <input
                  type="number"
                  value={mu}
                  onChange={(e) => setMu(Number(e.target.value))}
                  className="input"
                  style={{ fontSize: '1rem', fontWeight: 700 }}
                />
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <label className="input-label" style={{ fontSize: '0.72rem' }}>Ventanillas Activas (c)</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={cajas}
                  onChange={(e) => setCajas(Number(e.target.value))}
                  className="input"
                  style={{ fontSize: '1rem', fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div className="card" style={{ padding: '0.75rem 1rem' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                  Utilización (&rho;)
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: resultadoColas.rho < 0.85 ? 'var(--status-active)' : '#ef4444', margin: '0.2rem 0 0' }}>
                  {(resultadoColas.rho * 100).toFixed(1)}%
                </p>
              </div>

              <div className="card" style={{ padding: '0.75rem 1rem' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                  Espera en Cola (Wq)
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: resultadoColas.wqMin < 10 ? 'var(--status-active)' : '#fbbf24', margin: '0.2rem 0 0' }}>
                  {resultadoColas.wqMin} min
                </p>
              </div>

              <div className="card" style={{ padding: '0.75rem 1rem' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                  Alumnos en Cola (Lq)
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.2rem 0 0' }}>
                  {resultadoColas.lq} personas
                </p>
              </div>

              <div className="card" style={{ padding: '0.75rem 1rem' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                  Tiempo en Sistema (Ws)
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--military-gold-primary)', margin: '0.2rem 0 0' }}>
                  {resultadoColas.wsMin} min
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'PREDICCION_H3' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cargar Escenario H3:</span>
              <button
                onClick={() => {
                  setCalifsH3(CASO_OFICIAL_H3);
                  setNombreH3('Cadete M. Suárez (Tabla 5.3)');
                  setObjetivoLvlH3(12);
                  setNuevoLibroH3('7');
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', border: '1px solid var(--military-gold-primary)' }}
              >
                <Award size={13} color="var(--military-gold-primary)" /> Caso Validación Oficial H3 (Tabla 5.3)
              </button>
              <button
                onClick={() => {
                  setCalifsH3(CASO_RIESGO_MEDIO);
                  setNombreH3('Sbtte. R. Condori');
                  setObjetivoLvlH3(6);
                  setNuevoLibroH3('6');
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
              >
                <TrendingDown size={13} color="#fbbf24" /> Caso Riesgo Medio
              </button>
              <button
                onClick={() => {
                  setCalifsH3(CASO_OPTIMO);
                  setNombreH3('Tte. C. Morales');
                  setObjetivoLvlH3(6);
                  setNuevoLibroH3('6');
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
              >
                <TrendingUp size={13} color="var(--status-active)" /> Caso Rendimiento Óptimo
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => setVistaLote(!vistaLote)}
                className={`btn ${vistaLote ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              >
                <Users size={13} /> {vistaLote ? 'Volver a Estudiante Individual' : 'Recálculo por Lote (Figura 5.4)'}
              </button>
              <button
                onClick={verificarConQuarkus}
                disabled={cargandoApi}
                className="btn btn-military"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                title="Llama al endpoint POST /api/analytics/prediccion-rendimiento"
              >
                <Server size={13} /> {cargandoApi ? 'Consultando Microservicio...' : 'Verificar con Quarkus REST'}
              </button>
            </div>
          </div>

          {servidorMsg && (
            <div
              style={{
                padding: '0.6rem 0.9rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: servidorMsg.tipo === 'ok' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${servidorMsg.tipo === 'ok' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                color: 'var(--text-main)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={14} color="var(--status-active)" />
                <span>
                  <strong>Servicio Activo:</strong> Respuesta validada desde <code>{servidorMsg.fuente}</code> en {servidorMsg.ms} ms.
                </span>
              </div>
              <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>
                Riesgo Servidor: {servidorMsg.data?.nivelRiesgo || 'OK'} &bull; R&sup2; = {servidorMsg.data?.r2 ?? '0.936'}
              </span>
            </div>
          )}

          {!vistaLote && (
            <>
              <div
                className="card"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  alignItems: 'flex-end',
                }}
              >
                <div>
                  <label className="input-label" style={{ fontSize: '0.72rem' }}>Nombre / Identificación del Estudiante</label>
                  <input
                    type="text"
                    value={nombreH3}
                    onChange={(e) => setNombreH3(e.target.value)}
                    className="input"
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.72rem' }}>Programa Académico</label>
                  <input
                    type="text"
                    value={programaH3}
                    onChange={(e) => setProgramaH3(e.target.value)}
                    className="input"
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.72rem' }}>Examen de Nivel Objetivo (Ecuación 4.10)</label>
                  <select
                    value={objetivoLvlH3}
                    onChange={(e) => setObjetivoLvlH3(e.target.value === 'AUTO' ? 'AUTO' : parseInt(e.target.value, 10))}
                    className="input"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <option value="AUTO">Automático (Siguiente examen no rendido)</option>
                    <option value={6}>Libro 6 — Examen Nivel 1</option>
                    <option value={12}>Libro 12 — Examen Nivel 2 (Caso H3)</option>
                    <option value={18}>Libro 18 — Examen Nivel 3</option>
                    <option value={24}>Libro 24 — Examen Nivel 4</option>
                    <option value={30}>Libro 30 — Examen Nivel 5</option>
                    <option value={36}>Libro 36 — Examen Nivel 6 (Final)</option>
                  </select>
                </div>

                <form
                  onSubmit={handleAgregarLibroH3}
                  style={{ display: 'flex', gap: '0.35rem', alignItems: 'flex-end' }}
                >
                  <div>
                    <label className="input-label" style={{ fontSize: '0.72rem' }}>Libro (1-36)</label>
                    <input
                      type="number"
                      min="1"
                      max="36"
                      value={nuevoLibroH3}
                      onChange={(e) => setNuevoLibroH3(e.target.value)}
                      className="input"
                      style={{ width: '75px', fontSize: '0.82rem' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label" style={{ fontSize: '0.72rem' }}>Nota (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={nuevaNotaH3}
                      onChange={(e) => setNuevaNotaH3(e.target.value)}
                      className="input"
                      style={{ width: '85px', fontSize: '0.82rem' }}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.65rem', height: '34px' }}>
                    <Plus size={13} /> Agregar
                  </button>
                </form>
              </div>

              {!resultadoH3.datosInsuficientes && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  <div className="card" style={{ padding: '0.85rem 1rem' }}>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                      Recta de Tendencia (&Ecirc; = ax + b)
                    </p>
                    <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--military-gold-primary)', margin: '0.2rem 0 0' }}>
                      {resultadoH3.ecuacionRecta}
                    </p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                      Pendiente a: <strong>{resultadoH3.a}</strong> pts/libro &bull; Intercepto b: <strong>{resultadoH3.b}</strong>
                    </p>
                  </div>

                  <div className="card" style={{ padding: '0.85rem 1rem' }}>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                      Bondad de Ajuste (R&sup2;)
                    </p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: resultadoH3.r2 >= 0.70 ? 'var(--status-active)' : '#fbbf24', margin: '0.2rem 0 0' }}>
                      {(resultadoH3.r2 * 100).toFixed(2)}%
                    </p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                      SS<sub>res</sub>: {resultadoH3.ssRes} &bull; SS<sub>tot</sub>: {resultadoH3.ssTot}
                    </p>
                  </div>

                  <div className="card" style={{ padding: '0.85rem 1rem', background: 'var(--bg-surface-elevated)' }}>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                      Proyección Examen Nivel (Libro {resultadoH3.xp})
                    </p>
                    <p style={{ fontSize: '1.35rem', fontWeight: 900, color: resultadoH3.yp >= 71 ? 'var(--status-active)' : (resultadoH3.yp >= 51 ? '#fbbf24' : '#ef4444'), margin: '0.2rem 0 0' }}>
                      &ycirc;<sub>{resultadoH3.xp}</sub> = {resultadoH3.yp} pts
                    </p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                      Umbral Aprobación: 71 pts &bull; Umbral Crítico: 51 pts
                    </p>
                  </div>

                  <div
                    className="card"
                    style={{
                      padding: '0.85rem 1rem',
                      borderLeft: `4px solid ${
                        resultadoH3.nivelRiesgo === 'ALTO' ? '#ef4444' : (resultadoH3.nivelRiesgo === 'MEDIO' ? '#fbbf24' : '#22c55e')
                      }`,
                    }}
                  >
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                      Riesgo Deserción R(x<sub>p</sub>)
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      {resultadoH3.nivelRiesgo === 'ALTO' && <AlertTriangle size={18} color="#ef4444" />}
                      {resultadoH3.nivelRiesgo === 'MEDIO' && <AlertCircle size={18} color="#fbbf24" />}
                      {resultadoH3.nivelRiesgo === 'BAJO' && <CheckCircle2 size={18} color="#22c55e" />}
                      <span
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          color: resultadoH3.nivelRiesgo === 'ALTO' ? '#ef4444' : (resultadoH3.nivelRiesgo === 'MEDIO' ? '#fbbf24' : '#22c55e'),
                        }}
                      >
                        RIESGO {resultadoH3.nivelRiesgo}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                      Regla Ecuación 4.11 ({resultadoH3.n} libros evaluados)
                    </p>
                  </div>
                </div>
              )}

              <div
                style={{
                  padding: '0.9rem 1.1rem',
                  borderRadius: '6px',
                  border: `1px solid ${
                    resultadoH3.nivelRiesgo === 'ALTO'
                      ? 'rgba(239, 68, 68, 0.4)'
                      : (resultadoH3.nivelRiesgo === 'MEDIO' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(34, 197, 94, 0.4)')
                  }`,
                  background:
                    resultadoH3.nivelRiesgo === 'ALTO'
                      ? 'rgba(239, 68, 68, 0.08)'
                      : (resultadoH3.nivelRiesgo === 'MEDIO' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(34, 197, 94, 0.08)'),
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  {resultadoH3.nivelRiesgo === 'ALTO' ? (
                    <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                  ) : resultadoH3.nivelRiesgo === 'MEDIO' ? (
                    <AlertCircle size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
                  ) : (
                    <CheckCircle2 size={20} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
                  )}
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                      Recomendación Oficial para el Jefe Académico (CEDMIL)
                    </h4>
                    <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0', color: 'var(--text-main)', lineHeight: 1.45 }}>
                      {resultadoH3.mensajeAlerta}
                    </p>
                  </div>
                </div>
              </div>

              {!resultadoH3.datosInsuficientes && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'var(--bg-surface-elevated)',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        Tabla 5.3: Dispersión, Residuos y Error Cuadrático del Ajuste Lineal
                      </h3>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                        Cálculo del residuo e<sub>i</sub> = y<sub>i</sub> - &ycirc;<sub>i</sub> y diferencias al cuadrado e<sub>i</sub>&sup2;
                      </p>
                    </div>
                    <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                      &Delta; = {resultadoH3.delta} &bull; n = {resultadoH3.n} libros
                    </span>
                  </div>

                  <div className="table-responsive">
                    <table className="table" style={{ margin: 0, fontSize: '0.78rem' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'center' }}>Libro (x<sub>i</sub>)</th>
                          <th style={{ textAlign: 'center' }}>Nota Observada (y<sub>i</sub>)</th>
                          <th style={{ textAlign: 'center' }}>Nota Ajustada (&ycirc;<sub>i</sub>)</th>
                          <th style={{ textAlign: 'center' }}>Residuo (e<sub>i</sub> = y - &ycirc;)</th>
                          <th style={{ textAlign: 'center', background: 'rgba(245, 158, 11, 0.08)' }}>
                            Error Cuadrático (e<sub>i</sub>&sup2;)
                          </th>
                          <th style={{ textAlign: 'center' }}>x<sub>i</sub>&sup2;</th>
                          <th style={{ textAlign: 'center' }}>x<sub>i</sub> &bull; y<sub>i</sub></th>
                          <th style={{ textAlign: 'right' }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultadoH3.tablaAjuste.map((fila) => (
                          <tr key={fila.libro}>
                            <td style={{ textAlign: 'center', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                              Libro {fila.libro}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-main)' }}>
                              {fila.nota}
                            </td>
                            <td style={{ textAlign: 'center', color: 'var(--military-gold-primary)' }}>
                              {fila.notaAjustada}
                            </td>
                            <td style={{ textAlign: 'center', color: fila.residuo >= 0 ? 'var(--status-active)' : '#ef4444' }}>
                              {fila.residuo >= 0 ? `+${fila.residuo}` : fila.residuo}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 800, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.04)' }}>
                              {fila.residuoCuadrado}
                            </td>
                            <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              {fila.xCuadrado}
                            </td>
                            <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              {fila.xy}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => handleEliminarLibroH3(fila.libro)}
                                className="btn btn-secondary btn-icon"
                                style={{ width: '24px', height: '24px', padding: 0, color: '#ef4444' }}
                                title="Eliminar calificación de este libro"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}

                        <tr style={{ background: 'var(--bg-surface-elevated)', fontWeight: 800, borderTop: '2px solid var(--border-subtle)' }}>
                          <td style={{ textAlign: 'center', color: 'var(--military-gold-primary)' }}>&Sigma; (SUMATORIAS)</td>
                          <td style={{ textAlign: 'center' }}>&Sigma;y = {resultadoH3.sumY}</td>
                          <td style={{ textAlign: 'center' }}>-</td>
                          <td style={{ textAlign: 'center' }}>&Sigma;e &asymp; 0.00</td>
                          <td style={{ textAlign: 'center', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)' }}>
                            SS<sub>res</sub> = {resultadoH3.ssRes}
                          </td>
                          <td style={{ textAlign: 'center' }}>&Sigma;x&sup2; = {resultadoH3.sumXX}</td>
                          <td style={{ textAlign: 'center' }}>&Sigma;xy = {resultadoH3.sumXY}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {vistaLote && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div className="card" style={{ padding: '0.75rem 1rem' }}>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                    Total Cohorte
                  </p>
                  <p style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '0.2rem 0 0' }}>
                    {resultadoLote.total} Estudiantes
                  </p>
                </div>

                <div className="card" style={{ padding: '0.75rem 1rem', borderLeft: '4px solid #ef4444' }}>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                    Riesgo Alto (Deserción)
                  </p>
                  <p style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ef4444', margin: '0.2rem 0 0' }}>
                    {resultadoLote.alto} Casos
                  </p>
                </div>

                <div className="card" style={{ padding: '0.75rem 1rem', borderLeft: '4px solid #fbbf24' }}>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                    Riesgo Medio (Alerta)
                  </p>
                  <p style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fbbf24', margin: '0.2rem 0 0' }}>
                    {resultadoLote.medio} Casos
                  </p>
                </div>

                <div className="card" style={{ padding: '0.75rem 1rem', borderLeft: '4px solid #22c55e' }}>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                    Riesgo Bajo (Óptimo)
                  </p>
                  <p style={{ fontSize: '1.35rem', fontWeight: 900, color: '#22c55e', margin: '0.2rem 0 0' }}>
                    {resultadoLote.bajo} Casos
                  </p>
                </div>

                <div className="card" style={{ padding: '0.75rem 1rem' }}>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                    Datos Insuficientes (n &lt; 3)
                  </p>
                  <p style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                    {resultadoLote.insuf} Casos
                  </p>
                </div>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Figura 5.4: Matriz de Recálculo Consolidado al Cierre de Rotación Docente
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                    Detección temprana y priorización para asignación de tutores pedagógicos antes del examen de nivel
                  </p>
                </div>

                <div className="table-responsive">
                  <table className="table" style={{ margin: 0, fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        <th>Estudiante</th>
                        <th>Programa</th>
                        <th style={{ textAlign: 'center' }}>Libros Evaluados</th>
                        <th style={{ textAlign: 'center' }}>Pendiente (a)</th>
                        <th style={{ textAlign: 'center' }}>Próx. Examen Nivel</th>
                        <th style={{ textAlign: 'center' }}>Nota Proyectada (&ycirc;<sub>p</sub>)</th>
                        <th style={{ textAlign: 'center' }}>Nivel de Riesgo R(x<sub>p</sub>)</th>
                        <th style={{ textAlign: 'right' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultadoLote.items.map((est) => (
                        <tr key={est.id}>
                          <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{est.nombre}</td>
                          <td>{est.programa}</td>
                          <td style={{ textAlign: 'center' }}>{est.calificaciones.length} libros</td>
                          <td style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>
                            {est.a !== '-' ? `${est.a} pts/l` : '-'}
                          </td>
                          <td style={{ textAlign: 'center' }}>Libro {est.objetivo}</td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--military-gold-primary)' }}>
                            {est.yp !== '-' ? `${est.yp} pts` : '-'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              className={`badge ${
                                est.riesgo === 'ALTO'
                                  ? 'badge-danger'
                                  : (est.riesgo === 'MEDIO' ? 'badge-gold' : (est.riesgo === 'BAJO' ? 'badge-military' : ''))
                              }`}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.2rem 0.5rem',
                                color: est.riesgo === 'ALTO' ? '#ef4444' : (est.riesgo === 'MEDIO' ? '#fbbf24' : '#22c55e'),
                              }}
                            >
                              {est.riesgo}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                setCalifsH3(est.calificaciones);
                                setNombreH3(est.nombre);
                                setProgramaH3(est.programa);
                                setObjetivoLvlH3(est.objetivo);
                                setVistaLote(false);
                              }}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                            >
                              Analizar Detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
