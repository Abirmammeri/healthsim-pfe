<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_equipments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade');
            $table->string('nom');
            $table->integer('quantite');
            $table->integer('patients_par_jour');
            $table->float('duree_utilisation_min');
            $table->float('duree_utilisation_max');
            $table->string('statut')->default('operational');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_equipments');
    }
};
