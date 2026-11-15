<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Libro extends Model
{
    protected $table = 'libro';
    protected $primaryKey = 'id_libro';

    protected $fillable = [
        'id_nivel',
        'numero_libro',
        'nombre_libro',
    ];

    public function nivel()
    {
        return $this->belongsTo(Nivel::class, 'id_nivel', 'id_nivel');
    }

    public function inscripcionesLibros()
    {
        return $this->hasMany(InscripcionLibro::class, 'id_libro', 'id_libro');
    }

    public function inventarioAlmacen()
    {
        return $this->hasOne(AlmacenLibro::class, 'id_libro', 'id_libro');
    }
}
