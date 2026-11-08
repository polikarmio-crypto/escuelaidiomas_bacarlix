<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoPrograma extends Model
{
    protected $table = 'tipo_programa';
    protected $primaryKey = 'id_tipo_programa';

    protected $fillable = [
        'nombre_tipo_programa',
    ];

    public function programas()
    {
        return $this->hasMany(Programa::class, 'id_tipo_programa', 'id_tipo_programa');
    }
}
