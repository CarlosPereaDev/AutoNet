<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Organization;
use App\Models\Task;
use App\Models\Vehicle;
use App\Models\Machinery;

class ClearDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:clear {--force : Ejecutar sin confirmación}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Limpiar todos los datos de la base de datos';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->option('force')) {
            if (!$this->confirm('¿Estás seguro de que quieres eliminar TODOS los datos de la base de datos? Esta acción no se puede deshacer.')) {
                $this->info('Operación cancelada.');
                return 0;
            }
        }

        try {
            $this->info('Limpiando base de datos...');

            // Desactivar restricciones de claves foráneas temporalmente (SQLite)
            if (DB::getDriverName() === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = OFF;');
            }

            // Eliminar datos en orden (respetando dependencias)
            $this->info('Eliminando tareas...');
            Task::query()->delete();
            
            $this->info('Eliminando vehículos...');
            Vehicle::query()->delete();
            
            $this->info('Eliminando maquinaria...');
            Machinery::query()->delete();
            
            $this->info('Eliminando usuarios...');
            User::query()->delete();
            
            $this->info('Eliminando organizaciones...');
            Organization::query()->delete();

            // Reactivar restricciones de claves foráneas
            if (DB::getDriverName() === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = ON;');
            }

            $this->info('✓ Base de datos limpiada exitosamente.');
            return 0;

        } catch (\Exception $e) {
            $this->error('Error al limpiar la base de datos: ' . $e->getMessage());
            return 1;
        }
    }
}

