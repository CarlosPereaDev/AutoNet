<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Routing\Controller;

class TaskController extends Controller
{
    /**
     * Obtener todas las tareas (para jefe)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        $tasks = Task::where('organization_id', $organizationId)
            ->with(['assignedTo', 'assignedBy', 'vehicle', 'machinery'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['tasks' => $tasks]);
    }

    /**
     * Obtener tareas del trabajador
     */
    public function myTasks(Request $request)
    {
        $user = $request->user();

        $tasks = Task::where('assigned_to', $user->id)
            ->with(['assignedBy', 'vehicle', 'machinery'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['tasks' => $tasks]);
    }

    /**
     * Crear una nueva tarea
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();
            $organizationId = $user->organization_id;

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'priority' => ['required', Rule::in(['low', 'medium', 'high'])],
                'assigned_to' => [
                    'required',
                    'integer',
                    Rule::exists('users', 'id')->where(function ($query) use ($organizationId) {
                        $query->where('organization_id', $organizationId)
                              ->where('role', 'trabajador');
                    })
                ],
                'vehicle_id' => [
                    'nullable',
                    'integer',
                    Rule::exists('vehicles', 'id')->where('organization_id', $organizationId)
                ],
                'machinery_id' => [
                    'nullable',
                    'integer',
                    Rule::exists('machineries', 'id')->where('organization_id', $organizationId)
                ],
                'estimated_hours' => 'nullable|numeric|min:0',
                'deadline' => 'nullable|date',
            ]);

            // Verificación adicional manual
            $assignedUser = User::find($validated['assigned_to']);
            if (!$assignedUser || $assignedUser->organization_id !== $organizationId || $assignedUser->role !== 'trabajador') {
                return response()->json([
                    'message' => 'El trabajador seleccionado no es válido o no pertenece a tu organización.',
                    'errors' => ['assigned_to' => ['El trabajador seleccionado no es válido']]
                ], 422);
            }

            $task = Task::create([
                ...$validated,
                'assigned_by' => $user->id,
                'organization_id' => $organizationId,
                'status' => 'pending',
            ]);

            return response()->json(['task' => $task->load(['assignedTo', 'assignedBy', 'vehicle', 'machinery'])], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error al crear tarea: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al crear la tarea: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar una tarea
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $task = Task::findOrFail($id);

        // Verificar permisos
        if ($user->role === 'trabajador' && $task->assigned_to !== $user->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $user = $request->user();
        $organizationId = $user->organization_id;

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => ['sometimes', Rule::in(['pending', 'in_progress', 'completed'])],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
            'vehicle_id' => [
                'nullable',
                'integer',
                Rule::exists('vehicles', 'id')->where('organization_id', $organizationId)
            ],
            'machinery_id' => [
                'nullable',
                'integer',
                Rule::exists('machineries', 'id')->where('organization_id', $organizationId)
            ],
            'estimated_hours' => 'nullable|numeric|min:0',
            'deadline' => 'nullable|date',
        ]);

        // Actualizar started_at cuando cambia a in_progress
        if (isset($validated['status'])) {
            if ($validated['status'] === 'in_progress' && $task->status !== 'in_progress' && !$task->started_at) {
                $validated['started_at'] = now();
                
                // Crear notificación para el jefe cuando un trabajador inicia una tarea
                if ($user->role === 'trabajador') {
                    Notification::createForBoss(
                        $user->organization_id,
                        'task_started',
                        'Tarea iniciada',
                        "{$user->name} ha iniciado la tarea: {$task->title}",
                        ['task_id' => $task->id, 'worker_id' => $user->id, 'worker_name' => $user->name]
                    );
                }
            }
            // Actualizar completed_at cuando cambia a completed
            if ($validated['status'] === 'completed' && $task->status !== 'completed' && !$task->completed_at) {
                $validated['completed_at'] = now();
                
                // Crear notificación para el jefe cuando un trabajador completa una tarea
                if ($user->role === 'trabajador') {
                    Notification::createForBoss(
                        $user->organization_id,
                        'task_completed',
                        'Tarea completada',
                        "{$user->name} ha completado la tarea: {$task->title}",
                        ['task_id' => $task->id, 'worker_id' => $user->id, 'worker_name' => $user->name]
                    );
                }
            }
        }

        $task->update($validated);

        return response()->json(['task' => $task->load(['assignedTo', 'assignedBy', 'vehicle', 'machinery'])]);
    }

    /**
     * Eliminar una tarea
     */
    public function destroy($id)
    {
        $task = Task::findOrFail($id);
        $task->delete();

        return response()->json(['message' => 'Tarea eliminada']);
    }
}

