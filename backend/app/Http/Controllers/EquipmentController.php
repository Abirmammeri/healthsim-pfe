<?php

namespace App\Http\Controllers;

use App\Services\EquipmentService;
use Illuminate\Http\Request;

class EquipmentController extends Controller
{
    protected $equipmentService;

    public function __construct(EquipmentService $equipmentService)
    {
        $this->equipmentService = $equipmentService;
    }

    public function store(Request $request, $serviceId)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'type' => 'required|string',
            'quantity' => 'integer|min:1',
            'status' => 'in:operational,maintenance,hors_service',
        ]);

        $equipment = $this->equipmentService->addEquipment($serviceId, $data);
        return response()->json($equipment, 201);
    }

    public function transfer(Request $request, $serviceId)
    {
        $data = $request->validate([
            'to_service_id' => 'required|integer',
            'equipment_type' => 'required|string',
            'quantity' => 'required|integer|min:1',
        ]);

        $this->equipmentService->transferEquipment($serviceId, $data);
        return response()->json(['message' => 'Équipement transféré']);
    }
}
