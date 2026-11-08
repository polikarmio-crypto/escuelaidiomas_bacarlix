<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {

        Schema::create('gestion', function (Blueprint $table) {
            $table->id('id_gestion');
            $table->smallInteger('anio_gestion')->unique()->comment('Año de la gestión académica único');
            $table->string('estado_gestion', 15)->default('Activa')->comment('Activa o Cerrada');
            $table->timestamps();

            $table->index(['anio_gestion', 'estado_gestion'], 'idx_gestion_anio_estado');
        });

        Schema::create('idioma', function (Blueprint $table) {
            $table->id('id_idioma');
            $table->string('nombre_idioma', 50)->unique()->comment('Nombre del idioma ofertado');
            $table->timestamps();
        });

        Schema::create('tipo_programa', function (Blueprint $table) {
            $table->id('id_tipo_programa');
            $table->string('nombre_tipo_programa', 30)->comment('Modalidad o tipo de programa: Regular, Niños, Diplomático');
            $table->timestamps();
        });

        Schema::create('modalidad', function (Blueprint $table) {
            $table->id('id_modalidad');
            $table->string('nombre_modalidad', 20)->comment('Presencial, Virtual, Semipresencial');
            $table->timestamps();
        });

        Schema::create('horario', function (Blueprint $table) {
            $table->id('id_horario');
            $table->time('hora_inicio_horario');
            $table->time('hora_fin_horario');
            $table->timestamps();

            $table->index(['hora_inicio_horario', 'hora_fin_horario'], 'idx_horario_rango');
        });

        Schema::create('aula', function (Blueprint $table) {
            $table->id('id_aula');
            $table->string('nombre_aula', 30)->unique()->comment('Identificador o nombre del ambiente físico/virtual');
            $table->smallInteger('capacidad_aula')->default(30)->comment('Capacidad máxima de aforo');
            $table->timestamps();
        });

        Schema::create('tipo_pago', function (Blueprint $table) {
            $table->id('id_tipo_pago');
            $table->string('nombre_tipo_pago', 60)->unique()->comment('Matrícula, Mensualidad, Libro, Certificado');
            $table->timestamps();
        });

        Schema::create('caja', function (Blueprint $table) {
            $table->id('id_caja');
            $table->string('nombre_caja', 60)->unique()->comment('Ventanilla 1, Caja 2, etc.');
            $table->string('ubicacion_caja', 80)->comment('Ubicación física en el recinto');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('caja');
        Schema::dropIfExists('tipo_pago');
        Schema::dropIfExists('aula');
        Schema::dropIfExists('horario');
        Schema::dropIfExists('modalidad');
        Schema::dropIfExists('tipo_programa');
        Schema::dropIfExists('idioma');
        Schema::dropIfExists('gestion');
    }
};
