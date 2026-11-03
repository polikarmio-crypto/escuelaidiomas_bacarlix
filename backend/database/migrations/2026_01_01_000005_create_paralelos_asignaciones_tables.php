<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Módulo 5: Paralelos y Asignación/Rotación Docente (5NF Normalization)
     * Paralelo y Asignacion_Docente_Paralelo (Rotación quincenal)
     */
    public function up(): void
    {
        // 1.15 PARALELO
        Schema::create('paralelo', function (Blueprint $table) {
            $table->id('id_paralelo');
            $table->foreignId('id_nivel')->constrained('nivel', 'id_nivel')->onDelete('restrict')->onUpdate('cascade');
            $table->foreignId('id_aula')->constrained('aula', 'id_aula')->onDelete('restrict')->onUpdate('cascade');
            $table->foreignId('id_horario')->constrained('horario', 'id_horario')->onDelete('restrict')->onUpdate('cascade');
            $table->foreignId('id_modalidad')->constrained('modalidad', 'id_modalidad')->onDelete('restrict')->onUpdate('cascade');
            $table->foreignId('id_gestion')->constrained('gestion', 'id_gestion')->onDelete('restrict')->onUpdate('cascade');
            $table->string('codigo_paralelo', 20)->comment('Ej. ING-101-A, FRA-101-B');
            $table->smallInteger('capacidad_maxima_paralelo')->default(30)->comment('Cupo máximo de estudiantes');
            $table->smallInteger('capacidad_minima_apertura')->default(10)->comment('Cupo mínimo para apertura');
            $table->string('estado_paralelo', 15)->default('Planificado')->comment('Planificado, Abierto, En curso, Cerrado');
            $table->timestamps();

            // Unicidad del código por gestión
            $table->unique(['id_gestion', 'codigo_paralelo'], 'uq_paralelo_gestion_codigo');
            // Índice para validar no-solapamiento de aula y horario en la misma gestión
            $table->index(['id_gestion', 'id_aula', 'id_horario'], 'idx_paralelo_aula_horario');
            $table->index('estado_paralelo', 'idx_paralelo_estado');
        });

        // 1.16 ASIGNACION_DOCENTE_PARALELO (Historial de rotación quincenal 15 días)
        Schema::create('asignacion_docente_paralelo', function (Blueprint $table) {
            $table->id('id_asignacion');
            $table->foreignId('id_paralelo')->constrained('paralelo', 'id_paralelo')->onDelete('cascade')->onUpdate('cascade');
            $table->foreignId('id_docente')->constrained('docente', 'id_docente')->onDelete('restrict')->onUpdate('cascade');
            $table->date('fecha_inicio_asignacion');
            $table->date('fecha_fin_asignacion')->nullable()->comment('NULL si el docente está actualmente en aula');
            $table->timestamps();

            $table->index(['id_paralelo', 'fecha_fin_asignacion'], 'idx_asignacion_activa');
            $table->index(['id_docente', 'fecha_inicio_asignacion', 'fecha_fin_asignacion'], 'idx_rotacion_docente_fechas');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asignacion_docente_paralelo');
        Schema::dropIfExists('paralelo');
    }
};
