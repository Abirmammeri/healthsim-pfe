<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Budget extends Model
{
    protected $fillable = [
        'hospital_id', 'annee',
        'budget_total', 'budget_personnel',
        'budget_medicaments', 'budget_equipements',
        'budget_maintenance', 'budget_energie',
        'budget_autre', 'statut',
    ];

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }
}