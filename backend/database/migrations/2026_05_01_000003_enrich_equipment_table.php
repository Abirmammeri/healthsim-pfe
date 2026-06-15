<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->string('reference')->nullable()->after('type');
            $table->string('marque')->nullable()->after('reference');
            $table->string('modele')->nullable()->after('marque');
            $table->date('date_acquisition')->nullable()->after('status');
            $table->date('date_derniere_maintenance')->nullable()->after('date_acquisition');
            $table->date('date_prochaine_maintenance')->nullable()->after('date_derniere_maintenance');
            $table->integer('cout_maintenance_annuel')->default(0)->after('date_prochaine_maintenance');
            $table->bigInteger('valeur_achat')->default(0)->after('cout_maintenance_annuel');
            $table->integer('duree_amortissement')->default(10)->after('valeur_achat');
        });
    }

    public function down(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->dropColumn([
                'reference', 'marque', 'modele',
                'date_acquisition', 'date_derniere_maintenance',
                'date_prochaine_maintenance', 'cout_maintenance_annuel',
                'valeur_achat', 'duree_amortissement',
            ]);
        });
    }
};