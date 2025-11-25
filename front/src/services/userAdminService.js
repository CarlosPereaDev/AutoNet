/**
 * Servicio para gestionar usuarios (solo admin)
 */

import api from './api';
import { cachedRequest, invalidateCachePattern, CACHE_TTL } from './cache';

/**
 * Obtener todos los usuarios (solo admin)
 */
export const getAllUsers = async (useCache = true) => {
  const key = '/admin/users';
  return await cachedRequest(key, () => api.get(key), CACHE_TTL.MEDIUM, useCache);
};

/**
 * Crear un nuevo usuario (solo admin)
 */
export const createUser = async (userData) => {
  invalidateCachePattern('/admin/users');
  invalidateCachePattern('/workers');
  return await api.post('/admin/users', userData);
};

/**
 * Actualizar un usuario (solo admin)
 */
export const updateUser = async (id, userData) => {
  invalidateCachePattern('/admin/users');
  invalidateCachePattern('/workers');
  return await api.put(`/admin/users/${id}`, userData);
};

/**
 * Eliminar un usuario (solo admin)
 */
export const deleteUser = async (id) => {
  invalidateCachePattern('/admin/users');
  invalidateCachePattern('/workers');
  return await api.delete(`/admin/users/${id}`);
};

export default {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};


