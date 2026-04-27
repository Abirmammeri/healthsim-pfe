<?php

namespace App\Services;

use App\Models\Alert;

class AlertService
{
   public function getAllAlerts()
{
    return Alert::with('hospital')
        ->orderBy('created_at', 'desc')
        ->get();
}

    public function getAlertsByHospital($hospitalId)
    {
        return Alert::where('hospital_id', $hospitalId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function createAlert($hospitalId, $data)
    {
        return Alert::create([
            'hospital_id' => $hospitalId,
            'title' => $data['title'],
            'message' => $data['message'],
            'severity' => $data['severity'] ?? 'medium',
            'type' => $data['type'] ?? 'general',
            'is_read' => false
        ]);
    }

    public function markAsRead($id)
    {
        $alert = Alert::findOrFail($id);
        $alert->update(['is_read' => true]);
        return $alert;
    }
}