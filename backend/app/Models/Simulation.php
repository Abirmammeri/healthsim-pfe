<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Simulation extends Model
{
    protected $fillable = [
        'hospital_id', 'scenario_name', 'description', 'created_by',
        'input_active_patients', 'input_target_doctors',
        'input_target_nurses', 'input_target_beds',
        'input_available_eq', 'input_current_doctors',
        'input_current_nurses', 'input_current_beds', 'input_current_eq',
        'target_doctors', 'target_nurses', 'available_equipment',
        'results_before', 'results_after', 'kpis',
        'before_waiting_time', 'before_bed_occupancy',
        'before_resource_util', 'before_throughput',
        'before_coverage', 'before_rho_doctors', 'before_rho_beds',
        'after_waiting_time', 'after_bed_occupancy',
        'after_resource_util', 'after_throughput',
        'after_coverage', 'after_rho_doctors', 'after_rho_beds',
        'after_A2_dms', 'after_A4_temps_attente',
        'after_A8_lits_vacants', 'after_A9_transfert',
        'after_C2_occupation', 'after_C3_mortalite', 'after_C4_infection',
        'after_B1_cout_soins', 'after_B4_cout_lit',
        'after_B5_cout_med_eq', 'after_B7_cout_personnel',
        'after_D5_distribution', 'after_D11_dechets',
        'after_D12_localisation', 'after_D13_air', 'after_D14_acoustique',
        'projections', 'recommendations', 'scenario_changes',
        'statut', 'applied_at',
    ];

    protected $casts = [
        'results_before'   => 'array',
        'results_after'    => 'array',
        'kpis'             => 'array',
        'projections'      => 'array',
        'recommendations'  => 'array',
        'scenario_changes' => 'array',
        'applied_at'       => 'datetime',
    ];

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function serviceSnapshots()
    {
        return $this->hasMany(SimulationServiceSnapshot::class);
    }

    public function toArray()
    {
        return [
            'id'           => $this->id,
            'hospitalId'   => $this->hospital_id,
            'scenarioName' => $this->scenario_name,
            'description'  => $this->description,
            'createdBy'    => $this->created_by,
            'statut'       => $this->statut,
            'appliedAt'    => $this->applied_at,
            'createdAt'    => $this->created_at,
            'input' => [
                'active_patients' => $this->input_active_patients,
                'target_doctors'  => $this->input_target_doctors,
                'target_nurses'   => $this->input_target_nurses,
                'target_beds'     => $this->input_target_beds,
                'available_eq'    => $this->input_available_eq,
                'current_doctors' => $this->input_current_doctors,
                'current_nurses'  => $this->input_current_nurses,
                'current_beds'    => $this->input_current_beds,
                'current_eq'      => $this->input_current_eq,
            ],
            'before'          => $this->results_before,
            'after'           => $this->results_after,
            'improvements'    => $this->kpis,
            'projections'     => $this->projections,
            'recommendations' => $this->recommendations,
            'scenarioChanges' => $this->scenario_changes,
        ];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }
}