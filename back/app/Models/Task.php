<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Vehicle;
use App\Models\Machinery;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'status',
        'priority',
        'assigned_to',
        'assigned_by',
        'organization_id',
        'vehicle_id',
        'machinery_id',
        'estimated_hours',
        'deadline',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'deadline' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function machinery()
    {
        return $this->belongsTo(Machinery::class);
    }
}



