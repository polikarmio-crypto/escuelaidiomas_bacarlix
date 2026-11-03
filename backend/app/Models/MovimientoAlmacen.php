<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimientoAlmacen extends Model
{
    protected $table = 'movimiento_almacen';
    protected $primaryKey = 'id_movimiento';

    protected $fillable = [
        'id_almacen_libro',
        'id_paralelo',
        'tipo_movimiento',
        'cantidad_movimiento',
        'fecha_movimiento',
        'motivo_movimiento',
    ];

    protected $casts = [
        'fecha_movimiento' => 'datetime',
        'cantidad_movimiento' => 'integer',
    ];

    public function almacenLibro()
    {
        return $this->belongsTo(AlmacenLibro::class, 'id_almacen_libro', 'id_almacen_libro');
    }

    public function paralelo()
    {
        return $this->belongsTo(Paralelo::class, 'id_paralelo', 'id_paralelo');
    }
}
