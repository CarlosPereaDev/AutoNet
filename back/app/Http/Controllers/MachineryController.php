<?php

namespace App\Http\Controllers;

use App\Models\Machinery;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class MachineryController extends Controller
{
    /**
     * Obtener toda la maquinaria
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        $machineries = Machinery::where('organization_id', $organizationId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['machineries' => $machineries]);
    }

    /**
     * Crear nueva maquinaria
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:100',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'current_hours' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:active,inactive,maintenance',
        ]);

        $machinery = Machinery::create([
            ...$validated,
            'organization_id' => $user->organization_id,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json(['machinery' => $machinery], 201);
    }

    /**
     * Actualizar maquinaria
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $machinery = Machinery::where('id', $id)
            ->where('organization_id', $user->organization_id)
            ->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'nullable|string|max:100',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'current_hours' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:active,inactive,maintenance',
        ]);

        $machinery->update($validated);

        // Crear notificación para el jefe cuando un trabajador actualiza maquinaria
        if ($user->role === 'trabajador') {
            $changes = [];
            if (isset($validated['current_hours'])) {
                $changes[] = "horas: {$validated['current_hours']}h";
            }
            if (isset($validated['status']) && $validated['status'] === 'maintenance') {
                $changes[] = "estado: En mantenimiento";
            }
            
            if (!empty($changes)) {
                Notification::createForBoss(
                    $user->organization_id,
                    'machinery_updated',
                    'Maquinaria actualizada',
                    "{$user->name} ha actualizado la maquinaria {$machinery->name}: " . implode(', ', $changes),
                    ['machinery_id' => $machinery->id, 'worker_id' => $user->id, 'worker_name' => $user->name]
                );
            }
        }

        return response()->json(['machinery' => $machinery]);
    }

    /**
     * Eliminar maquinaria
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $machinery = Machinery::where('id', $id)
            ->where('organization_id', $user->organization_id)
            ->firstOrFail();
        
        $machinery->delete();

        return response()->json(['message' => 'Maquinaria eliminada']);
    }
}

