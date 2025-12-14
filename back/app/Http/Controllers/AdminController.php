<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminController extends Controller
{
    /**
     * Obtener ubicaciones de todos los trabajadores (solo admin)
     */
    public function getWorkersLocation(Request $request)
    {
        try {
            $user = $request->user();
            
            // Verificar que sea admin
            if ($user->role !== 'admin') {
                return response()->json([
                    'message' => 'No tienes permisos para acceder a esta información'
                ], 403);
            }

            // Obtener todos los trabajadores con sus ubicaciones (incluyendo los que no tienen ubicación)
            $workers = User::where('role', 'trabajador')
                ->select('id', 'name', 'email', 'latitude', 'longitude', 'last_location_at', 'last_activity_at', 'organization_id')
                ->with('organization')
                ->orderBy('name')
                ->get();

            return response()->json([
                'workers' => $workers
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al obtener ubicaciones de trabajadores: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al obtener las ubicaciones: ' . $e->getMessage()
            ], 500);
        }
    }
}

