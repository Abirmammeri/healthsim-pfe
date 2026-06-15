<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $fillable = [
        'code_patient', 'age', 'sexe', 'wilaya_origine',
    ];

    public function admissions()
    {
        return $this->hasMany(Admission::class);
    }

    public function toArray()
    {
        return [
            'id'            => $this->id,
            'codePatient'   => $this->code_patient,
            'age'           => $this->age,
            'sexe'          => $this->sexe,
            'wilayaOrigine' => $this->wilaya_origine,
        ];
    }
}