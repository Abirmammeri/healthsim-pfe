<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'hospital_id',
        'name',
        'head',
        'doctors',
        'nurses',
        'beds',
        'patients',
        'available_beds'
    ];

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function equipment()
    {
        return $this->hasMany(Equipment::class);
    }

    public function toArray()
    {
        return [
            'id' => $this->id,
            'hospitalId' => $this->hospital_id,
            'name' => $this->name,
            'head' => $this->head,
            'doctors' => $this->doctors,
            'nurses' => $this->nurses,
            'beds' => $this->beds,
            'availableBeds' => $this->available_beds,
            'patients' => $this->patients,
            'status' => 'normal',
            'equipment' => $this->relationLoaded('equipment') 
                ? $this->equipment->toArray() 
                : [],
        ];
    }
}
