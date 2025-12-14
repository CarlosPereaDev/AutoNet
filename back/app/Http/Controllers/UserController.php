<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Routing\Controller;

class UserController extends Controller
{
    /**
     * Obtener todos los trabajadores de la organización
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $organizationId = $user->organization_id;

            $workers = User::where('organization_id', $organizationId)
                ->where('role', 'trabajador')
                ->withCount([
                    'tasks as active_tasks_count' => function ($query) {
                        $query->whereIn('status', ['pending', 'in_progress']);
                    }
                ])
                ->orderBy('name')
                ->get()
                ->map(function ($worker) {
                    // Calcular si está activo (última actividad en los últimos 5 minutos)
                    $isActive = $worker->last_activity_at &&
                        $worker->last_activity_at->diffInMinutes(now()) <= 5;
                    $worker->is_active = $isActive;
                    return $worker;
                });

            return response()->json(['workers' => $workers]);
        } catch (\Exception $e) {
            \Log::error('Error al obtener trabajadores: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Error al obtener los trabajadores: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo trabajador
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'password_confirmation' => 'required|same:password',
            ]);

            $worker = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'organization_id' => $user->organization_id,
                'role' => 'trabajador',
            ]);

            return response()->json(['worker' => $worker], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error al crear trabajador: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al crear el trabajador: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un trabajador
     */
    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();
            $worker = User::findOrFail($id);

            // Verificar que el trabajador pertenece a la misma organización
            if ($worker->organization_id !== $user->organization_id) {
                return response()->json([
                    'message' => 'No autorizado'
                ], 403);
            }

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => ['sometimes', 'email', Rule::unique('users')->ignore($worker->id)],
                'password' => 'nullable|string|min:8',
                'password_confirmation' => 'nullable|same:password',
            ]);

            // Solo actualizar la contraseña si se proporciona
            if (isset($validated['password']) && !empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            // Eliminar password_confirmation del array de validación
            unset($validated['password_confirmation']);

            $worker->update($validated);

            return response()->json(['worker' => $worker]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error al actualizar trabajador: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar el trabajador: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener ubicaciones de trabajadores de la organización (solo jefe)
     */
    public function getWorkersLocation(Request $request)
    {
        try {
            $user = $request->user();

            // Verificar que el usuario sea jefe
            if ($user->role !== 'jefe') {
                return response()->json([
                    'message' => 'No tienes permisos para acceder a esta información'
                ], 403);
            }

            $organizationId = $user->organization_id;

            if (!$organizationId) {
                return response()->json([
                    'message' => 'No tienes una organización asignada'
                ], 400);
            }

            // Obtener todos los trabajadores de la organización con sus ubicaciones (incluyendo los que no tienen ubicación)
            $workers = User::where('organization_id', $organizationId)
                ->where('role', 'trabajador')
                ->select('id', 'name', 'email', 'latitude', 'longitude', 'last_location_at', 'last_activity_at')
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

    /**
     * Eliminar un trabajador
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            $worker = User::findOrFail($id);

            // Verificar que el trabajador pertenece a la misma organización
            if ($worker->organization_id !== $user->organization_id) {
                return response()->json([
                    'message' => 'No autorizado'
                ], 403);
            }

            $worker->delete();

            return response()->json(['message' => 'Trabajador eliminado']);
        } catch (\Exception $e) {
            \Log::error('Error al eliminar trabajador: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al eliminar el trabajador: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar si el usuario es admin
     */
    private function isAdmin($user)
    {
        return $user && $user->role === 'admin';
    }

    /**
     * Obtener todos los usuarios (solo admin)
     */
    public function getAllUsers(Request $request)
    {
        try {
            $user = $request->user();

            if (!$this->isAdmin($user)) {
                return response()->json(['message' => 'No autorizado'], 403);
            }

            $users = User::with('organization')
                ->orderBy('name')
                ->get();

            return response()->json(['users' => $users]);
        } catch (\Exception $e) {
            \Log::error('Error al obtener usuarios: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al obtener los usuarios: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo usuario (solo admin)
     */
    public function createUser(Request $request)
    {
        try {
            $user = $request->user();

            if (!$this->isAdmin($user)) {
                return response()->json(['message' => 'No autorizado'], 403);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'password_confirmation' => 'required|same:password',
                'role' => ['required', Rule::in(['jefe', 'trabajador', 'admin'])],
                'organization_id' => 'nullable|exists:organizations,id',
            ]);

            // Si es admin, no debe tener organización
            if ($validated['role'] === 'admin') {
                $validated['organization_id'] = null;
            } else {
                // Si es jefe o trabajador, debe tener organización
                if (empty($validated['organization_id'])) {
                    return response()->json([
                        'message' => 'Los usuarios jefe y trabajador deben tener una organización asignada',
                        'errors' => ['organization_id' => ['La organización es obligatoria para este rol']]
                    ], 422);
                }
            }

            $newUser = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'organization_id' => $validated['organization_id'] ?? null,
            ]);

            return response()->json(['user' => $newUser->load('organization')], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error al crear usuario: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al crear el usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un usuario (solo admin)
     */
    public function updateUser(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$this->isAdmin($user)) {
                return response()->json(['message' => 'No autorizado'], 403);
            }

            $targetUser = User::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => ['sometimes', 'email', Rule::unique('users')->ignore($targetUser->id)],
                'password' => 'nullable|string|min:8',
                'password_confirmation' => 'nullable|same:password',
                'role' => ['sometimes', Rule::in(['jefe', 'trabajador', 'admin'])],
                'organization_id' => 'nullable|exists:organizations,id',
            ]);

            // Si se cambia el rol a admin, eliminar organización
            if (isset($validated['role']) && $validated['role'] === 'admin') {
                $validated['organization_id'] = null;
            } else if (isset($validated['role']) && in_array($validated['role'], ['jefe', 'trabajador'])) {
                // Si se cambia a jefe o trabajador, asegurar que tenga organización
                if (empty($validated['organization_id']) && empty($targetUser->organization_id)) {
                    return response()->json([
                        'message' => 'Los usuarios jefe y trabajador deben tener una organización asignada',
                        'errors' => ['organization_id' => ['La organización es obligatoria para este rol']]
                    ], 422);
                }
            }

            // Solo actualizar la contraseña si se proporciona
            if (isset($validated['password']) && !empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            // Eliminar password_confirmation del array de validación
            unset($validated['password_confirmation']);

            $targetUser->update($validated);

            return response()->json(['user' => $targetUser->load('organization')]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error al actualizar usuario: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar el usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un usuario (solo admin)
     */
    public function deleteUser(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$this->isAdmin($user)) {
                return response()->json(['message' => 'No autorizado'], 403);
            }

            $targetUser = User::findOrFail($id);

            // No permitir eliminar al propio admin
            if ($targetUser->id === $user->id) {
                return response()->json([
                    'message' => 'No puedes eliminar tu propio usuario'
                ], 422);
            }

            $targetUser->delete();

            return response()->json(['message' => 'Usuario eliminado']);
        } catch (\Exception $e) {
            \Log::error('Error al eliminar usuario: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al eliminar el usuario: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Actualizar ubicación del usuario autenticado
     */
    public function updateLocation(Request $request)
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
            ]);

            $user->update([
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'last_location_at' => now(),
            ]);

            return response()->json(['message' => 'Ubicación actualizada']);
        } catch (\Exception $e) {
            \Log::error('Error al actualizar ubicación: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar ubicación'
            ], 500);
        }
    }
}

