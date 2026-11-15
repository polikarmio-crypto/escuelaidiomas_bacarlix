<?php

namespace App\Services;

use App\Models\LogAuditoria;
use Carbon\Carbon;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    public const LEVEL_DEBUG = 'DEBUG';
    public const LEVEL_INFO = 'INFO';
    public const LEVEL_WARNING = 'WARNING';
    public const LEVEL_ERROR = 'ERROR';
    public const LEVEL_CRITICAL = 'CRITICAL';
    public const LEVEL_EMERGENCY = 'EMERGENCY';

    public static function auth(string $level, string $action, array $context = [], ?int $userId = null): void
    {
        self::log('auth', $level, $action, $context, $userId, 'usuario');
    }

    public static function almacen(string $level, string $action, array $context = [], ?int $userId = null, ?int $registroId = null): void
    {
        self::log('almacen', $level, $action, $context, $userId, 'almacen_libro', $registroId);
    }

    public static function academico(string $level, string $action, array $context = [], ?int $userId = null, ?string $tabla = null, ?int $registroId = null): void
    {
        self::log('academico', $level, $action, $context, $userId, $tabla, $registroId);
    }

    public static function cajas(string $level, string $action, array $context = [], ?int $userId = null, ?int $registroId = null): void
    {
        self::log('cajas', $level, $action, $context, $userId, 'ficha_atencion', $registroId);
    }

    public static function api(string $level, string $action, array $context = [], ?int $userId = null): void
    {
        self::log('api', $level, $action, $context, $userId);
    }

    public static function log(
        string $modulo,
        string $level,
        string $action,
        array $context = [],
        ?int $userId = null,
        ?string $tabla = null,
        ?int $registroId = null
    ): void {
        $normalizedLevel = strtoupper($level);
        $timestamp = Carbon::now()->toIso8601String();
        $ip = Request::ip() ?? '127.0.0.1';

        $dir = storage_path("logs/{$modulo}");
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }

        $dateFile = Carbon::now()->format('Y-m-d');
        $filePath = "{$dir}/{$dateFile}.log";

        $logEntry = sprintf(
            "[%s] %s: %s | User: %s | IP: %s | Context: %s\n",
            $timestamp,
            $normalizedLevel,
            $action,
            $userId ? (string) $userId : 'GUEST',
            $ip,
            json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );

        @file_put_contents($filePath, $logEntry, FILE_APPEND | LOCK_EX);

        try {
            if ($normalizedLevel !== self::LEVEL_DEBUG) {
                LogAuditoria::create([
                    'id_usuario' => $userId,
                    'modulo_log' => $modulo,
                    'nivel_log' => $normalizedLevel,
                    'accion_log' => $action,
                    'tabla_afectada_log' => $tabla,
                    'registro_id_log' => $registroId,
                    'ip_origen_log' => $ip,
                    'detalles_log' => $context,
                ]);
            }
        } catch (\Throwable $e) {
        }
    }
}

