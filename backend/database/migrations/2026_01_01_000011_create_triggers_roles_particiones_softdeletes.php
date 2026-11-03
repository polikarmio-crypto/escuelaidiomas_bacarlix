<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Módulo 11: Triggers, Roles/Permisos, Bajas Lógicas (Soft Deletes) y Tablas Particionadas
     */
    public function up(): void
    {
        // 1. Columnas de Baja Lógica (Soft Deletes)
        if (Schema::hasTable('estudiante') && !Schema::hasColumn('estudiante', 'deleted_at')) {
            Schema::table('estudiante', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('docente') && !Schema::hasColumn('docente', 'deleted_at')) {
            Schema::table('docente', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('paralelo') && !Schema::hasColumn('paralelo', 'deleted_at')) {
            Schema::table('paralelo', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('inscripcion') && !Schema::hasColumn('inscripcion', 'deleted_at')) {
            Schema::table('inscripcion', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // 2. Tabla Particionada por Rango de Fechas (Auditoría Histórica de Operaciones)
        DB::statement("
            CREATE TABLE IF NOT EXISTS auditoria_historica (
                id_auditoria BIGSERIAL,
                id_usuario INT NULL,
                tabla_afectada VARCHAR(50) NOT NULL,
                accion VARCHAR(20) NOT NULL,
                registro_id VARCHAR(50) NULL,
                datos_previos JSONB NULL,
                datos_nuevos JSONB NULL,
                ip_cliente VARCHAR(45) DEFAULT '127.0.0.1',
                created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY (id_auditoria, created_at)
            ) PARTITION BY RANGE (created_at);
        ");

        // Particiones anuales
        DB::statement("
            CREATE TABLE IF NOT EXISTS auditoria_p2025 PARTITION OF auditoria_historica
            FOR VALUES FROM ('2025-01-01 00:00:00') TO ('2026-01-01 00:00:00');
        ");
        DB::statement("
            CREATE TABLE IF NOT EXISTS auditoria_p2026 PARTITION OF auditoria_historica
            FOR VALUES FROM ('2026-01-01 00:00:00') TO ('2027-01-01 00:00:00');
        ");
        DB::statement("
            CREATE TABLE IF NOT EXISTS auditoria_p2027 PARTITION OF auditoria_historica
            FOR VALUES FROM ('2027-01-01 00:00:00') TO ('2028-01-01 00:00:00');
        ");

        // 3. Trigger 1: Auditoría Automática ante Modificación o Baja de Estudiantes y Docentes
        DB::statement("
            CREATE OR REPLACE FUNCTION fn_trg_auditoria_seguridad()
            RETURNS TRIGGER AS $$
            DECLARE
                v_reg_id VARCHAR(50);
            BEGIN
                v_reg_id := COALESCE(
                    to_jsonb(OLD)->>'ci_estudiante',
                    to_jsonb(OLD)->>'ci_docente',
                    to_jsonb(OLD)->>'id_estudiante',
                    to_jsonb(OLD)->>'id_docente',
                    '0'
                );
                IF (TG_OP = 'UPDATE') THEN
                    INSERT INTO auditoria_historica (tabla_afectada, accion, registro_id, datos_previos, datos_nuevos, created_at)
                    VALUES (TG_TABLE_NAME, 'UPDATE', v_reg_id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, NOW());
                    RETURN NEW;
                ELSIF (TG_OP = 'DELETE') THEN
                    INSERT INTO auditoria_historica (tabla_afectada, accion, registro_id, datos_previos, datos_nuevos, created_at)
                    VALUES (TG_TABLE_NAME, 'DELETE_FISICA', v_reg_id, row_to_json(OLD)::jsonb, NULL, NOW());
                    RETURN OLD;
                END IF;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        ");

        DB::statement("DROP TRIGGER IF EXISTS trg_audit_estudiante ON estudiante;");
        DB::statement("
            CREATE TRIGGER trg_audit_estudiante
            AFTER UPDATE OR DELETE ON estudiante
            FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_seguridad();
        ");

        // 4. Trigger 2: Validación y Recálculo Automático de Ponderación Militar 80/10/10
        DB::statement("
            CREATE OR REPLACE FUNCTION fn_trg_validar_ponderacion_militar()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Asegurar notas entre 0 y 100
                IF NEW.nota_examen_libro < 0 OR NEW.nota_examen_libro > 100 THEN
                    RAISE EXCEPTION 'La nota de examen debe estar comprendida entre 0 y 100 puntos.';
                END IF;
                IF NEW.nota_defensa_oral < 0 OR NEW.nota_defensa_oral > 100 THEN
                    RAISE EXCEPTION 'La nota de defensa oral debe estar comprendida entre 0 y 100 puntos.';
                END IF;
                IF NEW.nota_participacion_libro < 0 OR NEW.nota_participacion_libro > 100 THEN
                    RAISE EXCEPTION 'La nota de participacion debe estar comprendida entre 0 y 100 puntos.';
                END IF;

                -- Ponderación Militar Oficial: 80% Examen + 10% Defensa Oral + 10% Participación
                NEW.nota_final_libro := ROUND(
                    (NEW.nota_examen_libro * 0.80) + 
                    (NEW.nota_defensa_oral * 0.10) + 
                    (NEW.nota_participacion_libro * 0.10), 
                    2
                );

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ");

        DB::statement("DROP TRIGGER IF EXISTS trg_calc_evaluacion ON evaluacion_libro;");
        DB::statement("
            CREATE TRIGGER trg_calc_evaluacion
            BEFORE INSERT OR UPDATE ON evaluacion_libro
            FOR EACH ROW EXECUTE FUNCTION fn_trg_validar_ponderacion_militar();
        ");

        // 5. Configuración de Roles y Privilegios en PostgreSQL (Grants)
        DB::statement("
            DO $$
            BEGIN
                -- Roles de base de datos si no existen
                IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'eie_admin_role') THEN
                    CREATE ROLE eie_admin_role;
                END IF;
                IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'eie_docente_role') THEN
                    CREATE ROLE eie_docente_role;
                END IF;
                IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'eie_secretaria_role') THEN
                    CREATE ROLE eie_secretaria_role;
                END IF;
                IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'eie_cajero_role') THEN
                    CREATE ROLE eie_cajero_role;
                END IF;
                IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'eie_almacenero_role') THEN
                    CREATE ROLE eie_almacenero_role;
                END IF;
            END
            $$;
        ");

        // Privilegios granulares sobre el esquema public
        DB::statement("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO eie_admin_role;");
        DB::statement("GRANT SELECT, INSERT, UPDATE, DELETE ON estudiante, inscripcion, paralelo TO eie_secretaria_role;");
        DB::statement("GRANT SELECT ON estudiante, paralelo TO eie_docente_role;");
        DB::statement("GRANT SELECT, INSERT, UPDATE ON evaluacion_libro, inscripcion_libro TO eie_docente_role;");
        DB::statement("GRANT SELECT, INSERT, UPDATE ON pago, ficha_atencion TO eie_cajero_role;");
        DB::statement("GRANT SELECT, INSERT, UPDATE ON almacen_libro, movimiento_almacen, pedido_reposicion TO eie_almacenero_role;");
    }

    public function down(): void
    {
        DB::statement("DROP TRIGGER IF EXISTS trg_calc_evaluacion ON evaluacion_libro;");
        DB::statement("DROP FUNCTION IF EXISTS fn_trg_validar_ponderacion_militar;");
        DB::statement("DROP TRIGGER IF EXISTS trg_audit_estudiante ON estudiante;");
        DB::statement("DROP FUNCTION IF EXISTS fn_trg_auditoria_seguridad;");

        DB::statement("DROP TABLE IF EXISTS auditoria_p2027;");
        DB::statement("DROP TABLE IF EXISTS auditoria_p2026;");
        DB::statement("DROP TABLE IF EXISTS auditoria_p2025;");
        DB::statement("DROP TABLE IF EXISTS auditoria_historica;");

        if (Schema::hasColumn('estudiante', 'deleted_at')) {
            Schema::table('estudiante', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
        if (Schema::hasColumn('docente', 'deleted_at')) {
            Schema::table('docente', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
        if (Schema::hasColumn('paralelo', 'deleted_at')) {
            Schema::table('paralelo', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
        if (Schema::hasColumn('inscripcion', 'deleted_at')) {
            Schema::table('inscripcion', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
