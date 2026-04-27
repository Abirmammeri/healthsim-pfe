<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
{
    Schema::create('alerts', function (Blueprint $table) {
        $table->id();
        $table->foreignId('hospital_id')->constrained()->onDelete('cascade');
        $table->string('title');
        $table->text('message');
        $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
        $table->enum('type', ['saturation', 'personnel', 'equipment', 'general'])->default('general');
        $table->boolean('is_read')->default(false);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
