<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simulations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained()->onDelete('cascade');
            $table->string('scenario_name');
            $table->integer('target_doctors')->default(0);
            $table->integer('target_nurses')->default(0);
            $table->integer('available_equipment')->default(0);
            $table->json('results_before')->nullable();
            $table->json('results_after')->nullable();
            $table->json('kpis')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simulations');
    }
};