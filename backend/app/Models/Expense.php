<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'service_id', 'hospital_id',
        'mois', 'annee',
        'cout_personnel', 'cout_medicaments',
        'cout_equipements', 'cout_maintenance',
        'cout_energie', 'cout_autre', 'cout_total',
        'nb_patients_mois',
        'cout_moyen_patient', 'cout_par_lit_jour',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }
}