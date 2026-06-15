<?php

namespace App\Http\Controllers;

use App\Models\Hospital;
use App\Models\Service;
use App\Models\Alert;
use Illuminate\Http\Request;

class HospitalController extends Controller
{
    // ── Liste tous les hôpitaux ───────────────────────────
    public function index()
    {
        $hospitals = Hospital::with(['services.equipment'])->get()
            ->map(fn($h) => $h->toArray());
        return response()->json($hospitals);
    }

    // ── Détail d'un hôpital ───────────────────────────────
    public function show($id)
    {
        $hospital = Hospital::with(['services.equipment'])->findOrFail($id);
        return response()->json($hospital->toArray());
    }

    // ── Dashboard hôpital avec KPIs ───────────────────────
    public function dashboard($id)
    {
        $hospital = Hospital::with(['services.equipment', 'alerts'])->findOrFail($id);
        $services = $hospital->services;

        $totalDoctors  = $services->sum('doctors');
        $totalNurses   = $services->sum('nurses');
        $totalBeds     = $services->sum('beds');
        $totalPatients = $services->sum('patients');
        $availBeds     = $services->sum('available_beds');
        $occupiedBeds  = $totalBeds - $availBeds;

        $allEquipment  = $services->flatMap(fn($s) => $s->equipment);
        $eqOp    = $allEquipment->where('status', 'operational')->sum('quantity');
        $eqMaint = $allEquipment->where('status', 'maintenance')->sum('quantity');
        $eqHS    = $allEquipment->whereIn('status', ['hors_service', 'broken'])->sum('quantity');

        $alerts       = $hospital->alerts->where('is_read', false);
        $activeAlerts = $alerts->count();

        $kpisParService = $services->map(fn($s) => [
            'service' => ['id' => $s->id, 'name' => $s->name, 'status' => $s->computeStatus()],
            'kpis'    => $s->computeKpis(),
        ]);

        $kpisGlobaux = [
            'SSI' => [
                'A2_dms'            => round($kpisParService->avg(fn($k) => $k['kpis']['SSI']['A2_dms']), 1),
                'A4_temps_attente'  => round($kpisParService->avg(fn($k) => $k['kpis']['SSI']['A4_temps_attente']), 1),
                'A8_lits_vacants'   => $totalBeds > 0 ? round(($availBeds / $totalBeds) * 100, 1) : 0,
                'A9_taux_transfert' => round($kpisParService->avg(fn($k) => $k['kpis']['SSI']['A9_taux_transfert']), 1),
            ],
            'IIP' => [
                'C2_occupation' => $totalBeds > 0 ? round(($totalPatients / $totalBeds) * 100, 1) : 0,
                'C3_mortalite'  => round($kpisParService->avg(fn($k) => $k['kpis']['IIP']['C3_mortalite']), 2),
                'C4_infection'  => round($kpisParService->avg(fn($k) => $k['kpis']['IIP']['C4_infection']), 2),
            ],
            'ESI' => [
                'B1_cout_soins'     => round($kpisParService->avg(fn($k) => $k['kpis']['ESI']['B1_cout_soins'])),
                'B4_cout_lit'       => round($kpisParService->avg(fn($k) => $k['kpis']['ESI']['B4_cout_lit'])),
                'B5_cout_med_eq'    => round($kpisParService->sum(fn($k) => $k['kpis']['ESI']['B5_cout_med_eq'])),
                'B7_cout_personnel' => round($kpisParService->sum(fn($k) => $k['kpis']['ESI']['B7_cout_personnel'])),
            ],
            'TI' => [
                'D5_distribution_eq'  => round($kpisParService->avg(fn($k) => $k['kpis']['TI']['D5_distribution_eq']), 1),
                'D11_gestion_dechets' => round($kpisParService->avg(fn($k) => $k['kpis']['TI']['D11_gestion_dechets']), 1),
                'D12_localisation'    => $hospital->score_localisation,
                'D13_air_interieur'   => $hospital->score_air_interieur,
                'D14_acoustique'      => $hospital->score_acoustique,
            ],
        ];

        return response()->json([
            'hospitalId'      => $hospital->id,
            'hospitalName'    => $hospital->name,
            'typeHopital'     => $hospital->type_hopital,
            'wilaya'          => $hospital->wilaya,
            'doctors'         => $totalDoctors,
            'nurses'          => $totalNurses,
            'totalBeds'       => $totalBeds,
            'availableBeds'   => $availBeds,
            'occupiedBeds'    => $occupiedBeds,
            'patients'        => $totalPatients,
            'loadPercentage'  => $totalBeds > 0 ? round($totalPatients / $totalBeds * 100) : 0,
            'serviceCount'    => $services->count(),
            'activeAlerts'    => $activeAlerts,
            'equipmentStatus' => ['operational' => $eqOp, 'maintenance' => $eqMaint, 'offline' => $eqHS],
            'kpis'            => $kpisGlobaux,
            'servicesKpis'    => $kpisParService->values(),
        ]);
    }

    // ── KPIs globaux d'un hôpital ─────────────────────────
    public function kpis($id)
    {
        $hospital = Hospital::with(['services.equipment'])->findOrFail($id);
        $services = $hospital->services;

        $kpisParService = $services->map(fn($s) => [
            'serviceId'   => $s->id,
            'serviceName' => $s->name,
            'status'      => $s->computeStatus(),
            'kpis'        => $s->computeKpis(),
        ]);

        return response()->json([
            'hospitalId'   => $hospital->id,
            'hospitalName' => $hospital->name,
            'servicesKpis' => $kpisParService->values(),
        ]);
    }

    // ── Résumé global ─────────────────────────────────────
    public function summary()
    {
        $hospitals = Hospital::with('services')->get();

        $totalHospitals   = $hospitals->count();
        $totalPatients    = $hospitals->sum('active_patients');
        $totalBeds        = $hospitals->sum('total_beds');
        $availableBeds    = $hospitals->sum('available_beds');
        $totalDoctors     = $hospitals->sum('total_doctors');
        $totalNurses      = $hospitals->sum('total_nurses');
        $totalAlerts      = Alert::where('is_read', false)->count();
        $criticalServices = Service::where('status', 'critical')->count();

        $occupation  = $totalBeds > 0 ? round($totalPatients / $totalBeds * 100) : 0;
        $overallLoad = match(true) {
            $occupation >= 90 => 'critical',
            $occupation >= 85 => 'high',
            $occupation >= 70 => 'medium',
            default           => 'normal',
        };

        return response()->json([
            'totalHospitals'    => $totalHospitals,
            'totalPatients'     => $totalPatients,
            'totalBeds'         => $totalBeds,
            'availableBeds'     => max(0, $availableBeds ?: ($totalBeds - $totalPatients)),
            'totalDoctors'      => $totalDoctors,
            'totalNurses'       => $totalNurses,
            'activeAlerts'      => $totalAlerts,
            'criticalServices'  => $criticalServices,
            'overallLoadStatus' => $overallLoad,
        ]);
    }

    // ── Toutes les alertes ────────────────────────────────
    public function allAlerts()
    {
        $alerts = Alert::with('hospital')
            ->where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($a) => [
                'id'          => $a->id,
                'title'       => $a->title,
                'description' => $a->message,
                'severity'    => $a->severity,
                'type'        => $a->type,
                'is_read'     => $a->is_read,
                'hospitalName'=> $a->hospital?->name ?? 'CHU Ibn Badis',
                'serviceName' => '',
                'createdAt'   => $a->created_at,
            ]);

        return response()->json($alerts);
    }

    // ── Alertes d'un hôpital ──────────────────────────────
    public function alerts($id)
    {
        $alerts = Alert::where('hospital_id', $id)
            ->where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($a) => [
                'id'          => $a->id,
                'title'       => $a->title,
                'description' => $a->message,
                'severity'    => $a->severity,
                'type'        => $a->type,
                'is_read'     => $a->is_read,
                'hospitalName'=> '',
                'serviceName' => '',
                'createdAt'   => $a->created_at,
            ]);

        return response()->json($alerts);
    }

    // ── Appliquer un scénario ─────────────────────────────
    public function applyScenario(Request $request, $id)
    {
        $data = $request->validate([
            'doctors'       => 'required|integer|min:0',
            'nurses'        => 'required|integer|min:0',
            'beds'          => 'required|integer|min:1',
            'scenario_name' => 'nullable|string|max:255',
        ]);

        $hospital = Hospital::findOrFail($id);
        $hospital->update([
            'total_doctors' => $data['doctors'],
            'total_nurses'  => $data['nurses'],
            'total_beds'    => $data['beds'],
        ]);

        return response()->json(['message' => 'Scenario applique.', 'hospital' => $hospital->toArray()]);
    }

    // ── Créer un hôpital ──────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'               => 'required|string|max:200',
            'type_hopital'       => 'nullable|string',
            'wilaya'             => 'nullable|string',
            'commune'            => 'nullable|string',
            'address'            => 'required|string',
            'latitude'           => 'required|numeric',
            'longitude'          => 'required|numeric',
            'budget_annuel'      => 'nullable|integer',
            'score_localisation' => 'nullable|integer',
            'score_air_interieur'=> 'nullable|integer',
            'score_acoustique'   => 'nullable|integer',
        ]);

        $hospital = Hospital::create($data);
        return response()->json($hospital->toArray(), 201);
    }

    // ── Mettre à jour un hôpital ──────────────────────────
    public function update(Request $request, $id)
    {
        $hospital = Hospital::findOrFail($id);
        $data = $request->validate([
            'name'               => 'nullable|string',
            'wilaya'             => 'nullable|string',
            'budget_annuel'      => 'nullable|integer',
            'score_localisation' => 'nullable|integer|min:0|max:100',
            'score_air_interieur'=> 'nullable|integer|min:0|max:100',
            'score_acoustique'   => 'nullable|integer|min:0|max:100',
        ]);

        $hospital->update($data);
        return response()->json($hospital->toArray());
    }
}