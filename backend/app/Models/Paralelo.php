<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paralelo extends Model
{
    protected $table = 'paralelo';
    protected $primaryKey = 'id_paralelo';

    protected $fillable = [
        'id_nivel',
        'id_aula',
        'id_horario',
        'id_modalidad',
        'id_gestion',
        'codigo_paralelo',
        'capacidad_maxima_paralelo',
        'capacidad_minima_apertura',
        'estado_paralelo',
    ];

    public function nivel()
    {
        return $this->belongsTo(Nivel::class, 'id_nivel', 'id_nivel');
    }

    public function aula()
    {
        return $this->belongsTo(Aula::class, 'id_aula', 'id_aula');
    }

    public function horario()
    {
        return $this->belongsTo(Horario::class, 'id_horario', 'id_horario');
    }

    public function modalidad()
    {
        return $this->belongsTo(Modalidad::class, 'id_modalidad', 'id_modalidad');
    }

    public function gestion()
    {
        return $this->belongsTo(Gestion::class, 'id_gestion', 'id_gestion');
    }

    public function asignacionesDocente()
    {
        return $this->hasMany(AsignacionDocenteParalelo::class, 'id_paralelo', 'id_paralelo')
            ->orderBy('fecha_inicio_asignacion', 'desc');
    }

    public function docenteActual()
    {
        return $this->hasOne(AsignacionDocenteParalelo::class, 'id_paralelo', 'id_paralelo')
            ->whereNull('fecha_fin_asignacion')
            ->latestOfMany('fecha_inicio_asignacion');
    }

    public function inscripciones()
    {
        return $this->hasMany(Inscripcion::class, 'id_paralelo', 'id_paralelo');
    }

    public function getInscritosCountAttribute(): int
    {
        return $this->inscripciones()->where('estado_inscripcion', 'Activa')->count();
    }

    public function getTieneCupoDisponibleAttribute(): bool
    {
        return $this->inscritos_count < $this->capacidad_maxima_paralelo;
    }
}
