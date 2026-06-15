<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimulationServiceSnapshot extends Model
{
    protected $fillable = [
        'simulation_id', 'service_id',
        'service_doctors', 'service_nurses',
        'service_beds', 'service_patients',
        'service_equipment', 'service_dms_heures',
        // SSI
        'A2_dms', 'A4_temps_attente',
        'A8_lits_vacants', 'A9_taux_transfert',
        // IIP
        'C2_occupation', 'C3_mortalite', 'C4_infection',
        // ESI
        'B1_cout_soins', 'B4_cout_lit',
        'B5_cout_med_eq', 'B7_cout_personnel',
        // TI
        'D5_distribution_eq', 'D11_dechets',
        'D12_localisation', 'D13_air', 'D14_acoustique',
        'statut_service',
        // DES
        'lambda_rate', 'mu_rate',
        'rho_doctors', 'rho_beds',
        'erlang_pw', 'wq_hours',
    ];

    public function simulation()
    {
        return $this->belongsTo(Simulation::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}