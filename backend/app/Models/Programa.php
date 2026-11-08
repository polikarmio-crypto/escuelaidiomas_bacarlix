<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Programa extends Model
{
    protected $table = 'programa';
    protected $primaryKey = 'id_programa';

    protected $fillable = [
        'id_idioma',
        'id_tipo_programa',
        'nombre_programa',
        'duracion_anios_programa',
    ];

    public function idioma()
    {
        return $this->belongsTo(Idioma::class, 'id_idioma', 'id_idioma');
    }

    public function tipoPrograma()
    {
        return $this->belongsTo(TipoPrograma::class, 'id_tipo_programa', 'id_tipo_programa');
    }

    public function niveles()
    {
        return $this->hasMany(Nivel::class, 'id_programa', 'id_programa')->orderBy('numero_nivel');
    }
}
