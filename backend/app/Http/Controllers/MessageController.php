<?php
// app/Http/Controllers/MessageController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Conversation;
use App\Models\Message;

class MessageController extends Controller
{
    // ── GET /api/messaging/users
    public function users(Request $request)
    {
        $me = $request->user();
        $users = User::where('id', '!=', $me->id)
            ->where('hospital_id', $me->hospital_id)
            ->where('is_active', true)
            ->select('id', 'nom', 'prenom', 'name', 'role', 'service_id')
            ->with('service:id,name')
            ->get()
            ->map(fn($u) => [
                'id'      => $u->id,
                'name'    => $u->prenom && $u->nom ? "Dr. {$u->prenom} {$u->nom}" : $u->name,
                'role'    => $u->role,
                'service' => $u->role === 'directeur'
                    ? "Directeur de l'hopital"
                    : ($u->service?->name ? "Chef de service - " . $u->service->name : "Chef de service"),
            ]);
        return response()->json($users);
    }

    // ── GET /api/messaging/conversations
    public function conversations(Request $request)
    {
        $me = $request->user();
        $convs = Conversation::where('user1_id', $me->id)
            ->orWhere('user2_id', $me->id)
            ->with([
                'user1:id,nom,prenom,name,role,service_id',
                'user1.service:id,name',
                'user2:id,nom,prenom,name,role,service_id',
                'user2.service:id,name',
                'lastMessage',
            ])
            ->orderByDesc('last_message_at')
            ->get()
            ->map(function($c) use ($me) {
                $other = $c->user1_id === $me->id ? $c->user2 : $c->user1;
                $unread = Message::where('conversation_id', $c->id)
                    ->where('to_user_id', $me->id)
                    ->where('is_read', false)
                    ->count();
                return [
                    'id'          => $c->id,
                    'other_user'  => [
                        'id'      => $other->id,
                        'name'    => $other->prenom && $other->nom ? "Dr. {$other->prenom} {$other->nom}" : $other->name,
                        'role'    => $other->role,
                        'service' => $other->role === 'directeur'
                            ? "Directeur de l'hopital"
                            : ($other->service?->name ? "Chef de service - " . $other->service->name : "Chef de service"),
                    ],
                    'last_message'    => $c->lastMessage?->body,
                    'last_message_at' => $c->last_message_at,
                    'unread_count'    => $unread,
                ];
            });
        return response()->json($convs);
    }

    // ── GET /api/messaging/conversations/{id}/messages
    public function messages(Request $request, $convId)
    {
        $me = $request->user();
        $conv = Conversation::where('id', $convId)
            ->where(fn($q) => $q->where('user1_id', $me->id)->orWhere('user2_id', $me->id))
            ->firstOrFail();

        Message::where('conversation_id', $conv->id)
            ->where('to_user_id', $me->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $messages = Message::where('conversation_id', $conv->id)
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => [
                'id'              => $m->id,
                'from_user_id'    => $m->from_user_id,
                'body'            => $m->body,
                'subject'         => $m->subject,
                'simulation_data' => $m->simulation_data,
                'is_read'         => $m->is_read,
                'created_at'      => $m->created_at,
                'is_mine'         => $m->from_user_id === $me->id,
            ]);

        return response()->json($messages);
    }

    // ── POST /api/messaging/send
    public function send(Request $request)
    {
        $request->validate([
            'to_user_id'      => 'required|exists:users,id',
            'body'            => 'required|string|max:2000',
            'subject'         => 'nullable|string|max:200',
            'simulation_data' => 'nullable|array',
        ]);

        $me   = $request->user();
        $toId = $request->to_user_id;
        $u1   = min($me->id, $toId);
        $u2   = max($me->id, $toId);

        $conv = Conversation::firstOrCreate(
            ['user1_id' => $u1, 'user2_id' => $u2],
            ['last_message_at' => now()]
        );
        $conv->update(['last_message_at' => now()]);

        $message = Message::create([
            'conversation_id' => $conv->id,
            'from_user_id'    => $me->id,
            'to_user_id'      => $toId,
            'subject'         => $request->subject,
            'body'            => $request->body,
            'simulation_data' => $request->simulation_data,
            'is_read'         => false,
        ]);

        return response()->json([
            'id'         => $message->id,
            'body'       => $message->body,
            'subject'    => $message->subject,
            'is_mine'    => true,
            'created_at' => $message->created_at,
            'conv_id'    => $conv->id,
        ], 201);
    }

    // ── GET /api/messaging/unread
    public function unread(Request $request)
    {
        $count = Message::where('to_user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();
        return response()->json(['count' => $count]);
    }
}