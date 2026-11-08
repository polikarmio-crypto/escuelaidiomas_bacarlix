<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Modalidad extends Model
{
    protected $table = 'modalidad';
    protected $primaryKey = 'id_modalidad';

    protected $fillable = [
        'nombre_modalidad',
    ];

    public function paralelos()
    {
        return $this->hasMany(Paralelo::class, 'id_modalidad', 'id_modalidad');
    }
}
