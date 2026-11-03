<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamenNivel extends Model
{
    protected $table = 'examen_nivel';
    protected $primaryKey = 'id_examen_nivel';

    protected $fillable = [
        'id_inscripcion',
        'nota_examen_nivel',
        'id_docente_calificador',
        'fecha_examen_nivel',
        'estado_examen_nivel',
    ];

    protected $casts = [
        'nota_examen_nivel' => 'float',
        'fecha_examen_nivel' => 'date',
    ];

    public function inscripcion()
    {
        return $this->belongsTo(Inscripcion::class, 'id_inscripcion', 'id_inscripcion');
    }

    public function docenteCalificador()
    {
        return $this->belongsTo(Docente::class, 'id_docente_calificador', 'id_docente');
    }

    public function esAprobado(): bool
    {
        return $this->nota_examen_nivel >= 71.0;
    }
}
