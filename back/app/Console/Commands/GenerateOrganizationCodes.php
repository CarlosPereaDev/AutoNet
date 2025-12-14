<?php

namespace App\Console\Commands;

use App\Models\Organization;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateOrganizationCodes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'organizations:generate-codes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Genera códigos únicos para organizaciones que no los tienen';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $organizations = Organization::whereNull('code')->orWhere('code', '')->get();
        
        if ($organizations->isEmpty()) {
            $this->info('Todas las organizaciones ya tienen códigos asignados.');
            return 0;
        }

        $this->info("Generando códigos para {$organizations->count()} organizaciones...");

        foreach ($organizations as $organization) {
            // Generar código único de 8 caracteres
            $code = strtoupper(Str::random(8));
            // Asegurar que el código sea único
            while (Organization::where('code', $code)->where('id', '!=', $organization->id)->exists()) {
                $code = strtoupper(Str::random(8));
            }
            
            $organization->code = $code;
            $organization->save();
            
            $this->line("✓ {$organization->name}: {$code}");
        }

        $this->info('¡Códigos generados exitosamente!');
        return 0;
    }
}





