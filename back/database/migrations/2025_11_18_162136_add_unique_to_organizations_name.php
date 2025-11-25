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
        Schema::table('organizations', function (Blueprint $table) {
            // Verificar si el índice ya existe antes de crearlo
            $indexExists = false;
            $connection = Schema::getConnection();
            $database = $connection->getDatabaseName();
            
            if ($connection->getDriverName() === 'sqlite') {
                // Para SQLite, verificar en sqlite_master
                $indexes = $connection->select(
                    "SELECT name FROM sqlite_master WHERE type='index' AND name='organizations_name_unique'"
                );
                $indexExists = count($indexes) > 0;
            } else {
                // Para otros motores de base de datos
                $indexExists = Schema::hasIndex('organizations', 'organizations_name_unique');
            }
            
            if (!$indexExists) {
                $table->unique('name', 'organizations_name_unique');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropUnique(['name']);
        });
    }
};
