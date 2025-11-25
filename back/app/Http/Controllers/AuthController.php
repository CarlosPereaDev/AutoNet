<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Illuminate\Routing\Controller;

class AuthController extends Controller
{
    /**
     * Obtener headers CORS
     */
    private function getCorsHeaders(): array
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        return [
            'Access-Control-Allow-Origin' => $frontendUrl,
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Accept, Authorization',
        ];
    }

    /**
     * Buscar usuario por email (exacto o case-insensitive) o provider_id
     */
    private function findUserByEmailOrProvider(string $email, ?string $providerId = null): ?User
    {
        // Buscar por email exacto
        $user = User::where('email', $email)->first();
        if ($user) {
            return $user;
        }

        // Buscar case-insensitive
        $emailNormalized = strtolower(trim($email));
        $allUsers = User::all();
        foreach ($allUsers as $u) {
            if (strtolower(trim($u->email)) === $emailNormalized) {
                return $u;
            }
        }

        // Buscar por provider_id
        if ($providerId) {
            return User::where('provider', 'google')
                ->where('provider_id', $providerId)
                ->first();
        }

        return null;
    }

    /**
     * Registrar una nueva organización y usuario administrador
     */
    public function register(Request $request)
    {
        try {
            $request->validate([
                'organization_name' => 'required|string|max:255',
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
                'role' => 'required|in:jefe,trabajador',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors(),
            ], 422);
        }

        // Si es trabajador, buscar organización existente
        // Si es jefe, crear nueva organización
        if ($request->role === 'trabajador') {
            $organization = Organization::where('name', $request->organization_name)->first();
            
            if (!$organization) {
                return response()->json([
                    'message' => 'La organización especificada no existe. Por favor, verifica el nombre.',
                    'errors' => ['organization_name' => ['La organización no existe']],
                ], 422);
            }
        } else {
            // Jefe crea nueva organización - validar que no exista
            $existingOrganization = Organization::where('name', $request->organization_name)->first();
            
            if ($existingOrganization) {
                return response()->json([
                    'message' => 'Ya existe una organización con ese nombre. Por favor, elige otro nombre.',
                    'errors' => ['organization_name' => ['El nombre de la organización ya está en uso']],
                ], 422);
            }
            
            $organization = Organization::create([
                'name' => $request->organization_name,
            ]);
        }

        // Crear el usuario
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'organization_id' => $organization->id,
            'role' => $request->role,
        ]);

        // Autenticar al usuario
        Auth::login($user);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Usuario registrado exitosamente',
            'user' => $user->load('organization'),
            'token' => $token,
        ], 201);
    }

    /**
     * Iniciar sesión
     */
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Las credenciales proporcionadas son incorrectas.',
            ], 401);
        }

        Auth::login($user);
        
        // Actualizar last_activity_at al iniciar sesión
        $user->update(['last_activity_at' => now()]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Inicio de sesión exitoso',
            'user' => $user->load('organization'),
            'token' => $token,
        ]);
    }

    /**
     * Cerrar sesión
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        
        // Limpiar last_activity_at al cerrar sesión
        $user->update(['last_activity_at' => null]);
        
        $user->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente',
        ]);
    }

    /**
     * Heartbeat para mantener el estado activo
     */
    public function heartbeat(Request $request)
    {
        $user = $request->user();
        
        // Actualizar last_activity_at
        $user->update(['last_activity_at' => now()]);

        return response()->json([
            'message' => 'Heartbeat recibido',
            'last_activity_at' => $user->last_activity_at,
        ]);
    }

    /**
     * Redirigir a Google OAuth
     */
    public function redirectToGoogle()
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        
        if (empty(config('services.google.client_id')) || empty(config('services.google.client_secret'))) {
            return redirect("{$frontendUrl}/?error=" . urlencode('Las credenciales de Google OAuth no están configuradas.'));
        }
        
        try {
            return Socialite::driver('google')
                ->scopes(['openid', 'profile', 'email'])
                ->redirect();
        } catch (\Exception $e) {
            return redirect("{$frontendUrl}/?error=" . urlencode('Error al iniciar la autenticación con Google.'));
        }
    }

    /**
     * Manejar callback de Google OAuth
     */
    public function handleGoogleCallback(Request $request)
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        
        try {
            if ($request->has('error')) {
                return redirect("{$frontendUrl}/?error=" . urlencode('Error de Google: ' . $request->get('error_description', $request->get('error'))));
            }

            if (!$request->hasSession()) {
                return redirect("{$frontendUrl}/?error=" . urlencode('Error de sesión. Por favor, habilita las cookies.'));
            }

            $googleUser = Socialite::driver('google')->user();
            
            if (!$googleUser || !$googleUser->getEmail()) {
                return redirect("{$frontendUrl}/?error=" . urlencode('No se pudieron obtener los datos de Google.'));
            }

            $email = $googleUser->getEmail();
            $providerId = $googleUser->getId();
            
            // Buscar usuario existente
            $user = $this->findUserByEmailOrProvider($email, $providerId);

            // Si el usuario existe, autenticarlo y redirigir
            if ($user) {
                // Actualizar información de OAuth si es necesario
                $updateData = [];
                if (!$user->provider || !$user->provider_id) {
                    $updateData['provider'] = 'google';
                    $updateData['provider_id'] = $providerId;
                }
                if ($googleUser->getAvatar() && $user->avatar !== $googleUser->getAvatar()) {
                    $updateData['avatar'] = $googleUser->getAvatar();
                }
                if ($googleUser->getName() && $user->name !== $googleUser->getName()) {
                    $updateData['name'] = $googleUser->getName();
                }
                
                if (!empty($updateData)) {
                    $user->update($updateData);
                }

                // Actualizar last_activity_at al iniciar sesión con Google
                $user->update(['last_activity_at' => now()]);

                Auth::login($user);
                $token = $user->createToken('auth_token')->plainTextToken;
                $dashboardPath = $user->role === 'jefe' ? '/dashboard/jefe' : '/dashboard/trabajador';
                
                return redirect("{$frontendUrl}{$dashboardPath}?token={$token}");
            }

            // Usuario nuevo: guardar datos en sesión y redirigir a completar registro
            $tempToken = Str::random(64);
            $googleData = [
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'provider_id' => $providerId,
                'avatar' => $googleUser->getAvatar(),
            ];
            
            $request->session()->put("google_user_data_{$tempToken}", $googleData);
            $request->session()->put("google_user_data_{$tempToken}_expires", now()->addMinutes(10));

            return redirect("{$frontendUrl}/complete-google-registration?token={$tempToken}");

        } catch (\Throwable $e) {
            \Log::error('Error en Google OAuth callback', ['message' => $e->getMessage()]);
            return redirect("{$frontendUrl}/?error=" . urlencode('Error al procesar la autenticación con Google.'));
        }
    }

    /**
     * Obtener datos temporales de Google para completar el registro
     */
    public function getGoogleRegistrationData(Request $request)
    {
        $corsHeaders = $this->getCorsHeaders();
        
        try {
            $tempToken = $request->query('token');
            
            if (!$tempToken) {
                return response()->json(['message' => 'Token de registro no proporcionado.'], 400)->withHeaders($corsHeaders);
            }

            $googleData = $request->session()->get("google_user_data_{$tempToken}");
            $expires = $request->session()->get("google_user_data_{$tempToken}_expires");
            
            if (!$googleData) {
                return response()->json(['message' => 'No se encontraron datos de Google. Por favor, inicia sesión nuevamente.'], 400)->withHeaders($corsHeaders);
            }

            if ($expires && now()->greaterThan($expires)) {
                $request->session()->forget("google_user_data_{$tempToken}");
                $request->session()->forget("google_user_data_{$tempToken}_expires");
                return response()->json(['message' => 'El token de registro ha expirado. Por favor, inicia sesión nuevamente.'], 400)->withHeaders($corsHeaders);
            }

            return response()->json([
                'email' => $googleData['email'] ?? '',
                'name' => $googleData['name'] ?? '',
            ])->withHeaders($corsHeaders);

        } catch (\Exception $e) {
            \Log::error('Error al obtener datos de registro de Google', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Error al obtener los datos de registro.'], 500)->withHeaders($corsHeaders);
        }
    }

    /**
     * Completar registro después de autenticación con Google
     */
    public function completeGoogleRegistration(Request $request)
    {
        $corsHeaders = $this->getCorsHeaders();

        try {
            $tempToken = $request->input('token');
            
            if (!$tempToken) {
                return response()->json(['message' => 'Token de registro no proporcionado.'], 400)->withHeaders($corsHeaders);
            }

            $googleData = $request->session()->get("google_user_data_{$tempToken}");
            $expires = $request->session()->get("google_user_data_{$tempToken}_expires");
            
            if (!$googleData) {
                return response()->json(['message' => 'No se encontraron datos de Google. Por favor, inicia sesión nuevamente.'], 400)->withHeaders($corsHeaders);
            }

            if ($expires && now()->greaterThan($expires)) {
                $request->session()->forget("google_user_data_{$tempToken}");
                $request->session()->forget("google_user_data_{$tempToken}_expires");
                return response()->json(['message' => 'El token de registro ha expirado. Por favor, inicia sesión nuevamente.'], 400)->withHeaders($corsHeaders);
            }

            // Verificar que el email no esté ya registrado
            if (User::where('email', $googleData['email'])->exists()) {
                return response()->json(['message' => 'Este correo electrónico ya está registrado. Por favor, inicia sesión.'], 409)->withHeaders($corsHeaders);
            }

            $validated = $request->validate([
                'organization_name' => 'required|string|max:255',
                'role' => 'required|in:jefe,trabajador',
            ]);

            // Buscar organización existente (tanto para jefe como trabajador)
            $organization = Organization::where('name', $validated['organization_name'])->first();
            
            if (!$organization) {
                return response()->json([
                    'message' => 'La organización especificada no existe. Por favor, verifica el nombre.',
                    'errors' => ['organization_name' => ['La organización no existe']],
                ], 422)->withHeaders($corsHeaders);
            }

            try {
                $user = User::create([
                    'name' => $googleData['name'],
                    'email' => $googleData['email'],
                    'password' => Hash::make(Str::random(32)),
                    'organization_id' => $organization->id,
                    'role' => $validated['role'],
                    'provider' => 'google',
                    'provider_id' => $googleData['provider_id'],
                    'avatar' => $googleData['avatar'],
                ]);
            } catch (\Illuminate\Database\QueryException $e) {
                if ($e->getCode() == 23000 || $e->getCode() == 19 || str_contains($e->getMessage(), 'UNIQUE constraint')) {
                    return response()->json(['message' => 'Este correo electrónico ya está registrado. Por favor, inicia sesión.'], 409)->withHeaders($corsHeaders);
                }
                throw $e;
            }

            $request->session()->forget("google_user_data_{$tempToken}");
            $request->session()->forget("google_user_data_{$tempToken}_expires");

            // Actualizar last_activity_at al completar registro
            $user->update(['last_activity_at' => now()]);

            Auth::login($user);
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Registro completado exitosamente',
                'token' => $token,
                'user' => $user->load('organization'),
            ], 201)->withHeaders($corsHeaders);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Error de validación', 'errors' => $e->errors()], 422)->withHeaders($corsHeaders);
        } catch (\Exception $e) {
            \Log::error('Error al completar registro de Google', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Error al completar el registro.'], 500)->withHeaders($corsHeaders);
        }
    }
}
