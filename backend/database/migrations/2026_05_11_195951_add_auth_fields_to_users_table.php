<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['directeur', 'chef_service'])->default('chef_service')->after('email');
            $table->unsignedBigInteger('hospital_id')->nullable()->after('role');
            $table->unsignedBigInteger('service_id')->nullable()->after('hospital_id');
            $table->string('nom', 100)->nullable()->after('service_id');
            $table->string('prenom', 100)->nullable()->after('nom');
            $table->boolean('is_active')->default(true)->after('prenom');
            $table->foreign('hospital_id')->references('id')->on('hospitals')->onDelete('set null');
            $table->foreign('service_id')->references('id')->on('services')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['hospital_id']);
            $table->dropForeign(['service_id']);
            $table->dropColumn(['role','hospital_id','service_id','nom','prenom','is_active']);
        });
    }
};