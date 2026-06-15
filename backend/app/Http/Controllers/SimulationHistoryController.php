<?php
// app/Http/Controllers/SimulationHistoryController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SimulationHistoryController extends Controller
{
    // ── GET /api/simulation-history ──────────────────────────
    public function index(Request $request)
    {
        $user = $request->user();

        $history = DB::table('simulation_history')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($row) {
                return [
                    'id'            => $row->id,
                    'scenario_name' => $row->scenario_name,
                    'hospital_id'   => $row->hospital_id,
                    'created_at'    => $row->created_at,
                    'input_data'    => json_decode($row->input_data, true),
                    'result_data'   => json_decode($row->result_data, true),
                    'changes_data'  => $row->changes_data ? json_decode($row->changes_data, true) : null,
                ];
            });

        return response()->json($history);
    }

    // ── POST /api/simulation-history ─────────────────────────
    public function store(Request $request)
    {
        $request->validate([
            'scenario_name' => 'required|string',
            'hospital_id'   => 'nullable|integer',
            'input_data'    => 'required|array',
            'result_data'   => 'nullable|array',
            'changes_data'  => 'nullable|array',
        ]);

        $user = $request->user();
        $hospitalId = $request->hospital_id ?? ($request->input_data['hospital_id'] ?? null);

        $id = DB::table('simulation_history')->insertGetId([
            'user_id'       => $user->id,
            'hospital_id'   => $hospitalId,
            'scenario_name' => $request->scenario_name,
            'input_data'    => json_encode($request->input_data),
            'result_data'   => $request->result_data !== null ? json_encode($request->result_data) : null,
            'changes_data'  => $request->changes_data ? json_encode($request->changes_data) : null,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        return response()->json(['id' => $id, 'message' => 'Simulation sauvegardee.']);
    }

    // ── GET /api/simulation-history/{id} ─────────────────────
    public function show(Request $request, $id)
    {
        $user = $request->user();

        $row = DB::table('simulation_history')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$row) {
            return response()->json(['message' => 'Simulation non trouvee.'], 404);
        }

        return response()->json([
            'id'            => $row->id,
            'scenario_name' => $row->scenario_name,
            'hospital_id'   => $row->hospital_id,
            'created_at'    => $row->created_at,
            'input_data'    => json_decode($row->input_data, true),
            'result_data'   => json_decode($row->result_data, true),
            'changes_data'  => $row->changes_data ? json_decode($row->changes_data, true) : null,
        ]);
    }

    // ── DELETE /api/simulation-history/{id} ──────────────────
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        DB::table('simulation_history')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->delete();

        return response()->json(['message' => 'Simulation supprimee.']);
    }
}