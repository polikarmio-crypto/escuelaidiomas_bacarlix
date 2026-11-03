<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Módulo 8: Gestión de Cajas, Fichas de Atención FIFO y Pagos (5NF Normalization)
     * ficha_atencion (Colas M/M/c + FIFO), pago
     */
    public function up(): void
    {
        // 1.22 FICHA_ATENCIÓN (Motor de Teoría de Colas & Disciplina de Servicio FIFO)
        Schema::create('ficha_atencion', function (Blueprint $table) {
            $table->id('id_ficha');
            $table->foreignId('id_caja')->nullable()->constrained('caja', 'id_caja')->onDelete('set null')->onUpdate('cascade');
            $table->foreignId('id_estudiante')->constrained('estudiante', 'id_estudiante')->onDelete('restrict')->onUpdate('cascade');
            $table->integer('numero_ficha')->comment('Número de ticket o turno asignado correlativo');
            $table->timestamp('hora_llegada_ficha')->comment('Marca temporal de llegada (orden FIFO)');
            $table->timestamp('hora_inicio_atencion_ficha')->nullable()->comment('Marca temporal de llamado a ventanilla');
            $table->timestamp('hora_fin_atencion_ficha')->nullable()->comment('Marca temporal de fin de servicio');
            $table->string('estado_ficha', 15)->default('En espera')->comment('En espera, En atencion, Atendida, Anulada');
            $table->timestamps();

            // ÍNDICE FIFO ESPECÍFICO: Permite consultar el siguiente turno por estricto orden de llegada
            $table->index(['estado_ficha', 'hora_llegada_ficha'], 'idx_cola_fifo_llegada');
            $table->index(['id_caja', 'estado_ficha'], 'idx_ficha_caja_estado');
            $table->index(['hora_inicio_atencion_ficha', 'hora_fin_atencion_ficha'], 'idx_tiempos_servicio_quarkus');
        });

        // 1.23 PAGO (Registro transaccional monetario de aranceles y libros)
        Schema::create('pago', function (Blueprint $table) {
            $table->id('id_pago');
            $table->foreignId('id_estudiante')->constrained('estudiante', 'id_estudiante')->onDelete('restrict')->onUpdate('cascade');
            $table->foreignId('id_tipo_pago')->constrained('tipo_pago', 'id_tipo_pago')->onDelete('restrict')->onUpdate('cascade');
            $table->foreignId('id_inscripcion')->nullable()->constrained('inscripcion', 'id_inscripcion')->onDelete('set null')->onUpdate('cascade');
            $table->foreignId('id_inscripcion_libro')->nullable()->constrained('inscripcion_libro', 'id_inscripcion_libro')->onDelete('set null')->onUpdate('cascade');
            $table->foreignId('id_gestion')->constrained('gestion', 'id_gestion')->onDelete('restrict')->onUpdate('cascade');
            $table->foreignId('id_caja')->constrained('caja', 'id_caja')->onDelete('restrict')->onUpdate('cascade');
            $table->foreignId('id_ficha')->nullable()->constrained('ficha_atencion', 'id_ficha')->onDelete('set null')->onUpdate('cascade');
            $table->decimal('monto_pago', 10, 2)->comment('Monto monetario abonado en Bs.');
            $table->timestamp('fecha_pago')->useCurrent()->comment('Fecha y hora exacta de la transacción');
            $table->timestamps();

            $table->index(['id_gestion', 'fecha_pago'], 'idx_pago_gestion_fecha');
            $table->index('id_estudiante', 'idx_pago_estudiante');
            $table->index('id_caja', 'idx_pago_caja');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pago');
        Schema::dropIfExists('ficha_atencion');
    }
};
