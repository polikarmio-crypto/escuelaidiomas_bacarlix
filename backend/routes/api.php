<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CatalogoController;
use App\Http\Controllers\Api\EstructuraAcademicaController;
use App\Http\Controllers\Api\EstudianteController;
use App\Http\Controllers\Api\DocenteController;
use App\Http\Controllers\Api\ParaleloController;
use App\Http\Controllers\Api\InscripcionController;
use App\Http\Controllers\Api\CalificacionController;
use App\Http\Controllers\Api\CajaPagoController;
use App\Http\Controllers\Api\AlmacenController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AsistenciaController;
use App\Http\Controllers\Api\MetodosNumericosController;

Route::prefix('v1')->group(function () {

    Route::get('/health', function () {
        return response()->json([
            'status'   => 'online',
            'servicio' => 'Escuela de Idiomas del Ejército - Core API',
            'version'  => '2.0.0',
            'hora_servidor' => now()->toDateTimeString(),
        ]);
    });

    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/usuarios', [AuthController::class, 'usuarios']);
    });

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::prefix('catalogos')->group(function () {
        Route::get('/', [CatalogoController::class, 'index']);
        
        Route::get('/gestiones', [CatalogoController::class, 'gestiones']);
        Route::post('/gestiones', [CatalogoController::class, 'storeGestion']);
        Route::put('/gestiones/{id}', [CatalogoController::class, 'updateGestion']);
        Route::delete('/gestiones/{id}', [CatalogoController::class, 'destroyGestion']);

        Route::get('/idiomas', [CatalogoController::class, 'idiomas']);
        Route::post('/idiomas', [CatalogoController::class, 'storeIdioma']);
        Route::put('/idiomas/{id}', [CatalogoController::class, 'updateIdioma']);
        Route::delete('/idiomas/{id}', [CatalogoController::class, 'destroyIdioma']);

        Route::get('/aulas', [CatalogoController::class, 'aulas']);
        Route::post('/aulas', [CatalogoController::class, 'storeAula']);
        Route::put('/aulas/{id}', [CatalogoController::class, 'updateAula']);
        Route::delete('/aulas/{id}', [CatalogoController::class, 'destroyAula']);

        Route::get('/horarios', [CatalogoController::class, 'horarios']);
        Route::post('/horarios', [CatalogoController::class, 'storeHorario']);
        Route::put('/horarios/{id}', [CatalogoController::class, 'updateHorario']);
        Route::delete('/horarios/{id}', [CatalogoController::class, 'destroyHorario']);

        Route::get('/tipos-programa', [CatalogoController::class, 'tiposPrograma']);
        Route::post('/tipos-programa', [CatalogoController::class, 'storeTipoPrograma']);

        Route::get('/modalidades', [CatalogoController::class, 'modalidades']);
        Route::post('/modalidades', [CatalogoController::class, 'storeModalidad']);

        Route::get('/tipos-pago', [CatalogoController::class, 'tiposPago']);
        Route::post('/tipos-pago', [CatalogoController::class, 'storeTipoPago']);

        Route::get('/cajas', [CatalogoController::class, 'cajas']);
        Route::post('/cajas', [CatalogoController::class, 'storeCaja']);
    });

    Route::prefix('estructura')->group(function () {
        Route::get('/programas', [EstructuraAcademicaController::class, 'index']);
        Route::get('/programas/{id}', [EstructuraAcademicaController::class, 'showPrograma']);
        Route::post('/programas', [EstructuraAcademicaController::class, 'storePrograma']);
        Route::put('/programas/{id}', [EstructuraAcademicaController::class, 'updatePrograma']);
        Route::delete('/programas/{id}', [EstructuraAcademicaController::class, 'destroyPrograma']);

        Route::post('/niveles', [EstructuraAcademicaController::class, 'storeNivel']);
        Route::put('/niveles/{id}', [EstructuraAcademicaController::class, 'updateNivel']);
        Route::delete('/niveles/{id}', [EstructuraAcademicaController::class, 'destroyNivel']);

        Route::post('/libros', [EstructuraAcademicaController::class, 'storeLibro']);
        Route::put('/libros/{id}', [EstructuraAcademicaController::class, 'updateLibro']);
        Route::delete('/libros/{id}', [EstructuraAcademicaController::class, 'destroyLibro']);
    });

    Route::get('/estudiantes', [EstudianteController::class, 'index']);
    Route::post('/estudiantes', [EstudianteController::class, 'store']);
    Route::get('/estudiantes/{id}', [EstudianteController::class, 'show']);
    Route::put('/estudiantes/{id}', [EstudianteController::class, 'update']);
    Route::delete('/estudiantes/{id}', [EstudianteController::class, 'destroy']);

    Route::get('/docentes', [DocenteController::class, 'index']);
    Route::post('/docentes', [DocenteController::class, 'store']);
    Route::get('/docentes/{id}', [DocenteController::class, 'show']);
    Route::put('/docentes/{id}', [DocenteController::class, 'update']);
    Route::patch('/docentes/{id}/baja-logica', [DocenteController::class, 'bajaLogica']);
    Route::delete('/docentes/{id}', [DocenteController::class, 'destroy']);
    Route::get('/docentes/alertas/rotacion', [DocenteController::class, 'alertarRotaciones']);
    Route::post('/docentes/rotar', [DocenteController::class, 'rotarDocente']);
    Route::post('/docentes/asignacion-automatica', [DocenteController::class, 'asignacionAutomatica']);

    Route::get('/paralelos', [ParaleloController::class, 'index']);
    Route::post('/paralelos', [ParaleloController::class, 'store']);
    Route::get('/paralelos/{id}', [ParaleloController::class, 'show']);
    Route::post('/paralelos/{id}/asignar-docente', [ParaleloController::class, 'asignarDocente']);
    Route::post('/paralelos/{id}/asignar-aula', [ParaleloController::class, 'asignarAula']);

    Route::get('/inscripciones', [InscripcionController::class, 'index']);
    Route::post('/inscripciones', [InscripcionController::class, 'inscribir']);
    Route::get('/inscripciones/{id}', [InscripcionController::class, 'show']);

    Route::get('/calificaciones/paralelo/{id}', [CalificacionController::class, 'notasParalelo']);
    Route::post('/calificaciones/libro', [CalificacionController::class, 'registrarNotaLibro']);
    Route::post('/calificaciones/examen-nivel', [CalificacionController::class, 'registrarExamenNivel']);

    Route::prefix('asistencia')->group(function () {
        Route::get('/', [AsistenciaController::class, 'index']);
        Route::post('/', [AsistenciaController::class, 'registrar']);
        Route::get('/reporte/{idParalelo}', [AsistenciaController::class, 'reporte']);
    });

    Route::prefix('cajas')->group(function () {
        Route::get('/', [CajaPagoController::class, 'listarCajas']);
        Route::get('/cola-espera', [CajaPagoController::class, 'colaEspera']);
        Route::get('/cola-espera', [CajaPagoController::class, 'colaEspera']);
        Route::get('/metricas', [CajaPagoController::class, 'metricasCola']);
        Route::post('/ficha', [CajaPagoController::class, 'emitirFicha']);
        Route::post('/ficha/llamar', [CajaPagoController::class, 'llamarSiguiente']);
        Route::post('/ficha/llamar-siguiente', [CajaPagoController::class, 'llamarSiguiente']);
        Route::post('/ficha/finalizar', [CajaPagoController::class, 'finalizarAtencion']);
        Route::post('/pago', [CajaPagoController::class, 'registrarPago']);
        Route::get('/pagos', [CajaPagoController::class, 'historialPagos']);
    });

    Route::prefix('almacen')->group(function () {
        Route::get('/stock', [AlmacenController::class, 'stock']);
        Route::get('/alertas-rop', [AlmacenController::class, 'alertasRop']);
        Route::post('/movimiento', [AlmacenController::class, 'registrarMovimiento']);
        Route::get('/kardex/{id}', [AlmacenController::class, 'kardex']);
        Route::get('/pedidos', [AlmacenController::class, 'listaPedidos']);
        Route::post('/pedidos', [AlmacenController::class, 'crearPedidoReposicion']);
        Route::put('/pedidos/{id}/recibir', [AlmacenController::class, 'recibirPedido']);
    });

    Route::prefix('metodos-numericos')->group(function () {
        Route::post('/minimos-cuadrados', [MetodosNumericosController::class, 'minimosCuadrados']);
        Route::post('/interpolacion-newton', [MetodosNumericosController::class, 'interpolacionNewton']);
        Route::post('/simplex', [MetodosNumericosController::class, 'optimizacionLineal']);
        Route::post('/prediccion-rendimiento', [MetodosNumericosController::class, 'prediccionRendimiento']);
        Route::get('/prediccion-rendimiento/validacion-h3', [MetodosNumericosController::class, 'validacionH3']);
        Route::post('/prediccion-rendimiento/lote', [MetodosNumericosController::class, 'recalcularLote']);
    });
});
