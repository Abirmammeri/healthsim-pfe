<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->integer('lambda_patients_jour')->default(50)->after('equip_max_min');
        });

        // Étape 2 : initialiser tous les services existants à 50
        DB::table('services')->update(['lambda_patients_jour' => 50]);
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('lambda_patients_jour');
        });
    }
};
