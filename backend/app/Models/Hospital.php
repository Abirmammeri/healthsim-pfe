<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hospital extends Model
{
    protected $fillable = [
        'name', 'code', 'type_hopital', 'wilaya', 'commune',
        'address', 'latitude', 'longitude',
        'total_beds', 'available_beds',
        'total_doctors', 'total_nurses', 'active_patients',
        'status', 'load_status',
        'budget_annuel',
        'score_localisation', 'score_air_interieur', 'score_acoustique',
    ];

    // ── Relations ────────────────────────────────────────
    public function services()     { return $this->hasMany(Service::class); }
    public function alerts()       { return $this->hasMany(Alert::class); }
    public function simulations()  { return $this->hasMany(Simulation::class); }
    public function budgets()      { return $this->hasMany(Budget::class); }
    public function admissions()   { return $this->hasMany(Admission::class); }
    public function kpiSnapshots() { return $this->hasMany(KpiSnapshot::class); }
    public function staff()        { return $this->hasMany(Staff::class); }

    // ── Sérialisation ─────────────────────────────────────
    public function toArray()
    {
        // KPIs globaux agrégés depuis les services
        $services = $this->relationLoaded('services')
            ? $this->services
            : $this->services()->with('equipment')->get();

        $totalDoctors  = $services->sum('doctors');
        $totalNurses   = $services->sum('nurses');
        $totalBeds     = $services->sum('beds');
        $totalPatients = $services->sum('patients');
        $availBeds     = $services->sum('available_beds');

        // Calcul load_status dynamique
        $occupation = $totalBeds > 0
            ? round($totalPatients / $totalBeds * 100)
            : 0;

        $loadStatus = match(true) {
            $occupation >= 90 => 'critical',
            $occupation >= 85 => 'high',
            $occupation >= 70 => 'medium',
            default           => 'normal',
        };

        // Fallback sur les colonnes directes de l'hôpital si services vides
        $finalDoctors  = $totalDoctors  > 0 ? $totalDoctors  : ($this->total_doctors  ?? 0);
        $finalNurses   = $totalNurses   > 0 ? $totalNurses   : ($this->total_nurses   ?? 0);
        $finalBeds     = $totalBeds     > 0 ? $totalBeds     : ($this->total_beds     ?? 0);
        $finalPatients = $totalPatients > 0 ? $totalPatients : ($this->active_patients ?? 0);
        $finalAvail    = $finalBeds - $finalPatients;

        // Recalcul occupation avec données finales
        $occupationFinal = $finalBeds > 0 ? round($finalPatients / $finalBeds * 100) : 0;
        $loadStatusFinal = match(true) {
            $occupationFinal >= 90 => 'critical',
            $occupationFinal >= 85 => 'high',
            $occupationFinal >= 70 => 'medium',
            default                => 'normal',
        };

        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'code'           => $this->code,
            'typeHopital'    => $this->type_hopital,
            'wilaya'         => $this->wilaya,
            'commune'        => $this->commune,
            'address'        => $this->address,
            'latitude'       => (float)($this->latitude  ?? 36.34),
            'longitude'      => (float)($this->longitude ?? 6.62),
            'totalBeds'      => $finalBeds,
            'availableBeds'  => max(0, $finalAvail),
            'doctors'        => $finalDoctors,
            'nurses'         => $finalNurses,
            'patients'       => $finalPatients,
            'capacity'       => $finalBeds,
            'loadStatus'     => $loadStatusFinal,
            'status'         => $this->status,
            'budgetAnnuel'   => $this->budget_annuel,
            'scoreLocalisation'  => $this->score_localisation,
            'scoreAirInterieur'  => $this->score_air_interieur,
            'scoreAcoustique'    => $this->score_acoustique,
        ];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }
}