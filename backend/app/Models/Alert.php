<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    protected $fillable = [
        'hospital_id',
        'title',
        'message',
        'severity',
        'type',
        'is_read'
    ];

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function toArray()
    {
        return [
            'id' => $this->id,
            'hospitalId' => $this->hospital_id,
            'hospitalName' => $this->hospital ? $this->hospital->name : null,
            'serviceName' => null,
            'type' => $this->type,
            'severity' => $this->severity,
            'description' => $this->message,
            'resolved' => $this->is_read,
            'createdAt' => $this->created_at,
        ];
    }
}
