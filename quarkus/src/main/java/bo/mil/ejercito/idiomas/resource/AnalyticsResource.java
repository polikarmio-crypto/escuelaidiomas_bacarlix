package bo.mil.ejercito.idiomas.resource;

import bo.mil.ejercito.idiomas.service.AsignacionDocenteService;
import bo.mil.ejercito.idiomas.service.AsignacionDocenteService.AsignacionOptima;
import bo.mil.ejercito.idiomas.service.AsignacionDocenteService.DocenteCandidato;
import bo.mil.ejercito.idiomas.service.MetodosNumericosService;
import bo.mil.ejercito.idiomas.service.MetodosNumericosService.PuntoData;
import bo.mil.ejercito.idiomas.service.MetodosNumericosService.MinimosCuadradosResultado;
import bo.mil.ejercito.idiomas.service.MetodosNumericosService.NewtonResultado;
import bo.mil.ejercito.idiomas.service.MetodosNumericosService.SimplexResultado;
import bo.mil.ejercito.idiomas.service.PrediccionRendimientoService;
import bo.mil.ejercito.idiomas.service.PrediccionRendimientoService.PrediccionRequest;
import bo.mil.ejercito.idiomas.service.PrediccionRendimientoService.PrediccionResultado;
import bo.mil.ejercito.idiomas.service.PrediccionRendimientoService.LoteRequest;
import bo.mil.ejercito.idiomas.service.PrediccionRendimientoService.LoteResultado;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.*;

@Path("/api/analytics")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AnalyticsResource {

    @Inject
    AsignacionDocenteService asignacionDocenteService;

    @Inject
    MetodosNumericosService metodosNumericosService;

    @Inject
    PrediccionRendimientoService prediccionRendimientoService;

    // DTOs para Request y Response de Asignación Óptima
    public static class AsignacionRequest {
        public List<String> paralelos;
        public String idiomaRequerido;
        public List<DocenteCandidato> candidatos;
    }

    // DTOs para Teoría de Colas (M/M/c)
    public static class QueueMmcRequest {
        public double lambda; // Tasa de llegada (clientes/hora)
        public double mu;     // Tasa de servicio por ventanilla (clientes/hora)
        public int c;         // Cantidad de ventanillas/cajas activas
    }

    public static class QueueMmcResponse {
        public double lambda;
        public double mu;
        public int c;
        public double rho;               // Utilización del sistema (0 a 1)
        public double p0;                // Probabilidad de sistema vacío
        public double erlangC;           // Probabilidad de espera (C de Erlang)
        public double lq;                // Cantidad promedio en cola
        public double l;                 // Cantidad promedio en sistema (cola + servicio)
        public double wqMinutos;         // Tiempo promedio en cola (minutos)
        public double wsMinutos;         // Tiempo promedio total en sistema (minutos)
        public boolean esEstable;
        public String diagnostico;
        public String recomendacionMilitar;
    }

    // DTOs para Métodos Numéricos
    public static class MinimosCuadradosRequest {
        public List<PuntoData> puntos;
        public List<Double> periodosFuturos;
    }

    public static class NewtonRequest {
        public List<Double> x;
        public List<Double> y;
        public double xEval;
    }

    public static class SimplexRequest {
        public double[] c;          // Coeficientes función objetivo
        public double[][] A;        // Matriz de restricciones
        public double[] b;          // Lado derecho (RHS)
    }

    @GET
    @Path("/status")
    public Response status() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("servicio", "Microservicio de Métodos Numéricos, Investigación Operativa y Analítica Predictiva");
        status.put("institucion", "Escuela de Idiomas del Ejército (EIE) • CEDMIL");
        status.put("estado", "OPERATIVO");
        status.put("version", "3.0.0-H3");
        status.put("documento_base", "H3 - Proyecto Semestral MN");
        status.put("modulos", List.of(
            "Predicción de Rendimiento Académico (H3: Mínimos Cuadrados + Riesgo de Deserción)",
            "Método de Mínimos Cuadrados (Regresión Lineal con SSE, R² y Pearson)",
            "Interpolación por Diferencias Divididas de Newton",
            "Programación Lineal: Método Simplex (Maximización de Recursos Militares)",
            "Teoría de Colas M/M/c con disciplina FIFO para cajas",
            "Algoritmo de Rotación Docente Quincenal (<= 15 días)"
        ));
        status.put("parametros_h3", Map.of(
            "n_min", PrediccionRendimientoService.N_MIN,
            "examenes_nivel", PrediccionRendimientoService.EXAMENES_NIVEL,
            "umbral_alto", PrediccionRendimientoService.UMBRAL_ALTO,
            "umbral_medio", PrediccionRendimientoService.UMBRAL_MEDIO,
            "pendiente_critica", PrediccionRendimientoService.PENDIENTE_ALTO,
            "nota_aprobacion", PrediccionRendimientoService.NOTA_APROBACION
        ));
        return Response.ok(status).build();
    }

    // =========================================================================
    // H3: PREDICCIÓN DE RENDIMIENTO ACADÉMICO Y RIESGO DE DESERCIÓN
    // =========================================================================

    /**
     * Predicción individual de rendimiento para un estudiante.
     * Implementa el flujo completo de las Figuras 5.1, 5.2 y 5.3 del H3.
     *
     * Entrada: calificaciones por libro (x_i, y_i), programa, id del estudiante.
     * Salida: recta ajustada y=ax+b, R², proyección ŷ_p al siguiente examen de
     *         nivel, y clasificación de riesgo (ALTO/MEDIO/BAJO).
     */
    @POST
    @Path("/prediccion-rendimiento")
    public Response predecirRendimiento(PrediccionRequest req) {
        if (req == null || req.calificaciones == null || req.calificaciones.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Se requieren las calificaciones del estudiante (lista de {libro, nota})."))
                .build();
        }

        try {
            PrediccionResultado resultado = prediccionRendimientoService.predecir(req);
            return Response.ok(resultado).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Recálculo por lotes al cierre de cada rotación docente de 15 días (Figura 5.4).
     * Recorre las inscripciones activas y genera el reporte de estudiantes en riesgo
     * MEDIO y ALTO para el Jefe Académico.
     */
    @POST
    @Path("/prediccion-rendimiento/lote")
    public Response recalcularLote(LoteRequest req) {
        if (req == null || req.estudiantes == null || req.estudiantes.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Se requiere la lista de estudiantes con sus calificaciones para el recálculo por lotes."))
                .build();
        }

        try {
            LoteResultado resultado = prediccionRendimientoService.recalcularLote(req);
            return Response.ok(resultado).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Caso de validación con los datos hipotéticos del documento H3 (Tabla 5.3, §5.2.1).
     * Permite verificar que el algoritmo reproduce exactamente los resultados esperados:
     *   a ≈ -3.314, b ≈ 81.933, R² ≈ 0.936, ŷ_12 ≈ 42.16 → Riesgo ALTO
     */
    @GET
    @Path("/prediccion-rendimiento/validacion-h3")
    public Response casoValidacionH3() {
        try {
            PrediccionResultado resultado = prediccionRendimientoService.casoValidacionH3();
            Map<String, Object> respuesta = new LinkedHashMap<>();
            respuesta.put("descripcion", "Caso de validación H3 — Tabla 5.3, §5.2.1");
            respuesta.put("datos_entrada", "Libros 1-6: notas {78, 74, 75, 68, 66, 61}");
            respuesta.put("valores_esperados", Map.of(
                "a", "≈ -3.314",
                "b", "≈ 81.933",
                "R2", "≈ 0.936",
                "y_hat_12", "≈ 42.16",
                "riesgo", "ALTO"
            ));
            respuesta.put("resultado_calculado", resultado);
            return Response.ok(respuesta).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    // =========================================================================
    // MÉTODOS NUMÉRICOS GENERALES
    // =========================================================================

    // 1. MÍNIMOS CUADRADOS (SUMA DE CUADRADOS DE LAS DIFERENCIAS)
    @POST
    @Path("/minimos-cuadrados")
    public Response calcularMinimosCuadrados(MinimosCuadradosRequest req) {
        if (req == null || req.puntos == null || req.puntos.size() < 2) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Se requieren al menos 2 puntos (x, y) para el método de mínimos cuadrados."))
                .build();
        }

        try {
            MinimosCuadradosResultado res = metodosNumericosService.calcularMinimosCuadrados(req.puntos, req.periodosFuturos);
            return Response.ok(res).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    // 2. INTERPOLACIÓN POR DIFERENCIAS DIVIDIDAS DE NEWTON
    @POST
    @Path("/interpolacion-newton")
    public Response calcularNewton(NewtonRequest req) {
        if (req == null || req.x == null || req.y == null || req.x.size() < 2) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Se requieren al menos 2 pares de datos para la interpolación de Newton."))
                .build();
        }

        try {
            NewtonResultado res = metodosNumericosService.calcularNewtonDivididas(req.x, req.y, req.xEval);
            return Response.ok(res).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    // 3. INVESTIGACIÓN OPERATIVA: SIMPLEX
    @POST
    @Path("/simplex")
    public Response resolverSimplex(SimplexRequest req) {
        if (req == null || req.c == null || req.A == null || req.b == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Parámetros c, A y b son obligatorios para el método Simplex."))
                .build();
        }

        try {
            SimplexResultado res = metodosNumericosService.resolverSimplexMax(req.c, req.A, req.b);
            return Response.ok(res).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    // 4. ASIGNACIÓN ÓPTIMA DOCENTE
    @POST
    @Path("/asignacion-optima")
    public Response calcularAsignacion(AsignacionRequest request) {
        if (request == null || request.paralelos == null || request.candidatos == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Los campos paralelos, idiomaRequerido y candidatos son obligatorios."))
                .build();
        }

        List<AsignacionOptima> resultado = asignacionDocenteService.calcularAsignacionOptima(
            request.paralelos,
            request.idiomaRequerido != null ? request.idiomaRequerido : "Inglés Militar",
            request.candidatos
        );

        return Response.ok(Map.of(
            "paralelos_evaluados", request.paralelos.size(),
            "candidatos_evaluados", request.candidatos.size(),
            "asignaciones", resultado
        )).build();
    }

    // 5. TEORÍA DE COLAS M/M/c
    @POST
    @Path("/teoria-colas/mmc")
    public Response evaluarColaMmc(QueueMmcRequest req) {
        if (req == null || req.lambda <= 0 || req.mu <= 0 || req.c <= 0) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Los parámetros lambda (>0), mu (>0) y c (>=1) son requeridos."))
                .build();
        }

        QueueMmcResponse resp = new QueueMmcResponse();
        resp.lambda = req.lambda;
        resp.mu = req.mu;
        resp.c = req.c;

        double r = req.lambda / req.mu; // Intensidad de tráfico
        double rho = r / req.c;         // Factor de utilización
        resp.rho = Math.round(rho * 10000.0) / 10000.0;

        if (rho >= 1.0) {
            resp.esEstable = false;
            resp.diagnostico = "COLA INESTABLE (rho >= 1.0): La tasa de llegada de estudiantes excede la capacidad total de atención.";
            resp.recomendacionMilitar = "ACCIÓN INMEDIATA: Abrir urgentemente " + (int)(Math.ceil(r) - req.c + 1) + " ventanilla(s) adicional(es) para evitar colapso en el hall central.";
            return Response.ok(resp).build();
        }

        resp.esEstable = true;

        // Cálculo de P0 (Probabilidad de que el sistema esté vacío)
        double sumatoria = 0.0;
        for (int n = 0; n < req.c; n++) {
            sumatoria += Math.pow(r, n) / factorial(n);
        }
        double terminoC = Math.pow(r, req.c) / (factorial(req.c) * (1.0 - rho));
        double p0 = 1.0 / (sumatoria + terminoC);
        resp.p0 = Math.round(p0 * 10000.0) / 10000.0;

        // Fórmula C de Erlang (probabilidad de que un estudiante tenga que esperar)
        double erlangC = terminoC * p0;
        resp.erlangC = Math.round(erlangC * 10000.0) / 10000.0;

        // Longitud promedio de cola de espera Lq
        double lq = (erlangC * rho) / (1.0 - rho);
        resp.lq = Math.round(lq * 100.0) / 100.0;

        // Tiempo promedio de espera en cola Wq (horas -> minutos)
        double wqHoras = lq / req.lambda;
        resp.wqMinutos = Math.round(wqHoras * 60.0 * 100.0) / 100.0;

        // Tiempo promedio total en sistema Ws (horas -> minutos)
        double wsHoras = wqHoras + (1.0 / req.mu);
        resp.wsMinutos = Math.round(wsHoras * 60.0 * 100.0) / 100.0;

        // Cantidad promedio total en el sistema L
        double l = req.lambda * wsHoras;
        resp.l = Math.round(l * 100.0) / 100.0;

        // Diagnóstico y recomendación táctica
        if (resp.wqMinutos > 15.0 || resp.rho > 0.80) {
            resp.diagnostico = "SATURACIÓN MODERADA/ALTA: El tiempo de espera en ventanilla supera los 15 minutos o la utilización supera el 80%.";
            resp.recomendacionMilitar = "Habilitar 1 ventanilla de refuerzo para reducir Wq a menos de 5 minutos.";
        } else if (resp.rho < 0.35 && req.c > 1) {
            resp.diagnostico = "SOBRECAPACIDAD: Ventanillas ociosas (" + Math.round((1 - resp.rho) * 100) + "% de tiempo desocupadas).";
            resp.recomendacionMilitar = "Reasignar personal de ventanilla a labores de archivo o almacén temporalmente.";
        } else {
            resp.diagnostico = "ESTADO ÓPTIMO: Flujo FIFO fluido, balance adecuado de carga y tiempos de espera controlados.";
            resp.recomendacionMilitar = "Mantener esquema operativo actual de ventanillas.";
        }

        return Response.ok(resp).build();
    }

    private double factorial(int n) {
        if (n <= 1) return 1.0;
        double fact = 1.0;
        for (int i = 2; i <= n; i++) {
            fact *= i;
        }
        return fact;
    }
}
