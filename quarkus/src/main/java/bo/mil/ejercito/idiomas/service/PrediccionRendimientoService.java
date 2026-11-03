package bo.mil.ejercito.idiomas.service;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.*;

/**
 * Servicio Predictivo de Rendimiento Académico — H3 Proyecto Semestral MN
 *
 * Implementa el modelo numérico del documento H3:
 * - Ajuste lineal por mínimos cuadrados (Figura 5.2)
 * - Proyección al siguiente examen de nivel (Ecuación 4.10)
 * - Clasificación de riesgo de deserción R(x_p) (Figura 5.3, Ecuación 4.11)
 * - Recálculo por lotes al cierre de rotación docente (Figura 5.4)
 *
 * Parámetros de configuración (Tabla 5.2 del H3):
 *   n_min = 3 libros evaluados
 *   Rango de calificaciones: [0, 100]
 *   Libros de examen de nivel: {6, 12, 18, 24, 30, 36}
 *   ALTO:  ŷ_p < 51  OR  a < -3.0
 *   MEDIO: 51 ≤ ŷ_p < 65  OR  -3.0 ≤ a < 0
 *   BAJO:  ŷ_p ≥ 65  AND  a ≥ 0
 */
@ApplicationScoped
public class PrediccionRendimientoService {

    // =========================================================================
    // CONSTANTES DE CONFIGURACIÓN (Tabla 5.2 del documento H3)
    // =========================================================================
    /** Número mínimo de libros evaluados para que el ajuste sea significativo */
    public static final int N_MIN = 3;

    /** Libros en los que se rinden exámenes de nivel (múltiplos de 6) */
    public static final int[] EXAMENES_NIVEL = {6, 12, 18, 24, 30, 36};

    /** Nota mínima de aprobación institucional */
    public static final double NOTA_APROBACION = 71.0;

    /** Umbral inferior de riesgo ALTO por proyección */
    public static final double UMBRAL_ALTO = 51.0;

    /** Umbral inferior de riesgo MEDIO por proyección */
    public static final double UMBRAL_MEDIO = 65.0;

    /** Umbral de pendiente para riesgo ALTO */
    public static final double PENDIENTE_ALTO = -3.0;

    // =========================================================================
    // DTOs
    // =========================================================================

    /** Entrada: calificación de un libro evaluado */
    public static class CalificacionLibro {
        /** Número de libro (x_i ∈ {1, 2, ..., 36}) */
        public int libro;
        /** Calificación obtenida (y_i ∈ [0, 100]) */
        public double nota;

        public CalificacionLibro() {}
        public CalificacionLibro(int libro, double nota) {
            this.libro = libro;
            this.nota = nota;
        }
    }

    /** Fila de la tabla de dispersión y residuos (Tabla 5.3 del H3) */
    public static class FilaAjuste {
        public int libro;          // x_i
        public double nota;        // y_i (observada)
        public double notaAjustada; // ŷ_i = a*x_i + b
        public double residuo;     // e_i = y_i - ŷ_i
        public double residuoCuadrado; // e_i²
    }

    /** Resultado completo de la predicción para un estudiante (Figuras 5.1-5.3) */
    public static class PrediccionResultado {
        // Datos del estudiante
        public Long idEstudiante;
        public String nombreEstudiante;
        public String programa;

        // Datos de entrada
        public int librosEvaluados;        // n
        public boolean datosInsuficientes; // true si n < N_MIN

        // Coeficientes del modelo (Ecuaciones 4.7, 4.8)
        public double pendienteA;          // a (tasa de variación del rendimiento)
        public double interceptoB;         // b (desempeño base)
        public String ecuacionRecta;       // "y = ax + b"

        // Sumatorias del cálculo (§5.2.1)
        public double sumX;
        public double sumY;
        public double sumX2;
        public double sumXY;

        // Medidas de ajuste (Ecuación 4.9)
        public double ssRes;               // SS_res = Σ(y_i - ŷ_i)²
        public double ssTot;               // SS_tot = Σ(y_i - ȳ)²
        public double r2;                  // Coeficiente de determinación R²

        // Proyección (Ecuación 4.10)
        public int libroExamenNivel;       // x_p (siguiente examen de nivel)
        public double notaProyectada;      // ŷ_p = a*x_p + b (acotada a [0, 100])

        // Clasificación de riesgo (Ecuación 4.11, Figura 5.3)
        public String nivelRiesgo;         // "ALTO", "MEDIO" o "BAJO"
        public String mensajeAlerta;       // Descripción textual de la alerta

        // Tabla detallada de ajuste (Tabla 5.3)
        public List<FilaAjuste> tablaAjuste;
    }

    /** Solicitud de predicción individual */
    public static class PrediccionRequest {
        public Long idEstudiante;
        public String nombreEstudiante;
        public String programa;
        public List<CalificacionLibro> calificaciones;
        /** Libro de examen de nivel a proyectar (opcional; si no se indica, se calcula automáticamente) */
        public Integer libroExamenNivelObjetivo;
    }

    /** Solicitud de recálculo por lotes (Figura 5.4) */
    public static class LoteRequest {
        public List<PrediccionRequest> estudiantes;
    }

    /** Resultado del recálculo por lotes */
    public static class LoteResultado {
        public int totalEstudiantes;
        public int datosInsuficientes;
        public int riesgoAlto;
        public int riesgoMedio;
        public int riesgoBajo;
        public List<PrediccionResultado> resultados;
        public List<PrediccionResultado> alertas; // Solo MEDIO y ALTO
    }

    // =========================================================================
    // 1. PREDICCIÓN INDIVIDUAL (Figuras 5.1 + 5.2 + 5.3)
    // =========================================================================

    /**
     * Ejecuta el flujo completo del servicio predictivo para un estudiante:
     * 1. Verifica n >= N_MIN (Tabla 5.2)
     * 2. Ajusta la recta y = ax + b por mínimos cuadrados (Figura 5.2)
     * 3. Proyecta ŷ_p para el siguiente examen de nivel (Ecuación 4.10)
     * 4. Clasifica el riesgo de deserción R(x_p) (Figura 5.3, Ecuación 4.11)
     */
    public PrediccionResultado predecir(PrediccionRequest request) {
        if (request == null || request.calificaciones == null) {
            throw new IllegalArgumentException("Se requieren las calificaciones del estudiante.");
        }

        PrediccionResultado resultado = new PrediccionResultado();
        resultado.idEstudiante = request.idEstudiante;
        resultado.nombreEstudiante = request.nombreEstudiante;
        resultado.programa = request.programa != null ? request.programa : "Inglés";

        List<CalificacionLibro> califs = new ArrayList<>(request.calificaciones);
        // Ordenar por número de libro
        califs.sort(Comparator.comparingInt(c -> c.libro));

        int n = califs.size();
        resultado.librosEvaluados = n;

        // ── Paso 1: Verificar n >= N_MIN (Tabla 5.2 del H3) ──────────────
        if (n < N_MIN) {
            resultado.datosInsuficientes = true;
            resultado.nivelRiesgo = "DATOS_INSUFICIENTES";
            resultado.mensajeAlerta = String.format(
                "Se requieren al menos %d libros evaluados para generar la predicción. " +
                "Actualmente el estudiante tiene %d libro(s) registrado(s).", N_MIN, n);
            return resultado;
        }

        resultado.datosInsuficientes = false;

        // ── Paso 2: Ajuste por mínimos cuadrados (Figura 5.2) ────────────
        // Acumular sumatorias en una sola pasada
        double sumX = 0, sumY = 0, sumXX = 0, sumXY = 0;

        for (CalificacionLibro c : califs) {
            sumX += c.libro;
            sumY += c.nota;
            sumXX += (double) c.libro * c.libro;
            sumXY += (double) c.libro * c.nota;
        }

        // Determinante Δ = n*S_xx - S_x² (Figura 5.2)
        double delta = (n * sumXX) - (sumX * sumX);

        if (Math.abs(delta) < 1e-9) {
            // Abscisas sin variación (Δ = 0) — caso degenerado
            resultado.datosInsuficientes = true;
            resultado.nivelRiesgo = "ERROR_CALCULO";
            resultado.mensajeAlerta = "Abscisas sin variación: todos los libros tienen el mismo número.";
            return resultado;
        }

        // Coeficientes óptimos (Ecuaciones 4.7 y 4.8)
        double a = ((n * sumXY) - (sumX * sumY)) / delta;
        double b = (sumY - (a * sumX)) / n;

        resultado.pendienteA = redondear(a, 4);
        resultado.interceptoB = redondear(b, 4);
        resultado.sumX = redondear(sumX, 2);
        resultado.sumY = redondear(sumY, 2);
        resultado.sumX2 = redondear(sumXX, 2);
        resultado.sumXY = redondear(sumXY, 2);
        resultado.ecuacionRecta = String.format("y = %.4fx %s %.4f",
            resultado.pendienteA,
            resultado.interceptoB >= 0 ? "+" : "-",
            Math.abs(resultado.interceptoB));

        // Media de Y
        double mediaY = sumY / n;

        // Tabla de ajuste y cálculo de SS_res y SS_tot (Ecuación 4.9)
        double ssRes = 0.0;
        double ssTot = 0.0;
        List<FilaAjuste> tabla = new ArrayList<>();

        for (CalificacionLibro c : califs) {
            FilaAjuste fila = new FilaAjuste();
            fila.libro = c.libro;
            fila.nota = c.nota;
            fila.notaAjustada = redondear(a * c.libro + b, 2);
            fila.residuo = redondear(c.nota - fila.notaAjustada, 2);
            fila.residuoCuadrado = redondear(fila.residuo * fila.residuo, 4);

            ssRes += (c.nota - (a * c.libro + b)) * (c.nota - (a * c.libro + b));
            ssTot += (c.nota - mediaY) * (c.nota - mediaY);

            tabla.add(fila);
        }

        resultado.ssRes = redondear(ssRes, 4);
        resultado.ssTot = redondear(ssTot, 4);

        // R² (Ecuación 4.9), caso especial: notas constantes → R² = 1
        if (Math.abs(ssTot) < 1e-9) {
            resultado.r2 = 1.0;
        } else {
            resultado.r2 = redondear(1.0 - (ssRes / ssTot), 4);
        }

        resultado.tablaAjuste = tabla;

        // ── Paso 3: Proyección al siguiente examen de nivel (Ecuación 4.10) ──
        int ultimoLibroEvaluado = califs.get(califs.size() - 1).libro;
        int xp;

        if (request.libroExamenNivelObjetivo != null) {
            xp = request.libroExamenNivelObjetivo;
        } else {
            xp = calcularSiguienteExamenNivel(ultimoLibroEvaluado);
        }

        resultado.libroExamenNivel = xp;

        // ŷ_p = a * x_p + b, acotado a [0, 100] (Figura 5.3)
        double yp = a * xp + b;
        yp = Math.min(100.0, Math.max(0.0, yp));
        resultado.notaProyectada = redondear(yp, 2);

        // ── Paso 4: Clasificación del riesgo R(x_p) (Ecuación 4.11, Figura 5.3) ──
        clasificarRiesgo(resultado, a, yp);

        return resultado;
    }

    // =========================================================================
    // 2. RECÁLCULO POR LOTES (Figura 5.4 del H3)
    // =========================================================================

    /**
     * Recálculo programado de alertas al cierre de cada rotación docente (15 días).
     * Recorre las inscripciones activas, aplica los flujos de las Figuras 5.2 y 5.3,
     * y genera el reporte de estudiantes en riesgo MEDIO y ALTO para el Jefe Académico.
     */
    public LoteResultado recalcularLote(LoteRequest request) {
        if (request == null || request.estudiantes == null) {
            throw new IllegalArgumentException("Se requiere la lista de estudiantes para el recálculo por lotes.");
        }

        LoteResultado lote = new LoteResultado();
        lote.totalEstudiantes = request.estudiantes.size();
        lote.datosInsuficientes = 0;
        lote.riesgoAlto = 0;
        lote.riesgoMedio = 0;
        lote.riesgoBajo = 0;
        lote.resultados = new ArrayList<>();
        lote.alertas = new ArrayList<>();

        for (PrediccionRequest est : request.estudiantes) {
            PrediccionResultado res = predecir(est);
            lote.resultados.add(res);

            if (res.datosInsuficientes) {
                lote.datosInsuficientes++;
            } else {
                switch (res.nivelRiesgo) {
                    case "ALTO":
                        lote.riesgoAlto++;
                        lote.alertas.add(res);
                        break;
                    case "MEDIO":
                        lote.riesgoMedio++;
                        lote.alertas.add(res);
                        break;
                    case "BAJO":
                        lote.riesgoBajo++;
                        break;
                }
            }
        }

        return lote;
    }

    // =========================================================================
    // 3. CASO DE VALIDACIÓN (Tabla 5.3 y §5.2.1 del H3)
    // =========================================================================

    /**
     * Genera el caso de validación con los datos hipotéticos del documento H3 (Tabla 5.3):
     * Libros 1-6 con notas {78, 74, 75, 68, 66, 61}.
     * Resultado esperado: a ≈ -3.314, b ≈ 81.933, R² ≈ 0.936, ŷ_12 ≈ 42.16 → Riesgo ALTO
     */
    public PrediccionResultado casoValidacionH3() {
        PrediccionRequest request = new PrediccionRequest();
        request.idEstudiante = 0L;
        request.nombreEstudiante = "Caso Hipotético H3 (Tabla 5.3)";
        request.programa = "Inglés";
        request.libroExamenNivelObjetivo = 12;

        request.calificaciones = new ArrayList<>();
        request.calificaciones.add(new CalificacionLibro(1, 78));
        request.calificaciones.add(new CalificacionLibro(2, 74));
        request.calificaciones.add(new CalificacionLibro(3, 75));
        request.calificaciones.add(new CalificacionLibro(4, 68));
        request.calificaciones.add(new CalificacionLibro(5, 66));
        request.calificaciones.add(new CalificacionLibro(6, 61));

        return predecir(request);
    }

    // =========================================================================
    // MÉTODOS AUXILIARES PRIVADOS
    // =========================================================================

    /**
     * Determina el siguiente examen de nivel no rendido aún.
     * Si el estudiante ya pasó todos los exámenes, proyecta al libro 36.
     */
    private int calcularSiguienteExamenNivel(int ultimoLibroEvaluado) {
        for (int xp : EXAMENES_NIVEL) {
            if (xp > ultimoLibroEvaluado) {
                return xp;
            }
        }
        // Si ya evaluó los 36 libros, proyectar al 36 de todos modos
        return 36;
    }

    /**
     * Clasificación del riesgo de deserción R(x_p) — Ecuación 4.11, Figura 5.3
     *
     * Las condiciones se evalúan en orden, de la más severa a la más leve:
     *   ALTO:  ŷ_p < 51  OR  a < -3.0
     *   MEDIO: 51 ≤ ŷ_p < 65  OR  -3.0 ≤ a < 0
     *   BAJO:  ŷ_p ≥ 65  AND  a ≥ 0
     */
    private void clasificarRiesgo(PrediccionResultado resultado, double a, double yp) {
        if (yp < UMBRAL_ALTO || a < PENDIENTE_ALTO) {
            resultado.nivelRiesgo = "ALTO";
            StringBuilder msg = new StringBuilder("⚠️ RIESGO ALTO DE DESERCIÓN — ");
            List<String> razones = new ArrayList<>();
            if (yp < UMBRAL_ALTO) {
                razones.add(String.format("nota proyectada (%.2f) inferior al umbral de %d puntos", yp, (int) UMBRAL_ALTO));
            }
            if (a < PENDIENTE_ALTO) {
                razones.add(String.format("pendiente de rendimiento (%.4f) indica pérdida mayor a %.1f puntos por libro", a, Math.abs(PENDIENTE_ALTO)));
            }
            msg.append(String.join(" y ", razones));
            msg.append(". Se recomienda intervención pedagógica inmediata del Jefe Académico antes del examen de nivel del libro ");
            msg.append(resultado.libroExamenNivel).append(".");
            resultado.mensajeAlerta = msg.toString();

        } else if (yp < UMBRAL_MEDIO || a < 0) {
            resultado.nivelRiesgo = "MEDIO";
            StringBuilder msg = new StringBuilder("⚡ RIESGO MEDIO — ");
            List<String> razones = new ArrayList<>();
            if (yp < UMBRAL_MEDIO) {
                razones.add(String.format("nota proyectada (%.2f) por debajo de %d puntos", yp, (int) UMBRAL_MEDIO));
            }
            if (a < 0) {
                razones.add(String.format("tendencia descendente (pendiente %.4f)", a));
            }
            msg.append(String.join(" y ", razones));
            msg.append(". Se sugiere seguimiento académico reforzado y tutoría complementaria.");
            resultado.mensajeAlerta = msg.toString();

        } else {
            resultado.nivelRiesgo = "BAJO";
            resultado.mensajeAlerta = String.format(
                "✅ RIESGO BAJO — Trayectoria estable o ascendente (pendiente %.4f). " +
                "Nota proyectada de %.2f puntos para el examen de nivel del libro %d. " +
                "El estudiante avanza dentro del rango esperado.",
                a, yp, resultado.libroExamenNivel);
        }
    }

    /** Redondea un valor a N decimales */
    private double redondear(double valor, int decimales) {
        double factor = Math.pow(10, decimales);
        return Math.round(valor * factor) / factor;
    }
}
