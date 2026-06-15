<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

   protected $fillable = [
    'name', 'email', 'password',
    'role', 'hospital_id', 'service_id',
    'nom', 'prenom', 'is_active', 'status',
    'phone', 'otp_code', 'otp_expires_at',
    'face_embedding', 'avatar',
];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'is_active'         => 'boolean',
    ];

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function isDirecteur(): bool { return $this->role === 'directeur'; }
    public function isChefService(): bool { return $this->role === 'chef_service'; }
}