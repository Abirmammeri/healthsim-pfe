<?php

namespace App\Http\Controllers;

use App\Services\SimulationService;
use Illuminate\Http\Request;

class SimulationController extends Controller
{
    protected $simulationService;

    public function __construct(SimulationService $simulationService)
    {
        $this->simulationService = $simulationService;
    }

    public function index()
    {
        $simulations = $this->simulationService->getSimulations();
        return response()->json($simulations);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'hospital_id' => 'required|integer',
            'scenario_name' => 'required|string',
            'target_doctors' => 'required|integer|min:0',
            'target_nurses' => 'required|integer|min:0',
            'target_beds' => 'required|integer|min:0',
            'available_equipment' => 'required|integer|min:0',
        ]);

        $simulation = $this->simulationService->createSimulation($data);

        // Retourner les résultats complets incluant before/after/improvements
        return response()->json([
            'id' => $simulation->id,
            'scenario_name' => $simulation->scenario_name,
            'before' => $simulation->results_before,
            'after' => $simulation->results_after,
            'improvements' => $simulation->kpis,
        ], 201);
    }
}
