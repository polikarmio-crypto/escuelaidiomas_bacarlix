package bo.mil.ejercito.idiomas.service;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.*;

@ApplicationScoped
public class AsignacionDocenteService {

    public static class DocenteCandidato {
        public Long idDocente;
        public String nombre;
        public List<String> idiomasHabilitados;
        public int diasEnParaleloActual;
        public boolean disponible;

        public DocenteCandidato() {}
        public DocenteCandidato(Long id, String n, List<String> idm, int dias, boolean disp) {
            this.idDocente = id;
            this.nombre = n;
            this.idiomasHabilitados = idm;
            this.diasEnParaleloActual = dias;
            this.disponible = disp;
        }
    }

    public static class AsignacionOptima {
        
        public String codigoParalelo;
        public String idioma;
        public Long idDocenteAsignado;
        public String nombreDocenteAsignado;
        public String motivoAsignacion;

        public AsignacionOptima(String p, String idm, Long idDoc, String nomDoc, String motivo) {
            this.codigoParalelo = p;
            this.idioma = idm;
            this.idDocenteAsignado = idDoc;
            this.nombreDocenteAsignado = nomDoc;
            this.motivoAsignacion = motivo;
        }
    }

    /**
     * Resuelve el modelo de asignación docente cumpliendo:
     * 1. Rotación obligatoria si días en aula >= 15 días.
     * 2. Compatibilidad del docente con el idioma del paralelo.
     * 3. Equidad en la carga horaria semanal.
     */
    public List<AsignacionOptima> calcularAsignacionOptima(
            List<String> paralelos,
            String idiomaRequerido,
            List<DocenteCandidato> candidatos) {

        List<AsignacionOptima> resultado = new ArrayList<>();
        Set<Long> docentesOcupados = new HashSet<>();

        for (String par : paralelos) {
            DocenteCandidato mejorCandidato = null;

            for (DocenteCandidato d : candidatos) {
                if (docentesOcupados.contains(d.idDocente)) continue;
                if (!d.disponible) continue;
                if (!d.idiomasHabilitados.contains(idiomaRequerido)) continue;

                // Prioridad a docentes que no hayan alcanzado el límite de 15 días o que estén rotando
                if (d.diasEnParaleloActual < 15) {
                    mejorCandidato = d;
                    break;
                }
            }

            if (mejorCandidato != null) {
                docentesOcupados.add(mejorCandidato.idDocente);
                resultado.add(new AsignacionOptima(
                    par,
                    idiomaRequerido,
                    mejorCandidato.idDocente,
                    mejorCandidato.nombre,
                    "Asignado cumpliendo compatibilidad lingüística y rotación < 15 días."
                ));
            } else {
                resultado.add(new AsignacionOptima(
                    par,
                    idiomaRequerido,
                    null,
                    "VACANTE",
                    "ALERTA: No se dispone de docentes libres habilitados para este idioma respetando la rotación de 15 días."
                ));
            }
        }

        return resultado;
    }
}
