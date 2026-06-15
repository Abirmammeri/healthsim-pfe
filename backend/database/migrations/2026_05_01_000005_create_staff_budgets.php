<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained()->onDelete('cascade');
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();
            $table->string('matricule')->unique()->nullable();
            $table->string('nom');
            $table->string('prenom');
            $table->enum('type', [
                'medecin_specialiste', 'medecin_generaliste',
                'infirmier', 'aide_soignant', 'administratif'
            ]);
            $table->string('specialite')->nullable();
            $table->enum('statut', [
                'actif', 'conge', 'formation', 'absent', 'retraite'
            ])->default('actif');
            $table->integer('salaire')->default(0);
            $table->timestamps();
            $table->index(['hospital_id', 'type']);
            $table->index(['service_id', 'statut']);
        });

        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('admission_id')->nullable();
            $table->foreign('admission_id')
                  ->references('id')->on('admissions')
                  ->nullOnDelete();
            $table->enum('type', [
                'erreur_medication', 'erreur_clinique',
                'erreur_medicale', 'chute_patient',
                'infection', 'autre'
            ]);
            $table->text('description')->nullable();
            $table->enum('gravite', [
                'mineur', 'modere', 'grave', 'fatal'
            ])->nullable();
            $table->boolean('evitable')->default(true);
            $table->text('mesure_corrective')->nullable();
            $table->boolean('resolu')->default(false);
            $table->dateTime('date_incident');
            $table->timestamps();
            $table->index(['service_id', 'type']);
        });

        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained()->onDelete('cascade');
            $table->integer('annee');
            $table->bigInteger('budget_total')->default(0);
            $table->bigInteger('budget_personnel')->default(0);
            $table->bigInteger('budget_medicaments')->default(0);
            $table->bigInteger('budget_equipements')->default(0);
            $table->bigInteger('budget_maintenance')->default(0);
            $table->bigInteger('budget_energie')->default(0);
            $table->bigInteger('budget_autre')->default(0);
            $table->enum('statut', [
                'previsionnel', 'approuve', 'execute'
            ])->default('previsionnel');
            $table->timestamps();
            $table->unique(['hospital_id', 'annee']);
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->onDelete('cascade');
            $table->foreignId('hospital_id')->constrained()->onDelete('cascade');
            $table->integer('mois');
            $table->integer('annee');
            $table->bigInteger('cout_personnel')->default(0);
            $table->bigInteger('cout_medicaments')->default(0);
            $table->bigInteger('cout_equipements')->default(0);
            $table->bigInteger('cout_maintenance')->default(0);
            $table->bigInteger('cout_energie')->default(0);
            $table->bigInteger('cout_autre')->default(0);
            $table->bigInteger('cout_total')->default(0);
            $table->integer('nb_patients_mois')->default(0);
            $table->float('cout_moyen_patient')->default(0);
            $table->float('cout_par_lit_jour')->default(0);
            $table->timestamps();
            $table->unique(['service_id', 'mois', 'annee']);
            $table->index(['hospital_id', 'annee', 'mois']);
        });

        Schema::create('equipment_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('from_service_id')->nullable();
            $table->foreign('from_service_id')
                  ->references('id')->on('services')
                  ->nullOnDelete();
            $table->unsignedBigInteger('to_service_id')->nullable();
            $table->foreign('to_service_id')
                  ->references('id')->on('services')
                  ->nullOnDelete();
            $table->integer('quantity')->default(1);
            $table->string('motif')->nullable();
            $table->enum('statut', [
                'planifie', 'effectue', 'annule'
            ])->default('planifie');
            $table->dateTime('date_transfert')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_transfers');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('budgets');
        Schema::dropIfExists('incidents');
        Schema::dropIfExists('staff');
    }
};