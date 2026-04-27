<?php

namespace App\Http\Controllers;

use App\Services\AlertService;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    protected $alertService;

    public function __construct(AlertService $alertService)
    {
        $this->alertService = $alertService;
    }

    public function index()
    {
        $alerts = $this->alertService->getAllAlerts();
        return response()->json($alerts);
    }

    public function byHospital($hospitalId)
    {
        $alerts = $this->alertService->getAlertsByHospital($hospitalId);
        return response()->json($alerts);
    }

    public function store(Request $request, $hospitalId)
    {
        $data = $request->validate([
            'title' => 'required|string',
            'message' => 'required|string',
            'severity' => 'in:low,medium,high,critical',
            'type' => 'in:saturation,personnel,equipment,general',
        ]);

        $alert = $this->alertService->createAlert($hospitalId, $data);
        return response()->json($alert, 201);
    }

    public function markAsRead($id)
    {
        $alert = $this->alertService->markAsRead($id);
        return response()->json($alert);
    }
}
