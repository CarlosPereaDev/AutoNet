<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ClienteSeeder extends Seeder
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

        // Crear o actualizar usuario cliente
        $cliente = User::updateOrCreate(
            ['email' => 'cliente@cliente.com'],
            [
                'name' => 'Cliente',
                'email' => 'cliente@cliente.com',
                'password' => Hash::make('12345678'),
                'role' => 'trabajador', // Usando rol trabajador ya que no existe rol 'cliente'
                'organization_id' => $organization->id,
            ]
        );

        $this->command->info("✓ Usuario cliente creado/actualizado:");
        $this->command->info("  Nombre: {$cliente->name}");
        $this->command->info("  Email: {$cliente->email}");
        $this->command->info("  Organización: {$organization->name}");
        $this->command->info("  Contraseña: 12345678");
        $this->command->info("  Rol: trabajador");
    }
}



