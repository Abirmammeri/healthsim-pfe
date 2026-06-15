<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Admission extends Model
{
    protected $fillable = [
        'patient_id', 'service_id', 'hospital_id',
        'date_admission', 'date_triage',
        'date_prise_charge', 'date_sortie',
        'temps_attente_min', 'duree_sejour_h',
        'type_admission', 'statut',
        'is_readmission', 'admission_precedente_id',
        'delai_readmission_j',
        'is_deces', 'cause_deces', 'deces_evitable',
        'infection_nosocomiale', 'type_infection',
        'date_diagnostic_infection',
        'transfert_vers_hospital_id', 'motif_transfert',
        'diagnostic_principal', 'diagnostic_libelle',
    ];

    protected $casts = [
        'date_admission'            => 'datetime',
        'date_triage'               => 'datetime',
        'date_prise_charge'         => 'datetime',
        'date_sortie'               => 'datetime',
        'date_diagnostic_infection' => 'datetime',
        'is_readmission'            => 'boolean',
        'is_deces'                  => 'boolean',
        'deces_evitable'            => 'boolean',
        'infection_nosocomiale'     => 'boolean',
    ];

    // ── Relations ─────────────────────────────────────────
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function admissionPrecedente()
    {
        return $this->belongsTo(Admission::class, 'admission_precedente_id');
    }

    public function transfertVers()
    {
        return $this->belongsTo(Hospital::class, 'transfert_vers_hospital_id');
    }

    public function incidents()
    {
        return $this->hasMany(Incident::class);
    }

    // ── Calcul automatique des champs dérivés ─────────────
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($admission) {
            // Calcul temps d'attente
            if ($admission->date_admission && $admission->date_prise_charge) {
                $admission->temps_attente_min = round(
                    $admission->date_admission->diffInMinutes(
                        $admission->date_prise_charge
                    )
                );
            }
            // Calcul durée séjour
            if ($admission->date_admission && $admission->date_sortie) {
                $admission->duree_sejour_h = round(
                    $admission->date_admission->diffInHours(
                        $admission->date_sortie, true
                    ), 1
                );
            }
        });
    }
}