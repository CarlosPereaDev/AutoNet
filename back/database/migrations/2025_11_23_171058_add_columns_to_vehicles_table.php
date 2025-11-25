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
        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('name')->after('id');
            $table->string('plate', 20)->after('name');
            $table->string('brand', 100)->nullable()->after('plate');
            $table->string('model', 100)->nullable()->after('brand');
            $table->integer('year')->nullable()->after('model');
            $table->foreignId('organization_id')->after('year');
            $table->decimal('current_mileage', 10, 2)->nullable()->after('organization_id');
            $table->decimal('current_fuel_level', 5, 2)->nullable()->after('current_mileage');
            $table->string('status', 20)->default('active')->after('current_fuel_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn([
                'name',
                'plate',
                'brand',
                'model',
                'year',
                'organization_id',
                'current_mileage',
                'current_fuel_level',
                'status'
            ]);
        });
    }
};
