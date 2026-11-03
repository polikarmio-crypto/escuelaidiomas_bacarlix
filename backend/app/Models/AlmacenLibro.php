<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlmacenLibro extends Model
{
    protected $table = 'almacen_libro';
    protected $primaryKey = 'id_almacen_libro';

    protected $fillable = [
        'id_libro',
        'stock_actual_almacen',
        'punto_reorden_almacen',
        'stock_minimo_almacen',
        'stock_maximo_almacen',
    ];

    public function libro()
    {
        return $this->belongsTo(Libro::class, 'id_libro', 'id_libro');
    }

    public function movimientos()
    {
        return $this->hasMany(MovimientoAlmacen::class, 'id_almacen_libro', 'id_almacen_libro')
            ->orderBy('fecha_movimiento', 'desc');
    }

    public function pedidosReposicion()
    {
        return $this->hasMany(PedidoReposicion::class, 'id_almacen_libro', 'id_almacen_libro');
    }

    /**
     * Scope para filtrar libros bajo Punto de Reorden (ROP crítico)
     */
    public function scopeBajoPuntoReorden($query)
    {
        return $query->whereColumn('stock_actual_almacen', '<=', 'punto_reorden_almacen');
    }

    public function getRequiereReposicionAttribute(): bool
    {
        return $this->stock_actual_almacen <= $this->punto_reorden_almacen;
    }
}
