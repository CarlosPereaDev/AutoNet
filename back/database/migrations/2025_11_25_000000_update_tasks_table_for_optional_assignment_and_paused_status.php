<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            // SQLite no soporta MODIFY COLUMN ni ALTER COLUMN
            // Necesitamos recrear la tabla con la nueva estructura
            
            // Desactivar temporalmente las claves foráneas
            DB::statement('PRAGMA foreign_keys=OFF');
            
            // Crear tabla temporal con la nueva estructura
            DB::statement("
                CREATE TABLE tasks_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    status VARCHAR(255) NOT NULL DEFAULT 'pending',
                    priority VARCHAR(255) NOT NULL DEFAULT 'medium',
                    assigned_to INTEGER,
                    assigned_by INTEGER NOT NULL,
                    organization_id INTEGER NOT NULL,
                    vehicle_id INTEGER,
                    machinery_id INTEGER,
                    estimated_hours DECIMAL(8,2),
                    deadline DATE,
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
                    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
                    FOREIGN KEY (machinery_id) REFERENCES machineries(id) ON DELETE SET NULL
                )
            ");

            // Copiar datos de la tabla antigua a la nueva
            DB::statement('INSERT INTO tasks_new SELECT * FROM tasks');

            // Eliminar la tabla antigua
            Schema::dropIfExists('tasks');

            // Renombrar la nueva tabla
            DB::statement('ALTER TABLE tasks_new RENAME TO tasks');
            
            // Reactivar las claves foráneas
            DB::statement('PRAGMA foreign_keys=ON');
        } else {
            // Para MySQL/MariaDB/PostgreSQL
            // Eliminar la restricción de clave foránea primero
            Schema::table('tasks', function (Blueprint $table) {
                $table->dropForeign(['assigned_to']);
            });

            // Hacer assigned_to nullable
            Schema::table('tasks', function (Blueprint $table) {
                $table->foreignId('assigned_to')->nullable()->change();
            });

            // Volver a agregar la restricción de clave foránea con onDelete('set null')
            Schema::table('tasks', function (Blueprint $table) {
                $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
            });

            // Actualizar el enum de status para incluir 'paused' (solo MySQL)
            if ($driver === 'mysql') {
                DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('pending', 'in_progress', 'paused', 'completed') DEFAULT 'pending'");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            // Desactivar temporalmente las claves foráneas
            DB::statement('PRAGMA foreign_keys=OFF');
            
            // Recrear la tabla con la estructura antigua (assigned_to NOT NULL)
            DB::statement("
                CREATE TABLE tasks_old (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    status VARCHAR(255) NOT NULL DEFAULT 'pending',
                    priority VARCHAR(255) NOT NULL DEFAULT 'medium',
                    assigned_to INTEGER NOT NULL,
                    assigned_by INTEGER NOT NULL,
                    organization_id INTEGER NOT NULL,
                    vehicle_id INTEGER,
                    machinery_id INTEGER,
                    estimated_hours DECIMAL(8,2),
                    deadline DATE,
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
                    FOREIGN KEY (machinery_id) REFERENCES machineries(id) ON DELETE SET NULL
                )
            ");

            // Copiar solo las tareas que tienen assigned_to (filtrar las que no tienen)
            DB::statement('INSERT INTO tasks_old SELECT * FROM tasks WHERE assigned_to IS NOT NULL');

            // Eliminar la tabla actual
            Schema::dropIfExists('tasks');

            // Renombrar
            DB::statement('ALTER TABLE tasks_old RENAME TO tasks');
            
            // Reactivar las claves foráneas
            DB::statement('PRAGMA foreign_keys=ON');
        } else {
            // Para MySQL/MariaDB/PostgreSQL
            if ($driver === 'mysql') {
                DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending'");
            }

            // Eliminar la restricción de clave foránea
            Schema::table('tasks', function (Blueprint $table) {
                $table->dropForeign(['assigned_to']);
            });

            // Revertir assigned_to a NOT NULL (esto puede fallar si hay tareas sin asignar)
            Schema::table('tasks', function (Blueprint $table) {
                $table->foreignId('assigned_to')->nullable(false)->change();
            });

            // Volver a agregar la restricción original
            Schema::table('tasks', function (Blueprint $table) {
                $table->foreign('assigned_to')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }
};

