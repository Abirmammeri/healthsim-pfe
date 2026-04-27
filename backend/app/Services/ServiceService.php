<?php

namespace App\Services;

use App\Models\Service;
use App\Models\Hospital;

class ServiceService
{
    public function getServicesByHospital($hospitalId)
    {
        return Service::with('equipment')
            ->where('hospital_id', $hospitalId)
            ->get();
    }

    public function createService($hospitalId, $data)
    {
        $hospital = Hospital::findOrFail($hospitalId);
        return $hospital->services()->create($data);
    }

    public function deleteService($id)
    {
        $service = Service::findOrFail($id);
        $service->delete();
        return true;
    }

    public function transferStaff($serviceId, $data)
    {
        $fromService = Service::findOrFail($serviceId);
        $toService = Service::findOrFail($data['to_service_id']);

        if ($data['type'] === 'doctor') {
            $fromService->decrement('doctors', $data['quantity']);
            $toService->increment('doctors', $data['quantity']);
        } else {
            $fromService->decrement('nurses', $data['quantity']);
            $toService->increment('nurses', $data['quantity']);
        }

        return true;
    }
}