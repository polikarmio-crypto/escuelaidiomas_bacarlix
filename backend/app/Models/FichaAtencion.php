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

    /**
     * Scope FIFO: Obtiene los turnos en estricto orden de llegada
     */
    public function scopeEnEspera($query)
    {
        return $query->where('estado_ficha', 'En espera')->orderBy('hora_llegada_ficha', 'asc');
    }

    /**
     * Scope FIFO: Retorna la siguiente ficha a ser atendida (First In, First Out)
     */
    public function scopeSiguienteTurnoFifo($query)
    {
        return $query->where('estado_ficha', 'En espera')
                     ->orderBy('hora_llegada_ficha', 'asc')
                     ->first();
    }

    /**
     * Tiempo de espera en cola (minutos) antes de ser llamado
     */
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

    /**
     * Tiempo de atención en ventanilla (minutos de servicio)
     */
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
