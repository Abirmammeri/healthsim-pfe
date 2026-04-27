<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Simulation extends Model
{
    protected $fillable = [
        'hospital_id',
        'scenario_name',
        'target_doctors',
        'target_nurses',
        'available_equipment',
        'results_before',
        'results_after',
        'kpis'
    ];

    protected $casts = [
        'results_before' => 'array',
        'results_after' => 'array',
        'kpis' => 'array'
    ];

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }
}
