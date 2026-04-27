<?php

namespace App\Services;

use App\Models\Hospital;

class HospitalService
{
    public function getAllHospitals()
    {
        return Hospital::all();
    }

    public function getHospitalById($id)
    {
        return Hospital::findOrFail($id);
    }

    public function getDashboard($id)
{
    $hospital = Hospital::with(['services.equipment', 'alerts'])->findOrFail($id);

    $equipmentStatus = [
        'operational' => 0,
        'maintenance' => 0,
        'offline' => 0
    ];

    foreach ($hospital->services as $service) {
        foreach ($service->equipment as $eq) {
            if ($eq->status === 'operational') $equipmentStatus['operational']++;
            elseif ($eq->status === 'maintenance') $equipmentStatus['maintenance']++;
            else $equipmentStatus['offline']++;
        }
    }

    return [
        'hospitalId' => $hospital->id,
        'hospitalName' => $hospital->name,
        'doctors' => $hospital->total_doctors,
        'nurses' => $hospital->total_nurses,
        'patients' => $hospital->active_patients,
        'totalBeds' => $hospital->total_beds,
        'availableBeds' => $hospital->available_beds,
        'occupiedBeds' => $hospital->total_beds - $hospital->available_beds,
        'loadPercentage' => $hospital->total_beds > 0
            ? round(($hospital->active_patients / $hospital->total_beds) * 100)
            : 0,
        'loadStatus' => match($hospital->status) {
            'charge_elevee' => 'high',
            'critique' => 'critical',
            default => 'normal'
        },
        'serviceCount' => $hospital->services->count(),
        'activeAlerts' => $hospital->alerts->where('is_read', false)->count(),
        'equipmentStatus' => $equipmentStatus,
    ];
}
  public function getSummary()
{
    return [
        'totalHospitals' => (int) Hospital::count(),
        'totalPatients' => (int) Hospital::sum('active_patients'),
        'totalBeds' => (int) Hospital::sum('total_beds'),
        'availableBeds' => (int) Hospital::sum('available_beds'),
        'totalDoctors' => (int) Hospital::sum('total_doctors'),
        'totalNurses' => (int) Hospital::sum('total_nurses'),
        'activeAlerts' => (int) \App\Models\Alert::where('is_read', false)->count(),
        'criticalServices' => (int) Hospital::where('status', 'critique')->count(),
        'overallLoadStatus' => Hospital::where('status', 'critique')->exists() ? 'critical' : 'normal',
    ];
}
}