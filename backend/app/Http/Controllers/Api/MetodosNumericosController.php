<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MetodosNumericosController extends Controller
{
    /**
     * MÉTODOS NUMÉRICOS: Ajuste Lineal por Mínimos Cuadrados
     * Minimiza la Suma de Cuadrados de las Diferencias: SSE = SUM((y_i - y_hat_i)^2)
     */
    public function minimosCuadrados(Request $request)
    {
        $validated = $request->validate([
            'puntos' => 'required|array|min:2',
            'puntos.*.x' => 'required|numeric',
            'puntos.*.y' => 'required|numeric',
            'puntos.*.etiqueta' => 'nullable|string',
            'periodos_futuros' => 'nullable|array',
            'periodos_futuros.*' => 'numeric',
        ]);

        $puntos = $validated['puntos'];
        $n = count($puntos);

        $sumX = 0;
        $sumY = 0;
        $sumX2 = 0;
        $sumY2 = 0;
        $sumXY = 0;

        foreach ($puntos as $p) {
            $x = (float) $p['x'];
            $y = (float) $p['y'];
            $sumX += $x;
            $sumY += $y;
            $sumX2 += ($x * $x);
            $sumY2 += ($y * $y);
            $sumXY += ($x * $y);
        }

        $mediaX = $sumX / $n;
        $mediaY = $sumY / $n;

        $denominadorM = ($n * $sumX2) - ($sumX * $sumX);
        if (abs($denominadorM) < 1e-9) {
            return response()->json(['error' => 'Los valores de X deben presentar variabilidad para calcular la regresión.'], 422);
        }

        $m = (($n * $sumXY) - ($sumX * $sumY)) / $denominadorM;
        $b = $mediaY - ($m * $mediaX);

        $tablaDiferencias = [];
        $sse = 0.0;
        $sst = 0.0;

        foreach ($puntos as $idx => $p) {
            $x = (float) $p['x'];
            $y = (float) $p['y'];
            $etiqueta = $p['etiqueta'] ?? ('P' . ($idx + 1));

            $yEstimado = round($m * $x + $b, 3);
            $residuo = round($y - $yEstimado, 3);
            $residuoCuadrado = round(pow($residuo, 2), 4); // Diferencia de cuadrados del error

            $xCuadrado = round(pow($x, 2), 2);
            $yCuadrado = round(pow($y, 2), 2);
            $xy = round($x * $y, 2);

            $sse += pow($residuo, 2);
            $sst += pow($y - $mediaY, 2);

            $tablaDiferencias[] = [
                'x' => $x,
                'y' => $y,
                'etiqueta' => $etiqueta,
                'yEstimado' => $yEstimado,
                'residuo' => $residuo,
                'residuoCuadrado' => $residuoCuadrado,
                'xCuadrado' => $xCuadrado,
                'yCuadrado' => $yCuadrado,
                'xy' => $xy,
            ];
        }

        $ssr = $sst - $sse;
        $r2 = $sst > 0 ? max(0.0, min(1.0, $ssr / $sst)) : 1.0;
        $rPearson = ($m >= 0 ? 1 : -1) * sqrt($r2);
        $errorEstandar = $n > 2 ? sqrt($sse / ($n - 2)) : 0.0;

        // Proyecciones futuras si se solicitan
        $proyecciones = [];
        $futuros = $validated['periodos_futuros'] ?? [$n + 1, $n + 2, $n + 3];
        foreach ($futuros as $xf) {
            $yFut = round($m * $xf + $b, 2);
            $proyecciones[] = [
                'x' => $xf,
                'yEstimado' => $yFut,
                'etiqueta' => "Periodo {$xf}",
            ];
        }

        return response()->json([
            'metodo' => 'Ajuste Lineal por Mínimos Cuadrados (Suma de Diferencias al Cuadrado)',
            'n' => $n,
            'sumX' => round($sumX, 2),
            'sumY' => round($sumY, 2),
            'sumX2' => round($sumX2, 2),
            'sumY2' => round($sumY2, 2),
            'sumXY' => round($sumXY, 2),
            'mediaX' => round($mediaX, 2),
            'mediaY' => round($mediaY, 2),
            'pendienteM' => round($m, 4),
            'interceptoB' => round($b, 4),
            'ecuacionRecta' => sprintf("y = %.4fx %s %.4f", round($m, 4), ($b >= 0 ? '+' : '-'), abs(round($b, 4))),
            'sse' => round($sse, 4), // Suma de Cuadrados del Error / Diferencias de Cuadrados
            'sst' => round($sst, 4),
            'ssr' => round($ssr, 4),
            'r2' => round($r2, 4),
            'rPearson' => round($rPearson, 4),
            'errorEstandar' => round($errorEstandar, 4),
            'tablaDiferencias' => $tablaDiferencias,
            'proyecciones' => $proyecciones,
        ]);
    }

    /**
     * MÉTODOS NUMÉRICOS: Interpolación por Diferencias Divididas de Newton
     */
    public function interpolacionNewton(Request $request)
    {
        $validated = $request->validate([
            'x' => 'required|array|min:2',
            'x.*' => 'numeric',
            'y' => 'required|array|min:2',
            'y.*' => 'numeric',
            'x_eval' => 'required|numeric',
        ]);

        $x = $validated['x'];
        $y = $validated['y'];
        $xEval = (float) $validated['x_eval'];
        $n = count($x);

        if ($n !== count($y)) {
            return response()->json(['error' => 'Los arreglos X e Y deben tener la misma longitud.'], 422);
        }

        // Matriz de diferencias divididas
        $f = array_fill(0, $n, array_fill(0, $n, 0.0));
        for ($i = 0; $i < $n; $i++) {
            $f[$i][0] = (float) $y[$i];
        }

        for ($j = 1; $j < $n; $j++) {
            for ($i = 0; $i < $n - $j; $i++) {
                $den = $x[$i + $j] - $x[$i];
                if (abs($den) < 1e-9) {
                    return response()->json(['error' => 'Puntos X duplicados en interpolación de Newton.'], 422);
                }
                $f[$i][$j] = ($f[$i + 1][$j - 1] - $f[$i][$j - 1]) / $den;
            }
        }

        // Evaluación del polinomio
        $resultado = $f[0][0];
        $producto = 1.0;
        $poli = sprintf("%.3f", $f[0][0]);
        $coefs = [$f[0][0]];

        for ($j = 1; $j < $n; $j++) {
            $producto *= ($xEval - $x[$j - 1]);
            $resultado += $f[0][$j] * $producto;
            $coefs[] = round($f[0][$j], 4);

            $signo = $f[0][$j] >= 0 ? '+' : '-';
            $poli .= sprintf(" %s %.3f", $signo, abs($f[0][$j]));
            for ($k = 0; $k < $j; $k++) {
                $poli .= sprintf("(x - %.1f)", $x[$k]);
            }
        }

        return response()->json([
            'metodo' => 'Interpolación por Diferencias Divididas de Newton',
            'grado' => $n - 1,
            'xEvaluado' => $xEval,
            'valorInterpolado' => round($resultado, 4),
            'coeficientes' => $coefs,
            'polinomioNewton' => "P(x) = {$poli}",
            'tablaDiferenciasDivididas' => $f,
        ]);
    }

    /**
     * INVESTIGACIÓN OPERATIVA: Programación Lineal (Método Simplex)
     */
    public function simplex(Request $request)
    {
        $validated = $request->validate([
            'c' => 'required|array|min:1',
            'c.*' => 'numeric',
            'A' => 'required|array|min:1',
            'A.*' => 'array',
            'b' => 'required|array|min:1',
            'b.*' => 'numeric',
        ]);

        $c = $validated['c'];
        $A = $validated['A'];
        $b = $validated['b'];

        $numRestricciones = count($b);
        $numVars = count($c);
        $filas = $numRestricciones + 1;
        $cols = $numVars + $numRestricciones + 1;

        $tabla = array_fill(0, $filas, array_fill(0, $cols, 0.0));

        // Cargar restricciones
        for ($i = 0; $i < $numRestricciones; $i++) {
            for ($j = 0; $j < $numVars; $j++) {
                $tabla[$i][$j] = (float) $A[$i][$j];
            }
            $tabla[$i][$numVars + $i] = 1.0; // Holgura
            $tabla[$i][$cols - 1] = (float) $b[$i]; // RHS
        }

        // Fila Z
        for ($j = 0; $j < $numVars; $j++) {
            $tabla[$filas - 1][$j] = -((float) $c[$j]);
        }

        $pasos = ["Tabla inicial generada con {$numRestricciones} variables de holgura."];
        $iter = 0;

        while ($iter < 30) {
            $iter++;

            // Columna pivote
            $colPivote = -1;
            $menor = 0.0;
            for ($j = 0; $j < $cols - 1; $j++) {
                if ($tabla[$filas - 1][$j] < $menor) {
                    $menor = $tabla[$filas - 1][$j];
                    $colPivote = $j;
                }
            }

            if ($colPivote === -1) {
                $pasos[] = "Optimalidad alcanzada en la iteración {$iter}.";
                break;
            }

            // Fila pivote
            $filaPivote = -1;
            $minCociente = INF;
            for ($i = 0; $i < $numRestricciones; $i++) {
                if ($tabla[$i][$colPivote] > 1e-9) {
                    $cociente = $tabla[$i][$cols - 1] / $tabla[$i][$colPivote];
                    if ($cociente < $minCociente) {
                        $minCociente = $cociente;
                        $filaPivote = $i;
                    }
                }
            }

            if ($filaPivote === -1) {
                $pasos[] = "Solución no acotada (ilimitada).";
                break;
            }

            $pasos[] = "Iteración {$iter}: Columna pivote X" . ($colPivote + 1) . ", Fila S" . ($filaPivote + 1);

            // Normalizar
            $elemPivote = $tabla[$filaPivote][$colPivote];
            for ($j = 0; $j < $cols; $j++) {
                $tabla[$filaPivote][$j] /= $elemPivote;
            }

            // Gauss-Jordan
            for ($i = 0; $i < $filas; $i++) {
                if ($i !== $filaPivote) {
                    $factor = $tabla[$i][$colPivote];
                    for ($j = 0; $j < $cols; $j++) {
                        $tabla[$i][$j] -= $factor * $tabla[$filaPivote][$j];
                    }
                }
            }
        }

        $decision = [];
        for ($j = 0; $j < $numVars; $j++) {
            $unos = 0;
            $fUno = -1;
            for ($i = 0; $i < $numRestricciones; $i++) {
                if (abs($tabla[$i][$j] - 1.0) < 1e-4) {
                    $unos++;
                    $fUno = $i;
                } elseif (abs($tabla[$i][$j]) > 1e-4) {
                    $unos = -1;
                    break;
                }
            }
            $decision["X" . ($j + 1)] = ($unos === 1 && $fUno !== -1) ? round($tabla[$fUno][$cols - 1], 2) : 0.0;
        }

        return response()->json([
            'metodo' => 'Programación Lineal - Método Simplex Estándar',
            'optimoEncontrado' => true,
            'valorZOptimo' => round($tabla[$filas - 1][$cols - 1], 2),
            'variablesDecision' => $decision,
            'resumenPasos' => $pasos,
            'tablaFinal' => $tabla,
        ]);
    }

    /**
     * H3 PROYECTO SEMESTRAL MN: Servicio Predictivo de Rendimiento Académico
     * Implementa el modelo de mínimos cuadrados con proyección a exámenes de nivel y
     * clasificación de riesgo de deserción R(x_p) según Ecuación 4.11 y Figuras 5.1-5.3.
     */
    public function prediccionRendimiento(Request $request)
    {
        $validated = $request->validate([
            'id_estudiante' => 'nullable|integer',
            'nombre_estudiante' => 'nullable|string',
            'programa' => 'nullable|string',
            'calificaciones' => 'required|array',
            'calificaciones.*.libro' => 'required|integer|min:1|max:36',
            'calificaciones.*.nota' => 'required|numeric|min:0|max:100',
            'libro_examen_nivel_objetivo' => 'nullable|integer|min:1|max:36',
        ]);

        return response()->json($this->calcularPrediccionH3($validated));
    }

    /**
     * H3 Caso de Validación Oficial (Tabla 5.3): Libros 1-6 con notas {78, 74, 75, 68, 66, 61}
     */
    public function validacionH3()
    {
        $caso = [
            'id_estudiante' => 0,
            'nombre_estudiante' => 'Caso Hipotético H3 (Tabla 5.3)',
            'programa' => 'Inglés',
            'libro_examen_nivel_objetivo' => 12,
            'calificaciones' => [
                ['libro' => 1, 'nota' => 78],
                ['libro' => 2, 'nota' => 74],
                ['libro' => 3, 'nota' => 75],
                ['libro' => 4, 'nota' => 68],
                ['libro' => 5, 'nota' => 66],
                ['libro' => 6, 'nota' => 61],
            ],
        ];

        return response()->json($this->calcularPrediccionH3($caso));
    }

    /**
     * H3 Recálculo por Lotes al cierre de rotación docente (Figura 5.4)
     */
    public function recalcularLote(Request $request)
    {
        $validated = $request->validate([
            'estudiantes' => 'required|array|min:1',
        ]);

        $resultados = [];
        $alertas = [];
        $total = count($validated['estudiantes']);
        $insuficientes = 0;
        $alto = 0;
        $medio = 0;
        $bajo = 0;

        foreach ($validated['estudiantes'] as $est) {
            $res = $this->calcularPrediccionH3($est);
            $resultados[] = $res;

            if (!empty($res['datosInsuficientes'])) {
                $insuficientes++;
            } else {
                switch ($res['nivelRiesgo']) {
                    case 'ALTO':
                        $alto++;
                        $alertas[] = $res;
                        break;
                    case 'MEDIO':
                        $medio++;
                        $alertas[] = $res;
                        break;
                    case 'BAJO':
                        $bajo++;
                        break;
                }
            }
        }

        return response()->json([
            'totalEstudiantes' => $total,
            'datosInsuficientes' => $insuficientes,
            'riesgoAlto' => $alto,
            'riesgoMedio' => $medio,
            'riesgoBajo' => $bajo,
            'resultados' => $resultados,
            'alertas' => $alertas,
        ]);
    }

    /**
     * Motor numérico H3 compartido
     */
    private function calcularPrediccionH3(array $data): array
    {
        $nMin = 3;
        $examenesNivel = [6, 12, 18, 24, 30, 36];
        $umbralAlto = 51.0;
        $umbralMedio = 65.0;
        $pendienteAlto = -3.0;

        $califs = $data['calificaciones'] ?? [];
        usort($califs, fn($a, $b) => $a['libro'] <=> $b['libro']);
        $n = count($califs);

        $res = [
            'idEstudiante' => $data['id_estudiante'] ?? null,
            'nombreEstudiante' => $data['nombre_estudiante'] ?? 'Estudiante',
            'programa' => $data['programa'] ?? 'Inglés',
            'librosEvaluados' => $n,
        ];

        // Paso 1: n >= N_MIN
        if ($n < $nMin) {
            $res['datosInsuficientes'] = true;
            $res['nivelRiesgo'] = 'DATOS_INSUFICIENTES';
            $res['mensajeAlerta'] = "Se requieren al menos {$nMin} libros evaluados para generar la predicción. Actualmente cuenta con {$n} libro(s).";
            return $res;
        }

        $res['datosInsuficientes'] = false;

        // Paso 2: Sumatorias y determinantes
        $sumX = 0; $sumY = 0; $sumXX = 0; $sumXY = 0;
        foreach ($califs as $c) {
            $x = (float) $c['libro'];
            $y = (float) $c['nota'];
            $sumX += $x;
            $sumY += $y;
            $sumXX += ($x * $x);
            $sumXY += ($x * $y);
        }

        $delta = ($n * $sumXX) - ($sumX * $sumX);
        if (abs($delta) < 1e-9) {
            $res['datosInsuficientes'] = true;
            $res['nivelRiesgo'] = 'ERROR_CALCULO';
            $res['mensajeAlerta'] = 'Abscisas sin variación: todos los libros tienen el mismo número.';
            return $res;
        }

        // Coeficientes recta: y = a*x + b
        $a = (($n * $sumXY) - ($sumX * $sumY)) / $delta;
        $b = ($sumY - ($a * $sumX)) / $n;
        $mediaY = $sumY / $n;

        // Paso 3: Proyección al siguiente examen de nivel
        $ultimoLibro = end($califs)['libro'];
        $xp = $data['libro_examen_nivel_objetivo'] ?? null;
        if (!$xp) {
            $xp = 36;
            foreach ($examenesNivel as $lvl) {
                if ($lvl > $ultimoLibro) {
                    $xp = $lvl;
                    break;
                }
            }
        }

        $ypRaw = ($a * $xp) + $b;
        $yp = max(0.0, min(100.0, $ypRaw));

        // Paso 4: Tabla de ajuste y métricas de error
        $ssRes = 0.0;
        $ssTot = 0.0;
        $tablaAjuste = [];

        foreach ($califs as $c) {
            $x = (float) $c['libro'];
            $y = (float) $c['nota'];
            $yHat = ($a * $x) + $b;
            $e = $y - $yHat;
            $e2 = $e * $e;

            $ssRes += $e2;
            $ssTot += pow($y - $mediaY, 2);

            $tablaAjuste[] = [
                'libro' => (int) $x,
                'nota' => round($y, 2),
                'notaAjustada' => round($yHat, 2),
                'residuo' => round($e, 2),
                'residuoCuadrado' => round($e2, 4),
            ];
        }

        $r2 = $ssTot > 0 ? max(0.0, min(1.0, 1.0 - ($ssRes / $ssTot))) : 1.0;

        // Paso 5: Clasificación del riesgo R(x_p)
        $nivelRiesgo = 'BAJO';
        $mensajeAlerta = '';

        if ($yp < $umbralAlto || $a < $pendienteAlto) {
            $nivelRiesgo = 'ALTO';
            $razones = [];
            if ($yp < $umbralAlto) {
                $razones[] = sprintf('nota proyectada (%.2f) inferior a %d puntos', $yp, (int)$umbralAlto);
            }
            if ($a < $pendienteAlto) {
                $razones[] = sprintf('pendiente (%.4f) indica pérdida mayor a %.1f puntos por libro', $a, abs($pendienteAlto));
            }
            $mensajeAlerta = '⚠️ RIESGO ALTO DE DESERCIÓN — ' . implode(' y ', $razones) .
                ". Se requiere intervención pedagógica inmediata del Jefe Académico antes del examen de nivel del libro {$xp}.";
        } elseif ($yp < $umbralMedio || $a < 0) {
            $nivelRiesgo = 'MEDIO';
            $razones = [];
            if ($yp < $umbralMedio) {
                $razones[] = sprintf('nota proyectada (%.2f) inferior a %d puntos', $yp, (int)$umbralMedio);
            }
            if ($a < 0) {
                $razones[] = sprintf('tendencia descendente (pendiente %.4f)', $a);
            }
            $mensajeAlerta = '⚡ RIESGO MEDIO — ' . implode(' y ', $razones) .
                '. Se sugiere seguimiento académico reforzado y tutoría complementaria.';
        } else {
            $nivelRiesgo = 'BAJO';
            $mensajeAlerta = sprintf(
                '✅ RIESGO BAJO — Trayectoria estable o ascendente (pendiente %.4f). Nota proyectada de %.2f puntos para el examen del libro %d.',
                $a, $yp, $xp
            );
        }

        $res['pendienteA'] = round($a, 4);
        $res['interceptoB'] = round($b, 4);
        $res['ecuacionRecta'] = sprintf("y = %.4fx %s %.4f", $a, ($b >= 0 ? '+' : '-'), abs($b));
        $res['sumX'] = round($sumX, 2);
        $res['sumY'] = round($sumY, 2);
        $res['sumX2'] = round($sumXX, 2);
        $res['sumXY'] = round($sumXY, 2);
        $res['ssRes'] = round($ssRes, 4);
        $res['ssTot'] = round($ssTot, 4);
        $res['r2'] = round($r2, 4);
        $res['libroExamenNivel'] = $xp;
        $res['notaProyectada'] = round($yp, 2);
        $res['nivelRiesgo'] = $nivelRiesgo;
        $res['mensajeAlerta'] = $mensajeAlerta;
        $res['tablaAjuste'] = $tablaAjuste;

        return $res;
    }
}

