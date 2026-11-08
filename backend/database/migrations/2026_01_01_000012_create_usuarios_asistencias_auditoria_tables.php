<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('usuario')) {
            Schema::create('usuario', function (Blueprint $table) {
                $table->id('id_usuario');
                $table->string('nombre_usuario', 100);
                $table->string('email_usuario', 150)->unique();
                $table->string('password_usuario', 255);
                $table->string('rol_usuario', 30)->default('ESTUDIANTE');
                $table->unsignedBigInteger('id_docente')->nullable();
                $table->unsignedBigInteger('id_estudiante')->nullable();
                $table->string('estado_usuario', 20)->default('Activo');
                $table->timestamp('ultimo_acceso_usuario')->nullable();
                $table->timestamps();

                $table->foreign('id_docente')->references('id_docente')->on('docente')->onDelete('set null');
                $table->foreign('id_estudiante')->references('id_estudiante')->on('estudiante')->onDelete('set null');
                $table->index(['email_usuario', 'estado_usuario']);
            });
        }

        if (!Schema::hasTable('asistencia')) {
            Schema::create('asistencia', function (Blueprint $table) {
                $table->id('id_asistencia');
                $table->unsignedBigInteger('id_inscripcion');
                $table->unsignedBigInteger('id_paralelo');
                $table->unsignedBigInteger('id_estudiante');
                $table->unsignedBigInteger('id_docente')->nullable();
                $table->date('fecha_asistencia');
                $table->string('estado_asistencia', 20)->default('Presente');
                $table->string('observacion', 200)->nullable();
                $table->timestamps();

                $table->foreign('id_inscripcion')->references('id_inscripcion')->on('inscripcion')->onDelete('cascade');
                $table->foreign('id_paralelo')->references('id_paralelo')->on('paralelo')->onDelete('cascade');
                $table->foreign('id_estudiante')->references('id_estudiante')->on('estudiante')->onDelete('cascade');
                $table->foreign('id_docente')->references('id_docente')->on('docente')->onDelete('set null');

                $table->unique(['id_inscripcion', 'fecha_asistencia'], 'unique_asistencia_estudiante_dia');
                $table->index(['id_paralelo', 'fecha_asistencia']);
            });
        }

        if (!Schema::hasTable('log_auditoria')) {
            Schema::create('log_auditoria', function (Blueprint $table) {
                $table->id('id_log');
                $table->unsignedBigInteger('id_usuario')->nullable();
                $table->string('modulo_log', 50)->nullable();
                $table->string('nivel_log', 20)->default('INFO');
                $table->string('accion_log', 100);
                $table->string('tabla_afectada_log', 80)->nullable();
                $table->unsignedBigInteger('registro_id_log')->nullable();
                $table->string('ip_origen_log', 45)->nullable();
                $table->json('detalles_log')->nullable();
                $table->timestamps();

                $table->foreign('id_usuario')->references('id_usuario')->on('usuario')->onDelete('set null');
                $table->index(['modulo_log', 'nivel_log']);
                $table->index(['created_at']);
            });
        } else {
            Schema::table('log_auditoria', function (Blueprint $table) {
                if (!Schema::hasColumn('log_auditoria', 'modulo_log')) {
                    $table->string('modulo_log', 50)->nullable();
                }
                if (!Schema::hasColumn('log_auditoria', 'nivel_log')) {
                    $table->string('nivel_log', 20)->default('INFO');
                }
                if (!Schema::hasColumn('log_auditoria', 'detalles_log')) {
                    $table->json('detalles_log')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('log_auditoria');
        Schema::dropIfExists('asistencia');
        Schema::dropIfExists('usuario');
    }
};

