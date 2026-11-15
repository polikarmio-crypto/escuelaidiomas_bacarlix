package bo.mil.ejercito.idiomas.service;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.*;

@ApplicationScoped
public class MetodosNumericosService {

    // =========================================================================
    // 1. DTOs PARA MÍNIMOS CUADRADOS (SUMA DE CUADRADOS DE LAS DIFERENCIAS)
    // =========================================================================
    public static class PuntoData {
        public double x;
        public double y;
        public String etiqueta;

        public PuntoData() {}
        public PuntoData(double x, double y, String etiqueta) {
            this.x = x;
            this.y = y;
            this.etiqueta = etiqueta;
        }
    }

    public static class FilaTablaCuadrados {
        public double x;
        public double y;
        public String etiqueta;
        public double yEstimado;
        public double residuo;          // (y - yEstimado)
        public double residuoCuadrado;  // (y - yEstimado)^2 : Diferencia al Cuadrado
        public double xCuadrado;        // x^2
        public double yCuadrado;        // y^2
        public double xy;               // x * y
    }

    public static class ProyeccionFutura {
        public double x;
        public double yEstimado;
        public String etiqueta;

        public ProyeccionFutura(double x, double yEstimado, String etiqueta) {
            this.x = x;
            this.yEstimado = yEstimado;
            this.etiqueta = etiqueta;
        }
    }

    public static class MinimosCuadradosResultado {
        public int n;
        public double sumX;
        public double sumY;
        public double sumX2;
        public double sumY2;
        public double sumXY;
        public double mediaX;
        public double mediaY;
        public double pendienteM;         // m
        public double interceptoB;        // b
        public String ecuacionRecta;      // y = m*x + b
        public double sse;                // Suma de Cuadrados del Error / Diferencias de Cuadrados
        public double sst;                // Suma Total de Cuadrados
        public double ssr;                // Suma de Cuadrados de la Regresión
        public double r2;                 // Coeficiente de Determinación R^2 (0 a 1)
        public double rPearson;           // Coeficiente de Correlación de Pearson r (-1 a 1)
        public double errorEstandar;      // Desviación estándar del error
        public List<FilaTablaCuadrados> tablaDiferencias;
        public List<ProyeccionFutura> proyecciones;
    }

    /**
     * Resuelve el Método de Mínimos Cuadrados para ajuste lineal minimizando
     * la suma de los cuadrados de las diferencias: SSE = SUM((y_i - y_hat_i)^2)
     */
    public MinimosCuadradosResultado calcularMinimosCuadrados(List<PuntoData> puntos, List<Double> periodosFuturos) {
        if (puntos == null || puntos.size() < 2) {
            throw new IllegalArgumentException("Se requieren al menos 2 puntos para el método de mínimos cuadrados.");
        }

        int n = puntos.size();
        double sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0;

        for (PuntoData p : puntos) {
            sumX += p.x;
            sumY += p.y;
            sumX2 += (p.x * p.x);
            sumY2 += (p.y * p.y);
            sumXY += (p.x * p.y);
        }

        double mediaX = sumX / n;
        double mediaY = sumY / n;

        // Fórmulas analíticas de mínimos cuadrados
        double denominadorM = (n * sumX2) - (sumX * sumX);
        if (Math.abs(denominadorM) < 1e-9) {
            throw new ArithmeticException("División por cero en mínimos cuadrados: valores de X no presentan variabilidad.");
        }

        double m = ((n * sumXY) - (sumX * sumY)) / denominadorM;
        double b = mediaY - (m * mediaX);

        // Tabla detallada de diferencias de cuadrados paso a paso
        List<FilaTablaCuadrados> tabla = new ArrayList<>();
        double sse = 0.0;
        double sst = 0.0;

        for (PuntoData p : puntos) {
            FilaTablaCuadrados fila = new FilaTablaCuadrados();
            fila.x = p.x;
            fila.y = p.y;
            fila.etiqueta = p.etiqueta != null ? p.etiqueta : ("P" + (int)p.x);
            fila.yEstimado = Math.round((m * p.x + b) * 1000.0) / 1000.0;
            fila.residuo = Math.round((p.y - fila.yEstimado) * 1000.0) / 1000.0;
            fila.residuoCuadrado = Math.round((fila.residuo * fila.residuo) * 10000.0) / 10000.0;
            fila.xCuadrado = Math.round((p.x * p.x) * 100.0) / 100.0;
            fila.yCuadrado = Math.round((p.y * p.y) * 100.0) / 100.0;
            fila.xy = Math.round((p.x * p.y) * 100.0) / 100.0;

            sse += (fila.residuo * fila.residuo);
            sst += Math.pow(p.y - mediaY, 2);

            tabla.add(fila);
        }

        double ssr = sst - sse;
        double r2 = sst > 0 ? Math.max(0.0, Math.min(1.0, ssr / sst)) : 1.0;
        double rPearson = (m >= 0 ? 1 : -1) * Math.sqrt(r2);
        double errorEstandar = n > 2 ? Math.sqrt(sse / (n - 2)) : 0.0;

        // Proyecciones a futuro
        List<ProyeccionFutura> proyecciones = new ArrayList<>();
        if (periodosFuturos != null) {
            for (Double xFuturo : periodosFuturos) {
                double yFut = Math.round((m * xFuturo + b) * 100.0) / 100.0;
                proyecciones.add(new ProyeccionFutura(xFuturo, yFut, "Periodo " + xFuturo.intValue()));
            }
        }

        MinimosCuadradosResultado res = new MinimosCuadradosResultado();
        res.n = n;
        res.sumX = Math.round(sumX * 100.0) / 100.0;
        res.sumY = Math.round(sumY * 100.0) / 100.0;
        res.sumX2 = Math.round(sumX2 * 100.0) / 100.0;
        res.sumY2 = Math.round(sumY2 * 100.0) / 100.0;
        res.sumXY = Math.round(sumXY * 100.0) / 100.0;
        res.mediaX = Math.round(mediaX * 100.0) / 100.0;
        res.mediaY = Math.round(mediaY * 100.0) / 100.0;
        res.pendienteM = Math.round(m * 10000.0) / 10000.0;
        res.interceptoB = Math.round(b * 10000.0) / 10000.0;
        res.ecuacionRecta = String.format("y = %.4fx %s %.4f", res.pendienteM, (res.interceptoB >= 0 ? "+" : "-"), Math.abs(res.interceptoB));
        res.sse = Math.round(sse * 10000.0) / 10000.0;
        res.sst = Math.round(sst * 10000.0) / 10000.0;
        res.ssr = Math.round(ssr * 10000.0) / 10000.0;
        res.r2 = Math.round(r2 * 10000.0) / 10000.0;
        res.rPearson = Math.round(rPearson * 10000.0) / 10000.0;
        res.errorEstandar = Math.round(errorEstandar * 1000.0) / 1000.0;
        res.tablaDiferencias = tabla;
        res.proyecciones = proyecciones;

        return res;
    }

    // =========================================================================
    // 2. INTERPOLACIÓN POR DIFERENCIAS DIVIDIDAS DE NEWTON
    // =========================================================================
    public static class NewtonResultado {
        public int grado;
        public double xEvaluado;
        public double valorInterpolado;
        public List<Double> coeficientes; // a0, a1, a2...
        public double[][] tablaDiferenciasDivididas;
        public String polinomioNewton;
    }

    public NewtonResultado calcularNewtonDivididas(List<Double> x, List<Double> y, double xEval) {
        int n = x.size();
        if (n < 2 || x.size() != y.size()) {
            throw new IllegalArgumentException("Se requiere la misma cantidad de puntos X e Y (mínimo 2).");
        }

        double[][] f = new double[n][n];
        for (int i = 0; i < n; i++) {
            f[i][0] = y.get(i);
        }

        // Construcción de la tabla triangular de diferencias divididas
        for (int j = 1; j < n; j++) {
            for (int i = 0; i < n - j; i++) {
                f[i][j] = (f[i + 1][j - 1] - f[i][j - 1]) / (x.get(i + j) - x.get(i));
            }
        }

        // Evaluación de Newton para xEval
        double resultado = f[0][0];
        double producto = 1.0;
        StringBuilder poli = new StringBuilder(String.format("%.3f", f[0][0]));

        List<Double> coefs = new ArrayList<>();
        coefs.add(f[0][0]);

        for (int j = 1; j < n; j++) {
            producto *= (xEval - x.get(j - 1));
            resultado += f[0][j] * producto;
            coefs.add(f[0][j]);

            if (f[0][j] >= 0) {
                poli.append(String.format(" + %.3f", f[0][j]));
            } else {
                poli.append(String.format(" - %.3f", Math.abs(f[0][j])));
            }
            for (int k = 0; k < j; k++) {
                poli.append(String.format("(x - %.1f)", x.get(k)));
            }
        }

        NewtonResultado res = new NewtonResultado();
        res.grado = n - 1;
        res.xEvaluado = xEval;
        res.valorInterpolado = Math.round(resultado * 1000.0) / 1000.0;
        res.coeficientes = coefs;
        res.tablaDiferenciasDivididas = f;
        res.polinomioNewton = "P(x) = " + poli.toString();

        return res;
    }

    // =========================================================================
    // 3. INVESTIGACIÓN OPERATIVA: PROGRAMACIÓN LINEAL (MÉTODO SIMPLEX)
    // =========================================================================
    public static class SimplexResultado {
        public boolean optimoEncontrado;
        public double valorZOptimo;
        public Map<String, Double> variablesDecision;
        public List<String> resumenPasos;
        public double[][] tablaFinal;
    }

    /**
     * Resuelve un modelo de Programación Lineal estándar de Maximización:
     * Max Z = c1*X1 + c2*X2
     * s.a. A * X <= B
     */
    public SimplexResultado resolverSimplexMax(double[] c, double[][] A, double[] b) {
        int numRestricciones = b.length;
        int numVars = c.length;

        int filas = numRestricciones + 1;
        int cols = numVars + numRestricciones + 1;

        double[][] tabla = new double[filas][cols];

        // Llenar restricciones
        for (int i = 0; i < numRestricciones; i++) {
            for (int j = 0; j < numVars; j++) {
                tabla[i][j] = A[i][j];
            }
            // Variables de holgura
            tabla[i][numVars + i] = 1.0;
            // Lado derecho (RHS)
            tabla[i][cols - 1] = b[i];
        }

        // Fila Z (costos reducidos en forma canónica negativa)
        for (int j = 0; j < numVars; j++) {
            tabla[filas - 1][j] = -c[j];
        }

        List<String> pasos = new ArrayList<>();
        pasos.add("Tabla Simplex Inicial generada con " + numRestricciones + " variables de holgura.");

        int iteracion = 0;
        int maxIter = 50;

        while (iteracion < maxIter) {
            iteracion++;

            // 1. Encontrar columna pivote (más negativo en fila Z)
            int colPivote = -1;
            double menorValor = 0.0;
            for (int j = 0; j < cols - 1; j++) {
                if (tabla[filas - 1][j] < menorValor) {
                    menorValor = tabla[filas - 1][j];
                    colPivote = j;
                }
            }

            if (colPivote == -1) {
                pasos.add("Condición de optimalidad alcanzada: no existen coeficientes negativos en la fila Z.");
                break;
            }

            // 2. Encontrar fila pivote (mínimo cociente positivo RHS / colPivote)
            int filaPivote = -1;
            double menorCociente = Double.MAX_VALUE;
            for (int i = 0; i < numRestricciones; i++) {
                if (tabla[i][colPivote] > 1e-9) {
                    double cociente = tabla[i][cols - 1] / tabla[i][colPivote];
                    if (cociente < menorCociente) {
                        menorCociente = cociente;
                        filaPivote = i;
                    }
                }
            }

            if (filaPivote == -1) {
                pasos.add("Solución ilimitada: todos los coeficientes en la columna pivote son menores o iguales a cero.");
                break;
            }

            pasos.add(String.format("Iteración %d: Variable entrante Columna %d, Variable saliente Fila %d.", iteracion, colPivote + 1, filaPivote + 1));

            // 3. Normalizar fila pivote
            double elementoPivote = tabla[filaPivote][colPivote];
            for (int j = 0; j < cols; j++) {
                tabla[filaPivote][j] /= elementoPivote;
            }

            // 4. Eliminación de Gauss-Jordan en las demás filas
            for (int i = 0; i < filas; i++) {
                if (i != filaPivote) {
                    double factor = tabla[i][colPivote];
                    for (int j = 0; j < cols; j++) {
                        tabla[i][j] -= factor * tabla[filaPivote][j];
                    }
                }
            }
        }

        SimplexResultado res = new SimplexResultado();
        res.optimoEncontrado = true;
        res.valorZOptimo = Math.round(tabla[filas - 1][cols - 1] * 100.0) / 100.0;
        res.variablesDecision = new LinkedHashMap<>();

        // Identificar valores óptimos de X1, X2...
        for (int j = 0; j < numVars; j++) {
            int cuentaUnos = 0;
            int filaUno = -1;
            for (int i = 0; i < numRestricciones; i++) {
                if (Math.abs(tabla[i][j] - 1.0) < 1e-5) {
                    cuentaUnos++;
                    filaUno = i;
                } else if (Math.abs(tabla[i][j]) > 1e-5) {
                    cuentaUnos = -1;
                    break;
                }
            }
            if (cuentaUnos == 1 && filaUno != -1) {
                res.variablesDecision.put("X" + (j + 1), Math.round(tabla[filaUno][cols - 1] * 100.0) / 100.0);
            } else {
                res.variablesDecision.put("X" + (j + 1), 0.0);
            }
        }

        res.resumenPasos = pasos;
        res.tablaFinal = tabla;
        return res;
    }
}
