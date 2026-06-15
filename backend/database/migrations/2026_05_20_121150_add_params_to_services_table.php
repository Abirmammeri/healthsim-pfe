<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->float('dms_min_jours')->default(1);
            $table->float('dms_max_jours')->default(60);
            $table->float('consultation_min_min')->default(10);
            $table->float('consultation_max_min')->default(30);
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['dms_min_jours', 'dms_max_jours', 'consultation_min_min', 'consultation_max_min']);
        });
    }
};