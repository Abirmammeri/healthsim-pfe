<?php
// app/Http/Controllers/SpecialPatientController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SpecialPatientController extends Controller
{
    const DMS_MIN_H      =   24;
    const DMS_MAX_H      = 1440;
    const CAS_SPEC_MIN_H = 2160;
    const CAS_SPEC_MAX_H = 4320;

    // ── GET /api/special-patients ─────────────────────────
    public function index(Request $request)
    {
        $me = $request->user();
        $query = DB::table('special_patients')
            ->where('hospital_id', $me->hospital_id)
            ->whereNull('deleted_at');

        if ($request->service_id) $query->where('service_id', $request->service_id);
        if ($request->statut)     $query->where('statut', $request->statut);
        if ($request->type_cas)   $query->where('type_cas', $request->type_cas);

        $patients = $query->orderByDesc('created_at')->get()
            ->map(fn($p) => [
                'id'                => $p->id,
                'code_patient'      => $p->code_patient,
                'type_cas'          => $p->type_cas,
                'description'       => $p->description,
                'dms_heures'        => $p->dms_heures,
                'dms_jours'         => round($p->dms_heures / 24, 1),
                'dms_mois'          => round($p->dms_heures / (24 * 30), 1),
                'date_admission'    => $p->date_admission,
                'date_sortie_prevue'=> $p->date_sortie_prevue,
                'date_sortie_reelle'=> $p->date_sortie_reelle,
                'statut'            => $p->statut,
                'exclu_kpi'         => (bool)$p->exclu_kpi,
                'raison_exclusion'  => $p->raison_exclusion,
                'service_id'        => $p->service_id,
                'hospital_id'       => $p->hospital_id,
                'created_at'        => $p->created_at,
            ]);

        return response()->json([
            'patients' => $patients,
            'stats' => [
                'total'        => $patients->count(),
                'en_cours'     => $patients->where('statut', 'en_cours')->count(),
                'sortis'       => $patients->where('statut', 'sorti')->count(),
                'transferes'   => $patients->where('statut', 'transfere')->count(),
                'types'        => $patients->groupBy('type_cas')->map->count(),
                'dms_moy_mois' => $patients->count() > 0
                    ? round($patients->avg('dms_heures') / (24*30), 1) : 0,
                'note'         => 'Ces patients sont exclus des KPI principaux',
            ]
        ]);
    }

    // ── POST /api/special-patients ────────────────────────
    public function store(Request $request)
    {
        $request->validate([
            'service_id'         => 'required|exists:services,id',
            'type_cas'           => 'required|string|max:100',
            'description'        => 'nullable|string',
            'dms_heures'         => 'required|integer|min:' . self::CAS_SPEC_MIN_H . '|max:' . self::CAS_SPEC_MAX_H,
            'date_admission'     => 'required|date',
            'date_sortie_prevue' => 'nullable|date|after:date_admission',
            'raison_exclusion'   => 'nullable|string',
        ]);

        $me    = $request->user();
        $count = DB::table('special_patients')->where('hospital_id', $me->hospital_id)->count() + 1;
        $code  = 'SP-' . date('Y') . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

        $id = DB::table('special_patients')->insertGetId([
            'service_id'        => $request->service_id,
            'hospital_id'       => $me->hospital_id,
            'code_patient'      => $code,
            'type_cas'          => $request->type_cas,
            'description'       => $request->description,
            'dms_heures'        => $request->dms_heures,
            'date_admission'    => $request->date_admission,
            'date_sortie_prevue'=> $request->date_sortie_prevue,
            'statut'            => 'en_cours',
            'exclu_kpi'         => true,
            'raison_exclusion'  => $request->raison_exclusion
                ?? 'DMS hors plage standard (' . round($request->dms_heures/24, 0) . ' jours)',
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);

        return response()->json([
            'message'      => 'Cas particulier enregistre avec succes.',
            'id'           => $id,
            'code_patient' => $code,
            'note'         => 'Ce patient est exclu des KPI principaux (DMS hors plage standard).',
        ], 201);
    }

    // ── PUT /api/special-patients/{id} ───────────────────
    public function update(Request $request, $id)
    {
        $request->validate([
            'statut'             => 'nullable|in:en_cours,sorti,transfere',
            'date_sortie_reelle' => 'nullable|date',
            'description'        => 'nullable|string',
        ]);

        $me      = $request->user();
        $patient = DB::table('special_patients')
            ->where('id', $id)
            ->where('hospital_id', $me->hospital_id)
            ->whereNull('deleted_at')
            ->first();

        if (!$patient) {
            return response()->json(['message' => 'Patient non trouve.'], 404);
        }

        DB::table('special_patients')->where('id', $id)->update([
            'statut'             => $request->statut ?? $patient->statut,
            'date_sortie_reelle' => $request->date_sortie_reelle ?? $patient->date_sortie_reelle,
            'description'        => $request->description ?? $patient->description,
            'updated_at'         => now(),
        ]);

        return response()->json(['message' => 'Cas particulier mis a jour.']);
    }

    // ── DELETE /api/special-patients/{id} ────────────────
    public function destroy(Request $request, $id)
    {
        $me = $request->user();
        DB::table('special_patients')
            ->where('id', $id)
            ->where('hospital_id', $me->hospital_id)
            ->update(['deleted_at' => now()]);

        return response()->json(['message' => 'Cas particulier supprime.']);
    }

    // ── GET /api/special-patients/types ──────────────────
    public function types()
    {
        return response()->json([
            'types' => [
                // ✅ CORRECTION : 'Pied diabétique' (au lieu de 'Prédiabète')
                ['value' => 'pied_diabetique', 'label' => 'Pied diabétique',       'dms_mois' => '3-6'],
                ['value' => 'chronique',       'label' => 'Maladie chronique',     'dms_mois' => '3-6'],
                ['value' => 'readaptation',    'label' => 'Réadaptation longue',   'dms_mois' => '3-6'],
                ['value' => 'complexe',        'label' => 'Cas complexe',          'dms_mois' => '3-6'],
                ['value' => 'autre',           'label' => 'Autre cas particulier', 'dms_mois' => '3-6'],
            ],
            'plage_dms' => [
                'standard'        => ['min_jours' => 1, 'max_jours' => 60, 'description' => 'Inclus dans KPI'],
                'cas_particulier' => ['min_mois'  => 3, 'max_mois'  => 6,  'description' => 'Exclus des KPI'],
            ]
        ]);
    }
}