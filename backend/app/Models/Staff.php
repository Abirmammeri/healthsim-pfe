<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    protected $fillable = [
        'hospital_id', 'service_id',
        'matricule', 'nom', 'prenom',
        'type', 'specialite', 'statut', 'salaire',
    ];

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function toArray()
    {
        return [
            'id'         => $this->id,
            'matricule'  => $this->matricule,
            'nom'        => $this->nom,
            'prenom'     => $this->prenom,
            'type'       => $this->type,
            'specialite' => $this->specialite,
            'statut'     => $this->statut,
            'salaire'    => $this->salaire,
            'serviceId'  => $this->service_id,
            'hospitalId' => $this->hospital_id,
        ];
    }
}