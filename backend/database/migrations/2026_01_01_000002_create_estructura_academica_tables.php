<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Módulo 2: Creación de la Estructura Académica (5NF Normalization)
     * Jefe Académico: programa, nivel, libro
     */
    public function up(): void
    {
        // 1.8 PROGRAMA
        Schema::create('programa', function (Blueprint $table) {
            $table->id('id_programa');
            $table->foreignId('id_idioma')->constrained('idioma', 'id_idioma')->onDelete('restrict')->onUpdate('cascade');
            $table->foreignId('id_tipo_programa')->constrained('tipo_programa', 'id_tipo_programa')->onDelete('restrict')->onUpdate('cascade');
            $table->string('nombre_programa', 80)->comment('Nombre oficial del programa de formación');
            $table->smallInteger('duracion_anios_programa')->default(2)->comment('Duración aproximada en años');
            $table->timestamps();

            $table->index(['id_idioma', 'id_tipo_programa'], 'idx_programa_idioma_tipo');
            $table->unique(['id_idioma', 'id_tipo_programa', 'nombre_programa'], 'uq_programa_idioma_tipo_nombre');
        });

        // 1.9 NIVEL
        Schema::create('nivel', function (Blueprint $table) {
            $table->id('id_nivel');
            $table->foreignId('id_programa')->constrained('programa', 'id_programa')->onDelete('cascade')->onUpdate('cascade');
            $table->smallInteger('numero_nivel')->comment('Número secuencial del nivel: 1, 2, 3...');
            $table->string('nombre_nivel', 50)->comment('Básico, Intermedio, Avanzado');
            $table->smallInteger('cantidad_libros_nivel')->default(1)->comment('Cantidad de libros/módulos requeridos');
            $table->timestamps();

            $table->unique(['id_programa', 'numero_nivel'], 'uq_nivel_programa_secuencia');
            $table->index('id_programa', 'idx_nivel_programa');
        });

        // 1.10 LIBRO
        Schema::create('libro', function (Blueprint $table) {
            $table->id('id_libro');
            $table->foreignId('id_nivel')->constrained('nivel', 'id_nivel')->onDelete('cascade')->onUpdate('cascade');
            $table->smallInteger('numero_libro')->comment('Correlativo del libro dentro del nivel: 1, 2...');
            $table->string('nombre_libro', 80)->comment('Título del libro o módulo académico');
            $table->timestamps();

            $table->unique(['id_nivel', 'numero_libro'], 'uq_libro_nivel_secuencia');
            $table->index('id_nivel', 'idx_libro_nivel');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('libro');
        Schema::dropIfExists('nivel');
        Schema::dropIfExists('programa');
    }
};
