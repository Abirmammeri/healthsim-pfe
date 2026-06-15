<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'hospital_id', 'name', 'code', 'head', 'type', 'status',
        'doctors', 'nurses', 'beds', 'patients', 'available_beds',
        'dms_heures', 'simulation_hours',
        'salaire_medecin', 'salaire_infirmier',
        'cout_medicament_unit', 'cout_maintenance_eq',
        'score_distribution_eq', 'score_gestion_dechets',
        'mortalite_base',
        'nb_patients_mois', 'nb_deces_mois', 'nb_infections_mois',
        'nb_transferts_mois', 'nb_readmissions_mois',
        'replacement_user_id', 'replacement_until', 'replacement_reason',
        'patients_prediabete',
        'dms_min_jours', 'dms_max_jours',
        'consultation_min_min', 'consultation_max_min',
        'soin_inf_min_min', 'soin_inf_max_min',
        'equip_min_min', 'equip_max_min',
        'lambda_patients_jour',
    ];

    // ── Relations ────────────────────────────────────────────
    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function equipment()
    {
        return $this->hasMany(Equipment::class);
    }

    // ── Erlang-C M/M/c ───────────────────────────────────────
    private function erlangC(float $lambda, float $mu, int $c): float
    {
        if ($mu <= 0 || $c <= 0) return 0.0;

        $rho = $lambda / ($c * $mu);

        if ($rho >= 1.0) return 9999.0;

        $a = $lambda / $mu;

        $sum = 0.0;
        $factorial = 1.0;
        for ($k = 0; $k < $c; $k++) {
            if ($k > 0) $factorial *= $k;
            $sum += pow($a, $k) / $factorial;
        }
        $cFactorial = $factorial * $c;
        $erlangFactor = pow($a, $c) / ($cFactorial * (1 - $rho));
        $P0 = 1.0 / ($sum + $erlangFactor);

        $Cca = ($erlangFactor * $P0);
        $Wq = ($Cca / ($c * $mu - $lambda)) * 60.0;

        return round(max(0.0, $Wq), 2);
    }

    // ── KPIs ─────────────────────────────────────────────────
    public function computeKpis(): array
    {
        $beds      = max(1, $this->beds     ?? 1);
        $doctors   = max(1, $this->doctors  ?? 1);
        $nurses    = max(1, $this->nurses   ?? 1);
        $patients  = $this->patients        ?? 0;
        $dmsH      = max(1, $this->dms_heures ?? 96);

        $lambdaJour = $this->lambda_patients_jour ?? 50;
        $nbPatMois  = $this->nb_patients_mois ?? ($lambdaJour * 30);
        $nbPat      = max(1, $nbPatMois);

        $lambda = $lambdaJour / 24.0;

        $consultMin  = $this->consultation_min_min ?? 10;
        $consultMax  = $this->consultation_max_min ?? 30;
        $consultMoyH = (($consultMin + $consultMax) / 2) / 60.0;
        $muMedecin   = $consultMoyH > 0 ? 1.0 / $consultMoyH : 3.0;

        $soinMin     = $this->soin_inf_min_min ?? 25;
        $soinMax     = $this->soin_inf_max_min ?? 35;
        $soinMoyH    = (($soinMin + $soinMax) / 2) / 60.0;
        $muInfirmier = $soinMoyH > 0 ? 1.0 / $soinMoyH : 2.0;

        $a4Med       = $this->erlangC($lambda, $muMedecin,  $doctors);
        $a4Inf       = $this->erlangC($lambda, $muInfirmier, $nurses);
        $tempAttente = max($a4Med, $a4Inf);

        $rhoDocs = round($lambda / ($doctors * $muMedecin), 4);
        $rhoBeds = $beds > 0 ? round($patients / $beds, 4) : 0;

        $dmsMinJ = $this->dms_min_jours ?? 1;
        $dmsMaxJ = $this->dms_max_jours ?? 60;
        $a2Dms   = round(($dmsMinJ + $dmsMaxJ) / 2, 2);

        $a8Vacants   = round(max(0, $beds - $patients) / $beds * 100, 2);
        $nbTransferts = $this->nb_transferts_mois ?? 0;
        $a9Transfert  = round($nbTransferts / $nbPat * 100, 2);

        $c2Occupation = round(min(100, $patients / $beds * 100), 2);
        $nbDeces      = $this->nb_deces_mois ?? 0;
        $c3Mortalite  = round($nbDeces / $nbPat * 100, 2);
        $nbInfections = $this->nb_infections_mois ?? 0;
        $c4Infection  = round($nbInfections / $nbPat * 100, 2);

        $salairePersonnel = ($this->doctors ?? 0) * ($this->salaire_medecin   ?? 180000)
                          + ($this->nurses  ?? 0) * ($this->salaire_infirmier ?? 80000);
        $coutMedEq   = $nbPat * ($this->cout_medicament_unit ?? 1500)
                     + ($this->cout_maintenance_eq ?? 50000);
        $b1CoutSoins = round(($salairePersonnel + $coutMedEq) / $nbPat, 2);
        $b4CoutLit   = round(($salairePersonnel + ($this->cout_maintenance_eq ?? 50000)) / $beds, 2);
        $b7Personnel = $salairePersonnel;

        $hospital = $this->relationLoaded('hospital') ? $this->hospital : null;
        $d12Loc   = $hospital?->score_localisation  ?? 75;
        $d13Air   = $hospital?->score_air_interieur ?? 75;
        $d14Aco   = $hospital?->score_acoustique    ?? 75;

        return [
            'SSI' => [
                'A2_dms'            => $a2Dms,
                'A4_temps_attente'  => $tempAttente,
                'A8_lits_vacants'   => $a8Vacants,
                'A9_taux_transfert' => $a9Transfert,
            ],
            'IIP' => [
                'C2_occupation' => $c2Occupation,
                'C3_mortalite'  => $c3Mortalite,
                'C4_infection'  => $c4Infection,
            ],
            'ESI' => [
                'B1_cout_soins'    => $b1CoutSoins,
                'B4_cout_lit'      => $b4CoutLit,
                'B5_cout_med_eq'   => $coutMedEq,
                'B7_cout_personnel'=> $b7Personnel,
            ],
            'TI' => [
                'D5_distribution_eq'  => $this->score_distribution_eq ?? 80,
                'D11_gestion_dechets' => $this->score_gestion_dechets ?? 85,
                'D12_localisation'    => $d12Loc,
                'D13_air_interieur'   => $d13Air,
                'D14_acoustique'      => $d14Aco,
            ],
            'DES' => [
                'lambda_rate' => round($lambda, 6),
                'mu_rate'     => round($muMedecin, 6),
                'rho_doctors' => $rhoDocs,
                'rho_beds'    => $rhoBeds,
            ],
        ];
    }

    // ── Statut global — Scoring composite 7 KPIs ─────────────
    // Même principe que la génération des labels du dataset NHS
    // Chaque KPI reçoit 0, 1 ou 2 points → somme 0-14
    // Seuils OMS [46] / OCDE [45] / ECDC [47]
   public function computeStatus(): string
{
    $score    = 0;
    $beds     = max(1, $this->beds    ?? 1);
    $patients = $this->patients       ?? 0;
    $nbPat    = max(1, $this->nb_patients_mois
                    ?? ($this->lambda_patients_jour ?? 50) * 30);

    // C2 — Occupation lits
    $occ = ($patients / $beds) * 100;
    if ($occ > 92) $score += 2;
    elseif ($occ > 85) $score += 1;

    // C3 — Mortalité
    $mort = ($this->nb_deces_mois ?? 0) / $nbPat * 100;
    if ($mort > 4) $score += 2;
    elseif ($mort > 2) $score += 1;

    // C4 — Infections
    $inf = ($this->nb_infections_mois ?? 0) / $nbPat * 100;
    if ($inf > 3) $score += 2;
    elseif ($inf > 1) $score += 1;

    // A2 — DMS
    $dms = (($this->dms_min_jours ?? 1) + ($this->dms_max_jours ?? 60)) / 2;
    if ($dms > 7) $score += 2;
    elseif ($dms > 4.5) $score += 1;

    // ✅ A4 — Temps d'attente via Erlang-C
    $lambda      = ($this->lambda_patients_jour ?? 50) / 24.0;
    $consultMoyH = ((($this->consultation_min_min ?? 10)
                   + ($this->consultation_max_min ?? 30)) / 2) / 60.0;
    $muMedecin   = $consultMoyH > 0 ? 1.0 / $consultMoyH : 3.0;
    $a4          = $this->erlangC($lambda, $muMedecin, max(1, $this->doctors ?? 1));
    if ($a4 > 40) $score += 2;
    elseif ($a4 > 20) $score += 1;

    // A8 — Lits vacants
    $vacants = max(0, $beds - $patients) / $beds * 100;
    if ($vacants < 8) $score += 2;
    elseif ($vacants < 15) $score += 1;

    // A9 — Transferts
    $transf = ($this->nb_transferts_mois ?? 0) / $nbPat * 100;
    if ($transf > 5) $score += 2;
    elseif ($transf > 2) $score += 1;

    // Score total 0-14
    if ($score >= 8) return 'critical';
    if ($score >= 4) return 'high';
    return 'normal';
}

    // ── Sérialisation ─────────────────────────────────────────
    public function toArray(): array
    {
        return [
            'id'                    => $this->id,
            'hospital_id'           => $this->hospital_id,
            'name'                  => $this->name,
            'code'                  => $this->code,
            'head'                  => $this->head,
            'type'                  => $this->type,
            'status'                => $this->computeStatus(),
            'doctors'               => $this->doctors,
            'nurses'                => $this->nurses,
            'beds'                  => $this->beds,
            'patients'              => $this->patients,
            'available_beds'        => $this->available_beds,
            'dms_heures'            => $this->dms_heures,
            'simulation_hours'      => $this->simulation_hours,
            'salaire_medecin'       => $this->salaire_medecin,
            'salaire_infirmier'     => $this->salaire_infirmier,
            'cout_medicament_unit'  => $this->cout_medicament_unit,
            'cout_maintenance_eq'   => $this->cout_maintenance_eq,
            'score_distribution_eq' => $this->score_distribution_eq,
            'score_gestion_dechets' => $this->score_gestion_dechets,
            'mortalite_base'        => $this->mortalite_base,
            'nb_patients_mois'      => $this->nb_patients_mois,
            'nb_deces_mois'         => $this->nb_deces_mois,
            'nb_infections_mois'    => $this->nb_infections_mois,
            'nb_transferts_mois'    => $this->nb_transferts_mois,
            'nb_readmissions_mois'  => $this->nb_readmissions_mois,
            'replacement_user_id'   => $this->replacement_user_id,
            'replacement_until'     => $this->replacement_until,
            'replacement_reason'    => $this->replacement_reason,
            'patients_prediabete'   => $this->patients_prediabete,
            'dms_min_jours'         => $this->dms_min_jours,
            'dms_max_jours'         => $this->dms_max_jours,
            'consultation_min_min'  => $this->consultation_min_min,
            'consultation_max_min'  => $this->consultation_max_min,
            'soin_inf_min_min'      => $this->soin_inf_min_min,
            'soin_inf_max_min'      => $this->soin_inf_max_min,
            'equip_min_min'         => $this->equip_min_min,
            'equip_max_min'         => $this->equip_max_min,
            'lambda_patients_jour'  => $this->lambda_patients_jour ?? 50,
            'dmsHeures'             => $this->dms_heures,
            'dmsMinJours'           => $this->dms_min_jours ?? 1,
            'dmsMaxJours'           => $this->dms_max_jours ?? 60,
            'equipment'             => $this->relationLoaded('equipment')
                                        ? $this->equipment->toArray()
                                        : [],
            'hospital'              => $this->relationLoaded('hospital')
                                        ? $this->hospital?->toArray()
                                        : null,
            'created_at'            => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at'            => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}