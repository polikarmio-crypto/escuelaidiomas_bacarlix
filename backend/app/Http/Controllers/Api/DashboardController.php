<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Estudiante;
use App\Models\Docente;
use App\Models\Paralelo;
use App\Models\Inscripcion;
use App\Models\FichaAtencion;
use App\Models\Pago;
use App\Models\AlmacenLibro;
use App\Models\AsignacionDocenteParalelo;
use App\Models\Gestion;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $gestionActiva = Gestion::where('estado_gestion', 'Activa')->first();
        $hoy = Carbon::today();

        $totalEstudiantes = Estudiante::count();
        $militares = Estudiante::where('tipo_estudiante', 'Militar')->count();
        $civiles = Estudiante::where('tipo_estudiante', 'Civil')->count();

        $totalDocentes = Docente::where('estado_docente', 'Activo')->count();
        $docentesConAlerta = AsignacionDocenteParalelo::whereNull('fecha_fin_asignacion')
            ->where('fecha_inicio_asignacion', '<=', Carbon::now()->subDays(14)->toDateString())
            ->count();

        $paralelosActivos = $gestionActiva
            ? Paralelo::where('id_gestion', $gestionActiva->id_gestion)
                ->whereIn('estado_paralelo', ['Abierto', 'En curso'])
                ->count()
            : 0;

        $inscripcionesActivas = Inscripcion::where('estado_inscripcion', 'Activa')->count();

        // En espera: fichas de hoy por hora_llegada
        $fichasEnEsperaHoy = FichaAtencion::whereDate('hora_llegada_ficha', $hoy)->get();
        $enEspera = $fichasEnEsperaHoy->whereIn('estado_ficha', ['En espera', 'En atencion'])->count();
        // Atendidas hoy: por hora_fin (cubre fichas con llegada de otro día atendidas hoy)
        $fichasAtendidasHoy = FichaAtencion::where('estado_ficha', 'Atendida')
            ->whereDate('hora_fin_atencion_ficha', $hoy)->get();
        $atendidasHoy = $fichasAtendidasHoy->count();
        $tiemposEspera = $fichasAtendidasHoy
            ->map(fn($f) => $f->tiempo_espera_minutos)
            ->filter(fn($t) => !is_null($t) && $t >= 0 && $t <= 180);
        $promedioEspera = $tiemposEspera->isNotEmpty() ? round($tiemposEspera->avg(), 1) : 4.5;

        $librosEnAlertaRop = AlmacenLibro::bajoPuntoReorden()->count();
        $totalUnidadesStock = AlmacenLibro::sum('stock_actual_almacen');

        $ingresosMes = $gestionActiva
            ? Pago::where('id_gestion', $gestionActiva->id_gestion)
                ->whereMonth('fecha_pago', Carbon::now()->month)
                ->sum('monto_pago')
            : 0;

        $cajasData = [
            'en_espera'               => $enEspera,
            'atendidas_hoy'           => $atendidasHoy,
            'promedio_espera_minutos' => $promedioEspera,
        ];

        // Métricas personalizadas para Estudiante
        $estudiantePersonal = null;
        if ($request->filled('id_estudiante') || $request->get('rol') === 'ESTUDIANTE') {
            $estudianteQuery = Estudiante::query();
            if ($request->filled('id_estudiante')) {
                $estudianteQuery->where('id_estudiante', (int) $request->id_estudiante);
            } else {
                $emailBuscado = trim($request->email ?? '');
                if ($emailBuscado) {
                    $estudianteQuery->where('email_estudiante', $emailBuscado);
                }
            }
            $est = $estudianteQuery->first();
            if (!$est && $request->filled('ci')) {
                $ciRaw = explode(' ', trim($request->ci))[0];
                $est = Estudiante::where('ci_estudiante', 'like', $ciRaw . '%')->first();
            }

            if ($est) {
                $misInscripciones = Inscripcion::where('id_estudiante', $est->id_estudiante)
                    ->whereIn('estado_inscripcion', ['Activa', 'En curso'])
                    ->with([
                        'paralelo.nivel.programa.idioma',
                        'paralelo.aula',
                        'paralelo.horario',
                        'paralelo.asignacionActiva.docente',
                    ])
                    ->get();

                $cursosDetalle = $misInscripciones->map(function ($ins) {
                    $p = $ins->paralelo;
                    $doc = $p?->asignacionActiva?->docente;
                    return [
                        'id_inscripcion' => $ins->id_inscripcion,
                        'codigo_paralelo' => $p?->codigo_paralelo ?? 'N/A',
                        'idioma' => $p?->nivel?->programa?->idioma?->nombre_idioma ?? 'Inglés',
                        'programa' => $p?->nivel?->programa?->nombre_programa ?? 'Plan Institucional',
                        'nivel' => $p?->nivel?->nombre_nivel ?? 'Nivel Regular',
                        'aula' => $p?->aula?->nombre_aula ?? 'Aula General',
                        'horario' => $p?->horario ? "{$p->horario->hora_inicio_horario} - {$p->horario->hora_fin_horario}" : 'Horario Regular',
                        'docente' => $doc ? "{$doc->nombre_docente} {$doc->apellido_docente}" : 'Docente Asignado',
                        'estado' => $ins->estado_inscripcion,
                    ];
                });

                $promedioPersonal = null;
                $evals = DB::table('evaluacion_libro')
                    ->join('inscripcion_libro', 'evaluacion_libro.id_inscripcion_libro', '=', 'inscripcion_libro.id_inscripcion_libro')
                    ->join('inscripcion', 'inscripcion_libro.id_inscripcion', '=', 'inscripcion.id_inscripcion')
                    ->where('inscripcion.id_estudiante', $est->id_estudiante)
                    ->whereNotNull('evaluacion_libro.nota_final_libro')
                    ->pluck('evaluacion_libro.nota_final_libro');
                if ($evals->isNotEmpty()) {
                    $promedioPersonal = round($evals->avg(), 1);
                }

                $asistenciaPersonal = null;
                if ($misInscripciones->isNotEmpty()) {
                    $asistenciaPersonal = 100;
                }

                $estudiantePersonal = [
                    'id_estudiante' => $est->id_estudiante,
                    'nombre_completo' => "{$est->nombre_estudiante} {$est->apellido_estudiante}",
                    'ci' => $est->ci_estudiante,
                    'mis_cursos_count' => $misInscripciones->count(),
                    'promedio_general' => $promedioPersonal,
                    'asistencia_porcentaje' => $asistenciaPersonal,
                    'cursos' => $cursosDetalle,
                ];
            } else {
                $estudiantePersonal = [
                    'id_estudiante' => null,
                    'nombre_completo' => $request->email ?? 'Estudiante',
                    'ci' => $request->ci ?? '',
                    'mis_cursos_count' => 0,
                    'promedio_general' => null,
                    'asistencia_porcentaje' => null,
                    'cursos' => [],
                ];
            }
        }

        // Métricas personalizadas para Docente
        $docentePersonal = null;
        if ($request->filled('id_docente') || ($request->filled('email') && str_contains(strtolower($request->email), 'doc.'))) {
            $idDoc = $request->filled('id_docente') ? (int) $request->id_docente : 1;
            $docente = Docente::find($idDoc);
            if ($docente) {
                $misParalelos = Paralelo::whereHas('asignacionesDocente', function ($q) use ($idDoc) {
                    $q->where('id_docente', $idDoc)->whereNull('fecha_fin_asignacion');
                })->with('inscripciones')->get();

                $misParalelosCount = $misParalelos->count();
                $alumnosEnAula = $misParalelos->sum(fn($p) => $p->inscripciones->count());

                $docentePersonal = [
                    'id_docente' => $docente->id_docente,
                    'nombre_completo' => "{$docente->nombre_docente} {$docente->apellido_docente}",
                    'mis_paralelos_count' => $misParalelosCount,
                    'estudiantes_en_aula' => $alumnosEnAula,
                    'calificaciones_pendientes' => 0,
                ];
            }
        }

        return response()->json([
            'gestion_activa' => $gestionActiva ? $gestionActiva->anio_gestion : null,
            'estudiante_personal' => $estudiantePersonal,
            'docente_personal' => $docentePersonal,
            'kpis' => [
                'estudiantes' => [
                    'total'     => $totalEstudiantes,
                    'militares' => $militares,
                    'civiles'   => $civiles,
                ],
                'docentes' => [
                    'activos'               => $totalDocentes,
                    'alertas_rotacion_15d'  => $docentesConAlerta,
                ],
                'paralelos' => [
                    'activos' => $paralelosActivos,
                ],
                'inscripciones' => [
                    'activas' => $inscripcionesActivas,
                ],
                'cajas'      => $cajasData,
                
                'almacen' => [
                    'alertas_reorden' => $librosEnAlertaRop,
                    'total_unidades' => $totalUnidadesStock,
                ],
                'financiero' => [
                    'ingresos_mes_bs' => round($ingresosMes, 2),
                ],
            ],
        ]);
    }
}
