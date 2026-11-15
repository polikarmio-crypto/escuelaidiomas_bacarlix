<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MetodosNumericosController extends Controller
{
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
            return response()->json(['error' => 'Los valores de entrada deben presentar variabilidad para estimar la tendencia.'], 422);
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
            $residuoCuadrado = round(pow($residuo, 2), 4);

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
            'metodo' => 'Proyección de Demanda y Análisis de Tendencias',
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
            'ecuacionRecta' => sprintf("Tendencia: %.4fx %s %.4f", round($m, 4), ($b >= 0 ? '+' : '-'), abs(round($b, 4))),
            'sse' => round($sse, 4),
            'sst' => round($sst, 4),
            'ssr' => round($ssr, 4),
            'r2' => round($r2, 4),
            'rPearson' => round($rPearson, 4),
            'errorEstandar' => round($errorEstandar, 4),
            'tablaDiferencias' => $tablaDiferencias,
            'proyecciones' => $proyecciones,
        ]);
    }

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
            return response()->json(['error' => 'Los arreglos de entrada deben tener la misma longitud.'], 422);
        }

        $f = array_fill(0, $n, array_fill(0, $n, 0.0));
        for ($i = 0; $i < $n; $i++) {
            $f[$i][0] = (float) $y[$i];
        }

        for ($j = 1; $j < $n; $j++) {
            for ($i = 0; $i < $n - $j; $i++) {
                $den = $x[$i + $j] - $x[$i];
                if (abs($den) < 1e-9) {
                    return response()->json(['error' => 'Puntos duplicados en el rango evaluado.'], 422);
                }
                $f[$i][$j] = ($f[$i + 1][$j - 1] - $f[$i][$j - 1]) / $den;
            }
        }

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
            'metodo' => 'Punto de Equilibrio y Capacidad Operativa',
            'grado' => $n - 1,
            'xEvaluado' => $xEval,
            'valorInterpolado' => round($resultado, 4),
            'coeficientes' => $coefs,
            'polinomioNewton' => "Curva = {$poli}",
            'tablaDiferenciasDivididas' => $f,
        ]);
    }

    public function optimizacionLineal(Request $request)
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

        for ($i = 0; $i < $numRestricciones; $i++) {
            for ($j = 0; $j < $numVars; $j++) {
                $tabla[$i][$j] = (float) $A[$i][$j];
            }
            $tabla[$i][$numVars + $i] = 1.0;
            $tabla[$i][$cols - 1] = (float) $b[$i];
        }

        for ($j = 0; $j < $numVars; $j++) {
            $tabla[$filas - 1][$j] = -((float) $c[$j]);
        }

        $pasos = ["Matriz inicial con {$numRestricciones} restricciones operativas."];
        $iter = 0;

        while ($iter < 30) {
            $iter++;

            $colPivote = -1;
            $menor = 0.0;
            for ($j = 0; $j < $cols - 1; $j++) {
                if ($tabla[$filas - 1][$j] < $menor) {
                    $menor = $tabla[$filas - 1][$j];
                    $colPivote = $j;
                }
            }

            if ($colPivote === -1) {
                $pasos[] = "Convergencia óptima alcanzada en la fase {$iter}.";
                break;
            }

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
                $pasos[] = "Solución sin límite superior.";
                break;
            }

            $pasos[] = "Fase {$iter}: Ajuste de recurso " . ($colPivote + 1) . " con restricción " . ($filaPivote + 1);

            $elemPivote = $tabla[$filaPivote][$colPivote];
            for ($j = 0; $j < $cols; $j++) {
                $tabla[$filaPivote][$j] /= $elemPivote;
            }

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
            'metodo' => 'Optimización de Asignación Presupuestaria y Recursos',
            'optimoEncontrado' => true,
            'valorZOptimo' => round($tabla[$filas - 1][$cols - 1], 2),
            'variablesDecision' => $decision,
            'resumenPasos' => $pasos,
            'tablaFinal' => $tabla,
        ]);
    }

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

    public function validacionH3()
    {
        $caso = [
            'id_estudiante' => 0,
            'nombre_estudiante' => 'Caso de Monitoreo Académico',
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

        if ($n < $nMin) {
            $res['datosInsuficientes'] = true;
            $res['nivelRiesgo'] = 'DATOS_INSUFICIENTES';
            $res['mensajeAlerta'] = "Se requieren al menos {$nMin} libros evaluados para generar el análisis. Actualmente cuenta con {$n} libro(s).";
            return $res;
        }

        $res['datosInsuficientes'] = false;

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
            $res['mensajeAlerta'] = 'Valores sin variación en la serie académica.';
            return $res;
        }

        $a = (($n * $sumXY) - ($sumX * $sumY)) / $delta;
        $b = ($sumY - ($a * $sumX)) / $n;
        $mediaY = $sumY / $n;

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

        $nivelRiesgo = 'BAJO';
        $mensajeAlerta = '';

        if ($yp < $umbralAlto || $a < $pendienteAlto) {
            $nivelRiesgo = 'ALTO';
            $razones = [];
            if ($yp < $umbralAlto) {
                $razones[] = sprintf('calificación estimada (%.2f) inferior a %d puntos', $yp, (int)$umbralAlto);
            }
            if ($a < $pendienteAlto) {
                $razones[] = sprintf('disminución superior a %.1f puntos por libro', abs($pendienteAlto));
            }
            $mensajeAlerta = 'ALERTA ACADÉMICA — ' . implode(' y ', $razones) .
                ". Se requiere seguimiento del Departamento Académico antes del examen de nivel del libro {$xp}.";
        } elseif ($yp < $umbralMedio || $a < 0) {
            $nivelRiesgo = 'MEDIO';
            $razones = [];
            if ($yp < $umbralMedio) {
                $razones[] = sprintf('calificación estimada (%.2f) inferior a %d puntos', $yp, (int)$umbralMedio);
            }
            if ($a < 0) {
                $razones[] = sprintf('trayectoria con variación negativa (%.4f)', $a);
            }
            $mensajeAlerta = 'ATENCIÓN PREVENTIVA — ' . implode(' y ', $razones) .
                '. Se sugiere reforzamiento pedagógico complementario.';
        } else {
            $nivelRiesgo = 'BAJO';
            $mensajeAlerta = sprintf(
                'DESEMPEÑO REGULAR — Trayectoria estable. Calificación estimada de %.2f puntos para el examen del libro %d.',
                $yp, $xp
            );
        }

        $res['pendienteA'] = round($a, 4);
        $res['interceptoB'] = round($b, 4);
        $res['ecuacionRecta'] = sprintf("Estimación: %.4fx %s %.4f", $a, ($b >= 0 ? '+' : '-'), abs($b));
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
