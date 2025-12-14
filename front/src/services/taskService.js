/**
 * Servicio para gestionar tareas
 */

import api from './api';
import { cachedRequest, invalidateCachePattern, CACHE_TTL } from './cache';

/**
 * Obtener todas las tareas (para jefe)
 */
export const getTasks = async (useCache = true) => {
  const key = '/tasks';
  return await cachedRequest(key, () => api.get(key), CACHE_TTL.SHORT, useCache);
};

/**
 * Obtener tareas del trabajador
 */
export const getMyTasks = async (useCache = true) => {
  const key = '/tasks/my';
  return await cachedRequest(key, () => api.get(key), CACHE_TTL.SHORT, useCache);
};

/**
 * Obtener tareas disponibles (sin asignar)
 */
export const getAvailableTasks = async (useCache = true) => {
  const key = '/tasks/available';
  return await cachedRequest(key, () => api.get(key), CACHE_TTL.SHORT, useCache);
};

/**
 * Crear una nueva tarea
 */
export const createTask = async (taskData) => {
  // Invalidar caché de tareas al crear una nueva
  invalidateCachePattern('/tasks');
  return await api.post('/tasks', taskData);
};

/**
 * Actualizar una tarea
 */
export const updateTask = async (id, taskData) => {
  // Invalidar caché de tareas al actualizar
  invalidateCachePattern('/tasks');
  return await api.put(`/tasks/${id}`, taskData);
};

/**
 * Reservar una tarea (asignarla a un trabajador)
 */
export const reserveTask = async (id) => {
  // Invalidar caché de tareas al reservar
  invalidateCachePattern('/tasks');
  return await api.post(`/tasks/${id}/reserve`);
};

/**
 * Eliminar una tarea
 */
export const deleteTask = async (id) => {
  // Invalidar caché de tareas al eliminar
  invalidateCachePattern('/tasks');
  return await api.delete(`/tasks/${id}`);
};

export default {
  getTasks,
  getMyTasks,
  getAvailableTasks,
  createTask,
  updateTask,
  reserveTask,
  deleteTask,
};


