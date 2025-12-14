<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class WorkersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Buscar o crear la organización "empresa"
        $organization = Organization::firstOrCreate(
            ['name' => 'empresa'],
            ['name' => 'empresa']
        );

        // Limpiar trabajadores existentes de esta organización para evitar duplicados y "limpiar"
        User::where('organization_id', $organization->id)
            ->where('role', 'trabajador')
            ->delete();

        $this->command->info("✓ Limpieza completada: Trabajadores antiguos eliminados.");

        // Lista de trabajadores de ejemplo
        $workers = [
            ['name' => 'Juan Pérez García', 'email' => 'juan.perez@empresa.com'],
            ['name' => 'María González López', 'email' => 'maria.gonzalez@empresa.com'],
            ['name' => 'Carlos Martínez Ruiz', 'email' => 'carlos.martinez@empresa.com'],
            ['name' => 'Ana Fernández Sánchez', 'email' => 'ana.fernandez@empresa.com'],
            ['name' => 'Luis Rodríguez Torres', 'email' => 'luis.rodriguez@empresa.com'],
            ['name' => 'Laura Jiménez Moreno', 'email' => 'laura.jimenez@empresa.com'],
            ['name' => 'Pedro Sánchez Martín', 'email' => 'pedro.sanchez@empresa.com'],
            ['name' => 'Carmen García Hernández', 'email' => 'carmen.garcia@empresa.com'],
            ['name' => 'Miguel López Díaz', 'email' => 'miguel.lopez@empresa.com'],
            ['name' => 'Isabel Muñoz Álvarez', 'email' => 'isabel.munoz@empresa.com'],
            ['name' => 'Francisco Romero Gutiérrez', 'email' => 'francisco.romero@empresa.com'],
            ['name' => 'Elena Navarro Serrano', 'email' => 'elena.navarro@empresa.com'],
            ['name' => 'Antonio Morales Ramos', 'email' => 'antonio.morales@empresa.com'],
            ['name' => 'Sofía Castro Iglesias', 'email' => 'sofia.castro@empresa.com'],
            ['name' => 'David Ortega Medina', 'email' => 'david.ortega@empresa.com'],
            ['name' => 'Patricia Delgado Vega', 'email' => 'patricia.delgado@empresa.com'],
            ['name' => 'Javier Campos Fuentes', 'email' => 'javier.campos@empresa.com'],
            ['name' => 'Mónica Vázquez Peña', 'email' => 'monica.vazquez@empresa.com'],
            ['name' => 'Roberto Herrera Cruz', 'email' => 'roberto.herrera@empresa.com'],
            ['name' => 'Natalia Flores Mendoza', 'email' => 'natalia.flores@empresa.com'],
            ['name' => 'Alejandro Soto Ríos', 'email' => 'alejandro.soto@empresa.com'],
            ['name' => 'Cristina Aguilar Paredes', 'email' => 'cristina.aguilar@empresa.com'],
            ['name' => 'Daniel Méndez Valdez', 'email' => 'daniel.mendez@empresa.com'],
            ['name' => 'Lucía Ramírez Ochoa', 'email' => 'lucia.ramirez@empresa.com'],
            ['name' => 'Fernando Vargas Salinas', 'email' => 'fernando.vargas@empresa.com'],
            ['name' => 'Adriana Rojas Campos', 'email' => 'adriana.rojas@empresa.com'],
            ['name' => 'Ricardo Silva Pacheco', 'email' => 'ricardo.silva@empresa.com'],
            ['name' => 'Beatriz Mendoza León', 'email' => 'beatriz.mendoza@empresa.com'],
            ['name' => 'Óscar Vega Cárdenas', 'email' => 'oscar.vega@empresa.com'],
            ['name' => 'Raquel Núñez Guzmán', 'email' => 'raquel.nunez@empresa.com'],
        ];

        $this->command->info("Creando trabajadores con ubicaciones para la organización: {$organization->name}");

        // Coordenadas base (ej. centro de una ciudad)
        $baseLat = 38.3452;
        $baseLng = -0.4815;

        foreach ($workers as $index => $workerData) {
            // Generar ubicación aleatoria para el 80% de los trabajadores
            $hasLocation = rand(0, 100) < 80;
            $lat = null;
            $lng = null;
            $lastLocationAt = null;

            if ($hasLocation) {
                // Generar desplazamiento aleatorio (aprox. 10km a la redonda)
                $latOffset = (rand(-100, 100) / 1000); // +/- 0.1 grados
                $lngOffset = (rand(-100, 100) / 1000);

                $lat = $baseLat + $latOffset;
                $lng = $baseLng + $lngOffset;

                // Fecha reciente aleatoria (últimos 30 minutos)
                $lastLocationAt = Carbon::now()->subMinutes(rand(0, 30));
            }

            User::create([
                'name' => $workerData['name'],
                'email' => $workerData['email'],
                'password' => Hash::make('password123'),
                'organization_id' => $organization->id,
                'role' => 'trabajador',
                'latitude' => $lat,
                'longitude' => $lng,
                'last_location_at' => $lastLocationAt,
            ]);

            $status = $hasLocation ? "con ubicación" : "sin ubicación";
            $this->command->info("✓ Creado: {$workerData['name']} ({$status})");
        }

        $this->command->info("\n✓ Seeder completado. Total de trabajadores: " . count($workers));
    }
}
