<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
    ];

    /**
     * Relación con Users
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Boot del modelo - generar código automáticamente si no se proporciona
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($organization) {
            if (empty($organization->code)) {
                // Generar código único de 8 caracteres
                $code = strtoupper(Str::random(8));
                // Asegurar que el código sea único
                while (static::where('code', $code)->exists()) {
                    $code = strtoupper(Str::random(8));
                }
                $organization->code = $code;
            }
        });
    }
}
