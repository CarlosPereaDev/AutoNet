/**
 * Servicio para gestionar maquinaria
 */

import api from './api';
import { cachedRequest, invalidateCachePattern, CACHE_TTL } from './cache';

/**
 * Obtener toda la maquinaria
 */
export const getMachineries = async (useCache = true) => {
  const key = '/machineries';
  return await cachedRequest(key, () => api.get(key), CACHE_TTL.MEDIUM, useCache);
};

/**
 * Crear nueva maquinaria
 */
export const createMachinery = async (machineryData) => {
  invalidateCachePattern('/machineries');
  return await api.post('/machineries', machineryData);
};

/**
 * Actualizar maquinaria
 */
export const updateMachinery = async (id, machineryData) => {
  invalidateCachePattern('/machineries');
  return await api.put(`/machineries/${id}`, machineryData);
};

/**
 * Eliminar maquinaria
 */
export const deleteMachinery = async (id) => {
  invalidateCachePattern('/machineries');
  return await api.delete(`/machineries/${id}`);
};

export default {
  getMachineries,
  createMachinery,
  updateMachinery,
  deleteMachinery,
};


