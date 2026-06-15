<?php

namespace App\Http\Controllers;

use App\Models\Admission;
use App\Models\Patient;
use App\Models\Service;
use Illuminate\Http\Request;

class AdmissionController extends Controller
{
    // ── Admissions d'un service ───────────────────────────
    public function byService($serviceId)
    {
        $admissions = Admission::with('patient')
            ->where('service_id', $serviceId)
            ->where('statut', 'en_cours')
            ->orderByDesc('date_admission')
            ->get();

        return response()->json($admissions);
    }

    // ── Créer une admission ───────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id'      => 'required|integer|exists:patients,id',
            'service_id'      => 'required|integer|exists:services,id',
            'hospital_id'     => 'required|integer|exists:hospitals,id',
            'date_admission'  => 'required|date',
            'type_admission'  => 'nullable|string',
            'diagnostic_principal' => 'nullable|string',
            'diagnostic_libelle'   => 'nullable|string',
        ]);

        $data['statut'] = 'en_cours';

        // Vérifier réadmission
        $derniere = Admission::where('patient_id', $data['patient_id'])
            ->where('statut', '!=', 'en_cours')
            ->orderByDesc('date_sortie')
            ->first();

        if ($derniere && $derniere->date_sortie) {
            $jours = now()->diffInDays($derniere->date_sortie);
            if ($jours <= 30) {
                $data['is_readmission']          = true;
                $data['admission_precedente_id'] = $derniere->id;
                $data['delai_readmission_j']     = $jours;
                $data['type_admission']          = 'readmission';
            }
        }

        $admission = Admission::create($data);

        // Mettre à jour le compteur patients du service
        Service::where('id', $data['service_id'])->increment('patients');
        Service::where('id', $data['service_id'])->decrement('available_beds');

        return response()->json($admission, 201);
    }

    // ── Mettre à jour une admission ───────────────────────
    public function update(Request $request, $id)
    {
        $admission = Admission::findOrFail($id);
        $data = $request->validate([
            'date_prise_charge'       => 'nullable|date',
            'date_sortie'             => 'nullable|date',
            'statut'                  => 'nullable|string',
            'is_deces'                => 'nullable|boolean',
            'cause_deces'             => 'nullable|string',
            'infection_nosocomiale'   => 'nullable|boolean',
            'type_infection'          => 'nullable|string',
            'motif_transfert'         => 'nullable|string',
            'transfert_vers_hospital_id' => 'nullable|integer',
        ]);

        $admission->update($data);
        return response()->json($admission);
    }

    // ── Sortie patient ────────────────────────────────────
    public function discharge(Request $request, $id)
    {
        $admission = Admission::findOrFail($id);
        $data = $request->validate([
            'statut'       => 'required|in:sorti_gueri,sorti_ameliore,sorti_contre_avis',
            'date_sortie'  => 'required|date',
        ]);

        $admission->update([
            'statut'      => $data['statut'],
            'date_sortie' => $data['date_sortie'],
        ]);

        // Mettre à jour le compteur patients du service
        Service::where('id', $admission->service_id)->decrement('patients');
        Service::where('id', $admission->service_id)->increment('available_beds');

        return response()->json([
            'message'   => 'Patient sorti avec succès.',
            'admission' => $admission,
        ]);
    }

    // ── Transfert patient ─────────────────────────────────
    public function transfer(Request $request, $id)
    {
        $admission = Admission::findOrFail($id);
        $data = $request->validate([
            'transfert_vers_hospital_id' => 'required|integer|exists:hospitals,id',
            'motif_transfert'            => 'required|string',
        ]);

        $admission->update([
            'statut'                     => 'transfere',
            'date_sortie'                => now(),
            'transfert_vers_hospital_id' => $data['transfert_vers_hospital_id'],
            'motif_transfert'            => $data['motif_transfert'],
        ]);

        // Mettre à jour compteurs
        Service::where('id', $admission->service_id)->decrement('patients');
        Service::where('id', $admission->service_id)->increment('available_beds');

        return response()->json([
            'message'   => 'Patient transféré avec succès.',
            'admission' => $admission,
        ]);
    }
}