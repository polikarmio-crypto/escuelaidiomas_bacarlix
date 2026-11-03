<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Módulos 6 y 7: Inscripciones, Avance de Libros y Evaluaciones (5NF Normalization)
     * inscripcion, inscripcion_libro, evaluacion_libro, examen_nivel
     */
    public function up(): void
    {
        // 1.17 INSCRIPCIÓN
        Schema::create('inscripcion', function (Blueprint $table) {
            $table->id('id_inscripcion');
            $table->foreignId('id_estudiante')->constrained('estudiante', 'id_estudiante')->onDelete('restrict')->onUpdate('cascade');
            $table->foreignId('id_paralelo')->constrained('paralelo', 'id_paralelo')->onDelete('restrict')->onUpdate('cascade');
            $table->date('fecha_inscripcion');
            $table->string('estado_inscripcion', 15)->default('Activa')->comment('Activa, Retirada, Concluida');
            $table->timestamps();

            // Evitar doble inscripción activa en el mismo paralelo
            $table->unique(['id_estudiante', 'id_paralelo'], 'uq_estudiante_paralelo');
            $table->index(['id_paralelo', 'estado_inscripcion'], 'idx_inscripcion_paralelo_estado');
        });

        // 1.18 INSCRIPCIÓN_LIBRO (Avance curricular libro a libro)
        Schema::create('inscripcion_libro', function (Blueprint $table) {
            $table->id('id_inscripcion_libro');
            $table->foreignId('id_inscripcion')->constrained('inscripcion', 'id_inscripcion')->onDelete('cascade')->onUpdate('cascade');
            $table->foreignId('id_libro')->constrained('libro', 'id_libro')->onDelete('restrict')->onUpdate('cascade');
            $table->date('fecha_inicio_libro');
            $table->date('fecha_fin_libro')->nullable();
            $table->string('estado_libro', 15)->default('En curso')->comment('En curso, Aprobado, Reprobado');
            $table->timestamps();

            $table->unique(['id_inscripcion', 'id_libro'], 'uq_inscripcion_libro');
            $table->index('estado_libro', 'idx_inscripcion_libro_estado');
        });

        // 1.19 EVALUACIÓN_LIBRO (Desglose: Examen 80%, Oral 10%, Participación 10%)
        Schema::create('evaluacion_libro', function (Blueprint $table) {
            $table->id('id_evaluacion_libro');
            $table->foreignId('id_inscripcion_libro')->constrained('inscripcion_libro', 'id_inscripcion_libro')->onDelete('cascade')->onUpdate('cascade');
            $table->decimal('nota_examen_libro', 5, 2)->default(0)->comment('Examen escrito sobre 100 (Ponderado al 80%)');
            $table->decimal('nota_defensa_oral', 5, 2)->default(0)->comment('Prueba oral sobre 100 (Ponderado al 10%)');
            $table->decimal('nota_participacion_libro', 5, 2)->default(0)->comment('Desempeño en aula sobre 100 (Ponderado al 10%)');
            $table->decimal('nota_final_libro', 5, 2)->default(0)->comment('Nota calculada ponderada total (0 - 100)');
            $table->foreignId('id_docente_calificador')->constrained('docente', 'id_docente')->onDelete('restrict')->onUpdate('cascade');
            $table->date('fecha_evaluacion_libro');
            $table->timestamps();

            $table->index('id_docente_calificador', 'idx_eval_docente');
            $table->index('nota_final_libro', 'idx_eval_nota_final');
        });

        // 1.20 EXAMEN_NIVEL (Evaluación global independiente para concluir el nivel)
        Schema::create('examen_nivel', function (Blueprint $table) {
            $table->id('id_examen_nivel');
            $table->foreignId('id_inscripcion')->constrained('inscripcion', 'id_inscripcion')->onDelete('cascade')->onUpdate('cascade');
            $table->decimal('nota_examen_nivel', 5, 2)->comment('Nota obtenida en el examen de suficiencia global (0-100)');
            $table->foreignId('id_docente_calificador')->constrained('docente', 'id_docente')->onDelete('restrict')->onUpdate('cascade');
            $table->date('fecha_examen_nivel');
            $table->string('estado_examen_nivel', 15)->comment('Aprobado o Reprobado');
            $table->timestamps();

            $table->index(['id_inscripcion', 'estado_examen_nivel'], 'idx_examen_nivel_estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('examen_nivel');
        Schema::dropIfExists('evaluacion_libro');
        Schema::dropIfExists('inscripcion_libro');
        Schema::dropIfExists('inscripcion');
    }
};
