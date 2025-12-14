<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\MachineryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\AdminController;

// Rutas públicas de autenticación
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rutas públicas para organizaciones
Route::get('/organizations', [OrganizationController::class, 'index']);
Route::get('/organizations/search', [OrganizationController::class, 'search']);

// Rutas protegidas (requieren autenticación)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/heartbeat', [AuthController::class, 'heartbeat']);
    Route::get('/user', function (Request $request) {
        return response()->json([
            'user' => $request->user()->load('organization'),
        ]);
    });
    Route::post('/user/location', [UserController::class, 'updateLocation']);

    // Dashboard
    Route::get('/dashboard/jefe/stats', [DashboardController::class, 'getJefeStats']);
    Route::get('/dashboard/trabajador/stats', [DashboardController::class, 'getTrabajadorStats']);

    // Tareas
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/my', [TaskController::class, 'myTasks']);
    Route::get('/tasks/available', [TaskController::class, 'availableTasks']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{id}', [TaskController::class, 'update']);
    Route::post('/tasks/{id}/reserve', [TaskController::class, 'reserveTask']);
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);

    // Vehículos
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::post('/vehicles', [VehicleController::class, 'store']);
    Route::put('/vehicles/{id}', [VehicleController::class, 'update']);
    Route::delete('/vehicles/{id}', [VehicleController::class, 'destroy']);

    // Maquinaria
    Route::get('/machineries', [MachineryController::class, 'index']);
    Route::post('/machineries', [MachineryController::class, 'store']);
    Route::put('/machineries/{id}', [MachineryController::class, 'update']);
    Route::delete('/machineries/{id}', [MachineryController::class, 'destroy']);

    // Trabajadores (solo jefe)
    Route::get('/workers', [UserController::class, 'index']);
    Route::post('/workers', [UserController::class, 'store']);
    Route::put('/workers/{id}', [UserController::class, 'update']);
    Route::delete('/workers/{id}', [UserController::class, 'destroy']);
    Route::get('/workers-location', [UserController::class, 'getWorkersLocation']);

    // Notificaciones
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Rutas de administración (solo admin)
    Route::prefix('admin')->group(function () {
        Route::get('/organizations', [OrganizationController::class, 'getAll']);
        Route::post('/organizations', [OrganizationController::class, 'store']);
        Route::put('/organizations/{id}', [OrganizationController::class, 'update']);
        Route::delete('/organizations/{id}', [OrganizationController::class, 'destroy']);
        Route::get('/organizations/{id}/stats', [OrganizationController::class, 'stats']);

        Route::get('/users', [UserController::class, 'getAllUsers']);
        Route::post('/users', [UserController::class, 'createUser']);
        Route::put('/users/{id}', [UserController::class, 'updateUser']);
        Route::delete('/users/{id}', [UserController::class, 'deleteUser']);
    });
});

