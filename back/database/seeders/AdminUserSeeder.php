<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear o actualizar usuario admin
        $admin = User::updateOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Administrador',
                'email' => 'admin@admin.com',
                'password' => Hash::make('admin'),
                'role' => 'admin',
                'organization_id' => null, // El admin no pertenece a ninguna organización
            ]
        );

        $this->command->info("✓ Usuario admin creado/actualizado:");
        $this->command->info("  Email: admin@admin.com");
        $this->command->info("  Contraseña: admin");
    }
}
