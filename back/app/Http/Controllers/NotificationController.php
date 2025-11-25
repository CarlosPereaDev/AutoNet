<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class NotificationController extends Controller
{
    /**
     * Obtener todas las notificaciones del usuario
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['notifications' => $notifications]);
    }

    /**
     * Marcar notificación como leída
     */
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $notification->update([
            'read' => true,
            'read_at' => now(),
        ]);

        return response()->json(['notification' => $notification]);
    }

    /**
     * Marcar todas las notificaciones como leídas
     */
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)
            ->where('read', false)
            ->update([
                'read' => true,
                'read_at' => now(),
            ]);

        return response()->json(['message' => 'Todas las notificaciones han sido marcadas como leídas']);
    }

    /**
     * Eliminar una notificación
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $notification->delete();

        return response()->json(['message' => 'Notificación eliminada']);
    }

    /**
     * Obtener contador de notificaciones no leídas
     */
    public function unreadCount(Request $request)
    {
        $user = $request->user();

        $count = Notification::where('user_id', $user->id)
            ->where('read', false)
            ->count();

        return response()->json(['count' => $count]);
    }
}
