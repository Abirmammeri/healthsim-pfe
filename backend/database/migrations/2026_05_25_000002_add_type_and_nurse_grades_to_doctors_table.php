<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1 — Ajouter la colonne type (medecin | infirmier)
        Schema::table('doctors', function (Blueprint $table) {
            $table->enum('type', ['medecin', 'infirmier'])
                  ->default('medecin')
                  ->after('hospital_id');

            // specialite devient nullable pour les infirmiers
            $table->string('specialite', 150)->nullable()->change();
        });

        // 2 — Étendre grade pour accepter les grades infirmiers
        DB::statement("
            ALTER TABLE doctors
            MODIFY COLUMN grade ENUM(
                'interne','resident','specialiste','maitre_assistant','professeur',
                'infirmier','infirmier_chef','infirmier_specialise'
            ) NOT NULL DEFAULT 'specialiste'
        ");

        // 3 — Marquer tous les enregistrements existants comme médecins
        DB::table('doctors')->update(['type' => 'medecin']);
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE doctors
            MODIFY COLUMN grade ENUM(
                'interne','resident','specialiste','maitre_assistant','professeur'
            ) NOT NULL DEFAULT 'specialiste'
        ");

        Schema::table('doctors', function (Blueprint $table) {
            $table->dropColumn('type');
            $table->string('specialite', 150)->nullable(false)->change();
        });
    }
};
