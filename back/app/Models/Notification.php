<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'read',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read' => 'boolean',
        'read_at' => 'datetime',
    ];

    /**
     * Relación con User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Crear una notificación para el jefe cuando un trabajador hace una acción
     */
    public static function createForBoss($organizationId, $type, $title, $message, $data = [])
    {
        // Obtener todos los jefes de la organización
        $bosses = User::where('organization_id', $organizationId)
            ->where('role', 'jefe')
            ->get();

        foreach ($bosses as $boss) {
            self::create([
                'user_id' => $boss->id,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data,
                'read' => false,
            ]);
        }
    }
}
