'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  Sliders,
  Users,
  GraduationCap,
  AlertTriangle,
  Server,
  RotateCcw
} from 'lucide-react';

interface PuntoDato {
  id: number;
  x: number;
  y: number;
  etiqueta?: string;
}

interface CalificacionRegistro {
  libro: number;
  nota: number;
}

export default function MetodosNumericosPage() {
  const [tabActiva, setTabActiva] = useState<'PROYECCION' | 'CAPACIDAD' | 'RECURSOS' | 'VENTANILLAS' | 'MONITOREO'>('PROYECCION');

  const SERIE_DEMANDA: PuntoDato[] = [
    { id: 1, x: 1, y: 45, etiqueta: 'Enero' },
    { id: 2, x: 2, y: 52, etiqueta: 'Febrero' },
    { id: 3, x: 3, y: 68, etiqueta: 'Marzo' },
    { id: 4, x: 4, y: 74, etiqueta: 'Abril' },
    { id: 5, x: 5, y: 88, etiqueta: 'Mayo' },
    { id: 6, x: 6, y: 95, etiqueta: 'Junio' },
  ];

  const [puntos, setPuntos] = useState<PuntoDato[]>(SERIE_DEMANDA);
  const [nuevoX, setNuevoX] = useState<string>('7');
  const [nuevoY, setNuevoY] = useState<string>('105');
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState<string>('Julio');
  const [horizonteEstimacion, setHorizonteEstimacion] = useState<number>(7);

  const resultadoTendencia = useMemo(() => {
    const n = puntos.length;
    if (n < 2) return null;

    let sumX = 0, sumY = 0, sumX2 = 0, sumXY = 0;
    for (const p of puntos) {
      sumX += p.x;
      sumY += p.y;
      sumX2 += (p.x * p.x);
      sumXY += (p.x * p.y);
    }

    const mediaX = sumX / n;
    const mediaY = sumY / n;
    const denM = (n * sumX2) - (sumX * sumX);
    if (Math.abs(denM) < 1e-9) return null;

    const m = ((n * sumXY) - (sumX * sumY)) / denM;
    const b = mediaY - (m * mediaX);

    let varianzaError = 0;
    let varianzaTotal = 0;

    const filasDetalle = puntos.map((p) => {
      const estimado = m * p.x + b;
      const diferencia = p.y - estimado;
      varianzaError += (diferencia * diferencia);
      varianzaTotal += Math.pow(p.y - mediaY, 2);

      return {
        id: p.id,
        etiqueta: p.etiqueta || `Punto ${p.x}`,
        entrada: p.x,
        observado: p.y,
        estimado: Math.round(estimado * 10) / 10,
        diferencia: Math.round(diferencia * 10) / 10,
      };
    });

    const confiabilidad = varianzaTotal > 0 ? Math.max(0, Math.min(1, 1 - (varianzaError / varianzaTotal))) : 1;
    const pronostico = Math.max(0, Math.round((m * horizonteEstimacion + b) * 10) / 10);

    return {
      confiabilidad: Math.round(confiabilidad * 100),
      pronostico,
      promedio: Math.round(mediaY * 10) / 10,
      variabilidad: Math.round(Math.sqrt(varianzaError / Math.max(1, n - 2)) * 10) / 10,
      filas: filasDetalle,
    };
  }, [puntos, horizonteEstimacion]);

  const [tasaEntrada, setTasaEntrada] = useState<number>(24);
  const [capacidadAtencion, setCapacidadAtencion] = useState<number>(30);
  const [numVentanillas, setNumVentanillas] = useState<number>(2);

  const flujoAtencion = useMemo(() => {
    const servidores = Math.max(1, numVentanillas);
    const lambda = Math.max(1, tasaEntrada);
    const mu = Math.max(1, capacidadAtencion);
    const capacidadTotal = servidores * mu;
    const ocupacion = Math.min(100, Math.round((lambda / capacidadTotal) * 100));

    const tiempoEsperaMin = ocupacion > 90 ? 12 : (ocupacion > 70 ? 6 : 3);
    const personasEnEspera = Math.round((lambda * (tiempoEsperaMin / 60)) * 10) / 10;

    return {
      ocupacion,
      tiempoEsperaMin,
      personasEnEspera,
      capacidadTotal,
      balance: ocupacion < 80 ? 'FLUIDO' : (ocupacion < 95 ? 'ALTO FLUJO' : 'SATURADO'),
    };
  }, [tasaEntrada, capacidadAtencion, numVentanillas]);

  const [calificacionesEstudiante, setCalificacionesEstudiante] = useState<CalificacionRegistro[]>([
    { libro: 1, nota: 78 },
    { libro: 2, nota: 74 },
    { libro: 3, nota: 75 },
    { libro: 4, nota: 68 },
    { libro: 5, nota: 66 },
    { libro: 6, nota: 61 },
  ]);

  const monitoreoEstudiante = useMemo(() => {
    const n = calificacionesEstudiante.length;
    if (n < 2) return null;

    let sX = 0, sY = 0, sXX = 0, sXY = 0;
    for (const c of calificacionesEstudiante) {
      sX += c.libro;
      sY += c.nota;
      sXX += (c.libro * c.libro);
      sXY += (c.libro * c.nota);
    }

    const den = (n * sXX) - (sX * sX);
    if (Math.abs(den) < 1e-9) return null;

    const pend = ((n * sXY) - (sX * sY)) / den;
    const inter = (sY - (pend * sX)) / n;

    const proyeccionExamenNivel = Math.max(0, Math.min(100, Math.round((pend * 12 + inter) * 10) / 10));
    const estado = proyeccionExamenNivel < 51 ? 'ATENCIÓN CRÍTICA' : (proyeccionExamenNivel < 65 ? 'SEGUIMIENTO PREVENTIVO' : 'REGULAR');

    return {
      promedioActual: Math.round((sY / n) * 10) / 10,
      proyeccionExamenNivel,
      tendencia: pend < 0 ? 'Descendente' : 'Favorable',
      estado,
    };
  }, [calificacionesEstudiante]);

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
              <span>SACA</span>
              <span>/</span>
              <span className="text-purple-400 font-semibold">Modelos y Proyecciones</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              Modelos y Proyecciones Institucionales
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setTabActiva('PROYECCION')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            tabActiva === 'PROYECCION' ? 'bg-purple-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          Proyección de Demanda
        </button>
        <button
          onClick={() => setTabActiva('CAPACIDAD')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            tabActiva === 'CAPACIDAD' ? 'bg-sky-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          Capacidad Operativa
        </button>
        <button
          onClick={() => setTabActiva('VENTANILLAS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            tabActiva === 'VENTANILLAS' ? 'bg-amber-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          Flujo de Ventanillas
        </button>
        <button
          onClick={() => setTabActiva('MONITOREO')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            tabActiva === 'MONITOREO' ? 'bg-emerald-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          Monitoreo Académico
        </button>
      </div>

      {tabActiva === 'PROYECCION' && resultadoTendencia && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl">
              <span className="text-[11px] text-neutral-400 block">Proyección Estimada</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">{resultadoTendencia.pronostico}</p>
              <span className="text-[10px] text-neutral-500">Unidades estimadas</span>
            </div>
            <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl">
              <span className="text-[11px] text-neutral-400 block">Índice de Confiabilidad</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{resultadoTendencia.confiabilidad}%</p>
              <span className="text-[10px] text-neutral-500">Ajuste de datos</span>
            </div>
            <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl">
              <span className="text-[11px] text-neutral-400 block">Margen de Variabilidad</span>
              <p className="text-2xl font-bold font-mono text-purple-400 mt-1">±{resultadoTendencia.variabilidad}</p>
              <span className="text-[10px] text-neutral-500">Desviación estándar</span>
            </div>
            <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl">
              <span className="text-[11px] text-neutral-400 block">Promedio Histórico</span>
              <p className="text-2xl font-bold font-mono text-sky-400 mt-1">{resultadoTendencia.promedio}</p>
              <span className="text-[10px] text-neutral-500">Unidades base</span>
            </div>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white">Parámetros de Entrada y Proyección</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Periodo a Estimar:</span>
                <input
                  type="number"
                  min="1"
                  value={horizonteEstimacion}
                  onChange={(e) => setHorizonteEstimacion(parseInt(e.target.value) || 1)}
                  className="w-20 bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="p-2.5">Periodo</th>
                    <th className="p-2.5 text-center">Valor Registrado</th>
                    <th className="p-2.5 text-center">Valor Estimado</th>
                    <th className="p-2.5 text-right">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-300">
                  {resultadoTendencia.filas.map((f) => (
                    <tr key={f.id} className="hover:bg-neutral-800/20">
                      <td className="p-2.5 font-semibold text-white">{f.etiqueta}</td>
                      <td className="p-2.5 text-center font-mono text-sky-400">{f.observado}</td>
                      <td className="p-2.5 text-center font-mono text-neutral-300">{f.estimado}</td>
                      <td className="p-2.5 text-right font-mono text-neutral-400">{f.diferencia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'CAPACIDAD' && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
              <span className="text-xs text-neutral-400">Capacidad Máxima por Aula</span>
              <p className="text-2xl font-bold font-mono text-white">30 Alumnos</p>
              <p className="text-[11px] text-neutral-500">Aforo estándar normado</p>
            </div>
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
              <span className="text-xs text-neutral-400">Apertura Mínima Viable</span>
              <p className="text-2xl font-bold font-mono text-amber-400">10 Alumnos</p>
              <p className="text-[11px] text-neutral-500">Punto de equilibrio operativo</p>
            </div>
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
              <span className="text-xs text-neutral-400">Eficiencia Institucional</span>
              <p className="text-2xl font-bold font-mono text-emerald-400">85%</p>
              <p className="text-[11px] text-neutral-500">Aprovechamiento global de espacios</p>
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'VENTANILLAS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl">
              <span className="text-[11px] text-neutral-400 block">Nivel de Ocupación</span>
              <p className="text-2xl font-bold font-mono text-amber-400 mt-1">{flujoAtencion.ocupacion}%</p>
              <span className="text-[10px] text-neutral-500">{flujoAtencion.balance}</span>
            </div>
            <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl">
              <span className="text-[11px] text-neutral-400 block">Tiempo Estimado en Sala</span>
              <p className="text-2xl font-bold font-mono text-sky-400 mt-1">{flujoAtencion.tiempoEsperaMin} min</p>
              <span className="text-[10px] text-neutral-500">Por usuario</span>
            </div>
            <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl">
              <span className="text-[11px] text-neutral-400 block">Promedio en Espera</span>
              <p className="text-2xl font-bold font-mono text-purple-400 mt-1">{flujoAtencion.personasEnEspera}</p>
              <span className="text-[10px] text-neutral-500">Personas simultáneas</span>
            </div>
            <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl">
              <span className="text-[11px] text-neutral-400 block">Capacidad de Atención</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{flujoAtencion.capacidadTotal}</p>
              <span className="text-[10px] text-neutral-500">Trámites / hora</span>
            </div>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Configuración del Flujo Operativo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-neutral-300 block mb-1">Afluencia Estimada (solicitudes/hora)</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={tasaEntrada}
                  onChange={(e) => setTasaEntrada(parseInt(e.target.value) || 5)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-neutral-300 block mb-1">Velocidad de Ventanilla (atenciones/hora)</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={capacidadAtencion}
                  onChange={(e) => setCapacidadAtencion(parseInt(e.target.value) || 5)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-neutral-300 block mb-1">Ventanillas Habilitadas</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={numVentanillas}
                  onChange={(e) => setNumVentanillas(parseInt(e.target.value) || 1)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'MONITOREO' && monitoreoEstudiante && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
              <span className="text-xs text-neutral-400">Promedio Parcial Actual</span>
              <p className="text-3xl font-extrabold font-mono text-white mt-1">{monitoreoEstudiante.promedioActual}</p>
              <span className="text-[10px] text-neutral-500">Sobre 100 puntos</span>
            </div>
            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
              <span className="text-xs text-neutral-400">Desempeño Estimado Examen de Nivel</span>
              <p className={`text-3xl font-extrabold font-mono mt-1 ${
                monitoreoEstudiante.proyeccionExamenNivel >= 71 ? 'text-emerald-400' : (monitoreoEstudiante.proyeccionExamenNivel >= 51 ? 'text-amber-400' : 'text-red-400')
              }`}>
                {monitoreoEstudiante.proyeccionExamenNivel}
              </p>
              <span className="text-[10px] text-neutral-500">Estimación al cierre de nivel</span>
            </div>
            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
              <span className="text-xs text-neutral-400">Diagnóstico Preventivo</span>
              <p className="text-base font-bold mt-2 text-white">{monitoreoEstudiante.estado}</p>
              <span className="text-[10px] text-neutral-400">Tendencia: {monitoreoEstudiante.tendencia}</span>
            </div>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Notas Históricas por Libro</h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {calificacionesEstudiante.map((c, i) => (
                <div key={c.libro} className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 block">Libro {c.libro}</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={c.nota}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const copia = [...calificacionesEstudiante];
                      copia[i].nota = val;
                      setCalificacionesEstudiante(copia);
                    }}
                    className="w-full bg-neutral-900 border border-neutral-700 text-center text-sm font-mono font-bold text-white rounded mt-1 py-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
