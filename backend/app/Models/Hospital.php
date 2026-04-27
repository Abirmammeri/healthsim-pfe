<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hospital extends Model
{
    protected $fillable = [
        'name',
        'address',
        'latitude',
        'longitude',
        'total_beds',
        'available_beds',
        'total_doctors',
        'total_nurses',
        'active_patients',
        'status'
    ];

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function alerts()
    {
        return $this->hasMany(Alert::class);
    }

    public function simulations()
    {
        return $this->hasMany(Simulation::class);
    }
    protected function serializeDate(\DateTimeInterface $date): string
{
    return $date->format('Y-m-d H:i:s');
}

public function toArray()
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'address' => $this->address,
        'latitude' => $this->latitude,
        'longitude' => $this->longitude,
        'totalBeds' => $this->total_beds,
        'availableBeds' => $this->available_beds,
        'doctors' => $this->total_doctors,
        'nurses' => $this->total_nurses,
        'patients' => $this->active_patients,
        'capacity' => $this->total_beds,
        'loadStatus' => match($this->status) {
            'charge_elevee' => 'high',
            'critique' => 'critical',
            default => 'normal'
        },
    ];
}
}