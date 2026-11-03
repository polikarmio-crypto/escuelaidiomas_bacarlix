<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    protected $table = 'pago';
    protected $primaryKey = 'id_pago';

    protected $fillable = [
        'id_estudiante',
        'id_tipo_pago',
        'id_inscripcion',
        'id_inscripcion_libro',
        'id_gestion',
        'id_caja',
        'id_ficha',
        'monto_pago',
        'fecha_pago',
    ];

    protected $casts = [
        'monto_pago' => 'float',
        'fecha_pago' => 'datetime',
    ];

    public function estudiante()
    {
        return $this->belongsTo(Estudiante::class, 'id_estudiante', 'id_estudiante');
    }

    public function tipoPago()
    {
        return $this->belongsTo(TipoPago::class, 'id_tipo_pago', 'id_tipo_pago');
    }

    public function inscripcion()
    {
        return $this->belongsTo(Inscripcion::class, 'id_inscripcion', 'id_inscripcion');
    }

    public function inscripcionLibro()
    {
        return $this->belongsTo(InscripcionLibro::class, 'id_inscripcion_libro', 'id_inscripcion_libro');
    }

    public function gestion()
    {
        return $this->belongsTo(Gestion::class, 'id_gestion', 'id_gestion');
    }

    public function caja()
    {
        return $this->belongsTo(Caja::class, 'id_caja', 'id_caja');
    }

    public function ficha()
    {
        return $this->belongsTo(FichaAtencion::class, 'id_ficha', 'id_ficha');
    }
}
