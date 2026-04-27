<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Hospital;
use App\Models\Alert;

class GenerateAlerts extends Command
{
    protected $signature = 'alerts:generate';
    protected $description = 'Génère automatiquement les alertes selon les données des hôpitaux';

    public function handle()
    {
        // Supprimer les anciennes alertes automatiques non lues
        Alert::where('is_read', false)->delete();

        $hospitals = Hospital::all();

        foreach ($hospitals as $hospital) {
            $occupancyRate = $hospital->total_beds > 0
                ? ($hospital->active_patients / $hospital->total_beds) * 100
                : 0;

            // Alerte critique — occupation > 85%
            if ($occupancyRate > 85) {
                Alert::create([
                    'hospital_id' => $hospital->id,
                    'title' => 'Saturation critique',
                    'message' => "{$hospital->name} : taux d'occupation à " . round($occupancyRate) . "%",
                    'severity' => 'critical',
                    'type' => 'saturation',
                    'is_read' => false
                ]);
            }
            // Alerte élevée — occupation > 70%
            elseif ($occupancyRate > 70) {
                Alert::create([
                    'hospital_id' => $hospital->id,
                    'title' => 'Charge élevée',
                    'message' => "{$hospital->name} : taux d'occupation à " . round($occupancyRate) . "%",
                    'severity' => 'high',
                    'type' => 'saturation',
                    'is_read' => false
                ]);
            }

            // Alerte manque de personnel — moins de 1 médecin pour 10 patients
            if ($hospital->active_patients > 0 && $hospital->total_doctors > 0) {
                $patientPerDoctor = $hospital->active_patients / $hospital->total_doctors;
                if ($patientPerDoctor > 10) {
                    Alert::create([
                        'hospital_id' => $hospital->id,
                        'title' => 'Manque de médecins',
                        'message' => "{$hospital->name} : " . round($patientPerDoctor) . " patients par médecin",
                        'severity' => 'high',
                        'type' => 'personnel',
                        'is_read' => false
                    ]);
                }
            }
        }

        $this->info('Alertes générées avec succès !');
    }
}