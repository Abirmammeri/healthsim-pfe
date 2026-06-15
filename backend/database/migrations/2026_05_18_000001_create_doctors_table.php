<?php
// database/migrations/2026_05_18_000001_create_doctors_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained()->onDelete('cascade');
            $table->foreignId('service_id')->constrained()->onDelete('cascade');

            // Identité
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email')->nullable()->unique();
            $table->string('telephone', 20)->nullable();

            // Profil médical
            $table->string('specialite', 150);
            $table->enum('grade', [
                'interne',
                'resident',
                'specialiste',
                'maitre_assistant',
                'professeur',
            ])->default('specialiste');

            // Charge de travail
            $table->integer('heures_travail_semaine')->default(40);   // heures contractuelles/semaine
            $table->integer('heures_travail_effectuees')->default(0); // heures réelles ce mois
            $table->integer('nb_patients_charge')->default(0);        // patients actuellement en charge
            $table->integer('nb_gardes_mois')->default(0);            // gardes ce mois

            // Statut
            $table->enum('statut', [
                'disponible',
                'en_garde',
                'en_conge',
                'absent',
                'en_formation',
            ])->default('disponible');

            $table->date('date_recrutement')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['service_id', 'statut']);
            $table->index(['hospital_id', 'grade']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctors');
    }
};