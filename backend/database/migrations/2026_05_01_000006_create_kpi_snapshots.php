<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kpi_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->onDelete('cascade');
            $table->foreignId('hospital_id')->constrained()->onDelete('cascade');
            $table->date('periode');
            $table->enum('type_periode', [
                'journalier', 'hebdomadaire', 'mensuel'
            ])->default('mensuel');

            // SSI
            $table->float('A2_dms_jours')->nullable();
            $table->float('A4_temps_attente')->nullable();
            $table->float('A8_lits_vacants')->nullable();
            $table->float('A9_taux_transfert')->nullable();

            // IIP
            $table->float('C2_occupation_lits')->nullable();
            $table->float('C3_mortalite')->nullable();
            $table->float('C4_infection')->nullable();

            // ESI
            $table->float('B1_cout_moyen_soins')->nullable();
            $table->float('B4_cout_par_lit')->nullable();
            $table->float('B5_cout_med_eq')->nullable();
            $table->float('B7_cout_personnel')->nullable();

            // TI
            $table->float('D5_distribution_eq')->nullable();
            $table->float('D11_gestion_dechets')->nullable();
            $table->integer('D12_localisation')->nullable();
            $table->integer('D13_air_interieur')->nullable();
            $table->integer('D14_acoustique')->nullable();

            // DES
            $table->float('lambda_rate')->nullable();
            $table->float('mu_rate')->nullable();
            $table->float('rho_doctors')->nullable();
            $table->float('rho_beds')->nullable();
            $table->integer('active_patients')->nullable();
            $table->integer('nb_doctors')->nullable();
            $table->integer('nb_nurses')->nullable();
            $table->integer('nb_beds')->nullable();

            $table->enum('statut_global', [
                'normal', 'attention', 'critique'
            ])->default('normal');

            $table->timestamps();
            $table->unique(['service_id', 'periode', 'type_periode']);
            $table->index(['hospital_id', 'periode']);
        });

        Schema::table('simulations', function (Blueprint $table) {
            $table->integer('input_active_patients')->default(0)->after('scenario_name');
            $table->integer('input_target_doctors')->default(0)->after('input_active_patients');
            $table->integer('input_target_nurses')->default(0)->after('input_target_doctors');
            $table->integer('input_target_beds')->default(0)->after('input_target_nurses');
            $table->integer('input_available_eq')->default(0)->after('input_target_beds');
            $table->integer('input_current_doctors')->default(0)->after('input_available_eq');
            $table->integer('input_current_nurses')->default(0)->after('input_current_doctors');
            $table->integer('input_current_beds')->default(0)->after('input_current_nurses');
            $table->integer('input_current_eq')->default(0)->after('input_current_beds');

            // KPIs AVANT
            $table->float('before_waiting_time')->nullable()->after('input_current_eq');
            $table->float('before_bed_occupancy')->nullable()->after('before_waiting_time');
            $table->float('before_resource_util')->nullable()->after('before_bed_occupancy');
            $table->float('before_throughput')->nullable()->after('before_resource_util');
            $table->float('before_coverage')->nullable()->after('before_throughput');
            $table->float('before_rho_doctors')->nullable()->after('before_coverage');
            $table->float('before_rho_beds')->nullable()->after('before_rho_doctors');

            // KPIs APRÈS
            $table->float('after_waiting_time')->nullable()->after('before_rho_beds');
            $table->float('after_bed_occupancy')->nullable()->after('after_waiting_time');
            $table->float('after_resource_util')->nullable()->after('after_bed_occupancy');
            $table->float('after_throughput')->nullable()->after('after_resource_util');
            $table->float('after_coverage')->nullable()->after('after_throughput');
            $table->float('after_rho_doctors')->nullable()->after('after_coverage');
            $table->float('after_rho_beds')->nullable()->after('after_rho_doctors');

            // KPIs enrichis SSI
            $table->float('after_A2_dms')->nullable()->after('after_rho_beds');
            $table->float('after_A4_temps_attente')->nullable()->after('after_A2_dms');
            $table->float('after_A8_lits_vacants')->nullable()->after('after_A4_temps_attente');
            $table->float('after_A9_transfert')->nullable()->after('after_A8_lits_vacants');

            // KPIs enrichis IIP
            $table->float('after_C2_occupation')->nullable()->after('after_A9_transfert');
            $table->float('after_C3_mortalite')->nullable()->after('after_C2_occupation');
            $table->float('after_C4_infection')->nullable()->after('after_C3_mortalite');

            // KPIs enrichis ESI
            $table->float('after_B1_cout_soins')->nullable()->after('after_C4_infection');
            $table->float('after_B4_cout_lit')->nullable()->after('after_B1_cout_soins');
            $table->float('after_B5_cout_med_eq')->nullable()->after('after_B4_cout_lit');
            $table->float('after_B7_cout_personnel')->nullable()->after('after_B5_cout_med_eq');

            // KPIs enrichis TI
            $table->float('after_D5_distribution')->nullable()->after('after_B7_cout_personnel');
            $table->float('after_D11_dechets')->nullable()->after('after_D5_distribution');
            $table->float('after_D12_localisation')->nullable()->after('after_D11_dechets');
            $table->float('after_D13_air')->nullable()->after('after_D12_localisation');
            $table->float('after_D14_acoustique')->nullable()->after('after_D13_air');

            // JSON
            $table->json('projections')->nullable()->after('after_D14_acoustique');
            $table->json('recommendations')->nullable()->after('projections');
            $table->json('scenario_changes')->nullable()->after('recommendations');

            // Statut
            $table->enum('statut', [
                'brouillon', 'applique', 'archive'
            ])->default('brouillon')->after('scenario_changes');
            $table->string('created_by')->nullable()->after('statut');
            $table->dateTime('applied_at')->nullable()->after('created_by');
            $table->text('description')->nullable()->after('applied_at');
        });

        Schema::create('simulation_service_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('simulation_id')->constrained()->onDelete('cascade');
            $table->foreignId('service_id')->constrained()->onDelete('cascade');
            $table->integer('service_doctors')->nullable();
            $table->integer('service_nurses')->nullable();
            $table->integer('service_beds')->nullable();
            $table->integer('service_patients')->nullable();
            $table->integer('service_equipment')->nullable();
            $table->float('service_dms_heures')->nullable();

            // SSI
            $table->float('A2_dms')->nullable();
            $table->float('A4_temps_attente')->nullable();
            $table->float('A8_lits_vacants')->nullable();
            $table->float('A9_taux_transfert')->nullable();

            // IIP
            $table->float('C2_occupation')->nullable();
            $table->float('C3_mortalite')->nullable();
            $table->float('C4_infection')->nullable();

            // ESI
            $table->float('B1_cout_soins')->nullable();
            $table->float('B4_cout_lit')->nullable();
            $table->float('B5_cout_med_eq')->nullable();
            $table->float('B7_cout_personnel')->nullable();

            // TI
            $table->float('D5_distribution_eq')->nullable();
            $table->float('D11_dechets')->nullable();
            $table->float('D12_localisation')->nullable();
            $table->float('D13_air')->nullable();
            $table->float('D14_acoustique')->nullable();

            $table->enum('statut_service', [
                'normal', 'attention', 'critique'
            ])->default('normal');

            $table->float('lambda_rate')->nullable();
            $table->float('mu_rate')->nullable();
            $table->float('rho_doctors')->nullable();
            $table->float('rho_beds')->nullable();
            $table->float('erlang_pw')->nullable();
            $table->float('wq_hours')->nullable();

            $table->timestamps();
            $table->index('simulation_id');
            $table->index('service_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simulation_service_snapshots');
        Schema::dropIfExists('kpi_snapshots');
        Schema::table('simulations', function (Blueprint $table) {
            $table->dropColumn([
                'input_active_patients', 'input_target_doctors',
                'input_target_nurses', 'input_target_beds',
                'input_available_eq', 'input_current_doctors',
                'input_current_nurses', 'input_current_beds', 'input_current_eq',
                'before_waiting_time', 'before_bed_occupancy',
                'before_resource_util', 'before_throughput',
                'before_coverage', 'before_rho_doctors', 'before_rho_beds',
                'after_waiting_time', 'after_bed_occupancy',
                'after_resource_util', 'after_throughput',
                'after_coverage', 'after_rho_doctors', 'after_rho_beds',
                'after_A2_dms', 'after_A4_temps_attente',
                'after_A8_lits_vacants', 'after_A9_transfert',
                'after_C2_occupation', 'after_C3_mortalite', 'after_C4_infection',
                'after_B1_cout_soins', 'after_B4_cout_lit',
                'after_B5_cout_med_eq', 'after_B7_cout_personnel',
                'after_D5_distribution', 'after_D11_dechets',
                'after_D12_localisation', 'after_D13_air', 'after_D14_acoustique',
                'projections', 'recommendations', 'scenario_changes',
                'statut', 'created_by', 'applied_at', 'description',
            ]);
        });
    }
};