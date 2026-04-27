<?php

namespace App\Services;

use App\Models\Simulation;
use App\Models\Hospital;
use Illuminate\Support\Facades\Http;

class SimulationService
{
    public function getSimulations()
    {
        return Simulation::with('hospital')->get();
    }

    public function createSimulation($data)
    {
        $hospital = Hospital::findOrFail($data['hospital_id']);

        // Appel au moteur DES Python/Flask
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ])->post('http://127.0.0.1:5000/simulate', [
            'hospital_id' => $hospital->id,
            'scenario_name' => $data['scenario_name'],
            'current_beds' => $hospital->total_beds,
            'current_doctors' => $hospital->total_doctors,
            'current_nurses' => $hospital->total_nurses,
            'current_equipment' => 10,
            'active_patients' => $hospital->active_patients,
            'target_beds' => $data['target_beds'] ?? $hospital->total_beds,
            'target_doctors' => $data['target_doctors'],
            'target_nurses' => $data['target_nurses'],
            'target_equipment' => $data['available_equipment'],
        ]);

        $result = $response->json();

        // Sauvegarder en BDD
        return Simulation::create([
            'hospital_id' => $hospital->id,
            'scenario_name' => $data['scenario_name'],
            'target_doctors' => $data['target_doctors'],
            'target_nurses' => $data['target_nurses'],
            'available_equipment' => $data['available_equipment'],
            'results_before' => $result['before'],
            'results_after' => $result['after'],
            'kpis' => $result['improvements'],
        ]);
    }
}