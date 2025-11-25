<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

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

        // Si existe "Raulico SL" o "Raulino SL", migrar trabajadores y eliminar la organización antigua
        $oldOrganizations = Organization::whereIn('name', ['Raulico SL', 'Raulino SL'])->get();
        foreach ($oldOrganizations as $oldOrganization) {
            if ($oldOrganization->id !== $organization->id) {
                // Migrar trabajadores a la nueva organización
                User::where('organization_id', $oldOrganization->id)
                    ->update(['organization_id' => $organization->id]);
                // Eliminar la organización antigua
                $oldOrganization->delete();
                $this->command->info("✓ Migrados trabajadores de '{$oldOrganization->name}' a 'empresa'");
            }
        }

        // Lista de trabajadores de ejemplo
        $workers = [
            ['name' => 'Juan Pérez García', 'email' => 'juan.perez@raulico.es'],
            ['name' => 'María González López', 'email' => 'maria.gonzalez@raulico.es'],
            ['name' => 'Carlos Martínez Ruiz', 'email' => 'carlos.martinez@raulico.es'],
            ['name' => 'Ana Fernández Sánchez', 'email' => 'ana.fernandez@raulico.es'],
            ['name' => 'Luis Rodríguez Torres', 'email' => 'luis.rodriguez@raulico.es'],
            ['name' => 'Laura Jiménez Moreno', 'email' => 'laura.jimenez@raulico.es'],
            ['name' => 'Pedro Sánchez Martín', 'email' => 'pedro.sanchez@raulico.es'],
            ['name' => 'Carmen García Hernández', 'email' => 'carmen.garcia@raulico.es'],
            ['name' => 'Miguel López Díaz', 'email' => 'miguel.lopez@raulico.es'],
            ['name' => 'Isabel Muñoz Álvarez', 'email' => 'isabel.munoz@raulico.es'],
            ['name' => 'Francisco Romero Gutiérrez', 'email' => 'francisco.romero@raulico.es'],
            ['name' => 'Elena Navarro Serrano', 'email' => 'elena.navarro@raulico.es'],
            ['name' => 'Antonio Morales Ramos', 'email' => 'antonio.morales@raulico.es'],
            ['name' => 'Sofía Castro Iglesias', 'email' => 'sofia.castro@raulico.es'],
            ['name' => 'David Ortega Medina', 'email' => 'david.ortega@raulico.es'],
            ['name' => 'Patricia Delgado Vega', 'email' => 'patricia.delgado@raulico.es'],
            ['name' => 'Javier Campos Fuentes', 'email' => 'javier.campos@raulico.es'],
            ['name' => 'Mónica Vázquez Peña', 'email' => 'monica.vazquez@raulico.es'],
            ['name' => 'Roberto Herrera Cruz', 'email' => 'roberto.herrera@raulico.es'],
            ['name' => 'Natalia Flores Mendoza', 'email' => 'natalia.flores@raulico.es'],
            ['name' => 'Alejandro Soto Ríos', 'email' => 'alejandro.soto@raulico.es'],
            ['name' => 'Cristina Aguilar Paredes', 'email' => 'cristina.aguilar@raulico.es'],
            ['name' => 'Daniel Méndez Valdez', 'email' => 'daniel.mendez@raulico.es'],
            ['name' => 'Lucía Ramírez Ochoa', 'email' => 'lucia.ramirez@raulico.es'],
            ['name' => 'Fernando Vargas Salinas', 'email' => 'fernando.vargas@raulico.es'],
            ['name' => 'Adriana Rojas Campos', 'email' => 'adriana.rojas@raulico.es'],
            ['name' => 'Ricardo Silva Pacheco', 'email' => 'ricardo.silva@raulico.es'],
            ['name' => 'Beatriz Mendoza León', 'email' => 'beatriz.mendoza@raulico.es'],
            ['name' => 'Óscar Vega Cárdenas', 'email' => 'oscar.vega@raulico.es'],
            ['name' => 'Raquel Núñez Guzmán', 'email' => 'raquel.nunez@raulico.es'],
        ];

        $this->command->info("Creando trabajadores para la organización: {$organization->name}");

        foreach ($workers as $workerData) {
            // Verificar si el trabajador ya existe
            $existingWorker = User::where('email', $workerData['email'])->first();
            
            if (!$existingWorker) {
                User::create([
                    'name' => $workerData['name'],
                    'email' => $workerData['email'],
                    'password' => Hash::make('password123'), // Contraseña por defecto
                    'organization_id' => $organization->id,
                    'role' => 'trabajador',
                ]);
                $this->command->info("✓ Creado: {$workerData['name']}");
            } else {
                $this->command->warn("⊘ Ya existe: {$workerData['name']}");
            }
        }

        $this->command->info("\n✓ Seeder completado. Total de trabajadores en {$organization->name}: " . 
            User::where('organization_id', $organization->id)->where('role', 'trabajador')->count());
    }
}
