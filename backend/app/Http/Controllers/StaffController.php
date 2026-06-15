<?php

namespace App\Http\Controllers;

use App\Models\Staff;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    // ── Personnel d'un hôpital ────────────────────────────
    public function byHospital($hospitalId)
    {
        $staff = Staff::where('hospital_id', $hospitalId)
            ->with('service')
            ->get()
            ->map(fn($s) => $s->toArray());

        return response()->json($staff);
    }

    // ── Personnel d'un service ────────────────────────────
    public function byService($serviceId)
    {
        $staff = Staff::where('service_id', $serviceId)
            ->where('statut', 'actif')
            ->get()
            ->map(fn($s) => $s->toArray());

        return response()->json($staff);
    }

    // ── Créer un membre du personnel ──────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'hospital_id' => 'required|integer|exists:hospitals,id',
            'service_id'  => 'nullable|integer|exists:services,id',
            'matricule'   => 'nullable|string|unique:staff',
            'nom'         => 'required|string',
            'prenom'      => 'required|string',
            'type'        => 'required|in:medecin_specialiste,medecin_generaliste,infirmier,aide_soignant,administratif',
            'specialite'  => 'nullable|string',
            'salaire'     => 'nullable|integer|min:0',
        ]);

        $staff = Staff::create($data);
        return response()->json($staff->toArray(), 201);
    }

    // ── Mettre à jour ─────────────────────────────────────
    public function update(Request $request, $id)
    {
        $staff = Staff::findOrFail($id);
        $data  = $request->validate([
            'service_id' => 'nullable|integer|exists:services,id',
            'statut'     => 'nullable|in:actif,conge,formation,absent,retraite',
            'salaire'    => 'nullable|integer|min:0',
            'specialite' => 'nullable|string',
        ]);

        $staff->update($data);
        return response()->json($staff->toArray());
    }

    // ── Supprimer ─────────────────────────────────────────
    public function destroy($id)
    {
        Staff::findOrFail($id)->delete();
        return response()->json(['message' => 'Personnel supprimé.']);
    }
}