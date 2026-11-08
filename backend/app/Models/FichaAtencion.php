<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class FichaAtencion extends Model
{
    protected $table = 'ficha_atencion';
    protected $primaryKey = 'id_ficha';

    protected $fillable = [
        'id_caja',
        'id_estudiante',
        'numero_ficha',
        'hora_llegada_ficha',
        'hora_inicio_atencion_ficha',
        'hora_fin_atencion_ficha',
        'estado_ficha',
    ];

    protected $casts = [
        'hora_llegada_ficha' => 'datetime',
        'hora_inicio_atencion_ficha' => 'datetime',
        'hora_fin_atencion_ficha' => 'datetime',
    ];

    public function caja()
    {
        return $this->belongsTo(Caja::class, 'id_caja', 'id_caja');
    }

    public function estudiante()
    {
        return $this->belongsTo(Estudiante::class, 'id_estudiante', 'id_estudiante');
    }

    public function pagos()
    {
        return $this->hasMany(Pago::class, 'id_ficha', 'id_ficha');
    }

    public function scopeEnEspera($query)
    {
        return $query->where('estado_ficha', 'En espera')->orderBy('hora_llegada_ficha', 'asc');
    }

    public function scopeSiguienteTurno($query)
    {
        return $query->where('estado_ficha', 'En espera')
                     ->orderBy('hora_llegada_ficha', 'asc')
                     ->first();
    }

    public function getTiempoEsperaMinutosAttribute(): ?float
    {
        if (!$this->hora_inicio_atencion_ficha || !$this->hora_llegada_ficha) {
            if ($this->hora_llegada_ficha && $this->estado_ficha === 'En espera') {
                return round(Carbon::parse($this->hora_llegada_ficha)->diffInMinutes(Carbon::now()), 1);
            }
            return null;
        }
        $llegada = Carbon::parse($this->hora_llegada_ficha);
        $inicio = Carbon::parse($this->hora_inicio_atencion_ficha);
        return round($llegada->diffInMinutes($inicio), 1);
    }

    public function getTiempoServicioMinutosAttribute(): ?float
    {
        if (!$this->hora_inicio_atencion_ficha || !$this->hora_fin_atencion_ficha) {
            return null;
        }
        $inicio = Carbon::parse($this->hora_inicio_atencion_ficha);
        $fin = Carbon::parse($this->hora_fin_atencion_ficha);
        return round($inicio->diffInMinutes($fin), 1);
    }
}
