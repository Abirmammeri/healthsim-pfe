<?php
// app/Http/Controllers/InfirmierController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InfirmierController extends Controller
{
    // ── GET /api/nurses ──────────────────────────────────
    public function index(Request $request)
    {
        $me    = $request->user();
        $query = DB::table('doctors')
            ->where('hospital_id', $me->hospital_id)
            ->where('type', 'infirmier')
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

        $nurses = $query->orderBy('nom')->get()->map(fn($n) => $this->format($n));

        $stats = [
            'total'       => $nurses->count(),
            'disponibles' => $nurses->where('statut', 'disponible')->count(),
            'en_garde'    => $nurses->where('statut', 'en_garde')->count(),
            'en_conge'    => $nurses->where('statut', 'en_conge')->count(),
            'absents'     => $nurses->where('statut', 'absent')->count(),
            'charge_moy_patients' => $nurses->count() > 0
                ? round($nurses->avg('nb_patients_charge'), 1) : 0,
        ];

        return response()->json(['nurses' => $nurses, 'stats' => $stats]);
    }

    // ── POST /api/nurses ─────────────────────────────────
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
            'specialite'               => 'nullable|string|max:150',
            'grade'                    => 'required|in:infirmier,infirmier_chef,infirmier_specialise',
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
            'type'                      => 'infirmier',
            'nom'                       => strtoupper($data['nom']),
            'prenom'                    => ucfirst(strtolower($data['prenom'])),
            'email'                     => $data['email'] ?? null,
            'telephone'                 => $data['telephone'] ?? null,
            'specialite'                => $data['specialite'] ?? null,
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

        return response()->json(['message' => 'Infirmier ajoute avec succes.', 'id' => $id], 201);
    }

    // ── PUT /api/nurses/{id} ─────────────────────────────
    public function update(Request $request, $id)
    {
        $me = $request->user();
        if ($me->role !== 'directeur') {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }

        $nurse = DB::table('doctors')
            ->where('id', $id)
            ->where('hospital_id', $me->hospital_id)
            ->where('type', 'infirmier')
            ->whereNull('deleted_at')
            ->first();

        if (!$nurse) return response()->json(['message' => 'Infirmier non trouve.'], 404);

        $data = $request->validate([
            'service_id'               => 'nullable|exists:services,id',
            'nom'                      => 'nullable|string|max:100',
            'prenom'                   => 'nullable|string|max:100',
            'email'                    => 'nullable|email|unique:doctors,email,' . $id,
            'telephone'                => 'nullable|string|max:20',
            'specialite'               => 'nullable|string|max:150',
            'grade'                    => 'nullable|in:infirmier,infirmier_chef,infirmier_specialise',
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

        return response()->json(['message' => 'Infirmier mis a jour.']);
    }

    // ── DELETE /api/nurses/{id} ──────────────────────────
    public function destroy(Request $request, $id)
    {
        $me = $request->user();
        if ($me->role !== 'directeur') {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }

        DB::table('doctors')
            ->where('id', $id)
            ->where('hospital_id', $me->hospital_id)
            ->where('type', 'infirmier')
            ->update(['deleted_at' => now()]);

        return response()->json(['message' => 'Infirmier supprime.']);
    }

    // ── Format ───────────────────────────────────────────
    private function format($n): array
    {
        $taux = $n->heures_travail_semaine > 0
            ? round(($n->heures_travail_effectuees / ($n->heures_travail_semaine * 4)) * 100, 1)
            : 0;

        return [
            'id'                        => $n->id,
            'nom'                       => $n->nom,
            'prenom'                    => $n->prenom,
            'nom_complet'               => "Inf. {$n->prenom} {$n->nom}",
            'email'                     => $n->email,
            'telephone'                 => $n->telephone,
            'specialite'                => $n->specialite,
            'grade'                     => $n->grade,
            'grade_label'               => $this->gradeLabel($n->grade),
            'service_id'                => $n->service_id,
            'hospital_id'               => $n->hospital_id,
            'heures_travail_semaine'    => $n->heures_travail_semaine,
            'heures_travail_effectuees' => $n->heures_travail_effectuees,
            'taux_travail_pct'          => min(100, $taux),
            'nb_patients_charge'        => $n->nb_patients_charge,
            'nb_gardes_mois'            => $n->nb_gardes_mois,
            'statut'                    => $n->statut,
            'statut_label'              => $this->statutLabel($n->statut),
            'date_recrutement'          => $n->date_recrutement,
            'notes'                     => $n->notes,
            'created_at'                => $n->created_at,
        ];
    }

    private function gradeLabel(string $grade): string
    {
        return match($grade) {
            'infirmier'            => 'Infirmier',
            'infirmier_chef'       => 'Infirmier Chef',
            'infirmier_specialise' => 'Infirmier Spécialisé',
            default                => $grade,
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
