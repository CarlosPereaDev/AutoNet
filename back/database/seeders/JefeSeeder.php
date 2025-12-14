<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class JefeSeeder extends Seeder
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

        // Crear o actualizar usuario jefe
        $jefe = User::updateOrCreate(
            ['email' => 'carlosperedev@gmail.com'],
            [
                'name' => 'Carlos Pere',
                'email' => 'carlosperedev@gmail.com',
                'password' => Hash::make('password123'), // Contraseña por defecto
                'role' => 'jefe',
                'organization_id' => $organization->id,
            ]
        );

        $this->command->info("✓ Usuario jefe creado/actualizado:");
        $this->command->info("  Nombre: {$jefe->name}");
        $this->command->info("  Email: {$jefe->email}");
        $this->command->info("  Organización: {$organization->name}");
        $this->command->info("  Contraseña: password123");
    }
}






