/**
 * Servicio para gestionar vehículos
 */

import api from './api';
import { cachedRequest, invalidateCachePattern, CACHE_TTL } from './cache';

/**
 * Obtener todos los vehículos
 */
export const getVehicles = async (useCache = true) => {
  const key = '/vehicles';
  return await cachedRequest(key, () => api.get(key), CACHE_TTL.MEDIUM, useCache);
};

/**
 * Crear un nuevo vehículo
 */
export const createVehicle = async (vehicleData) => {
  invalidateCachePattern('/vehicles');
  return await api.post('/vehicles', vehicleData);
};

/**
 * Actualizar un vehículo
 */
export const updateVehicle = async (id, vehicleData) => {
  invalidateCachePattern('/vehicles');
  return await api.put(`/vehicles/${id}`, vehicleData);
};

/**
 * Eliminar un vehículo
 */
export const deleteVehicle = async (id) => {
  invalidateCachePattern('/vehicles');
  return await api.delete(`/vehicles/${id}`);
};

export default {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};


