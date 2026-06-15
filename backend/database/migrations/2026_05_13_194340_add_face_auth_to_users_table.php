<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('face_embedding')->nullable()->after('is_active');
            $table->string('phone', 20)->nullable()->after('face_embedding');
            $table->string('otp_code', 6)->nullable()->after('phone');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
            $table->enum('status', ['pending', 'active', 'rejected'])->default('pending')->after('otp_expires_at');
            $table->string('avatar')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['face_embedding','phone','otp_code','otp_expires_at','status','avatar']);
        });
    }
};