<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {

        Schema::create('almacen_libro', function (Blueprint $table) {
            $table->id('id_almacen_libro');
            $table->foreignId('id_libro')->unique()->constrained('libro', 'id_libro')->onDelete('restrict')->onUpdate('cascade');
            $table->smallInteger('stock_actual_almacen')->default(0)->comment('Cantidad física disponible en depósito');
            $table->smallInteger('punto_reorden_almacen')->default(15)->comment('Umbral ROP que dispara alerta de reabastecimiento');
            $table->smallInteger('stock_minimo_almacen')->default(5)->comment('Nivel de seguridad de reserva de emergencia');
            $table->smallInteger('stock_maximo_almacen')->default(100)->comment('Capacidad máxima de almacenaje del ítem');
            $table->timestamps();

            $table->index(['stock_actual_almacen', 'punto_reorden_almacen'], 'idx_almacen_alerta_rop');
        });

        Schema::create('movimiento_almacen', function (Blueprint $table) {
            $table->id('id_movimiento');
            $table->foreignId('id_almacen_libro')->constrained('almacen_libro', 'id_almacen_libro')->onDelete('cascade')->onUpdate('cascade');
            $table->foreignId('id_paralelo')->nullable()->constrained('paralelo', 'id_paralelo')->onDelete('set null')->onUpdate('cascade');
            $table->string('tipo_movimiento', 10)->comment('Entrada o Salida');
            $table->smallInteger('cantidad_movimiento')->comment('Unidades ingresadas o retiradas');
            $table->timestamp('fecha_movimiento')->useCurrent();
            $table->string('motivo_movimiento', 150)->comment('Justificación de la operación de kardex');
            $table->timestamps();

            $table->index(['id_almacen_libro', 'tipo_movimiento', 'fecha_movimiento'], 'idx_movimiento_kardex');
        });

        Schema::create('pedido_reposicion', function (Blueprint $table) {
            $table->id('id_pedido');
            $table->foreignId('id_almacen_libro')->constrained('almacen_libro', 'id_almacen_libro')->onDelete('cascade')->onUpdate('cascade');
            $table->smallInteger('cantidad_pedido')->comment('Unidades solicitadas a reponer según lote económico EOQ');
            $table->date('fecha_pedido');
            $table->date('fecha_recepcion_pedido')->nullable()->comment('Fecha efectiva de entrega');
            $table->string('estado_pedido', 15)->default('Pendiente')->comment('Pendiente, Recibido, Cancelado');
            $table->timestamps();

            $table->index(['estado_pedido', 'fecha_pedido'], 'idx_pedido_reposicion_estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pedido_reposicion');
        Schema::dropIfExists('movimiento_almacen');
        Schema::dropIfExists('almacen_libro');
    }
};
