<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'aplicacion' => 'Escuela de Idiomas del Ejército - API REST',
        'version'    => '1.0.0',
        'estado'     => 'Operativo',
        'timezone'   => config('app.timezone'),
        'api_base'   => '/api/v1',
        'modulos'    => [
            'dashboard'      => '/api/v1/dashboard',
            'catalogos'      => '/api/v1/catalogos',
            'estructura'     => '/api/v1/estructura',
            'estudiantes'    => '/api/v1/estudiantes',
            'docentes'       => '/api/v1/docentes',
            'paralelos'      => '/api/v1/paralelos',
            'inscripciones'  => '/api/v1/inscripciones',
            'calificaciones' => '/api/v1/calificaciones',
            'cajas_pagos'    => '/api/v1/cajas',
            'almacen'        => '/api/v1/almacen',
        ],
    ]);
});
