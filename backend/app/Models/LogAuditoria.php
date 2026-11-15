<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogAuditoria extends Model
{
    protected $table = 'log_auditoria';
    protected $primaryKey = 'id_log';

    protected $fillable = [
        'id_usuario',
        'modulo_log',
        'nivel_log',
        'accion_log',
        'tabla_afectada_log',
        'registro_id_log',
        'ip_origen_log',
        'detalles_log',
    ];

    protected $casts = [
        'detalles_log' => 'array',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }
}

