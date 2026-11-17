<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('usuario') && !Schema::hasColumn('usuario', 'id_estudiante')) {
            Schema::table('usuario', function (Blueprint $table) {
                $table->unsignedBigInteger('id_estudiante')->nullable()->after('id_docente');
                $table->foreign('id_estudiante')->references('id_estudiante')->on('estudiante')->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('usuario') && Schema::hasColumn('usuario', 'id_estudiante')) {
            Schema::table('usuario', function (Blueprint $table) {
                $table->dropForeign(['id_estudiante']);
                $table->dropColumn('id_estudiante');
            });
        }
    }
};
