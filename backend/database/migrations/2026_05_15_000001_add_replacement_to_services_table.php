<?php
// database/migrations/2026_05_15_000001_add_replacement_to_services_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->unsignedBigInteger('replacement_user_id')->nullable()->after('head');
            $table->timestamp('replacement_until')->nullable()->after('replacement_user_id');
            $table->string('replacement_reason')->nullable()->after('replacement_until');
            $table->foreign('replacement_user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropForeign(['replacement_user_id']);
            $table->dropColumn(['replacement_user_id', 'replacement_until', 'replacement_reason']);
        });
    }
};