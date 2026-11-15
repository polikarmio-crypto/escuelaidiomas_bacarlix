package bo.mil.ejercito.idiomas.resource;

import bo.mil.ejercito.idiomas.service.AsignacionDocenteService;
import bo.mil.ejercito.idiomas.service.AsignacionDocenteService.AsignacionOptima;
import bo.mil.ejercito.idiomas.service.AsignacionDocenteService.DocenteCandidato;
import bo.mil.ejercito.idiomas.service.MetodosNumericosService;
import bo.mil.ejercito.idiomas.service.MetodosNumericosService.MinimosCuadradosResultado;
import bo.mil.ejercito.idiomas.service.MetodosNumericosService.PuntoData;
import bo.mil.ejercito.idiomas.service.PrediccionRendimientoService;
import bo.mil.ejercito.idiomas.service.PrediccionRendimientoService.CalificacionLibro;
import bo.mil.ejercito.idiomas.service.PrediccionRendimientoService.PrediccionRequest;
import bo.mil.ejercito.idiomas.service.PrediccionRendimientoService.PrediccionResultado;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@QuarkusTest
public class AnalyticsResourceMockitoTest {

    @Inject
    AnalyticsResource analyticsResource;

    @InjectMock
    PrediccionRendimientoService prediccionServiceMock;

    @InjectMock
    MetodosNumericosService metodosNumericosServiceMock;

    @InjectMock
    AsignacionDocenteService asignacionDocenteServiceMock;

    @Test
    @DisplayName("Mockito: Simulación exitosa de predicción de rendimiento individual")
    public void testPredecirRendimientoConMock() {
        // 1. Arrange (Configuración del comportamiento simulado)
        PrediccionResultado mockRes = new PrediccionResultado();
        mockRes.idEstudiante = 101L;
        mockRes.nombreEstudiante = "Subteniente Mendoza";
        mockRes.pendienteA = -3.31;
        mockRes.interceptoB = 81.93;
        mockRes.notaProyectada = 42.16;
        mockRes.nivelRiesgo = "ALTO";
        mockRes.datosInsuficientes = false;

        when(prediccionServiceMock.predecir(any(PrediccionRequest.class))).thenReturn(mockRes);

        // 2. Act (Ejecución del endpoint en AnalyticsResource)
        PrediccionRequest request = new PrediccionRequest();
        request.idEstudiante = 101L;
        request.nombreEstudiante = "Subteniente Mendoza";
        request.calificaciones = List.of(
                new CalificacionLibro(1, 78.0),
                new CalificacionLibro(2, 74.0),
                new CalificacionLibro(3, 75.0));

        Response response = analyticsResource.predecirRendimiento(request);

        // 3. Assert & Verify (Aserciones y Verificación de interacción con Mockito)
        assertEquals(200, response.getStatus());
        assertNotNull(response.getEntity());
        PrediccionResultado entity = (PrediccionResultado) response.getEntity();
        assertEquals("ALTO", entity.nivelRiesgo);
        assertEquals(42.16, entity.notaProyectada, 0.01);

        // Verificamos que el mock fue invocado exactamente 1 vez
        verify(prediccionServiceMock, times(1)).predecir(any(PrediccionRequest.class));
    }

    @Test
    @DisplayName("Mockito: Validación de entrada - si la lista está vacía retorna 400 y NUNCA llama al servicio")
    public void testPredecirRendimientoValidacionVacia() {
        PrediccionRequest requestInvalido = new PrediccionRequest();
        requestInvalido.calificaciones = List.of(); // Vacío

        Response response = analyticsResource.predecirRendimiento(requestInvalido);

        assertEquals(400, response.getStatus());
        // Verificamos con Mockito que gracias a la validación previa, el servicio NUNCA
        // fue llamado
        verify(prediccionServiceMock, never()).predecir(any());
    }

    @Test
    @DisplayName("Mockito: Manejo de excepciones - cuando el servicio arroja error, el recurso responde 400")
    public void testPredecirRendimientoManejoExcepcion() {
        when(prediccionServiceMock.predecir(any()))
                .thenThrow(new IllegalArgumentException("Error de convergencia en mínimos cuadrados"));

        PrediccionRequest request = new PrediccionRequest();
        request.calificaciones = List.of(new CalificacionLibro(1, 80));

        Response response = analyticsResource.predecirRendimiento(request);

        assertEquals(400, response.getStatus());
        verify(prediccionServiceMock, times(1)).predecir(any());
    }

    @Test
    @DisplayName("Mockito: Asignación óptima de docentes con servicio mockeado")
    public void testAsignacionDocenteOptimaConMock() {
        List<AsignacionOptima> mockAsignaciones = List.of(
                new AsignacionOptima("ING-101", "Inglés", 10L, "Cap. Pérez", "Asignado con éxito"));

        when(asignacionDocenteServiceMock.calcularAsignacionOptima(anyList(), anyString(), anyList()))
                .thenReturn(mockAsignaciones);

        AnalyticsResource.AsignacionRequest req = new AnalyticsResource.AsignacionRequest();
        req.paralelos = List.of("ING-101");
        req.idiomaRequerido = "Inglés";
        req.candidatos = List.of(new DocenteCandidato(10L, "Cap. Pérez", List.of("Inglés"), 5, true));

        Response response = analyticsResource.calcularAsignacion(req);

        assertEquals(200, response.getStatus());
        verify(asignacionDocenteServiceMock, times(1))
                .calcularAsignacionOptima(eq(req.paralelos), eq("Inglés"), eq(req.candidatos));
    }

    @Test
    @DisplayName("Mockito: Mínimos cuadrados simulados y verificación de llamada delegada")
    public void testMinimosCuadradosConMock() {
        MinimosCuadradosResultado mockResultado = new MinimosCuadradosResultado();
        mockResultado.n = 2;
        mockResultado.pendienteM = 2.5;
        mockResultado.interceptoB = 10.0;
        mockResultado.ecuacionRecta = "y = 2.5x + 10.0";

        when(metodosNumericosServiceMock.calcularMinimosCuadrados(anyList(), any()))
                .thenReturn(mockResultado);

        AnalyticsResource.MinimosCuadradosRequest req = new AnalyticsResource.MinimosCuadradosRequest();
        req.puntos = List.of(new PuntoData(1, 12, "P1"), new PuntoData(2, 15, "P2"));

        Response response = analyticsResource.calcularMinimosCuadrados(req);

        assertEquals(200, response.getStatus());
        assertEquals(mockResultado, response.getEntity());
        verify(metodosNumericosServiceMock, times(1)).calcularMinimosCuadrados(anyList(), any());
    }
}
