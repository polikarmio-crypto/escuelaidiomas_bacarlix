<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Docente extends Model
{
    protected $table = 'docente';
    protected $primaryKey = 'id_docente';

    protected $fillable = [
        'ci_docente',
        'nombre_docente',
        'apellido_docente',
        'telefono_docente',
        'email_docente',
        'estado_docente',
    ];

    public function idiomas()
    {
        return $this->belongsToMany(Idioma::class, 'docente_idioma', 'id_docente', 'id_idioma');
    }

    public function asignacionesParalelo()
    {
        return $this->hasMany(AsignacionDocenteParalelo::class, 'id_docente', 'id_docente');
    }

    public function asignacionActiva()
    {
        return $this->hasOne(AsignacionDocenteParalelo::class, 'id_docente', 'id_docente')
            ->whereNull('fecha_fin_asignacion');
    }

    public function evaluacionesCalificadas()
    {
        return $this->hasMany(EvaluacionLibro::class, 'id_docente_calificador', 'id_docente');
    }

    public function examenesNivelCalificados()
    {
        return $this->hasMany(ExamenNivel::class, 'id_docente_calificador', 'id_docente');
    }
}
