<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Módulo 3: Gestión de Docentes y Habilitación Idiomática (5NF Normalization)
     * Docente y Docente_Idioma
     */
    public function up(): void
    {
        // 1.11 DOCENTE
        Schema::create('docente', function (Blueprint $table) {
            $table->id('id_docente');
            $table->string('ci_docente', 15)->unique()->comment('Documento de identidad nacional');
            $table->string('nombre_docente', 60);
            $table->string('apellido_docente', 60);
            $table->string('telefono_docente', 20)->nullable();
            $table->string('email_docente', 100)->nullable();
            $table->string('estado_docente', 15)->default('Activo')->comment('Activo, Inactivo');
            $table->timestamps();

            $table->index('estado_docente', 'idx_docente_estado');
            $table->index(['apellido_docente', 'nombre_docente'], 'idx_docente_apellidos_nombres');
        });

        // 1.12 DOCENTE_IDIOMA (Descomposición 4NF/5NF para evitar anomalías multivaluadas)
        Schema::create('docente_idioma', function (Blueprint $table) {
            $table->foreignId('id_docente')->constrained('docente', 'id_docente')->onDelete('cascade')->onUpdate('cascade');
            $table->foreignId('id_idioma')->constrained('idioma', 'id_idioma')->onDelete('restrict')->onUpdate('cascade');
            $table->timestamp('fecha_habilitacion')->useCurrent();

            $table->primary(['id_docente', 'id_idioma'], 'pk_docente_idioma');
            $table->index('id_idioma', 'idx_docente_idioma_idioma');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('docente_idioma');
        Schema::dropIfExists('docente');
    }
};
