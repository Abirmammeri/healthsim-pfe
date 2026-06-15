<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('code')->nullable()->after('name');
            $table->enum('type', [
                'urgences', 'chirurgie', 'medecine_interne',
                'cardiologie', 'pediatrie', 'maternite',
                'reanimation', 'radiologie', 'laboratoire',
                'psychiatrie', 'orthopedie', 'neurologie', 'autre'
            ])->default('autre')->after('code');
            $table->enum('status', [
                'normal', 'medium', 'high', 'critical'
            ])->default('normal')->after('type');
            $table->float('dms_heures')->default(96)->after('available_beds');
            $table->integer('simulation_hours')->default(24)->after('dms_heures');
            $table->integer('salaire_medecin')->default(180000)->after('simulation_hours');
            $table->integer('salaire_infirmier')->default(80000)->after('salaire_medecin');
            $table->integer('cout_medicament_unit')->default(1500)->after('salaire_infirmier');
            $table->integer('cout_maintenance_eq')->default(50000)->after('cout_medicament_unit');
            $table->integer('score_distribution_eq')->default(80)->after('cout_maintenance_eq');
            $table->integer('score_gestion_dechets')->default(85)->after('score_distribution_eq');
            $table->float('mortalite_base')->default(1.5)->after('score_gestion_dechets');
            $table->integer('nb_patients_mois')->default(0)->after('mortalite_base');
            $table->integer('nb_deces_mois')->default(0)->after('nb_patients_mois');
            $table->integer('nb_infections_mois')->default(0)->after('nb_deces_mois');
            $table->integer('nb_transferts_mois')->default(0)->after('nb_infections_mois');
            $table->integer('nb_readmissions_mois')->default(0)->after('nb_transferts_mois');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn([
                'code', 'type', 'status',
                'dms_heures', 'simulation_hours',
                'salaire_medecin', 'salaire_infirmier',
                'cout_medicament_unit', 'cout_maintenance_eq',
                'score_distribution_eq', 'score_gestion_dechets',
                'mortalite_base',
                'nb_patients_mois', 'nb_deces_mois',
                'nb_infections_mois', 'nb_transferts_mois',
                'nb_readmissions_mois',
            ]);
        });
    }
};