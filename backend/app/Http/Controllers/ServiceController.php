<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\Hospital;
use App\Models\KpiSnapshot;
use App\Models\User;
use App\Services\ServiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServiceController extends Controller
{
    protected $serviceService;

    public function __construct(ServiceService $serviceService)
    {
        $this->serviceService = $serviceService;
    }

    public function index($hospitalId)
    {
        $services = Service::where('hospital_id', $hospitalId)
            ->with(['equipment', 'hospital'])
            ->get()
            ->map(fn($s) => $s->toArray());
        return response()->json($services);
    }

    public function show($id)
    {
        $service = Service::with(['equipment', 'hospital'])->findOrFail($id);
        $data = $service->toArray();
        if ($service->replacement_user_id) {
            $repl = User::find($service->replacement_user_id);
            $data['replacement_name'] = $repl ? "Dr. {$repl->prenom} {$repl->nom}" : null;
        }
        return response()->json($data);
    }

    public function kpis($id)
    {
        $service = Service::with('hospital')->findOrFail($id);
        $kpis    = $service->computeKpis();
        $status  = $service->computeStatus();
        return response()->json([
            'serviceId'   => $service->id,
            'serviceName' => $service->name,
            'status'      => $status,
            'kpis'        => $kpis,
            'meta' => [
                'periode'    => now()->format('Y-m-d H:i:s'),
                'patients'   => $service->patients,
                'doctors'    => $service->doctors,
                'nurses'     => $service->nurses,
                'beds'       => $service->beds,
                'dmsHeures'  => $service->dms_heures,
            ],
        ]);
    }

    public function getParams($id)
    {
        $service = Service::findOrFail($id);
        return response()->json([
            'dms_min_jours'        => $service->dms_min_jours        ?? 1,
            'dms_max_jours'        => $service->dms_max_jours        ?? 60,
            'consultation_min_min' => $service->consultation_min_min ?? 10,
            'consultation_max_min' => $service->consultation_max_min ?? 30,
            'lambda_patients_jour' => $service->lambda_patients_jour ?? 50,
        ]);
    }

    public function updateParams(Request $request, $id)
    {
        $request->validate([
            'dms_min_jours'        => 'required|numeric|min:1',
            'dms_max_jours'        => 'required|numeric|min:1',
            'consultation_min_min' => 'required|numeric|min:1|max:60',
            'consultation_max_min' => 'required|numeric|min:1|max:60',
            'lambda_patients_jour' => 'nullable|integer|min:1|max:10000',
        ]);

        $service = Service::findOrFail($id);

        if ($request->dms_min_jours >= $request->dms_max_jours) {
            return response()->json(['message' => 'La DMS minimale doit être inférieure à la DMS maximale.'], 422);
        }
        if ($request->consultation_min_min >= $request->consultation_max_min) {
            return response()->json(['message' => 'La durée de consultation minimale doit être inférieure à la maximale.'], 422);
        }

        $dms_moy_heures = (($request->dms_min_jours + $request->dms_max_jours) / 2) * 24;

        DB::table('services')->where('id', $id)->update([
            'dms_min_jours'        => $request->dms_min_jours,
            'dms_max_jours'        => $request->dms_max_jours,
            'dms_heures'           => $dms_moy_heures,
            'consultation_min_min' => $request->consultation_min_min,
            'consultation_max_min' => $request->consultation_max_min,
            'lambda_patients_jour' => $request->input('lambda_patients_jour', 50),
        ]);

        return response()->json([
            'message' => 'Paramètres du service mis à jour avec succès.',
            'params'  => [
                'dms_min_jours'        => (float) $request->dms_min_jours,
                'dms_max_jours'        => (float) $request->dms_max_jours,
                'dms_heures'           => $dms_moy_heures,
                'dms_moy_jours'        => $dms_moy_heures / 24,
                'consultation_min_min' => (float) $request->consultation_min_min,
                'consultation_max_min' => (float) $request->consultation_max_min,
                'lambda_patients_jour' => (int) $request->input('lambda_patients_jour', 50),
            ]
        ]);
    }

    public function freeServices(Request $request)
    {
        $hospitalId = $request->query('hospital_id');
        $occupiedServiceIds = \App\Models\User::whereNotNull('service_id')
            ->whereIn('status', ['active', 'pending'])
            ->pluck('service_id')
            ->toArray();
        $query = Service::whereNotIn('id', $occupiedServiceIds);
        if ($hospitalId) $query->where('hospital_id', $hospitalId);
        return response()->json($query->select('id', 'name', 'hospital_id')->get());
    }

    public function setReplacement(Request $request, $id)
    {
        $request->validate([
            'replacement_user_id' => 'required|exists:users,id',
            'replacement_until'   => 'required|date|after:today',
            'replacement_reason'  => 'nullable|string|max:255',
        ]);
        $me      = $request->user();
        $service = Service::findOrFail($id);
        if ($me->role !== 'directeur' && $me->service_id !== (int)$id) {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }
        $replacement = User::findOrFail($request->replacement_user_id);
        if ($replacement->hospital_id !== $service->hospital_id) {
            return response()->json(['message' => 'Le remplacant doit etre du meme hopital.'], 422);
        }
        $service->update([
            'replacement_user_id' => $request->replacement_user_id,
            'replacement_until'   => $request->replacement_until,
            'replacement_reason'  => $request->replacement_reason,
        ]);
        return response()->json(['message' => 'Remplacant assigne avec succes.']);
    }

    public function removeReplacement(Request $request, $id)
    {
        $me      = $request->user();
        $service = Service::findOrFail($id);
        if ($me->role !== 'directeur' && $me->service_id !== (int)$id) {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }
        $service->update(['replacement_user_id' => null, 'replacement_until' => null, 'replacement_reason' => null]);
        return response()->json(['message' => 'Remplacement supprime.']);
    }

    public function store(Request $request, $hospitalId)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:200',
            'head'             => 'nullable|string|max:200',
            'type'             => 'nullable|string',
            'doctors'          => 'integer|min:0',
            'nurses'           => 'integer|min:0',
            'beds'             => 'integer|min:0',
            'dms_heures'       => 'nullable|numeric|min:1',
            'salaire_medecin'  => 'nullable|integer|min:0',
            'salaire_infirmier'=> 'nullable|integer|min:0',
        ]);
        $service = Service::create([
            'hospital_id'          => $hospitalId,
            'name'                 => $data['name'],
            'head'                 => $data['head'] ?? null,
            'type'                 => $data['type'] ?? 'autre',
            'doctors'              => $data['doctors'] ?? 0,
            'nurses'               => $data['nurses'] ?? 0,
            'beds'                 => $data['beds'] ?? 0,
            'available_beds'       => $data['beds'] ?? 0,
            'patients'             => 0,
            'dms_heures'           => $data['dms_heures'] ?? 96,
            'salaire_medecin'      => $data['salaire_medecin'] ?? 180000,
            'salaire_infirmier'    => $data['salaire_infirmier'] ?? 80000,
            'dms_min_jours'        => 1,
            'dms_max_jours'        => 60,
            'consultation_min_min' => 10,
            'consultation_max_min' => 30,
            'lambda_patients_jour' => 50,
        ]);
        return response()->json($service->toArray(), 201);
    }

    public function update(Request $request, $id)
    {
        $service = Service::findOrFail($id);
        $data = $request->validate([
            'name'                  => 'nullable|string',
            'head'                  => 'nullable|string',
            'doctors'               => 'nullable|integer|min:0',
            'nurses'                => 'nullable|integer|min:0',
            'beds'                  => 'nullable|integer|min:0',
            'patients'              => 'nullable|integer|min:0',
            'dms_heures'            => 'nullable|numeric',
            'salaire_medecin'       => 'nullable|integer',
            'salaire_infirmier'     => 'nullable|integer',
            'cout_medicament_unit'  => 'nullable|integer',
            'score_distribution_eq' => 'nullable|integer',
            'score_gestion_dechets' => 'nullable|integer',
            'mortalite_base'        => 'nullable|numeric',
        ]);
        $service->update($data);
        if (isset($data['beds']) || isset($data['patients'])) {
            $service->available_beds = max(0, $service->beds - $service->patients);
            $service->save();
        }
        return response()->json($service->toArray());
    }

    public function destroy($id)
    {
        Service::findOrFail($id)->delete();
        return response()->json(['message' => 'Service supprimé']);
    }

    // ── GET /api/services/{serviceId}/equipments ──────────────────────────────
    public function getEquipments($serviceId)
    {
        $equipments = \App\Models\ServiceEquipment::where('service_id', $serviceId)
            ->get()
            ->map(fn($e) => [
                'id'      => $e->id,
                // ✅ Gère les deux cas : colonne 'name' ou colonne 'nom' dans la BDD
                'name'    => $e->name ?? $e->nom ?? 'Équipement',
                'nom'     => $e->name ?? $e->nom ?? 'Équipement',
                'type'    => $e->type ?? 'medical',
                // ✅ Gère quantite (français) et quantity (anglais)
                'quantite'  => $e->quantite  ?? $e->quantity  ?? 0,
                'quantity'  => $e->quantite  ?? $e->quantity  ?? 0,
                // ✅ Gère statut (français) et status (anglais)
                'statut'  => $e->statut ?? $e->status ?? 'operationnel',
                'status'  => $e->statut ?? $e->status ?? 'operationnel',
                // Autres champs
                'patients_par_jour'     => $e->patients_par_jour     ?? 0,
                'duree_utilisation_min' => $e->duree_utilisation_min ?? 0,
                'duree_utilisation_max' => $e->duree_utilisation_max ?? 0,
            ]);

        return response()->json($equipments);
    }

    public function updateEquipment(Request $request, $id)
    {
        $eq = \App\Models\ServiceEquipment::findOrFail($id);
        $eq->update($request->only([
            'quantite', 'patients_par_jour',
            'duree_utilisation_min', 'duree_utilisation_max', 'statut',
        ]));
        return response()->json($eq);
    }

    // ── POST /api/services/{id}/transfer-equipment ────────────────────────────
    public function transferEquipment(Request $request, $id)
    {
        $request->validate([
            'targetServiceId'        => 'required|integer|exists:services,id',
            'equipmentId'            => 'required|integer',
            'quantity'               => 'required|integer|min:1',
            'equipmentName'          => 'nullable|string|max:255',
            'equipmentType'          => 'nullable|string|max:100',
            'isNewInTarget'          => 'nullable|boolean',
            'defaultUtilizationRate' => 'nullable|numeric|min:0|max:100',
        ]);

        $quantity    = $request->quantity;
        $sourceEquip = \App\Models\ServiceEquipment::where('id', $request->equipmentId)
            ->where('service_id', $id)->first();

        if (!$sourceEquip) {
            return response()->json(['message' => 'Équipement non trouvé dans le service source.'], 404);
        }

        $currentQty = $sourceEquip->quantite ?? $sourceEquip->quantity ?? 0;
        if ($currentQty < $quantity) {
            return response()->json(['message' => "Stock insuffisant. Disponible : {$currentQty}.", 'available' => $currentQty], 422);
        }

        $newQty = $currentQty - $quantity;
        if ($newQty === 0) {
            $sourceEquip->delete();
        } else {
            if (property_exists($sourceEquip, 'quantite') || isset($sourceEquip->quantite)) {
                $sourceEquip->quantite = $newQty;
            } else {
                $sourceEquip->quantity = $newQty;
            }
            $sourceEquip->save();
        }

        $equipName       = $request->equipmentName ?? $sourceEquip->name ?? $sourceEquip->nom ?? 'Équipement transféré';
        $targetServiceId = $request->targetServiceId;

        $targetEquip = \App\Models\ServiceEquipment::where('service_id', $targetServiceId)
            ->whereRaw('LOWER(TRIM(COALESCE(name, nom, ""))) = LOWER(TRIM(?))', [$equipName])
            ->first();

        $isNew = false;
        if ($targetEquip) {
            if (isset($targetEquip->quantite)) $targetEquip->quantite += $quantity;
            else $targetEquip->quantity = ($targetEquip->quantity ?? 0) + $quantity;
            $targetEquip->save();
        } else {
            $targetEquip = \App\Models\ServiceEquipment::create([
                'service_id'            => $targetServiceId,
                'name'                  => $equipName,
                'nom'                   => $equipName,
                'type'                  => $request->equipmentType ?? $sourceEquip->type ?? 'medical',
                'quantite'              => $quantity,
                'statut'                => 'operationnel',
                'patients_par_jour'     => 0,
                'duree_utilisation_min' => 0,
                'duree_utilisation_max' => 0,
            ]);
            $isNew = true;
        }

        $targetService = Service::find($targetServiceId);
        return response()->json([
            'message'          => $isNew
                ? "Équipement '{$equipName}' créé dans {$targetService?->name} (taux util. 0%)."
                : "Équipement '{$equipName}' transféré vers {$targetService?->name}.",
            'is_new_in_target' => $isNew,
            'source_remaining' => $newQty,
            'target_quantity'  => $quantity,
        ]);
    }

    public function transferStaff(Request $request, $id)
    {
        $data = $request->validate([
            'targetServiceId' => 'required|integer|exists:services,id',
            'staffType'       => 'required|in:doctor,nurse',
            'count'           => 'required|integer|min:1',
        ]);
        $from  = Service::findOrFail($id);
        $to    = Service::findOrFail($data['targetServiceId']);
        $field = $data['staffType'] === 'nurse' ? 'nurses' : 'doctors';
        $count = $data['count'];
        if ($from->$field < $count) {
            return response()->json(['message' => "Effectif insuffisant. Disponible : {$from->$field}"], 422);
        }
        $from->decrement($field, $count);
        $to->increment($field, $count);
        return response()->json(['message' => "Transfert effectué : {$count} {$field}", 'from' => $from->toArray(), 'to' => $to->toArray()]);
    }

    public function updateKpiTerrain(Request $request, $id)
    {
        $service = Service::findOrFail($id);
        $data = $request->validate([
            'nb_patients_mois'      => 'nullable|integer|min:0',
            'nb_deces_mois'         => 'nullable|integer|min:0',
            'nb_infections_mois'    => 'nullable|integer|min:0',
            'nb_transferts_mois'    => 'nullable|integer|min:0',
            'nb_readmissions_mois'  => 'nullable|integer|min:0',
            'mortalite_base'        => 'nullable|numeric',
            'dms_heures'            => 'nullable|numeric',
            'score_distribution_eq' => 'nullable|integer',
            'score_gestion_dechets' => 'nullable|integer',
            'salaire_medecin'       => 'nullable|integer',
            'salaire_infirmier'     => 'nullable|integer',
            'patients_prediabete'   => 'nullable|integer|min:0',
        ]);
        $service->update($data);
        $kpis = $service->fresh()->computeKpis();
        KpiSnapshot::updateOrCreate(
            ['service_id' => $service->id, 'hospital_id' => $service->hospital_id, 'periode' => now()->startOfMonth()->format('Y-m-d'), 'type_periode' => 'mensuel'],
            [
                'A2_dms_jours'       => $kpis['SSI']['A2_dms'],
                'A4_temps_attente'   => $kpis['SSI']['A4_temps_attente'],
                'A8_lits_vacants'    => $kpis['SSI']['A8_lits_vacants'],
                'A9_taux_transfert'  => $kpis['SSI']['A9_taux_transfert'],
                'C2_occupation_lits' => $kpis['IIP']['C2_occupation'],
                'C3_mortalite'       => $kpis['IIP']['C3_mortalite'],
                'C4_infection'       => $kpis['IIP']['C4_infection'],
                'B1_cout_moyen_soins'=> $kpis['ESI']['B1_cout_soins'],
                'B4_cout_par_lit'    => $kpis['ESI']['B4_cout_lit'],
                'B5_cout_med_eq'     => $kpis['ESI']['B5_cout_med_eq'],
                'B7_cout_personnel'  => $kpis['ESI']['B7_cout_personnel'],
                'D5_distribution_eq' => $kpis['TI']['D5_distribution_eq'],
                'D11_gestion_dechets'=> $kpis['TI']['D11_gestion_dechets'],
                'D12_localisation'   => $kpis['TI']['D12_localisation'],
                'D13_air_interieur'  => $kpis['TI']['D13_air_interieur'],
                'D14_acoustique'     => $kpis['TI']['D14_acoustique'],
                'lambda_rate'        => $kpis['DES']['lambda_rate'],
                'mu_rate'            => $kpis['DES']['mu_rate'],
                'rho_doctors'        => $kpis['DES']['rho_doctors'],
                'rho_beds'           => $kpis['DES']['rho_beds'],
                'active_patients'    => $service->patients,
                'nb_doctors'         => $service->doctors,
                'nb_nurses'          => $service->nurses,
                'nb_beds'            => $service->beds,
                'statut_global'      => $service->computeStatus() === 'critical' ? 'critique' : ($service->computeStatus() === 'normal' ? 'normal' : 'attention'),
            ]
        );
        return response()->json(['message' => 'Données terrain mises à jour et KPIs recalculés.', 'service' => $service->toArray(), 'kpis' => $kpis]);
    }
}