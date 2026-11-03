<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class AsignacionDocenteParalelo extends Model
{
    protected $table = 'asignacion_docente_paralelo';
    protected $primaryKey = 'id_asignacion';

    protected $fillable = [
        'id_paralelo',
        'id_docente',
        'fecha_inicio_asignacion',
        'fecha_fin_asignacion',
    ];

    protected $casts = [
        'fecha_inicio_asignacion' => 'date',
        'fecha_fin_asignacion' => 'date',
    ];

    public function paralelo()
    {
        return $this->belongsTo(Paralelo::class, 'id_paralelo', 'id_paralelo');
    }

    public function docente()
    {
        return $this->belongsTo(Docente::class, 'id_docente', 'id_docente');
    }

    public function getDiasEnAulaAttribute(): int
    {
        $inicio = Carbon::parse($this->fecha_inicio_asignacion);
        $fin = $this->fecha_fin_asignacion ? Carbon::parse($this->fecha_fin_asignacion) : Carbon::now();
        return (int) $inicio->diffInDays($fin);
    }

    public function getCumplioCicloQuincenalAttribute(): bool
    {
        return $this->dias_en_aula >= 15;
    }
}
