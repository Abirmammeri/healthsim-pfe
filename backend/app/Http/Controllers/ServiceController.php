<?php

namespace App\Http\Controllers;

use App\Services\ServiceService;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    protected $serviceService;

    public function __construct(ServiceService $serviceService)
    {
        $this->serviceService = $serviceService;
    }

    public function index($hospitalId)
    {
        $services = $this->serviceService->getServicesByHospital($hospitalId);
        return response()->json($services);
    }

    public function store(Request $request, $hospitalId)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'head' => 'nullable|string',
            'doctors' => 'integer|min:0',
            'nurses' => 'integer|min:0',
            'beds' => 'integer|min:0',
        ]);

        $service = $this->serviceService->createService($hospitalId, $data);
        return response()->json($service, 201);
    }

    public function destroy($id)
    {
        $this->serviceService->deleteService($id);
        return response()->json(['message' => 'Service supprimé']);
    }

    public function transferStaff(Request $request, $id)
    {
        $data = $request->validate([
            'to_service_id' => 'required|integer',
            'type' => 'required|in:doctor,nurse',
            'quantity' => 'required|integer|min:1',
        ]);

        $this->serviceService->transferStaff($id, $data);
        return response()->json(['message' => 'Personnel transféré']);
    }
}
