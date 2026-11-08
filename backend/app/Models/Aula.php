<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Aula extends Model
{
    protected $table = 'aula';
    protected $primaryKey = 'id_aula';

    protected $fillable = [
        'nombre_aula',
        'capacidad_aula',
    ];

    public function paralelos()
    {
        return $this->hasMany(Paralelo::class, 'id_aula', 'id_aula');
    }
}
