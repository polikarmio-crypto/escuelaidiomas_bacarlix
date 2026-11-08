<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Idioma extends Model
{
    protected $table = 'idioma';
    protected $primaryKey = 'id_idioma';

    protected $fillable = [
        'nombre_idioma',
    ];

    public function programas()
    {
        return $this->hasMany(Programa::class, 'id_idioma', 'id_idioma');
    }

    public function docentes()
    {
        return $this->belongsToMany(Docente::class, 'docente_idioma', 'id_idioma', 'id_docente');
    }
}
