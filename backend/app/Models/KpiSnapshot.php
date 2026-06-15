<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiSnapshot extends Model
{
    protected $fillable = [
        'service_id', 'hospital_id',
        'periode', 'type_periode',
        // SSI
        'A2_dms_jours', 'A4_temps_attente',
        'A8_lits_vacants', 'A9_taux_transfert',
        // IIP
        'C2_occupation_lits', 'C3_mortalite', 'C4_infection',
        // ESI
        'B1_cout_moyen_soins', 'B4_cout_par_lit',
        'B5_cout_med_eq', 'B7_cout_personnel',
        // TI
        'D5_distribution_eq', 'D11_gestion_dechets',
        'D12_localisation', 'D13_air_interieur', 'D14_acoustique',
        // DES
        'lambda_rate', 'mu_rate', 'rho_doctors', 'rho_beds',
        'active_patients', 'nb_doctors', 'nb_nurses', 'nb_beds',
        'statut_global',
    ];

    protected $casts = [
        'periode' => 'date',
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