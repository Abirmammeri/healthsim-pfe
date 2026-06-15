<?php

namespace App\Http\Controllers;

use App\Models\Hospital;
use App\Models\Service;
use App\Models\KpiSnapshot;
use Illuminate\Http\Request;

class KpiController extends Controller
{
    // ── Historique KPIs d'un hôpital ─────────────────────
    public function hospitalHistory($hospitalId)
    {
        $snapshots = KpiSnapshot::where('hospital_id', $hospitalId)
            ->orderByDesc('periode')
            ->limit(12)
            ->get();

        return response()->json($snapshots);
    }

    // ── Historique KPIs d'un service ─────────────────────
    public function serviceHistory($serviceId)
    {
        $snapshots = KpiSnapshot::where('service_id', $serviceId)
            ->orderByDesc('periode')
            ->limit(12)
            ->get();

        return response()->json($snapshots);
    }

    // ── Calculer et stocker les KPIs maintenant ───────────
    public function computeAndStore(Request $request)
    {
        $data = $request->validate([
            'hospital_id' => 'nullable|integer|exists:hospitals,id',
            'service_id'  => 'nullable|integer|exists:services,id',
        ]);

        $results = [];

        // Si service_id spécifié → calculer pour ce service
        if (!empty($data['service_id'])) {
            $service = Service::with('hospital')->findOrFail($data['service_id']);
            $results[] = $this->storeServiceKpis($service);
        }
        // Si hospital_id → calculer pour tous ses services
        elseif (!empty($data['hospital_id'])) {
            $services = Service::with('hospital')
                ->where('hospital_id', $data['hospital_id'])
                ->get();
            foreach ($services as $service) {
                $results[] = $this->storeServiceKpis($service);
            }
        }
        // Sinon → tous les services
        else {
            $services = Service::with('hospital')->get();
            foreach ($services as $service) {
                $results[] = $this->storeServiceKpis($service);
            }
        }

        return response()->json([
            'message' => count($results) . ' snapshot(s) calculé(s) et stocké(s).',
            'results' => $results,
        ]);
    }

    // ── Méthode privée : stocker KPIs d'un service ────────
    private function storeServiceKpis(Service $service): array
    {
        $kpis = $service->computeKpis();

        $snapshot = KpiSnapshot::updateOrCreate(
            [
                'service_id'   => $service->id,
                'hospital_id'  => $service->hospital_id,
                'periode'      => now()->startOfMonth()->format('Y-m-d'),
                'type_periode' => 'mensuel',
            ],
            [
                // SSI
                'A2_dms_jours'     => $kpis['SSI']['A2_dms'],
                'A4_temps_attente' => $kpis['SSI']['A4_temps_attente'],
                'A8_lits_vacants'  => $kpis['SSI']['A8_lits_vacants'],
                'A9_taux_transfert'=> $kpis['SSI']['A9_taux_transfert'],
                // IIP
                'C2_occupation_lits'=> $kpis['IIP']['C2_occupation'],
                'C3_mortalite'      => $kpis['IIP']['C3_mortalite'],
                'C4_infection'      => $kpis['IIP']['C4_infection'],
                // ESI
                'B1_cout_moyen_soins' => $kpis['ESI']['B1_cout_soins'],
                'B4_cout_par_lit'     => $kpis['ESI']['B4_cout_lit'],
                'B5_cout_med_eq'      => $kpis['ESI']['B5_cout_med_eq'],
                'B7_cout_personnel'   => $kpis['ESI']['B7_cout_personnel'],
                // TI
                'D5_distribution_eq'  => $kpis['TI']['D5_distribution_eq'],
                'D11_gestion_dechets' => $kpis['TI']['D11_gestion_dechets'],
                'D12_localisation'    => $kpis['TI']['D12_localisation'],
                'D13_air_interieur'   => $kpis['TI']['D13_air_interieur'],
                'D14_acoustique'      => $kpis['TI']['D14_acoustique'],
                // DES
                'lambda_rate'     => $kpis['DES']['lambda_rate'],
                'mu_rate'         => $kpis['DES']['mu_rate'],
                'rho_doctors'     => $kpis['DES']['rho_doctors'],
                'rho_beds'        => $kpis['DES']['rho_beds'],
                'active_patients' => $service->patients,
                'nb_doctors'      => $service->doctors,
                'nb_nurses'       => $service->nurses,
                'nb_beds'         => $service->beds,
                'statut_global'   => match($service->computeStatus()) {
                    'critical', 'high' => 'critique',
                    'medium'           => 'attention',
                    default            => 'normal',
                },
            ]
        );

        return [
            'serviceId'   => $service->id,
            'serviceName' => $service->name,
            'snapshot'    => $snapshot->id,
            'kpis'        => $kpis,
        ];
    }
}