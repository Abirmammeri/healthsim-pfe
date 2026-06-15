<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            $table->string('code')->nullable()->unique()->after('name');
            $table->enum('type_hopital', [
                'CHU', 'EPH', 'EPSP', 'EHS', 'Clinique'
            ])->default('EPH')->after('code');
            $table->string('wilaya')->nullable()->after('type_hopital');
            $table->string('commune')->nullable()->after('wilaya');
            $table->enum('load_status', [
                'normal', 'medium', 'high', 'critical'
            ])->default('normal')->after('status');
            $table->bigInteger('budget_annuel')->default(500000000)->after('load_status');
            $table->integer('score_localisation')->default(80)->after('budget_annuel');
            $table->integer('score_air_interieur')->default(75)->after('score_localisation');
            $table->integer('score_acoustique')->default(70)->after('score_air_interieur');
        });
    }

    public function down(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            $table->dropColumn([
                'code', 'type_hopital', 'wilaya', 'commune',
                'load_status', 'budget_annuel',
                'score_localisation', 'score_air_interieur', 'score_acoustique',
            ]);
        });
    }
};