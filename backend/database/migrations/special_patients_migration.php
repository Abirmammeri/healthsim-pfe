<?php
// database/migrations/2026_05_17_000001_create_special_patients_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('special_patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->onDelete('cascade');
            $table->foreignId('hospital_id')->constrained()->onDelete('cascade');

            // Informations patient (anonymisées)
            $table->string('code_patient')->unique(); // ex: SP-2026-001
            $table->string('type_cas');               // ex: 'prediabete', 'chronique', 'autre'
            $table->text('description')->nullable();

            // Durée de séjour réelle (3-6 mois)
            $table->integer('dms_heures');            // durée en heures
            $table->date('date_admission');
            $table->date('date_sortie_prevue')->nullable();
            $table->date('date_sortie_reelle')->nullable();

            // Statut
            $table->enum('statut', ['en_cours', 'sorti', 'transfere'])->default('en_cours');

            // Exclusion explicite des KPI
            $table->boolean('exclu_kpi')->default(true);
            $table->text('raison_exclusion')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['service_id', 'statut']);
            $table->index(['hospital_id', 'type_cas']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('special_patients');
    }
};