<?php
// app/Models/Message.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'conversation_id', 'from_user_id', 'to_user_id',
        'subject', 'body', 'is_read', 'simulation_data',
    ];

    protected $casts = [
        'is_read'         => 'boolean',
        'simulation_data' => 'array',
    ];

    public function conversation() { return $this->belongsTo(Conversation::class); }
    public function fromUser()     { return $this->belongsTo(User::class, 'from_user_id'); }
    public function toUser()       { return $this->belongsTo(User::class, 'to_user_id'); }
}