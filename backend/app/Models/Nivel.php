<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nivel extends Model
{
    protected $table = 'nivel';
    protected $primaryKey = 'id_nivel';

    protected $fillable = [
        'id_programa',
        'numero_nivel',
        'nombre_nivel',
        'cantidad_libros_nivel',
    ];

    public function programa()
    {
        return $this->belongsTo(Programa::class, 'id_programa', 'id_programa');
    }

    public function libros()
    {
        return $this->hasMany(Libro::class, 'id_nivel', 'id_nivel')->orderBy('numero_libro');
    }

    public function paralelos()
    {
        return $this->hasMany(Paralelo::class, 'id_nivel', 'id_nivel');
    }
}
