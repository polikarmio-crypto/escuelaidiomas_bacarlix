<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {

        Schema::create('estudiante', function (Blueprint $table) {
            $table->id('id_estudiante');
            $table->string('ci_estudiante', 15)->unique()->comment('Cédula de identidad con complemento');
            $table->string('nombre_estudiante', 60);
            $table->string('apellido_estudiante', 60);
            $table->date('fecha_nacimiento_estudiante')->nullable();
            $table->string('telefono_estudiante', 20)->nullable();
            $table->string('email_estudiante', 100)->nullable();
            $table->string('direccion_estudiante', 150)->nullable();
            $table->string('tipo_estudiante', 10)->comment('Civil o Militar');
            $table->timestamps();

            $table->index('tipo_estudiante', 'idx_estudiante_tipo');
            $table->index(['apellido_estudiante', 'nombre_estudiante'], 'idx_estudiante_apellidos_nombres');
        });

        Schema::create('estudiante_militar', function (Blueprint $table) {
            $table->foreignId('id_estudiante')->primary()->constrained('estudiante', 'id_estudiante')->onDelete('cascade')->onUpdate('cascade');
            $table->string('grado_militar', 40)->comment('Capitán, Subteniente, Sargento, etc.');
            $table->string('unidad_militar', 80)->comment('Regimiento o unidad militar de destino');
            $table->string('id_militar_estudiante', 20)->unique()->comment('Matrícula o código militar interno');
            $table->timestamps();

            $table->index('grado_militar', 'idx_militar_grado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estudiante_militar');
        Schema::dropIfExists('estudiante');
    }
};
