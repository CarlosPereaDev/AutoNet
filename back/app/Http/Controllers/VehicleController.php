<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class VehicleController extends Controller
{
    /**
     * Obtener todos los vehículos
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        $vehicles = Vehicle::where('organization_id', $organizationId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['vehicles' => $vehicles]);
    }

    /**
     * Crear un nuevo vehículo
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'plate' => 'required|string|max:20',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'current_mileage' => 'nullable|numeric|min:0',
            'current_fuel_level' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|string|in:active,inactive,maintenance',
        ]);

        $vehicle = Vehicle::create([
            ...$validated,
            'organization_id' => $user->organization_id,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json(['vehicle' => $vehicle], 201);
    }

    /**
     * Actualizar un vehículo
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $vehicle = Vehicle::where('id', $id)
            ->where('organization_id', $user->organization_id)
            ->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'plate' => 'sometimes|string|max:20',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'current_mileage' => 'nullable|numeric|min:0',
            'current_fuel_level' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|string|in:active,inactive,maintenance',
        ]);

        $vehicle->update($validated);

        // Crear notificación para el jefe cuando un trabajador actualiza un vehículo
        $user = $request->user();
        if ($user->role === 'trabajador') {
            $changes = [];
            if (isset($validated['current_mileage'])) {
                $changes[] = "kilometraje: {$validated['current_mileage']} km";
            }
            if (isset($validated['current_fuel_level'])) {
                $changes[] = "combustible: {$validated['current_fuel_level']}%";
            }
            if (isset($validated['status']) && $validated['status'] === 'maintenance') {
                $changes[] = "estado: En mantenimiento";
            }
            
            if (!empty($changes)) {
                Notification::createForBoss(
                    $user->organization_id,
                    'vehicle_updated',
                    'Vehículo actualizado',
                    "{$user->name} ha actualizado el vehículo {$vehicle->name} ({$vehicle->plate}): " . implode(', ', $changes),
                    ['vehicle_id' => $vehicle->id, 'worker_id' => $user->id, 'worker_name' => $user->name]
                );
            }
        }

        return response()->json(['vehicle' => $vehicle]);
    }

    /**
     * Eliminar un vehículo
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $vehicle = Vehicle::where('id', $id)
            ->where('organization_id', $user->organization_id)
            ->firstOrFail();
        
        $vehicle->delete();

        return response()->json(['message' => 'Vehículo eliminado']);
    }
}

