<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Estudiante extends Model
{
    protected $table = 'estudiante';
    protected $primaryKey = 'id_estudiante';

    protected $fillable = [
        'ci_estudiante',
        'nombre_estudiante',
        'apellido_estudiante',
        'fecha_nacimiento_estudiante',
        'telefono_estudiante',
        'email_estudiante',
        'direccion_estudiante',
        'tipo_estudiante',
    ];

    protected $casts = [
        'fecha_nacimiento_estudiante' => 'date',
    ];

    public function militar()
    {
        return $this->hasOne(EstudianteMilitar::class, 'id_estudiante', 'id_estudiante');
    }

    public function inscripciones()
    {
        return $this->hasMany(Inscripcion::class, 'id_estudiante', 'id_estudiante');
    }

    public function fichasAtencion()
    {
        return $this->hasMany(FichaAtencion::class, 'id_estudiante', 'id_estudiante');
    }

    public function pagos()
    {
        return $this->hasMany(Pago::class, 'id_estudiante', 'id_estudiante');
    }

    public function esMilitar(): bool
    {
        return strtolower($this->tipo_estudiante) === 'militar';
    }
}
