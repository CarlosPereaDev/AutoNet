/**
 * Servicio para gestionar notificaciones
 */

import api from './api';
import { cachedRequest, invalidateCachePattern, CACHE_TTL } from './cache';

/**
 * Obtener todas las notificaciones del usuario
 */
export const getNotifications = async (useCache = false) => {
  const key = '/notifications';
  return await cachedRequest(key, () => api.get(key), CACHE_TTL.SHORT, useCache);
};

/**
 * Obtener contador de notificaciones no leídas
 */
export const getUnreadCount = async (useCache = false) => {
  const key = '/notifications/unread-count';
  return await cachedRequest(key, () => api.get(key), CACHE_TTL.SHORT, useCache);
};

/**
 * Marcar notificación como leída
 */
export const markAsRead = async (id) => {
  invalidateCachePattern('/notifications');
  return await api.put(`/notifications/${id}/read`);
};

/**
 * Marcar todas las notificaciones como leídas
 */
export const markAllAsRead = async () => {
  invalidateCachePattern('/notifications');
  return await api.put('/notifications/read-all');
};

/**
 * Eliminar una notificación
 */
export const deleteNotification = async (id) => {
  invalidateCachePattern('/notifications');
  return await api.delete(`/notifications/${id}`);
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};


