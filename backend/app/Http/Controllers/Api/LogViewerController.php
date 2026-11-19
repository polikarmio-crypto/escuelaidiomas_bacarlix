<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class LogViewerController extends Controller
{
    /**
     * Definición de metadatos de las categorías conocidas del sistema
     */
    protected array $categoriesMeta = [
        'auth' => [
            'name' => 'Autenticación y Seguridad',
            'system' => 'Backend (Laravel)',
            'scope' => 'backend',
            'description' => 'Logins, logouts, accesos denegados, rotación de credenciales y eventos de seguridad militar.',
            'icon' => 'Shield',
            'color' => '#3b82f6',
        ],
        'academico' => [
            'name' => 'Gestión Académica y Curricular',
            'system' => 'Backend (Laravel)',
            'scope' => 'backend',
            'description' => 'Malla curricular, programas, niveles, libros, asignación y rotación docente, estudiantes y actas.',
            'icon' => 'GraduationCap',
            'color' => '#10b981',
        ],
        'cajas' => [
            'name' => 'Cajas y Recaudaciones',
            'system' => 'Backend (Laravel)',
            'scope' => 'backend',
            'description' => 'Emisión de fichas de turno, teoría de colas, atención en ventanillas de recaudación y pagos.',
            'icon' => 'Landmark',
            'color' => '#f59e0b',
        ],
        'almacen' => [
            'name' => 'Almacén e Inventario de Textos',
            'system' => 'Backend (Laravel)',
            'scope' => 'backend',
            'description' => 'Control de stock físico, movimientos de kardex (entradas/salidas), punto de reposición (ROP) y pedidos.',
            'icon' => 'Package',
            'color' => '#ec4899',
        ],
        'api' => [
            'name' => 'API y Núcleo del Sistema',
            'system' => 'Backend (Laravel)',
            'scope' => 'backend',
            'description' => 'Peticiones HTTP entrantes, rutas API, consultas a PostgreSQL y excepciones del framework.',
            'icon' => 'Database',
            'color' => '#8b5cf6',
        ],
        'frontend' => [
            'name' => 'Cliente Web y Navegación',
            'system' => 'Frontend (Next.js)',
            'scope' => 'frontend',
            'description' => 'Eventos de interfaz de usuario, navegación, cambios de accesibilidad/tema y excepciones de cliente React.',
            'icon' => 'Globe',
            'color' => '#06b6d4',
        ],
        'quarkus' => [
            'name' => 'Microservicio Analítica Predictiva',
            'system' => 'Quarkus (Java Reactive)',
            'scope' => 'quarkus',
            'description' => 'Mínimos cuadrados, interpolación Newton, Simplex militar de recursos y modelo predictivo H3 de deserción.',
            'icon' => 'Cpu',
            'color' => '#ef4444',
        ],
    ];

    /**
     * Valida y sanitiza el nombre de la carpeta para prevenir Directory Traversal
     */
    protected function sanitizeFolder(string $folder): string
    {
        $clean = preg_replace('/[^a-zA-Z0-9_\-]/', '', $folder);
        return empty($clean) ? 'api' : $clean;
    }

    /**
     * Valida y sanitiza el nombre del archivo
     */
    protected function sanitizeFile(string $file): string
    {
        $file = basename($file);
        $clean = preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $file);
        return (str_ends_with($clean, '.log') || str_contains($clean, '.log.')) ? $clean : 'laravel.log';
    }

    /**
     * Resuelve la ruta física del archivo de log
     */
    protected function resolveLogPath(string $folder, string $file): ?string
    {
        $folder = $this->sanitizeFolder($folder);
        $file = $this->sanitizeFile($file);

        $path = storage_path("logs/{$folder}/{$file}");
        if (File::exists($path)) {
            return $path;
        }

        // Fallback especial para Quarkus si corre fuera de storage/logs
        if ($folder === 'quarkus') {
            $quarkusPaths = [
                base_path("../quarkus/logs/{$file}"),
                base_path("../quarkus/target/{$file}"),
                storage_path("logs/quarkus/quarkus.log"),
            ];
            foreach ($quarkusPaths as $alt) {
                if (File::exists($alt)) {
                    return $alt;
                }
            }
        }

        return null;
    }

    /**
     * Formatea tamaño en bytes a representación legible
     */
    protected function formatBytes(int $bytes): string
    {
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 1) . ' KB';
        }
        return $bytes . ' B';
    }

    /**
     * GET /api/v1/logs/folders
     * Lista todas las carpetas/categorías de logs con metadatos
     */
    public function folders()
    {
        $baseLogsDir = storage_path('logs');
        $folders = [];

        // Asegurar que las carpetas base existan
        foreach (array_keys($this->categoriesMeta) as $folderKey) {
            $dir = "{$baseLogsDir}/{$folderKey}";
            if (!File::isDirectory($dir)) {
                @File::makeDirectory($dir, 0775, true);
            }
        }

        // Escanear todas las carpetas dentro de storage/logs
        $directories = File::directories($baseLogsDir);

        foreach ($directories as $dirPath) {
            $folderName = basename($dirPath);
            $files = File::files($dirPath);

            $logFiles = array_filter($files, function ($file) {
                return str_ends_with($file->getFilename(), '.log') || str_contains($file->getFilename(), '.log.');
            });

            $totalBytes = 0;
            $latestFile = null;
            $latestTimestamp = 0;

            foreach ($logFiles as $f) {
                $totalBytes += $f->getSize();
                if ($f->getMTime() > $latestTimestamp) {
                    $latestTimestamp = $f->getMTime();
                    $latestFile = $f->getFilename();
                }
            }

            // Fallback para quarkus si storage está vacío
            if ($folderName === 'quarkus' && count($logFiles) === 0) {
                $altDir = base_path('../quarkus/logs');
                $altTarget = base_path('../quarkus/target');
                if (File::isDirectory($altDir)) {
                    $altFiles = array_filter(File::files($altDir), fn($f) => str_contains($f->getFilename(), '.log'));
                    foreach ($altFiles as $f) {
                        $logFiles[] = $f;
                        $totalBytes += $f->getSize();
                        if ($f->getMTime() > $latestTimestamp) {
                            $latestTimestamp = $f->getMTime();
                            $latestFile = $f->getFilename();
                        }
                    }
                } elseif (File::isDirectory($altTarget)) {
                    $altFiles = array_filter(File::files($altTarget), fn($f) => str_contains($f->getFilename(), '.log'));
                    foreach ($altFiles as $f) {
                        $logFiles[] = $f;
                        $totalBytes += $f->getSize();
                        if ($f->getMTime() > $latestTimestamp) {
                            $latestTimestamp = $f->getMTime();
                            $latestFile = $f->getFilename();
                        }
                    }
                }
            }

            $meta = $this->categoriesMeta[$folderName] ?? [
                'name' => ucfirst($folderName),
                'system' => 'Sistema Interno',
                'scope' => 'backend',
                'description' => "Registros y trazas de {$folderName}",
                'icon' => 'Folder',
                'color' => '#6b7280',
            ];

            $folders[] = [
                'id' => $folderName,
                'name' => $meta['name'],
                'system' => $meta['system'],
                'scope' => $meta['scope'],
                'description' => $meta['description'],
                'icon' => $meta['icon'],
                'color' => $meta['color'],
                'file_count' => count($logFiles),
                'total_bytes' => $totalBytes,
                'total_human' => $this->formatBytes($totalBytes),
                'latest_file' => $latestFile,
                'latest_activity' => $latestTimestamp > 0 ? Carbon::createFromTimestamp($latestTimestamp)->toIso8601String() : null,
            ];
        }

        // Ordenar con prioridad: backend (auth, academico, cajas, almacen, api), luego frontend, luego quarkus
        $order = ['auth', 'academico', 'cajas', 'almacen', 'api', 'frontend', 'quarkus'];
        usort($folders, function ($a, $b) use ($order) {
            $idxA = array_search($a['id'], $order);
            $idxB = array_search($b['id'], $order);
            $idxA = $idxA === false ? 999 : $idxA;
            $idxB = $idxB === false ? 999 : $idxB;
            return $idxA <=> $idxB;
        });

        return response()->json([
            'status' => 'success',
            'total_folders' => count($folders),
            'folders' => $folders,
        ]);
    }

    /**
     * GET /api/v1/logs/files?folder={folder}
     * Lista los archivos .log dentro de una carpeta específica
     */
    public function files(Request $request)
    {
        $folder = $this->sanitizeFolder($request->query('folder', 'auth'));
        $dir = storage_path("logs/{$folder}");

        if (!File::isDirectory($dir)) {
            @File::makeDirectory($dir, 0775, true);
        }

        $files = File::files($dir);

        // Fallback especial para Quarkus
        if ($folder === 'quarkus' && count($files) === 0) {
            $altQuarkus = base_path('../quarkus/logs');
            if (File::isDirectory($altQuarkus)) {
                $files = File::files($altQuarkus);
            }
            if (count($files) === 0 && File::isDirectory(base_path('../quarkus/target'))) {
                $files = File::files(base_path('../quarkus/target'));
            }
        }

        $logFiles = [];
        $today = Carbon::now()->format('Y-m-d');

        foreach ($files as $file) {
            $filename = $file->getFilename();
            if (!str_ends_with($filename, '.log') && !str_contains($filename, '.log.')) {
                continue;
            }

            $size = $file->getSize();
            $mtime = $file->getMTime();
            $isToday = str_contains($filename, $today);

            $logFiles[] = [
                'filename' => $filename,
                'size_bytes' => $size,
                'size_human' => $this->formatBytes($size),
                'updated_at' => Carbon::createFromTimestamp($mtime)->toIso8601String(),
                'is_today' => $isToday,
            ];
        }

        // Ordenar archivos por fecha de modificación descendente
        usort($logFiles, fn($a, $b) => strcmp($b['updated_at'], $a['updated_at']));

        return response()->json([
            'status' => 'success',
            'folder' => $folder,
            'total_files' => count($logFiles),
            'files' => $logFiles,
        ]);
    }

    /**
     * GET /api/v1/logs/entries?folder={folder}&file={file}&level={level}&search={search}&page={page}&per_page={per_page}
     * Lee y parsea un archivo de log línea por línea con soporte para múltiples formatos
     */
    public function entries(Request $request)
    {
        $folder = $this->sanitizeFolder($request->query('folder', 'auth'));
        $requestedFile = $request->query('file');
        $filterLevel = strtoupper($request->query('level', 'ALL'));
        $searchQuery = trim((string) $request->query('search', ''));
        $page = max(1, (int) $request->query('page', 1));
        $perPage = max(10, min(200, (int) $request->query('per_page', 50)));

        // Si no se proporcionó archivo, buscar el más reciente de la carpeta
        if (empty($requestedFile)) {
            $dir = storage_path("logs/{$folder}");
            $files = File::isDirectory($dir) ? File::files($dir) : [];
            if (!empty($files)) {
                usort($files, fn($a, $b) => $b->getMTime() <=> $a->getMTime());
                $requestedFile = $files[0]->getFilename();
            } else {
                $requestedFile = Carbon::now()->format('Y-m-d') . '.log';
            }
        }

        $filePath = $this->resolveLogPath($folder, $requestedFile);

        if (!$filePath || !File::exists($filePath)) {
            return response()->json([
                'status' => 'success',
                'folder' => $folder,
                'file' => $requestedFile,
                'total_entries' => 0,
                'filtered_entries' => 0,
                'counters' => [
                    'ALL' => 0,
                    'INFO' => 0,
                    'WARNING' => 0,
                    'ERROR' => 0,
                    'DEBUG' => 0,
                    'CRITICAL' => 0,
                    'AUDIT' => 0,
                ],
                'entries' => [],
                'message' => 'El archivo de registro está vacío o aún no ha sido creado.',
            ]);
        }

        $rawLines = @file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];

        $parsedEntries = [];
        $counters = [
            'ALL' => 0,
            'INFO' => 0,
            'WARNING' => 0,
            'ERROR' => 0,
            'DEBUG' => 0,
            'CRITICAL' => 0,
            'AUDIT' => 0,
        ];

        $currentEntry = null;
        $entryIndex = 1;

        foreach ($rawLines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '') continue;

            $entry = $this->parseLogLine($trimmed, $entryIndex);

            if ($entry !== null) {
                if ($currentEntry !== null) {
                    $parsedEntries[] = $currentEntry;
                }
                $currentEntry = $entry;
                $entryIndex++;
            } elseif ($currentEntry !== null) {
                // Línea de continuación (stacktrace, detalles multilínea, etc.)
                if (empty($currentEntry['stacktrace'])) {
                    $currentEntry['stacktrace'] = [];
                }
                $currentEntry['stacktrace'][] = $trimmed;
            }
        }

        if ($currentEntry !== null) {
            $parsedEntries[] = $currentEntry;
        }

        // Calcular contadores por nivel antes del filtro de nivel/búsqueda
        foreach ($parsedEntries as $item) {
            $counters['ALL']++;
            $lvl = $item['level'];
            if (isset($counters[$lvl])) {
                $counters[$lvl]++;
            } else {
                $counters[$lvl] = 1;
            }
        }

        // Aplicar filtros
        $filtered = array_filter($parsedEntries, function ($item) use ($filterLevel, $searchQuery) {
            if ($filterLevel !== 'ALL' && $item['level'] !== $filterLevel) {
                return false;
            }

            if ($searchQuery !== '') {
                $searchLower = mb_strtolower($searchQuery);
                $match = str_contains(mb_strtolower($item['action'] ?? ''), $searchLower)
                    || str_contains(mb_strtolower($item['message'] ?? ''), $searchLower)
                    || str_contains(mb_strtolower($item['user'] ?? ''), $searchLower)
                    || str_contains(mb_strtolower($item['ip'] ?? ''), $searchLower)
                    || str_contains(mb_strtolower(json_encode($item['context'] ?? '')), $searchLower)
                    || str_contains(mb_strtolower($item['raw']), $searchLower);

                if (!$match) return false;
            }

            return true;
        });

        // Ordenar: logs más recientes primero
        $filtered = array_reverse(array_values($filtered));

        $totalFiltered = count($filtered);
        $offset = ($page - 1) * $perPage;
        $pagedEntries = array_slice($filtered, $offset, $perPage);

        return response()->json([
            'status' => 'success',
            'folder' => $folder,
            'file' => basename($filePath),
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($totalFiltered / $perPage),
            'total_entries' => count($parsedEntries),
            'filtered_entries' => $totalFiltered,
            'counters' => $counters,
            'entries' => $pagedEntries,
        ]);
    }

    /**
     * Parsea una línea de registro identificando los formatos AuditLogger, Monolog o Quarkus
     */
    protected function parseLogLine(string $line, int $id): ?array
    {
        // -------------------------------------------------------------
        // Formato 1: AuditLogger del Sistema EIE
        // [2026-11-17T09:24:40-04:00] DEBUG: LOGIN_ATTEMPT | User: GUEST | IP: 172.18.0.1 | Context: {...}
        // -------------------------------------------------------------
        $patternAudit = '/^\[(?<date>[^\]]+)\]\s+(?<level>[A-Z]+):\s+(?<action>[^|]+)\s+\|\s+User:\s+(?<user>[^|]+)\s+\|\s+IP:\s+(?<ip>[^|]+)(?:\s+\|\s+Context:\s+(?<context>.*))?$/u';
        if (preg_match($patternAudit, $line, $m)) {
            $context = null;
            if (!empty($m['context'])) {
                $decoded = json_decode($m['context'], true);
                $context = (json_last_error() === JSON_ERROR_NONE) ? $decoded : $m['context'];
            }

            $action = trim($m['action']);
            $level = strtoupper(trim($m['level']));

            return [
                'id' => $id,
                'format' => 'audit_system',
                'timestamp' => trim($m['date']),
                'level' => $level,
                'action' => $action,
                'user' => trim($m['user']),
                'ip' => trim($m['ip']),
                'context' => $context,
                'message' => $action . (is_array($context) ? ' (' . count($context) . ' parámetros)' : ''),
                'stacktrace' => null,
                'raw' => $line,
            ];
        }

        // -------------------------------------------------------------
        // Formato 2: Monolog / Laravel Estándar
        // [2026-11-19 00:22:31] local.ERROR: SQLSTATE[23505]... {"exception":"..."}
        // -------------------------------------------------------------
        $patternMonolog = '/^\[(?<date>\d{4}-\d{2}-\d{2}[^\]]*)\]\s+(?:[a-zA-Z0-9_\-]+\.)?(?<level>[A-Z]+):\s+(?<message>.*)$/u';
        if (preg_match($patternMonolog, $line, $m)) {
            $level = strtoupper(trim($m['level']));
            $msg = trim($m['message']);

            // Extraer JSON al final si existe
            $context = null;
            if (preg_match('/^(?<text>.*?)\s*(?<json>\{.*\})$/us', $msg, $jm)) {
                $decoded = json_decode($jm['json'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $context = $decoded;
                    $msg = trim($jm['text']);
                }
            }

            return [
                'id' => $id,
                'format' => 'monolog_laravel',
                'timestamp' => trim($m['date']),
                'level' => $level,
                'action' => mb_substr($msg, 0, 60),
                'user' => 'SISTEMA',
                'ip' => '127.0.0.1',
                'context' => $context,
                'message' => $msg,
                'stacktrace' => null,
                'raw' => $line,
            ];
        }

        // -------------------------------------------------------------
        // Formato 3: Quarkus / Log4j / JBoss Logging
        // 2026-11-15 19:27:43,477 INFO  [io.quarkus] (main) service-analytics-quarkus started...
        // -------------------------------------------------------------
        $patternQuarkus = '/^(?<date>\d{4}-\d{2}-\d{2}\s+[\d:,]+)\s+(?<level>[A-Z]+)\s+\[(?<logger>[^\]]+)\]\s+(?:\((?<thread>[^\)]+)\)\s+)?(?<message>.*)$/u';
        if (preg_match($patternQuarkus, $line, $m)) {
            $level = strtoupper(trim($m['level']));
            $logger = trim($m['logger']);
            $msg = trim($m['message']);

            return [
                'id' => $id,
                'format' => 'quarkus_jboss',
                'timestamp' => trim($m['date']),
                'level' => $level,
                'action' => "Quarkus [{$logger}]",
                'user' => 'QUARKUS_SVC',
                'ip' => '127.0.0.1',
                'context' => [
                    'logger' => $logger,
                    'thread' => $m['thread'] ?? 'main',
                ],
                'message' => $msg,
                'stacktrace' => null,
                'raw' => $line,
            ];
        }

        return null;
    }

    /**
     * POST /api/v1/logs/frontend
     * Recibe logs originados en el cliente Next.js y los almacena en storage/logs/frontend/
     */
    public function frontendLog(Request $request)
    {
        $validated = $request->validate([
            'level' => 'required|string|in:DEBUG,INFO,WARNING,ERROR,CRITICAL,AUDIT',
            'action' => 'required|string|max:150',
            'context' => 'nullable|array',
            'userId' => 'nullable|integer',
        ]);

        $level = strtoupper($validated['level']);
        $action = $validated['action'];
        $context = $validated['context'] ?? [];
        $userId = $validated['userId'] ?? null;

        // Añadir metadata de cliente
        $context['_client'] = [
            'user_agent' => $request->userAgent(),
            'url' => $request->header('referer'),
            'ip' => $request->ip(),
        ];

        AuditLogger::frontend($level, $action, $context, $userId);

        return response()->json([
            'status' => 'success',
            'message' => 'Log de frontend registrado correctamente.',
            'timestamp' => Carbon::now()->toIso8601String(),
        ]);
    }

    /**
     * POST /api/v1/logs/quarkus
     * Recibe logs del microservicio Quarkus
     */
    public function quarkusLog(Request $request)
    {
        $validated = $request->validate([
            'level' => 'required|string|in:DEBUG,INFO,WARNING,ERROR,CRITICAL,AUDIT',
            'action' => 'required|string|max:150',
            'context' => 'nullable|array',
            'userId' => 'nullable|integer',
        ]);

        $level = strtoupper($validated['level']);
        $action = $validated['action'];
        $context = $validated['context'] ?? [];
        $userId = $validated['userId'] ?? null;

        AuditLogger::quarkus($level, $action, $context, $userId);

        return response()->json([
            'status' => 'success',
            'message' => 'Log de Quarkus registrado correctamente.',
            'timestamp' => Carbon::now()->toIso8601String(),
        ]);
    }

    /**
     * POST /api/v1/logs/test
     * Genera una batería de logs de prueba representativos para cada componente y nivel
     */
    public function testLogs(Request $request)
    {
        $now = Carbon::now();

        // 1. Logs de Backend (Auth, Academico, Cajas, Almacen, API)
        AuditLogger::auth(AuditLogger::LEVEL_INFO, 'LOGIN_SUCCESS', [
            'email' => 'admin@ejercito.mil.bo',
            'rol' => 'ADMIN',
            'metodo' => 'Credenciales institucionales verificadas',
        ], 1);

        AuditLogger::auth(AuditLogger::LEVEL_WARNING, 'INTENTO_ACCESO_NO_AUTORIZADO', [
            'email' => 'est.desconocido@gmail.com',
            'motivo' => 'PIN de seguridad de rol inválido',
        ]);

        AuditLogger::academico(AuditLogger::LEVEL_INFO, 'INSCRIPCION_FORMALIZADA', [
            'id_estudiante' => 451,
            'nombre' => 'Oscar Daniel Gutiérrez Quiroga',
            'codigo_paralelo' => 'ING-101-A',
            'idioma' => 'Inglés',
            'nivel' => 'Básico A1/A2',
            'cupo_restante' => 29,
        ], 1, 'inscripcion', 451);

        AuditLogger::academico(AuditLogger::LEVEL_CRITICAL, 'DOCENTE_ROTACION_EMERGENCIA', [
            'id_docente' => 3,
            'nombre' => 'Prof. Fernando Ríos Torrico',
            'motivo' => 'Límite quincenal de permanencia superado (16 días)',
            'paralelo_origen' => 'ING-101-A',
            'paralelo_destino' => 'ING-102-B',
        ], 1, 'docente', 3);

        AuditLogger::cajas(AuditLogger::LEVEL_INFO, 'EMISION_FICHA_ATENCION', [
            'numero_ficha' => 'F-104',
            'tipo_tramite' => 'Matriculación y Colegiatura',
            'ventanilla_asignada' => 2,
            'posicion_cola' => 3,
            'espera_estimada_minutos' => 6.5,
        ], 2, 104);

        AuditLogger::cajas(AuditLogger::LEVEL_WARNING, 'COLA_ESPERA_SATURACION_PREVENTIVA', [
            'clientes_en_espera' => 12,
            'ventanillas_activas' => 2,
            'tasa_llegada_lambda' => 18.5,
            'recomendacion' => 'Aperturar ventanilla 3 según modelo Erlang-C',
        ]);

        AuditLogger::almacen(AuditLogger::LEVEL_INFO, 'MOVIMIENTO_KARDEX_REGISTRADO', [
            'libro' => 'American Headway 1 (Military Edition)',
            'tipo_movimiento' => 'SALIDA_ESTUDIANTE',
            'cantidad' => 1,
            'stock_resultante' => 84,
            'punto_reorden_rop' => 25,
        ], 4, 12);

        AuditLogger::almacen(AuditLogger::LEVEL_WARNING, 'ALERTA_STOCK_BAJO_ROP', [
            'libro' => 'Modern Military German (Band 1)',
            'stock_actual' => 4,
            'rop_minimo' => 15,
            'accion_sugerida' => 'Generar orden de reposición de 50 ejemplares',
        ], 4, 8);

        AuditLogger::api(AuditLogger::LEVEL_INFO, 'HTTP_REQUEST_PROCESSED', [
            'metodo' => 'GET',
            'ruta' => '/api/v1/dashboard',
            'status_code' => 200,
            'tiempo_respuesta_ms' => 42.1,
        ], 1);

        // 2. Logs de Frontend (Next.js)
        AuditLogger::frontend(AuditLogger::LEVEL_INFO, 'UI_NAVIGATION_PAGE_VIEW', [
            'ruta' => '/logs',
            'componente' => 'LogViewerPage',
            'resolucion' => '1920x1080',
            'tema' => 'dark',
        ], 1);

        AuditLogger::frontend(AuditLogger::LEVEL_DEBUG, 'CLIENT_STATE_ACCESSIBILITY_CHANGE', [
            'tema_anterior' => 'dark',
            'tema_nuevo' => 'high-contrast',
            'tamano_fuente' => 'medium',
        ], 1);

        AuditLogger::frontend(AuditLogger::LEVEL_ERROR, 'CLIENT_NETWORK_RETRY', [
            'endpoint' => '/api/v1/asistencia',
            'intento' => 2,
            'error' => 'Timeout excedido esperando respuesta del servidor',
        ], 1);

        // 3. Logs de Quarkus (Microservicio reactivo)
        AuditLogger::quarkus(AuditLogger::LEVEL_INFO, 'QUARKUS_ANALYTICS_PREDICCION_CALCULADA', [
            'servicio' => 'PrediccionRendimientoService',
            'estudiante_id' => 11,
            'algoritmo' => 'Mínimos Cuadrados H3',
            'pendiente_m' => 1.84,
            'r2_determinacion' => 0.942,
            'calificacion_proyectada' => 86.5,
            'nivel_riesgo' => 'BAJO',
        ]);

        AuditLogger::quarkus(AuditLogger::LEVEL_WARNING, 'QUARKUS_METODOS_NUMERICOS_ALERTA_DESERCION', [
            'servicio' => 'PrediccionRendimientoService',
            'estudiante_id' => 45,
            'alerta' => 'ALERTA ACADÉMICA — Pendiente negativa persistente (-3.2 pts/libro)',
            'nivel_riesgo' => 'ALTO',
            'nota_proyectada' => 48.0,
            'accion_inmediata' => 'Convocatoria a reforzamiento pedagógico',
        ]);

        AuditLogger::quarkus(AuditLogger::LEVEL_INFO, 'QUARKUS_SIMPLEX_OPTIMIZACION_RECURSOS', [
            'servicio' => 'MetodosNumericosService',
            'algoritmo' => 'Simplex Primal de Recursos Militares',
            'variables_decision' => 3,
            'restricciones' => 4,
            'iteraciones' => 6,
            'valor_optimo_z' => 48500.0,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Batería de logs de prueba generada con éxito para Backend, Frontend y Microservicio Quarkus en todos los niveles requeridos.',
            'generados' => [
                'backend' => ['auth', 'academico', 'cajas', 'almacen', 'api'],
                'frontend' => ['frontend'],
                'quarkus' => ['quarkus'],
                'niveles' => ['INFO', 'WARNING', 'ERROR', 'DEBUG', 'CRITICAL', 'AUDIT'],
            ],
            'timestamp' => $now->toIso8601String(),
        ]);
    }

    /**
     * GET /api/v1/logs/download?folder={folder}&file={file}
     * Descarga directa del archivo de log
     */
    public function download(Request $request)
    {
        $folder = $this->sanitizeFolder($request->query('folder', 'auth'));
        $file = $this->sanitizeFile($request->query('file', ''));

        $filePath = $this->resolveLogPath($folder, $file);

        if (!$filePath || !File::exists($filePath)) {
            return response()->json(['error' => 'Archivo no encontrado'], 404);
        }

        return response()->download($filePath, "eie-{$folder}-{$file}", [
            'Content-Type' => 'text/plain',
        ]);
    }

    /**
     * DELETE /api/v1/logs/clear
     * Limpia un archivo de registro manteniendo constancia militar de la purga
     */
    public function clear(Request $request)
    {
        $validated = $request->validate([
            'folder' => 'required|string',
            'file' => 'required|string',
        ]);

        $folder = $this->sanitizeFolder($validated['folder']);
        $file = $this->sanitizeFile($validated['file']);

        $filePath = $this->resolveLogPath($folder, $file);

        if (!$filePath || !File::exists($filePath)) {
            return response()->json(['error' => 'Archivo de log no encontrado'], 404);
        }

        $now = Carbon::now();
        $initialEntry = sprintf(
            "[%s] AUDIT: LOG_FILE_PURGED | User: %s | IP: %s | Context: %s\n",
            $now->toIso8601String(),
            'ADMIN',
            $request->ip() ?? '127.0.0.1',
            json_encode([
                'motivo' => 'Purga administrativa de archivo de registros',
                'archivo' => $file,
                'carpeta' => $folder,
                'fecha_purga' => $now->toDateTimeString(),
            ], JSON_UNESCAPED_UNICODE)
        );

        @file_put_contents($filePath, $initialEntry);

        return response()->json([
            'status' => 'success',
            'message' => "El archivo {$file} fue reinicializado con constancia de auditoría militar.",
        ]);
    }
}
