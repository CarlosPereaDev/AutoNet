<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Task;
use App\Models\Vehicle;
use App\Models\Machinery;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'organization_id',
        'role',
        'provider',
        'provider_id',
        'avatar',
        'last_activity_at',
        'latitude',
        'longitude',
        'last_location_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_activity_at' => 'datetime',
            'last_location_at' => 'datetime',
        ];
    }

    /**
     * Relación con Organization
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Relación con Tasks (tareas asignadas)
     */
    public function tasks()
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    /**
     * Relación con Vehicles (vehículos asignados en tareas)
     */
    public function vehicles()
    {
        return $this->hasManyThrough(Vehicle::class, Task::class, 'assigned_to', 'id', 'id', 'vehicle_id');
    }

    /**
     * Relación con Machinery (maquinaria asignada en tareas)
     */
    public function machineries()
    {
        return $this->hasManyThrough(Machinery::class, Task::class, 'assigned_to', 'id', 'id', 'machinery_id');
    }
}
