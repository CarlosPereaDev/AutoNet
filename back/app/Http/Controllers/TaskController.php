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
     * Obtener tareas disponibles (sin asignar) para trabajadores
     */
    public function availableTasks(Request $request)
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        $tasks = Task::where('organization_id', $organizationId)
            ->whereNull('assigned_to')
            ->where('status', 'pending')
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
                    'nullable',
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

            // Verificación adicional manual solo si assigned_to está presente
            if (isset($validated['assigned_to']) && $validated['assigned_to']) {
                $assignedUser = User::find($validated['assigned_to']);
                if (!$assignedUser || $assignedUser->organization_id !== $organizationId || $assignedUser->role !== 'trabajador') {
                    return response()->json([
                        'message' => 'El trabajador seleccionado no es válido',
                        'errors' => ['assigned_to' => ['El trabajador seleccionado no es válido']]
                    ], 422);
                }
            }

            $task = Task::create([
                ...$validated,
                'assigned_by' => $user->id,
                'organization_id' => $organizationId,
                'status' => 'pending',
            ]);

            // Crear notificación para el trabajador si se le asigna la tarea
            if ($task->assigned_to) {
                $assignedUser = User::find($task->assigned_to);
                if ($assignedUser) {
                    Notification::createForWorker(
                        $task->assigned_to,
                        'task_assigned',
                        'Nueva tarea asignada',
                        "Se te ha asignado una nueva tarea: {$task->title}",
                        ['task_id' => $task->id, 'assigned_by' => $user->id, 'assigned_by_name' => $user->name]
                    );
                }
            }

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
            'status' => ['sometimes', Rule::in(['pending', 'in_progress', 'paused', 'completed'])],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
            'assigned_to' => [
                'nullable',
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

        // Guardar valores originales antes de actualizar
        $wasAssigned = $task->assigned_to !== null;
        $oldAssignedTo = $task->assigned_to;
        $oldPriority = $task->priority;
        $oldDeadline = $task->deadline;
        $oldTitle = $task->title;
        $oldDescription = $task->description;
        
        $isBeingAssigned = isset($validated['assigned_to']) && $validated['assigned_to'] !== null;
        $assignedToChanged = $isBeingAssigned && $oldAssignedTo != $validated['assigned_to'];

        // Actualizar started_at cuando cambia a in_progress
        if (isset($validated['status'])) {
            // Si cambia de paused a in_progress, no actualizar started_at (ya existe)
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
            // Si se pausa, crear notificación
            if ($validated['status'] === 'paused' && $task->status !== 'paused' && $user->role === 'trabajador') {
                Notification::createForBoss(
                    $user->organization_id,
                    'task_paused',
                    'Tarea pausada',
                    "{$user->name} ha pausado la tarea: {$task->title}",
                    ['task_id' => $task->id, 'worker_id' => $user->id, 'worker_name' => $user->name]
                );
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

        // Crear notificaciones para el trabajador después de actualizar
        // Si se asigna la tarea a un trabajador por primera vez o se cambia de trabajador
        if ($assignedToChanged) {
            $assignedUser = User::find($validated['assigned_to']);
            if ($assignedUser && $assignedUser->role === 'trabajador') {
                Notification::createForWorker(
                    $validated['assigned_to'],
                    'task_assigned',
                    'Tarea asignada',
                    "Se te ha asignado la tarea: {$task->title}",
                    ['task_id' => $task->id, 'assigned_by' => $user->id, 'assigned_by_name' => $user->name]
                );
            }
        }
        // Si el jefe actualiza una tarea que ya está asignada a un trabajador
        elseif ($wasAssigned && $user->role === 'jefe' && $task->assigned_to && !$assignedToChanged) {
            $hasImportantChanges = false;
            $changes = [];

            if (isset($validated['priority']) && $validated['priority'] !== $oldPriority) {
                $hasImportantChanges = true;
                $changes[] = 'prioridad';
            }
            if (isset($validated['deadline']) && $validated['deadline'] !== $oldDeadline) {
                $hasImportantChanges = true;
                $changes[] = 'fecha límite';
            }
            if (isset($validated['title']) && $validated['title'] !== $oldTitle) {
                $hasImportantChanges = true;
                $changes[] = 'título';
            }
            if (isset($validated['description']) && $validated['description'] !== $oldDescription) {
                $hasImportantChanges = true;
                $changes[] = 'descripción';
            }

            if ($hasImportantChanges) {
                Notification::createForWorker(
                    $task->assigned_to,
                    'task_updated',
                    'Tarea actualizada',
                    "La tarea '{$task->title}' ha sido actualizada. Cambios: " . implode(', ', $changes),
                    ['task_id' => $task->id, 'updated_by' => $user->id, 'updated_by_name' => $user->name]
                );
            }
        }

        return response()->json(['task' => $task->load(['assignedTo', 'assignedBy', 'vehicle', 'machinery'])]);
    }

    /**
     * Reservar una tarea (asignarla a un trabajador)
     */
    public function reserveTask(Request $request, $id)
    {
        $user = $request->user();
        
        // Solo trabajadores pueden reservar tareas
        if ($user->role !== 'trabajador') {
            return response()->json(['message' => 'Solo los trabajadores pueden reservar tareas'], 403);
        }

        $task = Task::findOrFail($id);

        // Verificar que la tarea pertenece a la misma organización
        if ($task->organization_id !== $user->organization_id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        // Verificar que la tarea no esté asignada
        if ($task->assigned_to !== null) {
            return response()->json(['message' => 'La tarea ya está asignada a otro trabajador'], 422);
        }

        // Verificar que la tarea esté en estado pending
        if ($task->status !== 'pending') {
            return response()->json(['message' => 'Solo se pueden reservar tareas pendientes'], 422);
        }

        // Asignar la tarea al trabajador
        $task->update([
            'assigned_to' => $user->id,
            'status' => 'pending' // Mantener como pending hasta que el trabajador la inicie
        ]);

        // Crear notificación para el jefe
        Notification::createForBoss(
            $user->organization_id,
            'task_reserved',
            'Tarea reservada',
            "{$user->name} ha reservado la tarea: {$task->title}",
            ['task_id' => $task->id, 'worker_id' => $user->id, 'worker_name' => $user->name]
        );

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

