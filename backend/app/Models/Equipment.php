<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    protected $fillable = [
        'service_id',
        'name',
        'type',
        'quantity',
        'status'
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
