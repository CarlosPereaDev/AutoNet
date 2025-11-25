<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/', function () {
    return view('welcome');
});

// Rutas de OAuth con Google (necesitan sesiones, por eso están en web.php)
Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

// Ruta para obtener datos temporales de Google (necesita sesión)
Route::get('/auth/google/registration-data', [AuthController::class, 'getGoogleRegistrationData']);

// Ruta para completar registro después de Google OAuth (necesita sesión)
// Excluir del middleware CSRF porque viene del frontend
Route::options('/auth/google/complete-registration', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', env('FRONTEND_URL', 'http://localhost:5173'))
        ->header('Access-Control-Allow-Credentials', 'true')
        ->header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
});

Route::post('/auth/google/complete-registration', [AuthController::class, 'completeGoogleRegistration'])
    ->middleware('web')
    ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
