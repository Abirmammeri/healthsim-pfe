<?php
// database/migrations/2026_05_25_000001_create_infirmiers_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('infirmiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained()->onDelete('cascade');
            $table->foreignId('service_id')->constrained()->onDelete('cascade');

            // Identité
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email')->nullable()->unique();
            $table->string('telephone', 20)->nullable();

            // Profil
            $table->string('specialite', 150)->nullable();
            $table->enum('grade', [
                'infirmier',
                'infirmier_chef',
                'infirmier_specialise',
            ])->default('infirmier');

            // Charge de travail
            $table->integer('heures_travail_semaine')->default(40);
            $table->integer('heures_travail_effectuees')->default(0);
            $table->integer('nb_patients_charge')->default(0);
            $table->integer('nb_gardes_mois')->default(0);

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
        Schema::dropIfExists('infirmiers');
    }
};
