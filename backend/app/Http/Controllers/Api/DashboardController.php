<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
    /**
     * Panel Ejecutivo: KPIs del sistema académico militar para el dashboard principal
     */
    public function index()
    {
        $gestionActiva = Gestion::where('estado_gestion', 'Activa')->first();
        $hoy = Carbon::today();

        // === KPIs de Estudiantes ===
        $totalEstudiantes = Estudiante::count();
        $militares = Estudiante::where('tipo_estudiante', 'Militar')->count();
        $civiles = Estudiante::where('tipo_estudiante', 'Civil')->count();

        // === KPIs de Docentes ===
        $totalDocentes = Docente::where('estado_docente', 'Activo')->count();
        $docentesConAlerta = AsignacionDocenteParalelo::whereNull('fecha_fin_asignacion')
            ->where('fecha_inicio_asignacion', '<=', Carbon::now()->subDays(14)->toDateString())
            ->count();

        // === KPIs de Paralelos ===
        $paralelosActivos = $gestionActiva
            ? Paralelo::where('id_gestion', $gestionActiva->id_gestion)
                ->whereIn('estado_paralelo', ['Abierto', 'En curso'])
                ->count()
            : 0;

        // === KPIs de Inscripciones ===
        $inscripcionesActivas = Inscripcion::where('estado_inscripcion', 'Activa')->count();

        // === KPIs de Cajas FIFO ===
        $fichasHoy = FichaAtencion::whereDate('hora_llegada_ficha', $hoy)->get();
        $enEspera = $fichasHoy->where('estado_ficha', 'En espera')->count();
        $atendidasHoy = $fichasHoy->where('estado_ficha', 'Atendida')->count();
        $tiemposEspera = $fichasHoy->where('estado_ficha', 'Atendida')
            ->map(fn($f) => $f->tiempo_espera_minutos)->filter();
        $promedioEspera = $tiemposEspera->isNotEmpty() ? round($tiemposEspera->avg(), 1) : 0;

        // === KPIs de Almacén ===
        $librosEnAlertaRop = AlmacenLibro::bajoPuntoReorden()->count();
        $totalUnidadesStock = AlmacenLibro::sum('stock_actual_almacen');

        // === KPIs Financieros ===
        $ingresosMes = $gestionActiva
            ? Pago::where('id_gestion', $gestionActiva->id_gestion)
                ->whereMonth('fecha_pago', Carbon::now()->month)
                ->sum('monto_pago')
            : 0;

        return response()->json([
            'gestion_activa' => $gestionActiva ? $gestionActiva->anio_gestion : null,
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
                'cajas_fifo' => [
                    'en_espera'               => $enEspera,
                    'atendidas_hoy'           => $atendidasHoy,
                    'promedio_espera_minutos'  => $promedioEspera,
                ],
                'almacen' => [
                    'alertas_rop'       => $librosEnAlertaRop,
                    'total_unidades'    => $totalUnidadesStock,
                ],
                'financiero' => [
                    'ingresos_mes_bs' => round($ingresosMes, 2),
                ],
            ],
        ]);
    }
}
