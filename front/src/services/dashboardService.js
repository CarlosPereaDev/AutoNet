/**
 * Servicio para obtener estadísticas del dashboard
 */

import api from './api';
import { cachedRequest } from './cache';

/**
 * Obtener estadísticas del dashboard para jefe
 * @param {boolean} useCache - Si usar caché o no
 * @param {string} period - Período de tiempo: '7days', '4weeks', '3months', '6months', '12months'
 */
export const getJefeStats = async (useCache = true, period = '12months') => {
  const key = `/dashboard/jefe/stats?period=${period}`;
  
  if (useCache) {
    return await cachedRequest(key, () => api.get(key), 30000); // 30 segundos de caché
  }
  
  return await api.get(key);
};

/**
 * Obtener estadísticas del dashboard para trabajador
 */
export const getTrabajadorStats = async (useCache = true) => {
  const key = '/dashboard/trabajador/stats';
  
  if (useCache) {
    return await cachedRequest(key, () => api.get(key), 30000); // 30 segundos de caché
  }
  
  return await api.get(key);
};

export default {
  getJefeStats,
  getTrabajadorStats,
};


