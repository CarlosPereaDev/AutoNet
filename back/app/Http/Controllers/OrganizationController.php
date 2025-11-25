<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class OrganizationController extends Controller
{
    /**
     * Verificar si el usuario es admin
     */
    private function isAdmin($user)
    {
        return $user && $user->role === 'admin';
    }

    /**
     * Obtener todas las organizaciones (para select público)
     */
    public function index()
    {
        $organizations = Organization::orderBy('name')
            ->get(['id', 'name']);

        return response()->json(['organizations' => $organizations]);
    }

    /**
     * Obtener todas las organizaciones con estadísticas (solo admin)
     */
    public function getAll(Request $request)
    {
        $user = $request->user();
        
        if (!$this->isAdmin($user)) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $organizations = Organization::withCount([
            'users as total_users',
            'users as total_workers' => function ($query) {
                $query->where('role', 'trabajador');
            }
        ])
        ->with(['users' => function ($query) {
            $query->orderBy('name');
        }])
        ->orderBy('name')
        ->get();

        return response()->json(['organizations' => $organizations]);
    }

    /**
     * Buscar organizaciones por nombre (para autocompletado)
     */
    public function search(Request $request)
    {
        $query = $request->input('q', '');
        
        if (empty($query)) {
            return response()->json(['organizations' => []]);
        }

        $organizations = Organization::where('name', 'LIKE', "%{$query}%")
            ->orderBy('name')
            ->limit(10)
            ->get(['id', 'name']);

        return response()->json(['organizations' => $organizations]);
    }

    /**
     * Crear una nueva organización (solo admin)
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$this->isAdmin($user)) {
                return response()->json(['message' => 'No autorizado'], 403);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:organizations,name',
            ]);

            $organization = Organization::create($validated);

            return response()->json(['organization' => $organization], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error al crear organización: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al crear la organización: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar una organización (solo admin)
     */
    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if (!$this->isAdmin($user)) {
                return response()->json(['message' => 'No autorizado'], 403);
            }

            $organization = Organization::findOrFail($id);

            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255', \Illuminate\Validation\Rule::unique('organizations')->ignore($organization->id)],
            ]);

            $organization->update($validated);

            return response()->json(['organization' => $organization]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error al actualizar organización: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar la organización: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar una organización (solo admin)
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if (!$this->isAdmin($user)) {
                return response()->json(['message' => 'No autorizado'], 403);
            }

            $organization = Organization::findOrFail($id);

            // Verificar si tiene usuarios asociados
            $usersCount = User::where('organization_id', $organization->id)->count();
            if ($usersCount > 0) {
                return response()->json([
                    'message' => 'No se puede eliminar la organización porque tiene usuarios asociados',
                    'users_count' => $usersCount
                ], 422);
            }

            $organization->delete();

            return response()->json(['message' => 'Organización eliminada']);
        } catch (\Exception $e) {
            \Log::error('Error al eliminar organización: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al eliminar la organización: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de una organización (solo admin)
     */
    public function stats(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if (!$this->isAdmin($user)) {
                return response()->json(['message' => 'No autorizado'], 403);
            }

            $organization = Organization::findOrFail($id);

            $stats = [
                'total_users' => User::where('organization_id', $organization->id)->count(),
                'total_workers' => User::where('organization_id', $organization->id)->where('role', 'trabajador')->count(),
                'total_bosses' => User::where('organization_id', $organization->id)->where('role', 'jefe')->count(),
            ];

            return response()->json(['stats' => $stats]);
        } catch (\Exception $e) {
            \Log::error('Error al obtener estadísticas: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }
}

