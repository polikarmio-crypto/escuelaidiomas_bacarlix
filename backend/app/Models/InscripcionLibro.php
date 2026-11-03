<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InscripcionLibro extends Model
{
    protected $table = 'inscripcion_libro';
    protected $primaryKey = 'id_inscripcion_libro';

    protected $fillable = [
        'id_inscripcion',
        'id_libro',
        'fecha_inicio_libro',
        'fecha_fin_libro',
        'estado_libro',
    ];

    protected $casts = [
        'fecha_inicio_libro' => 'date',
        'fecha_fin_libro' => 'date',
    ];

    public function inscripcion()
    {
        return $this->belongsTo(Inscripcion::class, 'id_inscripcion', 'id_inscripcion');
    }

    public function libro()
    {
        return $this->belongsTo(Libro::class, 'id_libro', 'id_libro');
    }

    public function evaluacion()
    {
        return $this->hasOne(EvaluacionLibro::class, 'id_inscripcion_libro', 'id_inscripcion_libro');
    }

    public function pagos()
    {
        return $this->hasMany(Pago::class, 'id_inscripcion_libro', 'id_inscripcion_libro');
    }
}
