<?php

return [
    'default' => env('LOG_CHANNEL', 'stack'),

    'deprecations' => [
        'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
        'trace' => env('LOG_DEPRECATIONS_TRACE', false),
    ],

    'channels' => [
        'stack' => [
            'driver' => 'stack',
            'channels' => ['api'],
            'ignore_exceptions' => false,
        ],

        'api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/api/api.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 14,
        ],

        'auth' => [
            'driver' => 'daily',
            'path' => storage_path('logs/auth/auth.log'),
            'level' => 'debug',
            'days' => 30,
        ],

        'almacen' => [
            'driver' => 'daily',
            'path' => storage_path('logs/almacen/almacen.log'),
            'level' => 'debug',
            'days' => 30,
        ],

        'academico' => [
            'driver' => 'daily',
            'path' => storage_path('logs/academico/academico.log'),
            'level' => 'debug',
            'days' => 30,
        ],

        'cajas' => [
            'driver' => 'daily',
            'path' => storage_path('logs/cajas/cajas.log'),
            'level' => 'debug',
            'days' => 30,
        ],
    ],
];

