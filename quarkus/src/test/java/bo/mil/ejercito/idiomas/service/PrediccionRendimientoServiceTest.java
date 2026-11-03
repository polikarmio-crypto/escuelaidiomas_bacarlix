package bo.mil.ejercito.idiomas.service;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class PrediccionRendimientoServiceTest {

    @Inject
    PrediccionRendimientoService service;

    @Test
    @DisplayName("Caso de Validación H3 (Tabla 5.3): a ≈ -3.314, b ≈ 81.933, R² ≈ 0.936, ŷ₁₂ ≈ 42.16 → ALTO")
    public void testCasoValidacionH3() {
        var resultado = service.casoValidacionH3();

        assertNotNull(resultado);
        assertFalse(resultado.datosInsuficientes);
        assertEquals(6, resultado.librosEvaluados);

        // a ≈ -3.3143
        assertEquals(-3.3143, resultado.pendienteA, 0.001);
        // b ≈ 81.9333
        assertEquals(81.9333, resultado.interceptoB, 0.001);
        // R² ≈ 0.936
        assertEquals(0.936, resultado.r2, 0.01);

        // Proyección al libro 12: ŷ₁₂ = -3.3143 * 12 + 81.9333 ≈ 42.16
        assertEquals(12, resultado.libroExamenNivel);
        assertEquals(42.16, resultado.notaProyectada, 0.1);

        // Clasificación de riesgo: ALTO
        assertEquals("ALTO", resultado.nivelRiesgo);
        assertTrue(resultado.mensajeAlerta.contains("RIESGO ALTO"));

        // Tabla de ajuste contiene 6 filas
        assertEquals(6, resultado.tablaAjuste.size());
    }

    @Test
    @DisplayName("Verificación de n_min = 3: con menos de 3 libros retorna DATOS_INSUFICIENTES")
    public void testDatosInsuficientes() {
        var req = new PrediccionRendimientoService.PrediccionRequest();
        req.idEstudiante = 1L;
        req.nombreEstudiante = "Cadete Prueba";
        req.calificaciones = List.of(
            new PrediccionRendimientoService.CalificacionLibro(1, 80),
            new PrediccionRendimientoService.CalificacionLibro(2, 85)
        );

        var resultado = service.predecir(req);

        assertNotNull(resultado);
        assertTrue(resultado.datosInsuficientes);
        assertEquals("DATOS_INSUFICIENTES", resultado.nivelRiesgo);
        assertEquals(2, resultado.librosEvaluados);
    }

    @Test
    @DisplayName("Verificación de Riesgo BAJO: notas altas y pendiente positiva")
    public void testRiesgoBajo() {
        var req = new PrediccionRendimientoService.PrediccionRequest();
        req.idEstudiante = 2L;
        req.nombreEstudiante = "Cadete Excelente";
        req.calificaciones = List.of(
            new PrediccionRendimientoService.CalificacionLibro(1, 75),
            new PrediccionRendimientoService.CalificacionLibro(2, 80),
            new PrediccionRendimientoService.CalificacionLibro(3, 85),
            new PrediccionRendimientoService.CalificacionLibro(4, 90)
        );

        var resultado = service.predecir(req);

        assertNotNull(resultado);
        assertFalse(resultado.datosInsuficientes);
        assertTrue(resultado.pendienteA > 0);
        assertEquals(6, resultado.libroExamenNivel); // Próximo examen: libro 6
        assertEquals("BAJO", resultado.nivelRiesgo);
    }
}
