<?php

namespace App\Http\Controllers;

use App\Models\Simulation;
use App\Models\SimulationServiceSnapshot;
use App\Models\Service;
use App\Models\Hospital;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SimulationController extends Controller
{
    // ── Liste toutes les simulations ─────────────────────
    public function index()
    {
        $simulations = Simulation::with('hospital')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($s) => $s->toArray());

        return response()->json($simulations);
    }

    // ── Simulations d'un hôpital ──────────────────────────
    public function byHospital(Request $request, $hospitalId)
    {
        $query = Simulation::where('hospital_id', $hospitalId)
            ->orderByDesc('created_at');

        // Filtrer par statut
        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        $simulations = $query->get()->map(fn($s) => [
            'id'           => $s->id,
            'scenarioName' => $s->scenario_name,
            'statut'       => $s->statut,
            'createdAt'    => $s->created_at->format('d/m/Y H:i'),
            'appliedAt'    => $s->applied_at?->format('d/m/Y H:i'),
            'createdBy'    => $s->created_by,
            'description'  => $s->description,
            // Résumé KPIs
            'summary' => [
                'waiting_time'    => $s->after_waiting_time,
                'bed_occupancy'   => $s->after_bed_occupancy,
                'rho_doctors'     => $s->after_rho_doctors,
            ],
        ]);

        return response()->json($simulations);
    }

    // ── 5 simulations récentes ────────────────────────────
    public function recent($hospitalId)
    {
        $simulations = Simulation::where('hospital_id', $hospitalId)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn($s) => [
                'id'           => $s->id,
                'scenarioName' => $s->scenario_name,
                'statut'       => $s->statut,
                'createdAt'    => $s->created_at->format('d/m/Y H:i'),
                'description'  => $s->description,
            ]);

        return response()->json($simulations);
    }

    // ── Simulations par date ──────────────────────────────
    public function byDate(Request $request, $hospitalId)
    {
        $date = $request->get('date');
        // Format attendu : 2026-04-30

        $query = Simulation::where('hospital_id', $hospitalId)
            ->orderByDesc('created_at');

        if ($date) {
            $query->whereDate('created_at', $date);
        }

        $simulations = $query->get()->map(fn($s) => $s->toArray());
        return response()->json($simulations);
    }

    // ── Récupérer une simulation ──────────────────────────
    public function show($id)
    {
        $simulation = Simulation::with(['hospital', 'serviceSnapshots.service'])
            ->findOrFail($id);

        return response()->json($simulation->toArray());
    }

    // ── Créer/Sauvegarder une simulation ─────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'hospital_id'         => 'required|integer|exists:hospitals,id',
            'scenario_name'       => 'required|string|max:255',
            'description'         => 'nullable|string',
            'created_by'          => 'nullable|string',
            // Paramètres d'entrée
            'target_doctors'      => 'required|integer|min:0',
            'target_nurses'       => 'required|integer|min:0',
            'target_beds'         => 'required|integer|min:0',
            'available_equipment' => 'required|integer|min:0',
            'active_patients'     => 'required|integer|min:0',
            'current_doctors'     => 'nullable|integer|min:0',
            'current_nurses'      => 'nullable|integer|min:0',
            'current_beds'        => 'nullable|integer|min:0',
            'current_equipment'   => 'nullable|integer|min:0',
            // Résultats
            'results_before'      => 'nullable|array',
            'results_after'       => 'nullable|array',
            'kpis'                => 'nullable|array',
            'projections'         => 'nullable|array',
            'recommendations'     => 'nullable|array',
            'scenario_changes'    => 'nullable|array',
            // KPIs enrichis
            'enriched_kpis'       => 'nullable|array',
            // Services snapshot
            'services_kpis'       => 'nullable|array',
        ]);

        $before = $data['results_before'] ?? [];
        $after  = $data['results_after'] ?? [];
        $enrich = $data['enriched_kpis'] ?? [];

        $simulation = Simulation::create([
            'hospital_id'          => $data['hospital_id'],
            'scenario_name'        => $data['scenario_name'],
            'description'          => $data['description'] ?? null,
            'created_by'           => $data['created_by'] ?? null,

            // Paramètres d'entrée
            'input_active_patients'=> $data['active_patients'],
            'input_target_doctors' => $data['target_doctors'],
            'input_target_nurses'  => $data['target_nurses'],
            'input_target_beds'    => $data['target_beds'],
            'input_available_eq'   => $data['available_equipment'],
            'input_current_doctors'=> $data['current_doctors'] ?? 0,
            'input_current_nurses' => $data['current_nurses'] ?? 0,
            'input_current_beds'   => $data['current_beds'] ?? 0,
            'input_current_eq'     => $data['current_equipment'] ?? 0,

            // Anciens champs (compatibilité)
            'target_doctors'       => $data['target_doctors'],
            'target_nurses'        => $data['target_nurses'],
            'available_equipment'  => $data['available_equipment'],
            'results_before'       => $before,
            'results_after'        => $after,
            'kpis'                 => $data['kpis'] ?? null,

            // KPIs AVANT
            'before_waiting_time'  => $before['waiting_time_minutes'] ?? null,
            'before_bed_occupancy' => $before['bed_occupancy_rate'] ?? null,
            'before_resource_util' => $before['resource_utilization'] ?? null,
            'before_throughput'    => $before['throughput_patients'] ?? null,
            'before_coverage'      => $before['service_coverage'] ?? null,
            'before_rho_doctors'   => $before['rho_doctors'] ?? null,
            'before_rho_beds'      => $before['rho_beds'] ?? null,

            // KPIs APRÈS
            'after_waiting_time'   => $after['waiting_time_minutes'] ?? null,
            'after_bed_occupancy'  => $after['bed_occupancy_rate'] ?? null,
            'after_resource_util'  => $after['resource_utilization'] ?? null,
            'after_throughput'     => $after['throughput_patients'] ?? null,
            'after_coverage'       => $after['service_coverage'] ?? null,
            'after_rho_doctors'    => $after['rho_doctors'] ?? null,
            'after_rho_beds'       => $after['rho_beds'] ?? null,

            // KPIs enrichis SSI
            'after_A2_dms'         => $enrich['SSI']['A2_dms'] ?? null,
            'after_A4_temps_attente'=> $enrich['SSI']['A4_temps_attente'] ?? null,
            'after_A8_lits_vacants' => $enrich['SSI']['A8_lits_vacants'] ?? null,
            'after_A9_transfert'    => $enrich['SSI']['A9_taux_transfert'] ?? null,

            // KPIs enrichis IIP
            'after_C2_occupation'  => $enrich['IIP']['C2_occupation'] ?? null,
            'after_C3_mortalite'   => $enrich['IIP']['C3_mortalite'] ?? null,
            'after_C4_infection'   => $enrich['IIP']['C4_infection'] ?? null,

            // KPIs enrichis ESI
            'after_B1_cout_soins'  => $enrich['ESI']['B1_cout_soins'] ?? null,
            'after_B4_cout_lit'    => $enrich['ESI']['B4_cout_lit'] ?? null,
            'after_B5_cout_med_eq' => $enrich['ESI']['B5_cout_med_eq'] ?? null,
            'after_B7_cout_personnel'=> $enrich['ESI']['B7_cout_personnel'] ?? null,

            // KPIs enrichis TI
            'after_D5_distribution'=> $enrich['TI']['D5_distribution_eq'] ?? null,
            'after_D11_dechets'    => $enrich['TI']['D11_gestion_dechets'] ?? null,
            'after_D12_localisation'=> $enrich['TI']['D12_localisation'] ?? null,
            'after_D13_air'        => $enrich['TI']['D13_air_interieur'] ?? null,
            'after_D14_acoustique' => $enrich['TI']['D14_acoustique'] ?? null,

            // JSON
            'projections'          => $data['projections'] ?? null,
            'recommendations'      => $data['recommendations'] ?? null,
            'scenario_changes'     => $data['scenario_changes'] ?? null,

            'statut'               => 'brouillon',
        ]);

        // Sauvegarder les KPIs par service
        if (!empty($data['services_kpis'])) {
            foreach ($data['services_kpis'] as $svcKpi) {
                SimulationServiceSnapshot::create([
                    'simulation_id'     => $simulation->id,
                    'service_id'        => $svcKpi['service_id'],
                    'service_doctors'   => $svcKpi['doctors'] ?? null,
                    'service_nurses'    => $svcKpi['nurses'] ?? null,
                    'service_beds'      => $svcKpi['beds'] ?? null,
                    'service_patients'  => $svcKpi['patients'] ?? null,
                    'service_equipment' => $svcKpi['equipment'] ?? null,
                    'service_dms_heures'=> $svcKpi['dms_heures'] ?? null,
                    // KPIs
                    'A2_dms'            => $svcKpi['kpis']['SSI']['A2_dms'] ?? null,
                    'A4_temps_attente'  => $svcKpi['kpis']['SSI']['A4_temps_attente'] ?? null,
                    'A8_lits_vacants'   => $svcKpi['kpis']['SSI']['A8_lits_vacants'] ?? null,
                    'A9_taux_transfert' => $svcKpi['kpis']['SSI']['A9_taux_transfert'] ?? null,
                    'C2_occupation'     => $svcKpi['kpis']['IIP']['C2_occupation'] ?? null,
                    'C3_mortalite'      => $svcKpi['kpis']['IIP']['C3_mortalite'] ?? null,
                    'C4_infection'      => $svcKpi['kpis']['IIP']['C4_infection'] ?? null,
                    'B1_cout_soins'     => $svcKpi['kpis']['ESI']['B1_cout_soins'] ?? null,
                    'B4_cout_lit'       => $svcKpi['kpis']['ESI']['B4_cout_lit'] ?? null,
                    'B5_cout_med_eq'    => $svcKpi['kpis']['ESI']['B5_cout_med_eq'] ?? null,
                    'B7_cout_personnel' => $svcKpi['kpis']['ESI']['B7_cout_personnel'] ?? null,
                    'D5_distribution_eq'=> $svcKpi['kpis']['TI']['D5_distribution_eq'] ?? null,
                    'D11_dechets'       => $svcKpi['kpis']['TI']['D11_gestion_dechets'] ?? null,
                    'D12_localisation'  => $svcKpi['kpis']['TI']['D12_localisation'] ?? null,
                    'D13_air'           => $svcKpi['kpis']['TI']['D13_air_interieur'] ?? null,
                    'D14_acoustique'    => $svcKpi['kpis']['TI']['D14_acoustique'] ?? null,
                    'statut_service'    => $svcKpi['statut'] ?? 'normal',
                    'lambda_rate'       => $svcKpi['kpis']['DES']['lambda_rate'] ?? null,
                    'mu_rate'           => $svcKpi['kpis']['DES']['mu_rate'] ?? null,
                    'rho_doctors'       => $svcKpi['kpis']['DES']['rho_doctors'] ?? null,
                    'rho_beds'          => $svcKpi['kpis']['DES']['rho_beds'] ?? null,
                    'erlang_pw'         => $svcKpi['kpis']['DES']['erlang_pw'] ?? null,
                    'wq_hours'          => $svcKpi['kpis']['DES']['wq_hours'] ?? null,
                ]);
            }
        }

        return response()->json([
            'id'              => $simulation->id,
            'scenario_name'   => $simulation->scenario_name,
            'statut'          => $simulation->statut,
            'before'          => $simulation->results_before,
            'after'           => $simulation->results_after,
            'improvements'    => $simulation->kpis,
            'projections'     => $simulation->projections,
            'recommendations' => $simulation->recommendations,
            'createdAt'       => $simulation->created_at->format('d/m/Y H:i'),
        ], 201);
    }

    // ── Appliquer simulation au système réel ──────────────
    public function apply(Request $request, $id)
    {
        $simulation = Simulation::findOrFail($id);

        // Mettre à jour le hospital
        $hospital = Hospital::findOrFail($simulation->hospital_id);
        $hospital->update([
            'total_doctors'   => $simulation->input_target_doctors,
            'total_nurses'    => $simulation->input_target_nurses,
            'total_beds'      => $simulation->input_target_beds,
            'available_beds'  => $simulation->input_target_beds,
        ]);

        // Appliquer les changements de scénario si présents
        if ($simulation->scenario_changes) {
            $changes = $simulation->scenario_changes;

            // Services modifiés
            if (!empty($changes['modifiedServices'])) {
                foreach ($changes['modifiedServices'] as $mod) {
                    Service::where('id', $mod['id'])->update([
                        'doctors' => $mod['doctors'],
                        'nurses'  => $mod['nurses'],
                        'beds'    => $mod['beds'],
                    ]);
                }
            }

            // Services supprimés
            if (!empty($changes['deletedServiceIds'])) {
                Service::whereIn('id', $changes['deletedServiceIds'])->delete();
            }

            // Services ajoutés
            if (!empty($changes['addedServices'])) {
                foreach ($changes['addedServices'] as $svc) {
                    Service::create([
                        'hospital_id' => $simulation->hospital_id,
                        'name'        => $svc['name'],
                        'head'        => $svc['head'],
                        'doctors'     => $svc['doctors'],
                        'nurses'      => $svc['nurses'],
                        'beds'        => $svc['beds'],
                        'patients'    => 0,
                        'available_beds' => $svc['beds'],
                    ]);
                }
            }
        }

        // Marquer la simulation comme appliquée
        $simulation->update([
            'statut'     => 'applique',
            'applied_at' => now(),
        ]);

        return response()->json([
            'message'    => 'Simulation appliquée avec succès au système réel.',
            'simulation' => $simulation->toArray(),
            'hospital'   => $hospital->toArray(),
        ]);
    }

    // ── Archiver une simulation ───────────────────────────
    public function archive($id)
    {
        $simulation = Simulation::findOrFail($id);
        $simulation->update(['statut' => 'archive']);
        return response()->json(['message' => 'Simulation archivée.']);
    }

    // ── KPIs par service d'une simulation ─────────────────
    public function serviceSnapshots($id)
    {
        $snapshots = SimulationServiceSnapshot::with('service')
            ->where('simulation_id', $id)
            ->get()
            ->map(fn($s) => [
                'serviceId'   => $s->service_id,
                'serviceName' => $s->service->name ?? '—',
                'statut'      => $s->statut_service,
                'SSI' => [
                    'A2_dms'           => $s->A2_dms,
                    'A4_temps_attente' => $s->A4_temps_attente,
                    'A8_lits_vacants'  => $s->A8_lits_vacants,
                    'A9_taux_transfert'=> $s->A9_taux_transfert,
                ],
                'IIP' => [
                    'C2_occupation'    => $s->C2_occupation,
                    'C3_mortalite'     => $s->C3_mortalite,
                    'C4_infection'     => $s->C4_infection,
                ],
                'ESI' => [
                    'B1_cout_soins'    => $s->B1_cout_soins,
                    'B4_cout_lit'      => $s->B4_cout_lit,
                    'B5_cout_med_eq'   => $s->B5_cout_med_eq,
                    'B7_cout_personnel'=> $s->B7_cout_personnel,
                ],
                'TI' => [
                    'D5_distribution_eq'  => $s->D5_distribution_eq,
                    'D11_dechets'         => $s->D11_dechets,
                    'D12_localisation'    => $s->D12_localisation,
                    'D13_air'             => $s->D13_air,
                    'D14_acoustique'      => $s->D14_acoustique,
                ],
                'DES' => [
                    'lambda_rate'  => $s->lambda_rate,
                    'mu_rate'      => $s->mu_rate,
                    'rho_doctors'  => $s->rho_doctors,
                    'rho_beds'     => $s->rho_beds,
                ],
            ]);

        return response()->json($snapshots);
    }
}