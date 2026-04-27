<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HospitalController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\SimulationController;

// Hospitals
Route::get('/hospitals', [HospitalController::class, 'index']);
Route::get('/hospitals/{id}/dashboard', [HospitalController::class, 'dashboard']);
Route::get('/summary', [HospitalController::class, 'summary']);

// Services
Route::get('/hospitals/{hospitalId}/services', [ServiceController::class, 'index']);
Route::post('/hospitals/{hospitalId}/services', [ServiceController::class, 'store']);
Route::delete('/services/{id}', [ServiceController::class, 'destroy']);
Route::post('/services/{id}/transfer-staff', [ServiceController::class, 'transferStaff']);

// Equipment
Route::post('/services/{serviceId}/equipment', [EquipmentController::class, 'store']);
Route::post('/services/{serviceId}/transfer-equipment', [EquipmentController::class, 'transfer']);

// Alerts
Route::get('/alerts', [AlertController::class, 'index']);
Route::get('/hospitals/{hospitalId}/alerts', [AlertController::class, 'byHospital']);
Route::post('/hospitals/{hospitalId}/alerts', [AlertController::class, 'store']);
Route::put('/alerts/{id}/read', [AlertController::class, 'markAsRead']);

// Simulations
Route::get('/simulations', [SimulationController::class, 'index']);
Route::post('/simulations', [SimulationController::class, 'store']);