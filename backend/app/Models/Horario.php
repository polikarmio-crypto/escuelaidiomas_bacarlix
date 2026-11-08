<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Horario extends Model
{
    protected $table = 'horario';
    protected $primaryKey = 'id_horario';

    protected $fillable = [
        'hora_inicio_horario',
        'hora_fin_horario',
    ];

    public function paralelos()
    {
        return $this->hasMany(Paralelo::class, 'id_horario', 'id_horario');
    }
}
