<?php

namespace App\Http\Controllers;

use App\Services\HospitalService;
use Illuminate\Http\Request;

class HospitalController extends Controller
{
    protected $hospitalService;

    public function __construct(HospitalService $hospitalService)
    {
        $this->hospitalService = $hospitalService;
    }

    public function index()
    {
        $hospitals = $this->hospitalService->getAllHospitals();
        return response()->json($hospitals);
    }

    public function dashboard($id)
    {
        $dashboard = $this->hospitalService->getDashboard($id);
        return response()->json($dashboard);
    }

    public function summary()
    {
        $summary = $this->hospitalService->getSummary();
        return response()->json($summary);
    }
}
