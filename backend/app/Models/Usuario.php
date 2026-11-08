<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Usuario extends Model
{
    protected $table = 'usuario';
    protected $primaryKey = 'id_usuario';

    protected $fillable = [
        'nombre_usuario',
        'email_usuario',
        'password_usuario',
        'rol_usuario',
        'id_docente',
        'id_estudiante',
        'estado_usuario',
        'ultimo_acceso_usuario',
    ];

    protected $hidden = [
        'password_usuario',
    ];

    protected $casts = [
        'ultimo_acceso_usuario' => 'datetime',
    ];

    public function docente(): BelongsTo
    {
        return $this->belongsTo(Docente::class, 'id_docente', 'id_docente');
    }

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(Estudiante::class, 'id_estudiante', 'id_estudiante');
    }
}

