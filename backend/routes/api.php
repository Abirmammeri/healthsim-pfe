<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HospitalController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\SimulationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\SimulationHistoryController;
use App\Http\Controllers\SpecialPatientController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\InfirmierController;

// ── AUTH PUBLIC ───────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login',               [AuthController::class, 'login']);
    Route::post('/login-face',          [AuthController::class, 'loginFace']);
    Route::post('/scan-face',           [AuthController::class, 'scanFace']);
    Route::post('/register',            [AuthController::class, 'register']);
    Route::post('/send-verification',   [AuthController::class, 'sendVerification']);
    Route::post('/verify-email',        [AuthController::class, 'verifyEmail']);
    Route::post('/forgot-password',     [AuthController::class, 'forgotPassword']);
    Route::post('/verify-otp',          [AuthController::class, 'verifyOtp']);
    Route::get('/hospitals',            [AuthController::class, 'hospitals']);
    Route::get('/free-services',        [ServiceController::class, 'freeServices']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout',            [AuthController::class, 'logout']);
        Route::post('/verify-password',   [AuthController::class, 'verifyPassword']);
        Route::get('/me',                 [AuthController::class, 'me']);
        Route::post('/register-face',     [AuthController::class, 'registerFace']);
        Route::delete('/delete-face',     [AuthController::class, 'deleteFace']);
        Route::put('/update-profile',     [AuthController::class, 'updateProfile']);
        Route::put('/change-email',       [AuthController::class, 'changeEmail']);
        Route::put('/change-password',    [AuthController::class, 'changePassword']);
        Route::delete('/delete-account',  [AuthController::class, 'deleteAccount']);
        Route::get('/pending-users',      [AuthController::class, 'pendingUsers']);
        Route::get('/all-users',          [AuthController::class, 'allUsers']);
        Route::post('/approve-user/{id}', [AuthController::class, 'approveUser']);
        Route::delete('/delete-user/{id}',[AuthController::class, 'deleteUser']);
    });
});

// ── ROUTES PROTÉGÉES ─────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/summary',                            [HospitalController::class, 'summary']);
    Route::get('/hospitals',                          [HospitalController::class, 'index']);
    Route::get('/hospitals/{id}',                     [HospitalController::class, 'show']);
    Route::put('/hospitals/{id}',                     [HospitalController::class, 'update']);
    Route::get('/hospitals/{id}/dashboard',           [HospitalController::class, 'dashboard']);
    Route::get('/hospitals/{id}/alerts',              [HospitalController::class, 'alerts']);
    Route::get('/hospitals/{hospitalId}/services',    [ServiceController::class, 'index']);
    Route::get('/services/{id}',                      [ServiceController::class, 'show']);
    Route::get('/services/{id}/kpis',                 [ServiceController::class, 'kpis']);
    Route::put('/services/{id}/kpi-terrain',          [ServiceController::class, 'updateKpiTerrain']);
    Route::post('/services/{id}/set-replacement',     [ServiceController::class, 'setReplacement']);
    Route::delete('/services/{id}/remove-replacement',[ServiceController::class, 'removeReplacement']);

    // Paramètres du service (DMS + consultation) — chef de service
    Route::get('/services/{id}/params',               [ServiceController::class, 'getParams']);
    Route::put('/services/{id}/params',               [ServiceController::class, 'updateParams']);

    // Équipements par service
    Route::get('/services/{serviceId}/equipments',    [ServiceController::class, 'getEquipments']);
    Route::put('/equipments/{id}',                    [ServiceController::class, 'updateEquipment']);

    // Transfert d'équipements entre services (NOUVEAU)
    Route::post('/services/{id}/transfer-equipment',  [ServiceController::class, 'transferEquipment']);

    // Transfert de personnel entre services
    Route::post('/services/{id}/transfer-staff',      [ServiceController::class, 'transferStaff']);

    Route::post('/simulate',                          [SimulationController::class, 'run']);
    Route::post('/simulate/realtime',                 [SimulationController::class, 'realtime']);
    Route::post('/hospitals/{id}/apply-scenario',     [HospitalController::class, 'applyScenario']);
    Route::get('/alerts',                             [HospitalController::class, 'allAlerts']);

    // Historique simulations
    Route::get('/simulation-history',         [SimulationHistoryController::class, 'index']);
    Route::post('/simulation-history',        [SimulationHistoryController::class, 'store']);
    Route::get('/simulation-history/{id}',    [SimulationHistoryController::class, 'show']);
    Route::delete('/simulation-history/{id}', [SimulationHistoryController::class, 'destroy']);

    // Cas particuliers (prédiabète) — exclus des KPI
    Route::get('/special-patients/types',    [SpecialPatientController::class, 'types']);
    Route::get('/special-patients',          [SpecialPatientController::class, 'index']);
    Route::post('/special-patients',         [SpecialPatientController::class, 'store']);
    Route::put('/special-patients/{id}',     [SpecialPatientController::class, 'update']);
    Route::delete('/special-patients/{id}',  [SpecialPatientController::class, 'destroy']);

    // Corps médical (by-service AVANT {id})
    Route::get('/doctors/by-service/{serviceId}', [DoctorController::class, 'byService']);
    Route::get('/doctors',                        [DoctorController::class, 'index']);
    Route::post('/doctors',                       [DoctorController::class, 'store']);
    Route::get('/doctors/{id}',                   [DoctorController::class, 'show']);
    Route::put('/doctors/{id}',                   [DoctorController::class, 'update']);
    Route::delete('/doctors/{id}',                [DoctorController::class, 'destroy']);

    // Corps infirmier
    Route::get('/nurses',        [InfirmierController::class, 'index']);
    Route::post('/nurses',       [InfirmierController::class, 'store']);
    Route::put('/nurses/{id}',   [InfirmierController::class, 'update']);
    Route::delete('/nurses/{id}',[InfirmierController::class, 'destroy']);

    Route::prefix('messaging')->group(function () {
        Route::get('/users',                       [MessageController::class, 'users']);
        Route::get('/conversations',               [MessageController::class, 'conversations']);
        Route::get('/conversations/{id}/messages', [MessageController::class, 'messages']);
        Route::post('/send',                       [MessageController::class, 'send']);
        Route::get('/unread',                      [MessageController::class, 'unread']);
    });
});