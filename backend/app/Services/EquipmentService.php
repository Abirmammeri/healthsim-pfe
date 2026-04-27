<?php

namespace App\Services;

use App\Models\Equipment;
use App\Models\Service;

class EquipmentService
{
    public function addEquipment($serviceId, $data)
    {
        $service = Service::findOrFail($serviceId);
        return $service->equipment()->create($data);
    }

    public function transferEquipment($serviceId, $data)
    {
        $fromService = Service::findOrFail($serviceId);
        $toService = Service::findOrFail($data['to_service_id']);

        $equipment = Equipment::where('service_id', $fromService->id)
            ->where('type', $data['equipment_type'])
            ->first();

        if ($equipment) {
            if ($equipment->quantity <= $data['quantity']) {
                $equipment->delete();
            } else {
                $equipment->decrement('quantity', $data['quantity']);
            }

            $existing = Equipment::where('service_id', $toService->id)
                ->where('type', $data['equipment_type'])
                ->first();

            if ($existing) {
                $existing->increment('quantity', $data['quantity']);
            } else {
                Equipment::create([
                    'service_id' => $toService->id,
                    'name' => $data['equipment_type'],
                    'type' => $data['equipment_type'],
                    'quantity' => $data['quantity'],
                    'status' => 'operational'
                ]);
            }
        }

        return true;
    }
}