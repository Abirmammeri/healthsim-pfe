<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\Admission;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function index()
    {
        $patients = Patient::with('admissions')->get()
            ->map(fn($p) => $p->toArray());
        return response()->json($patients);
    }

    public function show($id)
    {
        $patient = Patient::with('admissions.service')->findOrFail($id);
        return response()->json($patient->toArray());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'age'           => 'nullable|integer|min:0|max:150',
            'sexe'          => 'nullable|in:M,F,autre',
            'wilaya_origine'=> 'nullable|string',
        ]);

        // Générer code patient automatiquement
        $count = Patient::count() + 1;
        $data['code_patient'] = 'PAT-' . date('Y') . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);

        $patient = Patient::create($data);
        return response()->json($patient->toArray(), 201);
    }
}