<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PedidoReposicion extends Model
{
    protected $table = 'pedido_reposicion';
    protected $primaryKey = 'id_pedido';

    protected $fillable = [
        'id_almacen_libro',
        'cantidad_pedido',
        'fecha_pedido',
        'fecha_recepcion_pedido',
        'estado_pedido',
    ];

    protected $casts = [
        'fecha_pedido' => 'date',
        'fecha_recepcion_pedido' => 'date',
        'cantidad_pedido' => 'integer',
    ];

    public function almacenLibro()
    {
        return $this->belongsTo(AlmacenLibro::class, 'id_almacen_libro', 'id_almacen_libro');
    }
}
