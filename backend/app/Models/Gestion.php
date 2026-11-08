<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gestion extends Model
{
    protected $table = 'gestion';
    protected $primaryKey = 'id_gestion';

    protected $fillable = [
        'anio_gestion',
        'estado_gestion',
    ];

    public function paralelos()
    {
        return $this->hasMany(Paralelo::class, 'id_gestion', 'id_gestion');
    }

    public function pagos()
    {
        return $this->hasMany(Pago::class, 'id_gestion', 'id_gestion');
    }
}
