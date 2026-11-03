<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Caja extends Model
{
    protected $table = 'caja';
    protected $primaryKey = 'id_caja';

    protected $fillable = [
        'nombre_caja',
        'ubicacion_caja',
    ];

    public function fichas()
    {
        return $this->hasMany(FichaAtencion::class, 'id_caja', 'id_caja');
    }

    public function pagos()
    {
        return $this->hasMany(Pago::class, 'id_caja', 'id_caja');
    }
}
