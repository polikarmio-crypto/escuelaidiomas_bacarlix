<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocenteIdioma extends Model
{
    protected $table = 'docente_idioma';
    public $timestamps = false;
    public $incrementing = false;

    protected $fillable = [
        'id_docente',
        'id_idioma',
        'fecha_habilitacion',
    ];

    public function docente()
    {
        return $this->belongsTo(Docente::class, 'id_docente', 'id_docente');
    }

    public function idioma()
    {
        return $this->belongsTo(Idioma::class, 'id_idioma', 'id_idioma');
    }
}
