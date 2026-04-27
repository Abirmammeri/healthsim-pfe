<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hospitals', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('address');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->integer('total_beds')->default(0);
            $table->integer('available_beds')->default(0);
            $table->integer('total_doctors')->default(0);
            $table->integer('total_nurses')->default(0);
            $table->integer('active_patients')->default(0);
            $table->enum('status', ['normal', 'charge_elevee', 'critique'])->default('normal');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hospitals');
    }
};
