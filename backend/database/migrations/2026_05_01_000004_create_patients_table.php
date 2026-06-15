<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('code_patient')->unique();
            $table->integer('age')->nullable();
            $table->enum('sexe', ['M', 'F', 'autre'])->nullable();
            $table->string('wilaya_origine')->nullable();
            $table->timestamps();
        });

        Schema::create('admissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');
            $table->foreignId('service_id')->constrained()->onDelete('cascade');
            $table->foreignId('hospital_id')->constrained()->onDelete('cascade');

            // Timing
            $table->dateTime('date_admission');
            $table->dateTime('date_triage')->nullable();
            $table->dateTime('date_prise_charge')->nullable();
            $table->dateTime('date_sortie')->nullable();

            // Champs calculés
            $table->float('temps_attente_min')->nullable();
            $table->float('duree_sejour_h')->nullable();

            // Type et statut
            $table->enum('type_admission', [
                'urgence', 'programmee',
                'transfert_entrant', 'readmission'
            ])->default('urgence');

            $table->enum('statut', [
                'en_cours', 'sorti_gueri', 'sorti_ameliore',
                'transfere', 'deces', 'sorti_contre_avis'
            ])->default('en_cours');

            // Réadmission (A3)
            $table->boolean('is_readmission')->default(false);
            $table->unsignedBigInteger('admission_precedente_id')->nullable();
            $table->foreign('admission_precedente_id')
                  ->references('id')->on('admissions')
                  ->nullOnDelete();
            $table->integer('delai_readmission_j')->nullable();

            // Mortalité (C3)
            $table->boolean('is_deces')->default(false);
            $table->string('cause_deces')->nullable();
            $table->boolean('deces_evitable')->nullable();

            // Infection (C4)
            $table->boolean('infection_nosocomiale')->default(false);
            $table->string('type_infection')->nullable();
            $table->dateTime('date_diagnostic_infection')->nullable();

            // Transfert (A9)
            $table->unsignedBigInteger('transfert_vers_hospital_id')->nullable();
            $table->foreign('transfert_vers_hospital_id')
                  ->references('id')->on('hospitals')
                  ->nullOnDelete();
            $table->enum('motif_transfert', [
                'saturation', 'manque_specialite',
                'manque_equipement', 'autre'
            ])->nullable();

            // Diagnostic
            $table->string('diagnostic_principal', 10)->nullable();
            $table->string('diagnostic_libelle')->nullable();

            $table->timestamps();

            $table->index(['service_id', 'date_admission']);
            $table->index(['hospital_id', 'date_admission']);
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admissions');
        Schema::dropIfExists('patients');
    }
};