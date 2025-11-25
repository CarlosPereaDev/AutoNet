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
        Schema::table('machineries', function (Blueprint $table) {
            $table->string('name')->after('id');
            $table->string('type', 100)->nullable()->after('name');
            $table->string('brand', 100)->nullable()->after('type');
            $table->string('model', 100)->nullable()->after('brand');
            $table->string('serial_number', 100)->nullable()->after('model');
            $table->foreignId('organization_id')->after('serial_number');
            $table->decimal('current_hours', 10, 2)->nullable()->after('organization_id');
            $table->string('status', 20)->default('active')->after('current_hours');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('machineries', function (Blueprint $table) {
            $table->dropColumn([
                'name',
                'type',
                'brand',
                'model',
                'serial_number',
                'organization_id',
                'current_hours',
                'status'
            ]);
        });
    }
};
