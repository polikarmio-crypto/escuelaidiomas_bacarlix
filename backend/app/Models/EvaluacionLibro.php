<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluacionLibro extends Model
{
    protected $table = 'evaluacion_libro';
    protected $primaryKey = 'id_evaluacion_libro';

    protected $fillable = [
        'id_inscripcion_libro',
        'nota_examen_libro',
        'nota_defensa_oral',
        'nota_participacion_libro',
        'nota_final_libro',
        'id_docente_calificador',
        'fecha_evaluacion_libro',
    ];

    protected $casts = [
        'nota_examen_libro' => 'float',
        'nota_defensa_oral' => 'float',
        'nota_participacion_libro' => 'float',
        'nota_final_libro' => 'float',
        'fecha_evaluacion_libro' => 'date',
    ];

    public function inscripcionLibro()
    {
        return $this->belongsTo(InscripcionLibro::class, 'id_inscripcion_libro', 'id_inscripcion_libro');
    }

    public function docenteCalificador()
    {
        return $this->belongsTo(Docente::class, 'id_docente_calificador', 'id_docente');
    }

    /**
     * Calcula la nota final según los pesos del Ejército:
     * 80% Examen Escrito + 10% Defensa Oral + 10% Participación
     */
    public function calcularNotaPonderada(): float
    {
        $final = ($this->nota_examen_libro * 0.80) +
                 ($this->nota_defensa_oral * 0.10) +
                 ($this->nota_participacion_libro * 0.10);
        return round($final, 2);
    }

    public function esAprobado(): bool
    {
        return $this->nota_final_libro >= 71.0;
    }
}
