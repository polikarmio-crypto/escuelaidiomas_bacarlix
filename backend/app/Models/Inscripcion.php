<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inscripcion extends Model
{
    protected $table = 'inscripcion';
    protected $primaryKey = 'id_inscripcion';

    protected $fillable = [
        'id_estudiante',
        'id_paralelo',
        'fecha_inscripcion',
        'estado_inscripcion',
    ];

    protected $casts = [
        'fecha_inscripcion' => 'date',
    ];

    public function estudiante()
    {
        return $this->belongsTo(Estudiante::class, 'id_estudiante', 'id_estudiante');
    }

    public function paralelo()
    {
        return $this->belongsTo(Paralelo::class, 'id_paralelo', 'id_paralelo');
    }

    public function librosAvance()
    {
        return $this->hasMany(InscripcionLibro::class, 'id_inscripcion', 'id_inscripcion');
    }

    public function examenNivel()
    {
        return $this->hasOne(ExamenNivel::class, 'id_inscripcion', 'id_inscripcion');
    }

    public function pagos()
    {
        return $this->hasMany(Pago::class, 'id_inscripcion', 'id_inscripcion');
    }
}
