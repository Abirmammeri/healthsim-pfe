<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    protected $fillable = [
        'service_id', 'admission_id',
        'type', 'description', 'gravite',
        'evitable', 'mesure_corrective',
        'resolu', 'date_incident',
    ];

    protected $casts = [
        'date_incident' => 'datetime',
        'evitable'      => 'boolean',
        'resolu'        => 'boolean',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function admission()
    {
        return $this->belongsTo(Admission::class);
    }
}