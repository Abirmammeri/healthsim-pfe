<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Models\Hospital;
use Illuminate\Support\Facades\Http;

class AuthController extends Controller
{
    // ── POST /api/auth/login ──────────────────────────────────
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)
            ->where('is_active', true)
            ->with(['hospital', 'service'])
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email ou mot de passe incorrect.'], 401);
        }

        if (($user->status ?? 'active') === 'pending') {
            return response()->json(['message' => 'Compte en attente de validation par le directeur.'], 403);
        }

        if (($user->status ?? 'active') === 'rejected') {
            return response()->json(['message' => 'Compte rejete. Contactez le directeur.'], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('healthsim-token')->plainTextToken;
        return response()->json(['token' => $token, 'user' => $this->formatUser($user)]);
    }

    // ── POST /api/auth/login-face ─────────────────────────────
    public function loginFace(Request $request)
    {
        $request->validate(['email' => 'required|email', 'image' => 'required|string']);

        $user = User::where('email', $request->email)
            ->where('is_active', true)
            ->with(['hospital', 'service'])
            ->first();

        if (!$user) return response()->json(['message' => 'Utilisateur non trouve.'], 404);
        if (!$user->face_embedding) return response()->json(['message' => 'Aucun visage enregistre pour ce compte.'], 422);

        try {
            $response = Http::timeout(15)->post(config('services.face.url') . '/verify-face', [
                'image'     => $request->image,
                'embedding' => $user->face_embedding,
            ]);
            $result = $response->json();

            if (!$result['verified']) {
                return response()->json([
                    'message'    => 'Visage non reconnu.',
                    'similarity' => $result['similarity'] ?? 0,
                ], 401);
            }

            $user->tokens()->delete();
            $token = $user->createToken('healthsim-token')->plainTextToken;
            return response()->json([
                'token'      => $token,
                'user'       => $this->formatUser($user),
                'similarity' => $result['similarity'],
                'confidence' => $result['confidence'],
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Service IA indisponible.'], 503);
        }
    }

    // ── POST /api/auth/send-verification ─────────────────────
    public function sendVerification(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        if (User::where('email', $request->email)->exists()) {
            return response()->json(['message' => 'Cet email est deja utilise.'], 422);
        }

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        cache()->put('verify_email_' . $request->email, Hash::make($otp), now()->addMinutes(10));

        try {
            Mail::raw(
                "Votre code de verification HealthSim : {$otp}\n\nCe code expire dans 10 minutes.",
                fn($m) => $m->to($request->email)->subject('HealthSim - Verification email')
            );
            return response()->json(['message' => 'Code envoye sur votre email.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Code envoye.', 'dev_otp' => $otp]);
        }
    }

    // ── POST /api/auth/verify-email ───────────────────────────
    public function verifyEmail(Request $request)
    {
        $request->validate(['email' => 'required|email', 'otp' => 'required|string|size:6']);

        $cached = cache()->get('verify_email_' . $request->email);
        if (!$cached) return response()->json(['message' => 'Code expire. Recommencez.'], 422);
        if (!Hash::check($request->otp, $cached)) return response()->json(['message' => 'Code incorrect.'], 422);

        cache()->put('email_verified_' . $request->email, true, now()->addHour());
        return response()->json(['message' => 'Email verifie avec succes.']);
    }

    // ── POST /api/auth/scan-face (sans email) ────────────────
    public function scanFace(Request $request)
    {
        $request->validate(['image' => 'required|string']);

        $users = User::whereNotNull('face_embedding')
            ->where('is_active', true)
            ->whereIn('status', ['active'])
            ->with(['hospital', 'service'])
            ->get();

        if ($users->isEmpty()) {
            return response()->json(['message' => 'Aucun visage enregistre dans le systeme.'], 404);
        }

        try {
            $bestMatch    = null;
            $bestDistance = 1.0;

            foreach ($users as $user) {
                $response = Http::timeout(15)->post(config('services.face.url') . '/verify-face', [
                    'image'     => $request->image,
                    'embedding' => $user->face_embedding,
                ]);
                $result = $response->json();

                if (($result['distance'] ?? 1.0) < $bestDistance) {
                    $bestDistance = $result['distance'] ?? 1.0;
                    $bestMatch = ['user' => $user, 'result' => $result];
                }
            }

            if (!$bestMatch || !($bestMatch['result']['verified'] ?? false)) {
                return response()->json([
                    'message'    => 'Visage non reconnu. Acces refuse.',
                    'similarity' => $bestMatch ? $bestMatch['result']['similarity'] : 0,
                ], 401);
            }

            $user = $bestMatch['user'];
            $user->tokens()->delete();
            $token = $user->createToken('healthsim-token')->plainTextToken;

            return response()->json([
                'token'      => $token,
                'user'       => $this->formatUser($user),
                'similarity' => $bestMatch['result']['similarity'],
                'confidence' => $bestMatch['result']['confidence'],
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Service IA indisponible.'], 503);
        }
    }

    // ── POST /api/auth/register ───────────────────────────────
    public function register(Request $request)
    {
        $request->validate([
            'nom'         => 'required|string|max:100',
            'prenom'      => 'required|string|max:100',
            'email'       => 'required|email|unique:users',
            'password'    => 'required|string|min:8',
            'phone'       => 'nullable|string|max:20',
            'hospital_id' => 'required|exists:hospitals,id',
            'service_id'  => 'nullable|exists:services,id',
            'face_image'  => 'nullable|string',
        ]);

        $faceEmbedding = null;
        if ($request->face_image) {
            try {
                $response = Http::timeout(15)->post(config('services.face.url') . '/extract-embedding', [
                    'image' => $request->face_image,
                ]);
                $result = $response->json();
                if ($result['success'] ?? false) {
                    $faceEmbedding = json_encode($result['embedding']);
                }
            } catch (\Exception $e) {}
        }

        $user = User::create([
            'name'           => "Dr. {$request->prenom} {$request->nom}",
            'nom'            => $request->nom,
            'prenom'         => $request->prenom,
            'email'          => $request->email,
            'password'       => Hash::make($request->password),
            'phone'          => $request->phone,
            'role'           => 'chef_service',
            'hospital_id'    => $request->hospital_id,
            'service_id'     => $request->service_id,
            'is_active'      => true,
            'status'         => 'pending',
            'face_embedding' => $faceEmbedding,
        ]);

        return response()->json([
            'message' => 'Compte cree. En attente de validation par le directeur.',
            'user_id' => $user->id,
        ], 201);
    }

    // ── POST /api/auth/forgot-password ────────────────────────
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email'  => 'required|email',
            'method' => 'required|in:email,sms,whatsapp',
            'phone'  => 'nullable|string|max:20',
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) return response()->json(['message' => 'Email non trouve.'], 404);

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        // Utiliser DB directement pour garantir la sauvegarde
        \DB::table('users')->where('id', $user->id)->update([
            'otp_code'       => Hash::make($otp),
            'otp_expires_at' => now()->addMinutes(10),
            'updated_at'     => now(),
        ]);

        if ($request->method === 'sms') {
            $phone = $request->phone ?? $user->phone;
            if (!$phone) {
                return response()->json(['message' => 'Aucun numero de telephone fourni.'], 422);
            }
            // Nettoyer et formater le numéro
            $phone = preg_replace('/\s+/', '', $phone);
            $phone = preg_replace('/[^+0-9]/', '', $phone);
            if (str_starts_with($phone, '00213')) {
                $phone = '+213' . substr($phone, 5);
            } elseif (str_starts_with($phone, '0')) {
                $phone = '+213' . substr($phone, 1);
            } elseif (!str_starts_with($phone, '+')) {
                $phone = '+213' . $phone;
            }

            try {
                $apiKey    = env('VONAGE_API_KEY');
                $apiSecret = env('VONAGE_API_SECRET');

                $response = \Illuminate\Support\Facades\Http::post('https://rest.nexmo.com/sms/json', [
                    'api_key'    => $apiKey,
                    'api_secret' => $apiSecret,
                    'to'         => $phone,
                    'from'       => 'HealthSim',
                    'text'       => "HealthSim - Votre code : {$otp}. Expire dans 10 minutes.",
                ]);

                \Log::info('Vonage response: ' . $response->body());

                $result = $response->json();
                $status = $result['messages'][0]['status'] ?? '1';

                if ($status === '0') {
                    return response()->json([
                        'message' => 'Code envoye par SMS sur ' . substr($phone, 0, 6) . '****',
                        'dev_otp' => app()->environment('local') ? $otp : null,
                    ]);
                } else {
                    $errorText = $result['messages'][0]['error-text'] ?? 'Erreur inconnue';
                    \Log::error('Vonage SMS error: ' . $errorText);
                    return response()->json([
                        'message' => 'Erreur envoi SMS. Utilisez email a la place.',
                        'dev_otp' => $otp
                    ], 422);
                }
            } catch (\Exception $e) {
                \Log::error('Vonage Exception: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Service SMS indisponible.',
                    'dev_otp' => $otp
                ], 422);
            }
        }

        if ($request->method === 'whatsapp') {
            $phone = $request->phone ?? $user->phone;
            if (!$phone) {
                return response()->json(['message' => 'Aucun numero de telephone fourni.'], 422);
            }
            // Nettoyer le numéro
            $phone = preg_replace('/\s+/', '', $phone);
            $phone = preg_replace('/[^+0-9]/', '', $phone);
            if (str_starts_with($phone, '00213')) {
                $phone = '+213' . substr($phone, 5);
            } elseif (str_starts_with($phone, '0')) {
                $phone = '+213' . substr($phone, 1);
            } elseif (!str_starts_with($phone, '+')) {
                $phone = '+213' . $phone;
            }
            // Enlever le + pour WhatsApp Infobip
            $phoneWA = ltrim($phone, '+');

            try {
                $apiKey  = env('INFOBIP_WA_API_KEY');
                $baseUrl = env('INFOBIP_WA_BASE_URL');
                $from    = env('INFOBIP_WA_FROM');

                $response = \Illuminate\Support\Facades\Http::withHeaders([
                    'Authorization' => 'App ' . $apiKey,
                    'Content-Type'  => 'application/json',
                    'Accept'        => 'application/json',
                ])->post("https://{$baseUrl}/whatsapp/1/message/text", [
                    'from'    => $from,
                    'to'      => $phoneWA,
                    'content' => [
                        'text' => "HealthSim - Votre code de reinitialisation : *{$otp}*. Expire dans 10 minutes.",
                    ],
                ]);

                \Log::info('WhatsApp response: ' . $response->body());

                if ($response->successful()) {
                    return response()->json([
                        'message' => 'Code envoye par WhatsApp sur ' . substr($phone, 0, 6) . '****',
                        'dev_otp' => app()->environment('local') ? $otp : null,
                    ]);
                } else {
                    \Log::error('WhatsApp error: ' . $response->body());
                    return response()->json([
                        'message' => 'Erreur envoi WhatsApp.',
                        'dev_otp' => $otp
                    ], 422);
                }
            } catch (\Exception $e) {
                \Log::error('WhatsApp Exception: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Service WhatsApp indisponible.',
                    'dev_otp' => $otp
                ], 422);
            }
        }

        // Envoi par email
        try {
            Mail::raw(
                "Votre code de reinitialisation HealthSim : {$otp}\n\nCe code expire dans 10 minutes.",
                fn($m) => $m->to($user->email)->subject('HealthSim - Reinitialisation mot de passe')
            );
            return response()->json(['message' => 'Code envoye sur votre email.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Code envoye.', 'dev_otp' => $otp]);
        }
    }

    // ── POST /api/auth/verify-otp ─────────────────────────────
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email'            => 'required|email',
            'otp'              => 'required|string|size:6',
            'new_password'     => 'required|string|min:8',
            'confirm_password' => 'required|same:new_password',
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user || !$user->otp_code) return response()->json(['message' => 'Aucun code en attente.'], 422);
        if (now()->isAfter($user->otp_expires_at)) return response()->json(['message' => 'Code expire.'], 422);
        if (!Hash::check($request->otp, $user->otp_code)) return response()->json(['message' => 'Code incorrect.'], 422);

        $user->update([
            'password'       => Hash::make($request->new_password),
            'otp_code'       => null,
            'otp_expires_at' => null,
        ]);
        return response()->json(['message' => 'Mot de passe mis a jour avec succes.']);
    }

    // ── GET /api/auth/hospitals ───────────────────────────────
    public function hospitals()
    {
        $hospitals = Hospital::select('id', 'name', 'wilaya')->get();
        return response()->json($hospitals);
    }

    // ── POST /api/auth/verify-password ───────────────────────
    public function verifyPassword(Request $request)
    {
        $request->validate(['password' => 'required|string']);
        $user = $request->user();
        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Mot de passe incorrect.'], 401);
        }
        return response()->json(['message' => 'Mot de passe verifie.']);
    }

    // ── POST /api/auth/logout ─────────────────────────────────
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Deconnecte.']);
    }

    // ── GET /api/auth/me ──────────────────────────────────────
    public function me(Request $request)
    {
        return response()->json($this->formatUser($request->user()->load(['hospital', 'service'])));
    }

    // ── POST /api/auth/register-face ─────────────────────────
    public function registerFace(Request $request)
    {
        $request->validate(['image' => 'required|string']);
        $user = $request->user();

        try {
            $response = Http::timeout(30)->post(config('services.face.url') . '/extract-embedding', [
                'image' => $request->image,
            ]);

            $result = $response->json();
            \Log::info('FaceResult: ' . json_encode(array_slice($result, 0, 2)));

            if (!($result['success'] ?? false)) {
                return response()->json([
                    'message' => 'Visage non detecte : ' . ($result['error'] ?? 'erreur inconnue'),
                ], 422);
            }

            $embedding = json_encode($result['embedding']);
            \DB::table('users')->where('id', $user->id)->update(['face_embedding' => $embedding]);

            $check = \DB::table('users')->where('id', $user->id)->value('face_embedding');
            \Log::info('Saved embedding length: ' . strlen($check ?? ''));

            return response()->json([
                'message'  => 'Visage enregistre avec succes.',
                'has_face' => true,
                'length'   => strlen($embedding),
            ]);
        } catch (\Exception $e) {
            \Log::error('FaceError: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 503);
        }
    }

    // ── DELETE /api/auth/delete-face ─────────────────────────
    public function deleteFace(Request $request)
    {
        $request->user()->update(['face_embedding' => null]);
        return response()->json(['message' => 'Visage supprime.', 'has_face' => false]);
    }

    // ── PUT /api/auth/update-profile ─────────────────────────
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'nom'    => 'nullable|string|max:100',
            'prenom' => 'nullable|string|max:100',
            'phone'  => 'nullable|string|max:20',
        ]);

        $user->update($request->only(['nom', 'prenom', 'phone']));
        if ($request->nom || $request->prenom) {
            $user->update(['name' => "Dr. " . ($request->prenom ?? $user->prenom) . " " . ($request->nom ?? $user->nom)]);
        }
        return response()->json(['message' => 'Profil mis a jour.', 'user' => $this->formatUser($user->fresh())]);
    }

    // ── PUT /api/auth/change-email ────────────────────────────
    public function changeEmail(Request $request)
    {
        $request->validate([
            'email'    => 'required|email|unique:users,email,' . $request->user()->id,
            'password' => 'required|string',
        ]);

        $user = $request->user();
        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Mot de passe incorrect.'], 401);
        }

        $user->update(['email' => $request->email]);
        return response()->json(['message' => 'Email mis a jour.']);
    }

    // ── PUT /api/auth/change-password ────────────────────────
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:8',
            'confirm_password' => 'required|same:new_password',
        ]);

        $user = $request->user();
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Mot de passe actuel incorrect.'], 401);
        }

        $user->update(['password' => Hash::make($request->new_password)]);
        return response()->json(['message' => 'Mot de passe mis a jour.']);
    }

    // ── DELETE /api/auth/delete-account ──────────────────────
    public function deleteAccount(Request $request)
    {
        $request->validate(['password' => 'required|string']);
        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Mot de passe incorrect.'], 401);
        }

        $user->tokens()->delete();
        $user->delete();
        return response()->json(['message' => 'Compte supprime.']);
    }

    // ── PATCH /api/auth/deactivate-account ───────────────────
    public function deactivateAccount(Request $request)
    {
        $request->validate(['password' => 'required|string']);
        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Mot de passe incorrect.'], 401);
        }

        // On ne change pas status (ENUM MySQL) — on utilise uniquement is_active
        $user->update(['is_active' => false]);
        $user->tokens()->delete();

        return response()->json(['message' => 'Compte desactive. Contactez un administrateur pour le reactiver.']);
    }

    // ── PATCH /api/auth/toggle-user-status/{id} (directeur) ──
    public function toggleUserStatus(Request $request, $id)
    {
        $me = $request->user();
        if ($me->role !== 'directeur') return response()->json(['message' => 'Acces refuse.'], 403);

        $user = User::where('id', $id)->where('hospital_id', $me->hospital_id)->firstOrFail();
        $newActive = !$user->is_active;

        // On ne touche pas à status (ENUM MySQL) — is_active suffit pour bloquer la connexion
        $user->update(['is_active' => $newActive]);

        if (!$newActive) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message'   => $newActive ? 'Compte active.' : 'Compte desactive.',
            'is_active' => $newActive,
            'status'    => $user->status,
        ]);
    }

    // ── GET /api/auth/pending-users (directeur) ───────────────
    public function pendingUsers(Request $request)
    {
        $me = $request->user();
        if ($me->role !== 'directeur') return response()->json(['message' => 'Acces refuse.'], 403);

        $users = User::where('hospital_id', $me->hospital_id)
            ->where('status', 'pending')
            ->with('service:id,name')
            ->get()
            ->map(fn($u) => [
                'id'         => $u->id,
                'name'       => "Dr. {$u->prenom} {$u->nom}",
                'email'      => $u->email,
                'phone'      => $u->phone,
                'service'    => $u->service?->name,
                'created_at' => $u->created_at?->format('d/m/Y'),
                'has_face'   => !empty($u->face_embedding),
            ]);

        return response()->json($users);
    }

    // ── POST /api/auth/approve-user/{id} ─────────────────────
    public function approveUser(Request $request, $id)
    {
        $me = $request->user();
        if ($me->role !== 'directeur') return response()->json(['message' => 'Acces refuse.'], 403);

        $user = User::where('id', $id)->where('hospital_id', $me->hospital_id)->firstOrFail();
        $action = $request->input('action', 'approve');

        $user->update([
            'status'    => $action === 'approve' ? 'active' : 'rejected',
            'is_active' => $action === 'approve',
        ]);

        return response()->json(['message' => $action === 'approve' ? 'Compte approuve.' : 'Compte rejete.']);
    }

    // ── DELETE /api/auth/delete-user/{id} (directeur) ────────
    public function deleteUser(Request $request, $id)
    {
        $me = $request->user();
        if ($me->role !== 'directeur') return response()->json(['message' => 'Acces refuse.'], 403);

        $user = User::where('id', $id)->where('hospital_id', $me->hospital_id)->firstOrFail();
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Compte supprime.']);
    }

    // ── GET /api/auth/all-users (directeur) ──────────────────
    public function allUsers(Request $request)
    {
        $me = $request->user();
        if ($me->role !== 'directeur') return response()->json(['message' => 'Acces refuse.'], 403);

        $users = User::where('hospital_id', $me->hospital_id)
            ->where('id', '!=', $me->id)
            ->with('service:id,name')
            ->get()
            ->map(fn($u) => [
                'id'         => $u->id,
                'name'       => "Dr. {$u->prenom} {$u->nom}",
                'email'      => $u->email,
                'role'       => $u->role,
                'status'     => $u->status ?? 'active',
                'is_active'  => (bool) $u->is_active,
                'service'    => $u->service?->name,
                'has_face'   => !empty($u->face_embedding),
                'created_at' => $u->created_at?->format('d/m/Y'),
            ]);

        return response()->json($users);
    }

    // ── Format utilisateur ────────────────────────────────────
    private function formatUser(User $user): array
    {
        return [
            'id'          => $user->id,
            'name'        => $user->name,
            'nom'         => $user->nom,
            'prenom'      => $user->prenom,
            'email'       => $user->email,
            'role'        => $user->role,
            'status'      => $user->status ?? 'active',
            'is_active'   => $user->is_active,
            'phone'       => $user->phone ?? null,
            'has_face'    => !empty($user->face_embedding),
            'hospital_id' => $user->hospital_id,
            'service_id'  => $user->service_id,
            'hospital'    => $user->hospital ? ['id' => $user->hospital->id, 'name' => $user->hospital->name] : null,
            'service'     => $user->service  ? ['id' => $user->service->id,  'name' => $user->service->name]  : null,
        ];
    }
}