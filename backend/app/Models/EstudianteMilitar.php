<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstudianteMilitar extends Model
{
    protected $table = 'estudiante_militar';
    protected $primaryKey = 'id_estudiante';
    public $incrementing = false;

    protected $fillable = [
        'id_estudiante',
        'grado_militar',
        'unidad_militar',
        'id_militar_estudiante',
    ];

    public function estudiante()
    {
        return $this->belongsTo(Estudiante::class, 'id_estudiante', 'id_estudiante');
    }
}
