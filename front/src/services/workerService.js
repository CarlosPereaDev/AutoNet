/**
 * Servicio para gestionar trabajadores
 */

import api from './api';
import { cachedRequest, invalidateCachePattern, CACHE_TTL } from './cache';

/**
 * Obtener todos los trabajadores
 */
export const getWorkers = async (useCache = true) => {
  const key = '/workers';
  return await cachedRequest(key, () => api.get(key), CACHE_TTL.LONG, useCache);
};

/**
 * Crear un nuevo trabajador
 */
export const createWorker = async (workerData) => {
  invalidateCachePattern('/workers');
  return await api.post('/workers', workerData);
};

/**
 * Actualizar un trabajador
 */
export const updateWorker = async (id, workerData) => {
  invalidateCachePattern('/workers');
  return await api.put(`/workers/${id}`, workerData);
};

/**
 * Eliminar un trabajador
 */
export const deleteWorker = async (id) => {
  invalidateCachePattern('/workers');
  return await api.delete(`/workers/${id}`);
};

export default {
  getWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
};


