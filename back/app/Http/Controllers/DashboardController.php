<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\Vehicle;
use App\Models\Machinery;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Routing\Controller;

class DashboardController extends Controller
{
    /**
     * Obtener estadísticas del dashboard para jefe
     */
    public function getJefeStats(Request $request)
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        // Obtener estadísticas de tareas
        $totalTasks = Task::where('organization_id', $organizationId)->count();
        $pendingTasks = Task::where('organization_id', $organizationId)
            ->where('status', 'pending')
            ->count();
        $completedTasks = Task::where('organization_id', $organizationId)
            ->where('status', 'completed')
            ->count();
        $inProgressTasks = Task::where('organization_id', $organizationId)
            ->where('status', 'in_progress')
            ->count();

        // Tareas completadas este mes vs mes anterior
        $completedThisMonth = Task::where('organization_id', $organizationId)
            ->where('status', 'completed')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->count();
        
        $completedLastMonth = Task::where('organization_id', $organizationId)
            ->where('status', 'completed')
            ->whereMonth('updated_at', now()->subMonth()->month)
            ->whereYear('updated_at', now()->subMonth()->year)
            ->count();
        
        $tasksTrend = $completedLastMonth > 0 
            ? round((($completedThisMonth - $completedLastMonth) / $completedLastMonth) * 100, 1)
            : ($completedThisMonth > 0 ? 100 : 0);

        // Obtener estadísticas de vehículos
        $totalVehicles = Vehicle::where('organization_id', $organizationId)->count();
        $activeVehicles = Vehicle::where('organization_id', $organizationId)
            ->where('status', 'active')
            ->count();
        $pendingMaintenance = Vehicle::where('organization_id', $organizationId)
            ->where('status', 'maintenance')
            ->count();

        // Obtener estadísticas de maquinaria
        $totalMachinery = Machinery::where('organization_id', $organizationId)->count();
        $activeMachinery = Machinery::where('organization_id', $organizationId)
            ->where('status', 'active')
            ->count();

        // Obtener estadísticas de trabajadores
        $totalWorkers = User::where('organization_id', $organizationId)
            ->where('role', 'trabajador')
            ->count();
        
        // Trabajadores activos (con sesión iniciada - última actividad en los últimos 5 minutos)
        $activeWorkers = User::where('organization_id', $organizationId)
            ->where('role', 'trabajador')
            ->whereNotNull('last_activity_at')
            ->where('last_activity_at', '>=', now()->subMinutes(5))
            ->count();
        
        // Calcular horas trabajadas este mes vs mes anterior (basado en tareas completadas)
        $thisMonthStart = now()->startOfMonth();
        $thisMonthEnd = now()->endOfMonth();
        $lastMonthStart = now()->subMonth()->startOfMonth();
        $lastMonthEnd = now()->subMonth()->endOfMonth();
        
        // Calcular horas basadas en estimated_hours de tareas completadas
        $hoursThisMonth = Task::where('organization_id', $organizationId)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$thisMonthStart, $thisMonthEnd])
            ->sum('estimated_hours') ?? 0;
        
        $hoursLastMonth = Task::where('organization_id', $organizationId)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$lastMonthStart, $lastMonthEnd])
            ->sum('estimated_hours') ?? 0;
        
        $hoursTrend = $hoursLastMonth > 0 
            ? round((($hoursThisMonth - $hoursLastMonth) / $hoursLastMonth) * 100, 1)
            : ($hoursThisMonth > 0 ? 100 : 0);

        // Calcular tasa de productividad (tareas completadas / total)
        $productivityRate = $totalTasks > 0 
            ? round(($completedTasks / $totalTasks) * 100) 
            : 0;

        // Tasa de productividad mes anterior para comparación
        $lastMonthStart = now()->subMonth()->startOfMonth();
        $lastMonthEnd = now()->subMonth()->endOfMonth();
        
        $lastMonthTotal = Task::where('organization_id', $organizationId)
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->count();
        
        $lastMonthCompleted = Task::where('organization_id', $organizationId)
            ->where('status', 'completed')
            ->whereBetween('updated_at', [$lastMonthStart, $lastMonthEnd])
            ->count();
        
        $productivityLastMonth = $lastMonthTotal > 0 
            ? round(($lastMonthCompleted / $lastMonthTotal) * 100) 
            : 0;
        
        $productivityTrend = $productivityLastMonth > 0 
            ? round($productivityRate - $productivityLastMonth, 1)
            : ($productivityRate > 0 ? $productivityRate : 0);

        // Datos para gráficos según período seleccionado
        $period = $request->input('period', '12months'); // Por defecto 12 meses
        $chartData = [];
        
        if ($period === '7days') {
            // Últimos 7 días
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $dayStart = $date->copy()->startOfDay();
                $dayEnd = $date->copy()->endOfDay();
                
                $completed = Task::where('organization_id', $organizationId)
                    ->where('status', 'completed')
                    ->whereBetween('updated_at', [$dayStart, $dayEnd])
                    ->count();
                
                $inProgress = Task::where('organization_id', $organizationId)
                    ->where('status', 'in_progress')
                    ->whereBetween('updated_at', [$dayStart, $dayEnd])
                    ->count();
                
                $hours = Task::where('organization_id', $organizationId)
                    ->where('status', 'completed')
                    ->whereNotNull('completed_at')
                    ->whereBetween('completed_at', [$dayStart, $dayEnd])
                    ->sum('estimated_hours') ?? 0;
                
                $dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                
                $chartData[] = [
                    'label' => $dayNames[$date->dayOfWeek] . ' ' . $date->day,
                    'completed' => $completed,
                    'in_progress' => $inProgress,
                    'hours' => round($hours, 1),
                ];
            }
        } elseif ($period === '4weeks') {
            // Últimas 4 semanas
            for ($i = 3; $i >= 0; $i--) {
                $weekStart = now()->subWeeks($i)->startOfWeek();
                $weekEnd = $weekStart->copy()->endOfWeek();
                
                $completed = Task::where('organization_id', $organizationId)
                    ->where('status', 'completed')
                    ->whereBetween('updated_at', [$weekStart, $weekEnd])
                    ->count();
                
                $inProgress = Task::where('organization_id', $organizationId)
                    ->where('status', 'in_progress')
                    ->whereBetween('updated_at', [$weekStart, $weekEnd])
                    ->count();
                
                $hours = Task::where('organization_id', $organizationId)
                    ->where('status', 'completed')
                    ->whereNotNull('completed_at')
                    ->whereBetween('completed_at', [$weekStart, $weekEnd])
                    ->sum('estimated_hours') ?? 0;
                
                $chartData[] = [
                    'label' => 'Sem ' . ($weekStart->week),
                    'completed' => $completed,
                    'in_progress' => $inProgress,
                    'hours' => round($hours, 1),
                ];
            }
        } elseif ($period === '3months') {
            // Últimos 3 meses
            for ($i = 2; $i >= 0; $i--) {
                $month = now()->subMonths($i);
                $monthStart = $month->copy()->startOfMonth();
                $monthEnd = $month->copy()->endOfMonth();
                
                $completed = Task::where('organization_id', $organizationId)
                    ->where('status', 'completed')
                    ->whereBetween('updated_at', [$monthStart, $monthEnd])
                    ->count();
                
                $inProgress = Task::where('organization_id', $organizationId)
                    ->where('status', 'in_progress')
                    ->whereBetween('updated_at', [$monthStart, $monthEnd])
                    ->count();
                
                $hours = Task::where('organization_id', $organizationId)
                    ->where('status', 'completed')
                    ->whereNotNull('completed_at')
                    ->whereBetween('completed_at', [$monthStart, $monthEnd])
                    ->sum('estimated_hours') ?? 0;
                
                $monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                
                $chartData[] = [
                    'label' => $monthNames[$month->month - 1],
                    'completed' => $completed,
                    'in_progress' => $inProgress,
                    'hours' => round($hours, 1),
                ];
            }
        } elseif ($period === '6months') {
            // Últimos 6 meses
            for ($i = 5; $i >= 0; $i--) {
                $month = now()->subMonths($i);
                $monthStart = $month->copy()->startOfMonth();
                $monthEnd = $month->copy()->endOfMonth();
                
                $completed = Task::where('organization_id', $organizationId)
                    ->where('status', 'completed')
                    ->whereBetween('updated_at', [$monthStart, $monthEnd])
                    ->count();
                
                $inProgress = Task::where('organization_id', $organizationId)
                    ->where('status', 'in_progress')
                    ->whereBetween('updated_at', [$monthStart, $monthEnd])
                    ->count();
                
                $hours = Task::where('organization_id', $organizationId)
                    ->where('status', 'completed')
                    ->whereNotNull('completed_at')
                    ->whereBetween('completed_at', [$monthStart, $monthEnd])
                    ->sum('estimated_hours') ?? 0;
                
                $monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                
                $chartData[] = [
                    'label' => $monthNames[$month->month - 1],
                    'completed' => $completed,
                    'in_progress' => $inProgress,
                    'hours' => round($hours, 1),
                ];
            }
        } else {
            // Últimos 12 meses (por defecto)
            for ($i = 11; $i >= 0; $i--) {
                $month = now()->subMonths($i);
                $monthStart = $month->copy()->startOfMonth();
                $monthEnd = $month->copy()->endOfMonth();
                
                $completed = Task::where('organization_id', $organizationId)
                    ->where('status', 'completed')
                    ->whereBetween('updated_at', [$monthStart, $monthEnd])
                    ->count();
                
                $inProgress = Task::where('organization_id', $organizationId)
                    ->where('status', 'in_progress')
                    ->whereBetween('updated_at', [$monthStart, $monthEnd])
                    ->count();
                
                $hours = Task::where('organization_id', $organizationId)
                    ->where('status', 'completed')
                    ->whereNotNull('completed_at')
                    ->whereBetween('completed_at', [$monthStart, $monthEnd])
                    ->sum('estimated_hours') ?? 0;
                
                $monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                
                $chartData[] = [
                    'label' => $monthNames[$month->month - 1],
                    'completed' => $completed,
                    'in_progress' => $inProgress,
                    'hours' => round($hours, 1),
                ];
            }
        }
        
        $monthlyData = $chartData; // Mantener compatibilidad con el nombre existente

        // Calcular porcentajes para el gráfico de barras
        $maxCompleted = max(array_column($monthlyData, 'completed')) ?: 1;
        $maxInProgress = max(array_column($monthlyData, 'in_progress')) ?: 1;
        $maxValue = max($maxCompleted, $maxInProgress) ?: 1;
        
        // Agregar el período actual a la respuesta
        $currentPeriod = $period;

        return response()->json([
            'totalTasks' => $totalTasks,
            'pendingTasks' => $pendingTasks,
            'completedTasks' => $completedTasks,
            'inProgressTasks' => $inProgressTasks,
            'totalVehicles' => $totalVehicles,
            'activeVehicles' => $activeVehicles,
            'totalMachinery' => $totalMachinery,
            'activeMachinery' => $activeMachinery,
            'totalWorkers' => $totalWorkers,
            'activeWorkers' => $activeWorkers,
            'pendingMaintenance' => $pendingMaintenance,
            'totalHoursWorked' => round($hoursThisMonth, 1),
            'productivityRate' => $productivityRate,
            'tasksTrend' => $tasksTrend,
            'hoursTrend' => $hoursTrend,
            'productivityTrend' => $productivityTrend,
            'monthlyData' => $monthlyData,
            'maxChartValue' => $maxValue,
            'currentPeriod' => $currentPeriod,
        ]);
    }

    /**
     * Obtener estadísticas del dashboard para trabajador
     */
    public function getTrabajadorStats(Request $request)
    {
        $user = $request->user();

        // Obtener tareas del trabajador
        $myTasks = Task::where('assigned_to', $user->id)->count();
        $pendingTasks = Task::where('assigned_to', $user->id)
            ->where('status', 'pending')
            ->count();
        $completedTasks = Task::where('assigned_to', $user->id)
            ->where('status', 'completed')
            ->count();
        $inProgressTasks = Task::where('assigned_to', $user->id)
            ->where('status', 'in_progress')
            ->count();

        // Horas trabajadas este mes
        $thisMonthStart = now()->startOfMonth();
        $thisMonthEnd = now()->endOfMonth();
        $hoursThisMonth = Task::where('assigned_to', $user->id)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$thisMonthStart, $thisMonthEnd])
            ->sum('estimated_hours') ?? 0;

        // Horas trabajadas mes anterior
        $lastMonthStart = now()->subMonth()->startOfMonth();
        $lastMonthEnd = now()->subMonth()->endOfMonth();
        $hoursLastMonth = Task::where('assigned_to', $user->id)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$lastMonthStart, $lastMonthEnd])
            ->sum('estimated_hours') ?? 0;

        $hoursTrend = $hoursLastMonth > 0 
            ? round((($hoursThisMonth - $hoursLastMonth) / $hoursLastMonth) * 100, 1)
            : ($hoursThisMonth > 0 ? 100 : 0);

        // Tareas completadas este mes vs mes anterior
        $tasksThisMonth = Task::where('assigned_to', $user->id)
            ->where('status', 'completed')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->count();

        $tasksLastMonth = Task::where('assigned_to', $user->id)
            ->where('status', 'completed')
            ->whereMonth('updated_at', now()->subMonth()->month)
            ->whereYear('updated_at', now()->subMonth()->year)
            ->count();

        $tasksTrend = $tasksLastMonth > 0 
            ? round((($tasksThisMonth - $tasksLastMonth) / $tasksLastMonth) * 100, 1)
            : ($tasksThisMonth > 0 ? 100 : 0);

        // Tasa de completación
        $completionRate = $myTasks > 0 
            ? round(($completedTasks / $myTasks) * 100) 
            : 0;

        // Datos mensuales para gráficos
        $monthlyData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $monthStart = $month->copy()->startOfMonth();
            $monthEnd = $month->copy()->endOfMonth();
            
            $monthlyCompleted = Task::where('assigned_to', $user->id)
                ->where('status', 'completed')
                ->whereBetween('updated_at', [$monthStart, $monthEnd])
                ->count();
            
            $monthlyHours = Task::where('assigned_to', $user->id)
                ->where('status', 'completed')
                ->whereNotNull('completed_at')
                ->whereBetween('completed_at', [$monthStart, $monthEnd])
                ->sum('estimated_hours') ?? 0;
            
            $monthNames = [
                'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
            ];
            
            $monthlyData[] = [
                'month' => $monthNames[$month->month - 1],
                'completed' => $monthlyCompleted,
                'hours' => round($monthlyHours, 1),
            ];
        }

        return response()->json([
            'myTasks' => $myTasks,
            'pendingTasks' => $pendingTasks,
            'completedTasks' => $completedTasks,
            'inProgressTasks' => $inProgressTasks,
            'totalHoursWorked' => round($hoursThisMonth, 1),
            'tasksThisMonth' => $tasksThisMonth,
            'hoursTrend' => $hoursTrend,
            'tasksTrend' => $tasksTrend,
            'completionRate' => $completionRate,
            'monthlyData' => $monthlyData,
        ]);
    }
}

