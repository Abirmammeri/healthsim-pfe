<?php
// app/Http/Controllers/DoctorController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DoctorController extends Controller
{
    // ── GET /api/doctors ─────────────────────────────────
    public function index(Request $request)
    {
        $me    = $request->user();
        $query = DB::table('doctors')
            ->where('hospital_id', $me->hospital_id)
            ->where('type', 'medecin')
            ->whereNull('deleted_at');

        if ($request->service_id) {
            $query->where('service_id', $request->service_id);
        }
        if ($request->statut) {
            $query->where('statut', $request->statut);
        }
        if ($request->grade) {
            $query->where('grade', $request->grade);
        }

        $doctors = $query->orderBy('nom')->get()->map(fn($d) => $this->format($d));

        // Stats globales
        $stats = [
            'total'          => $doctors->count(),
            'disponibles'    => $doctors->where('statut', 'disponible')->count(),
            'en_garde'       => $doctors->where('statut', 'en_garde')->count(),
            'en_conge'       => $doctors->where('statut', 'en_conge')->count(),
            'absents'        => $doctors->where('statut', 'absent')->count(),
            'charge_moy_patients' => $doctors->count() > 0
                ? round($doctors->avg('nb_patients_charge'), 1) : 0,
            'heures_moy'     => $doctors->count() > 0
                ? round($doctors->avg('heures_travail_effectuees'), 1) : 0,
        ];

        return response()->json(['doctors' => $doctors, 'stats' => $stats]);
    }

    // ── GET /api/doctors/{id} ────────────────────────────
    public function show(Request $request, $id)
    {
        $me  = $request->user();
        $doc = DB::table('doctors')
            ->where('id', $id)
            ->where('hospital_id', $me->hospital_id)
            ->whereNull('deleted_at')
            ->first();

        if (!$doc) return response()->json(['message' => 'Medecin non trouve.'], 404);

        return response()->json($this->format($doc));
    }

    // ── POST /api/doctors ────────────────────────────────
    public function store(Request $request)
    {
        $me = $request->user();
        if ($me->role !== 'directeur') {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }

        $data = $request->validate([
            'service_id'               => 'required|exists:services,id',
            'nom'                      => 'required|string|max:100',
            'prenom'                   => 'required|string|max:100',
            'email'                    => 'nullable|email|unique:doctors,email',
            'telephone'                => 'nullable|string|max:20',
            'specialite'               => 'required|string|max:150',
            'grade'                    => 'required|in:interne,resident,specialiste,maitre_assistant,professeur',
            'heures_travail_semaine'   => 'nullable|integer|min:1|max:84',
            'heures_travail_effectuees'=> 'nullable|integer|min:0',
            'nb_patients_charge'       => 'nullable|integer|min:0',
            'nb_gardes_mois'           => 'nullable|integer|min:0',
            'statut'                   => 'nullable|in:disponible,en_garde,en_conge,absent,en_formation',
            'date_recrutement'         => 'nullable|date',
            'notes'                    => 'nullable|string',
        ]);

        $id = DB::table('doctors')->insertGetId([
            'hospital_id'               => $me->hospital_id,
            'service_id'                => $data['service_id'],
            'type'                      => 'medecin',
            'nom'                       => strtoupper($data['nom']),
            'prenom'                    => ucfirst(strtolower($data['prenom'])),
            'email'                     => $data['email'] ?? null,
            'telephone'                 => $data['telephone'] ?? null,
            'specialite'                => $data['specialite'],
            'grade'                     => $data['grade'],
            'heures_travail_semaine'    => $data['heures_travail_semaine'] ?? 40,
            'heures_travail_effectuees' => $data['heures_travail_effectuees'] ?? 0,
            'nb_patients_charge'        => $data['nb_patients_charge'] ?? 0,
            'nb_gardes_mois'            => $data['nb_gardes_mois'] ?? 0,
            'statut'                    => $data['statut'] ?? 'disponible',
            'date_recrutement'          => $data['date_recrutement'] ?? null,
            'notes'                     => $data['notes'] ?? null,
            'created_at'                => now(),
            'updated_at'                => now(),
        ]);

        return response()->json([
            'message' => 'Medecin ajoute avec succes.',
            'id'      => $id,
        ], 201);
    }

    // ── PUT /api/doctors/{id} ────────────────────────────
    public function update(Request $request, $id)
    {
        $me = $request->user();
        if ($me->role !== 'directeur') {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }

        $doc = DB::table('doctors')
            ->where('id', $id)
            ->where('hospital_id', $me->hospital_id)
            ->whereNull('deleted_at')
            ->first();

        if (!$doc) return response()->json(['message' => 'Medecin non trouve.'], 404);

        $data = $request->validate([
            'service_id'               => 'nullable|exists:services,id',
            'nom'                      => 'nullable|string|max:100',
            'prenom'                   => 'nullable|string|max:100',
            'email'                    => 'nullable|email|unique:doctors,email,' . $id,
            'telephone'                => 'nullable|string|max:20',
            'specialite'               => 'nullable|string|max:150',
            'grade'                    => 'nullable|in:interne,resident,specialiste,maitre_assistant,professeur',
            'heures_travail_semaine'   => 'nullable|integer|min:1|max:84',
            'heures_travail_effectuees'=> 'nullable|integer|min:0',
            'nb_patients_charge'       => 'nullable|integer|min:0',
            'nb_gardes_mois'           => 'nullable|integer|min:0',
            'statut'                   => 'nullable|in:disponible,en_garde,en_conge,absent,en_formation',
            'date_recrutement'         => 'nullable|date',
            'notes'                    => 'nullable|string',
        ]);

        $update = array_filter([
            'service_id'                => $data['service_id'] ?? null,
            'nom'                       => isset($data['nom']) ? strtoupper($data['nom']) : null,
            'prenom'                    => isset($data['prenom']) ? ucfirst(strtolower($data['prenom'])) : null,
            'email'                     => $data['email'] ?? null,
            'telephone'                 => $data['telephone'] ?? null,
            'specialite'                => $data['specialite'] ?? null,
            'grade'                     => $data['grade'] ?? null,
            'heures_travail_semaine'    => $data['heures_travail_semaine'] ?? null,
            'heures_travail_effectuees' => $data['heures_travail_effectuees'] ?? null,
            'nb_patients_charge'        => $data['nb_patients_charge'] ?? null,
            'nb_gardes_mois'            => $data['nb_gardes_mois'] ?? null,
            'statut'                    => $data['statut'] ?? null,
            'date_recrutement'          => $data['date_recrutement'] ?? null,
            'notes'                     => $data['notes'] ?? null,
            'updated_at'                => now(),
        ], fn($v) => $v !== null);

        DB::table('doctors')->where('id', $id)->update($update);

        return response()->json(['message' => 'Medecin mis a jour.']);
    }

    // ── DELETE /api/doctors/{id} ─────────────────────────
    public function destroy(Request $request, $id)
    {
        $me = $request->user();
        if ($me->role !== 'directeur') {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }

        DB::table('doctors')
            ->where('id', $id)
            ->where('hospital_id', $me->hospital_id)
            ->update(['deleted_at' => now()]);

        return response()->json(['message' => 'Medecin supprime.']);
    }

    // ── GET /api/doctors/by-service/{serviceId} ──────────
    public function byService(Request $request, $serviceId)
    {
        $me = $request->user();
        $doctors = DB::table('doctors')
            ->where('service_id', $serviceId)
            ->where('hospital_id', $me->hospital_id)
            ->where('type', 'medecin')
            ->whereNull('deleted_at')
            ->orderBy('nom')
            ->get()
            ->map(fn($d) => $this->format($d));

        return response()->json($doctors);
    }

    // ── Format ───────────────────────────────────────────
    private function format($d): array
    {
        $taux = $d->heures_travail_semaine > 0
            ? round(($d->heures_travail_effectuees / ($d->heures_travail_semaine * 4)) * 100, 1)
            : 0;

        return [
            'id'                        => $d->id,
            'nom'                       => $d->nom,
            'prenom'                    => $d->prenom,
            'nom_complet'               => "Dr. {$d->prenom} {$d->nom}",
            'email'                     => $d->email,
            'telephone'                 => $d->telephone,
            'specialite'                => $d->specialite,
            'grade'                     => $d->grade,
            'grade_label'               => $this->gradeLabel($d->grade),
            'service_id'                => $d->service_id,
            'hospital_id'               => $d->hospital_id,
            'heures_travail_semaine'    => $d->heures_travail_semaine,
            'heures_travail_effectuees' => $d->heures_travail_effectuees,
            'taux_travail_pct'          => min(100, $taux),
            'nb_patients_charge'        => $d->nb_patients_charge,
            'nb_gardes_mois'            => $d->nb_gardes_mois,
            'statut'                    => $d->statut,
            'statut_label'              => $this->statutLabel($d->statut),
            'date_recrutement'          => $d->date_recrutement,
            'notes'                     => $d->notes,
            'created_at'                => $d->created_at,
        ];
    }

    private function gradeLabel(string $grade): string
    {
        return match($grade) {
            'interne'          => 'Interne',
            'resident'         => 'Résident',
            'specialiste'      => 'Spécialiste',
            'maitre_assistant' => 'Maître Assistant',
            'professeur'       => 'Professeur',
            default            => $grade,
        };
    }

    private function statutLabel(string $statut): string
    {
        return match($statut) {
            'disponible'   => 'Disponible',
            'en_garde'     => 'En garde',
            'en_conge'     => 'En congé',
            'absent'       => 'Absent',
            'en_formation' => 'En formation',
            default        => $statut,
        };
    }
}
