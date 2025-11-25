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
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('vehicle_id')->nullable()->after('assigned_to')->constrained('vehicles')->onDelete('set null');
            $table->foreignId('machinery_id')->nullable()->after('vehicle_id')->constrained('machineries')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['vehicle_id']);
            $table->dropForeign(['machinery_id']);
            $table->dropColumn(['vehicle_id', 'machinery_id']);
        });
    }
};
