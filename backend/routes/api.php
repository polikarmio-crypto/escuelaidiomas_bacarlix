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

/*
|--------------------------------------------------------------------------
| API Routes - Escuela de Idiomas del Ejército (EIE)
|--------------------------------------------------------------------------
|
| Backend REST API v1 - Todos los módulos del sistema académico militar
|
*/

Route::prefix('v1')->group(function () {

    // HEALTHCHECK
    Route::get('/health', function () {
        return response()->json([
            'status'   => 'online',
            'servicio' => 'Escuela de Idiomas del Ejército - Core API (Laravel 12)',
            'version'  => '1.0.0',
            'hora_servidor' => now()->toDateTimeString(),
        ]);
    });

    // AUTENTICACIÓN Y ROLES INSTITUCIONALES (6 roles)
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::get('/usuarios', [AuthController::class, 'usuarios']);
    });

    // DASHBOARD: Panel ejecutivo con KPIs consolidados
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // MÓDULO 1: CATÁLOGOS BASE (Administrador del Sistema)
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

    // MÓDULO 2: ESTRUCTURA ACADÉMICA (Jefe Académico)
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

    // MÓDULO: ESTUDIANTES (Civiles y Militares - CRUD Completo)
    Route::get('/estudiantes', [EstudianteController::class, 'index']);
    Route::post('/estudiantes', [EstudianteController::class, 'store']);
    Route::get('/estudiantes/{id}', [EstudianteController::class, 'show']);
    Route::put('/estudiantes/{id}', [EstudianteController::class, 'update']);
    Route::patch('/estudiantes/{id}/baja-logica', [EstudianteController::class, 'bajaLogica']);
    Route::delete('/estudiantes/{id}', [EstudianteController::class, 'destroy']);

    // MÓDULO: DOCENTES Y ROTACIÓN 15 DÍAS (CRUD Completo)
    Route::get('/docentes', [DocenteController::class, 'index']);
    Route::post('/docentes', [DocenteController::class, 'store']);
    Route::get('/docentes/{id}', [DocenteController::class, 'show']);
    Route::put('/docentes/{id}', [DocenteController::class, 'update']);
    Route::patch('/docentes/{id}/baja-logica', [DocenteController::class, 'bajaLogica']);
    Route::delete('/docentes/{id}', [DocenteController::class, 'destroy']);
    Route::get('/docentes/alertas/rotacion', [DocenteController::class, 'alertarRotaciones']);
    Route::post('/docentes/rotar', [DocenteController::class, 'rotarDocente']);

    // MÓDULO: PARALELOS
    Route::get('/paralelos', [ParaleloController::class, 'index']);
    Route::post('/paralelos', [ParaleloController::class, 'store']);
    Route::get('/paralelos/{id}', [ParaleloController::class, 'show']);

    // MÓDULO: INSCRIPCIONES
    Route::get('/inscripciones', [InscripcionController::class, 'index']);
    Route::post('/inscripciones', [InscripcionController::class, 'inscribir']);
    Route::get('/inscripciones/{id}', [InscripcionController::class, 'show']);

    // MÓDULO: CALIFICACIONES (Ponderación Militar 80/10/10)
    Route::get('/calificaciones/paralelo/{id}', [CalificacionController::class, 'notasParalelo']);
    Route::post('/calificaciones/libro', [CalificacionController::class, 'registrarNotaLibro']);
    Route::post('/calificaciones/examen-nivel', [CalificacionController::class, 'registrarExamenNivel']);

    // MÓDULO: CAJAS, COLA FIFO Y PAGOS
    Route::prefix('cajas')->group(function () {
        Route::get('/', [CajaPagoController::class, 'listarCajas']);
        Route::get('/cola-fifo', [CajaPagoController::class, 'colaFifo']);
        Route::get('/metricas', [CajaPagoController::class, 'metricasCola']);
        Route::post('/ficha', [CajaPagoController::class, 'emitirFicha']);
        Route::post('/ficha/llamar', [CajaPagoController::class, 'llamarSiguienteFifo']);
        Route::post('/ficha/finalizar', [CajaPagoController::class, 'finalizarAtencion']);
        Route::post('/pago', [CajaPagoController::class, 'registrarPago']);
        Route::get('/pagos', [CajaPagoController::class, 'historialPagos']);
    });

    // MÓDULO: ALMACÉN E INVENTARIO (ROP / Kardex)
    Route::prefix('almacen')->group(function () {
        Route::get('/stock', [AlmacenController::class, 'stock']);
        Route::get('/alertas-rop', [AlmacenController::class, 'alertasRop']);
        Route::post('/movimiento', [AlmacenController::class, 'registrarMovimiento']);
        Route::get('/kardex/{id}', [AlmacenController::class, 'kardex']);
        Route::get('/pedidos', [AlmacenController::class, 'listaPedidos']);
        Route::post('/pedidos', [AlmacenController::class, 'crearPedidoReposicion']);
        Route::put('/pedidos/{id}/recibir', [AlmacenController::class, 'recibirPedido']);
    });

    // MÓDULO: MÉTODOS NUMÉRICOS E INVESTIGACIÓN OPERATIVA
    Route::prefix('metodos-numericos')->group(function () {
        Route::post('/minimos-cuadrados', [\App\Http\Controllers\Api\MetodosNumericosController::class, 'minimosCuadrados']);
        Route::post('/interpolacion-newton', [\App\Http\Controllers\Api\MetodosNumericosController::class, 'interpolacionNewton']);
        Route::post('/simplex', [\App\Http\Controllers\Api\MetodosNumericosController::class, 'simplex']);
        // H3: Servicio Predictivo de Rendimiento Académico y Riesgo de Deserción
        Route::post('/prediccion-rendimiento', [\App\Http\Controllers\Api\MetodosNumericosController::class, 'prediccionRendimiento']);
        Route::get('/prediccion-rendimiento/validacion-h3', [\App\Http\Controllers\Api\MetodosNumericosController::class, 'validacionH3']);
        Route::post('/prediccion-rendimiento/lote', [\App\Http\Controllers\Api\MetodosNumericosController::class, 'recalcularLote']);
    });
});

