<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Módulo 11: Índices de Performance, Vistas Materializadas y Optimizaciones
     * Complementos para normalización 5FN, performance de cola FIFO y reportes
     */
    public function up(): void
    {
        // ─── ÍNDICES ADICIONALES DE PERFORMANCE ───

        // Índice parcial para fichas activas (solo las que están en espera o atención)
        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_ficha_activa_parcial 
            ON ficha_atencion (hora_llegada_ficha ASC)
            WHERE estado_ficha IN ('En espera', 'En atencion')
        ");

        // Índice parcial para inscripciones activas
        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_inscripcion_activa_parcial
            ON inscripcion (id_paralelo, id_estudiante)
            WHERE estado_inscripcion = 'Activa'
        ");

        // Índice parcial para asignaciones docentes vigentes
        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_asignacion_vigente_parcial
            ON asignacion_docente_paralelo (id_paralelo, id_docente, fecha_inicio_asignacion)
            WHERE fecha_fin_asignacion IS NULL
        ");

        // Índice parcial para pedidos pendientes de almacén
        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_pedido_pendiente_parcial
            ON pedido_reposicion (id_almacen_libro, fecha_pedido)
            WHERE estado_pedido = 'Pendiente'
        ");

        // Índice parcial para paralelos no cerrados
        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_paralelo_no_cerrado_parcial
            ON paralelo (id_gestion, id_nivel)
            WHERE estado_paralelo != 'Cerrado'
        ");

        // Aceleración con Trigram GIN para búsqueda ilike instantánea
        DB::statement("CREATE EXTENSION IF NOT EXISTS pg_trgm");
        DB::statement("CREATE INDEX IF NOT EXISTS idx_estudiante_nombres_trgm ON estudiante USING gin (nombre_estudiante gin_trgm_ops)");
        DB::statement("CREATE INDEX IF NOT EXISTS idx_estudiante_apellidos_trgm ON estudiante USING gin (apellido_estudiante gin_trgm_ops)");

        // ─── VISTA: Resumen de cola FIFO del día (para Quarkus) ───
        DB::statement("
            CREATE OR REPLACE VIEW v_metricas_cola_diaria AS
            SELECT
                DATE(hora_llegada_ficha) AS fecha,
                COUNT(*) AS total_fichas,
                COUNT(*) FILTER (WHERE estado_ficha = 'Atendida') AS atendidas,
                COUNT(*) FILTER (WHERE estado_ficha = 'En espera') AS en_espera,
                COUNT(*) FILTER (WHERE estado_ficha = 'En atencion') AS en_atencion,
                AVG(EXTRACT(EPOCH FROM (hora_inicio_atencion_ficha - hora_llegada_ficha)) / 60)
                    FILTER (WHERE hora_inicio_atencion_ficha IS NOT NULL) AS promedio_espera_min,
                AVG(EXTRACT(EPOCH FROM (hora_fin_atencion_ficha - hora_inicio_atencion_ficha)) / 60)
                    FILTER (WHERE hora_fin_atencion_ficha IS NOT NULL) AS promedio_servicio_min
            FROM ficha_atencion
            GROUP BY DATE(hora_llegada_ficha)
            ORDER BY fecha DESC
        ");

        // ─── VISTA: Resumen de stock y alertas ROP ───
        DB::statement("
            CREATE OR REPLACE VIEW v_stock_alertas AS
            SELECT
                al.id_almacen_libro,
                l.nombre_libro,
                n.nombre_nivel,
                p.nombre_programa,
                i.nombre_idioma,
                al.stock_actual_almacen,
                al.punto_reorden_almacen,
                al.stock_minimo_almacen,
                al.stock_maximo_almacen,
                CASE
                    WHEN al.stock_actual_almacen <= al.stock_minimo_almacen THEN 'CRITICO'
                    WHEN al.stock_actual_almacen <= al.punto_reorden_almacen THEN 'ADVERTENCIA'
                    ELSE 'NORMAL'
                END AS nivel_alerta,
                (al.stock_maximo_almacen - al.stock_actual_almacen) AS unidades_para_llenar
            FROM almacen_libro al
            JOIN libro l ON al.id_libro = l.id_libro
            JOIN nivel n ON l.id_nivel = n.id_nivel
            JOIN programa p ON n.id_programa = p.id_programa
            JOIN idioma i ON p.id_idioma = i.id_idioma
        ");

        // ─── VISTA: Docentes con días en aula y alerta de rotación ───
        DB::statement("
            CREATE OR REPLACE VIEW v_docentes_rotacion AS
            SELECT
                d.id_docente,
                d.nombre_docente || ' ' || d.apellido_docente AS nombre_completo,
                d.estado_docente,
                adp.id_asignacion,
                adp.id_paralelo,
                par.codigo_paralelo,
                adp.fecha_inicio_asignacion,
                (CURRENT_DATE - adp.fecha_inicio_asignacion) AS dias_en_aula,
                CASE
                    WHEN (CURRENT_DATE - adp.fecha_inicio_asignacion) >= 15 THEN 'RELEVO_OBLIGATORIO'
                    WHEN (CURRENT_DATE - adp.fecha_inicio_asignacion) >= 14 THEN 'RELEVO_INMINENTE'
                    ELSE 'NORMAL'
                END AS estado_rotacion
            FROM docente d
            LEFT JOIN asignacion_docente_paralelo adp
                ON d.id_docente = adp.id_docente AND adp.fecha_fin_asignacion IS NULL
            LEFT JOIN paralelo par ON adp.id_paralelo = par.id_paralelo
            WHERE d.estado_docente = 'Activo'
        ");
    }

    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS v_docentes_rotacion");
        DB::statement("DROP VIEW IF EXISTS v_stock_alertas");
        DB::statement("DROP VIEW IF EXISTS v_metricas_cola_diaria");

        DB::statement("DROP INDEX IF EXISTS idx_paralelo_no_cerrado_parcial");
        DB::statement("DROP INDEX IF EXISTS idx_pedido_pendiente_parcial");
        DB::statement("DROP INDEX IF EXISTS idx_asignacion_vigente_parcial");
        DB::statement("DROP INDEX IF EXISTS idx_inscripcion_activa_parcial");
        DB::statement("DROP INDEX IF EXISTS idx_ficha_activa_parcial");
    }
};
