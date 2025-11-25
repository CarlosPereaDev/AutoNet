/**
 * Servicio para gestionar organizaciones
 */

import api from './api';
import { cachedRequest, invalidateCachePattern, CACHE_TTL } from './cache';

/**
 * Obtener todas las organizaciones (para select)
 * Con caché global para evitar múltiples llamadas
 */
export const getOrganizations = async (useCache = true) => {
  const key = '/organizations';
  
  return await cachedRequest(
    key,
    async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/organizations`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          return { organizations: [] };
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error al obtener organizaciones:', error);
        return { organizations: [] };
      }
    },
    CACHE_TTL.LONG, // 5 minutos - las organizaciones cambian poco
    useCache
  );
};

/**
 * Invalidar caché de organizaciones
 */
export const invalidateOrganizationsCache = () => {
  invalidateCachePattern('/organizations');
};

/**
 * Buscar organizaciones por nombre (autocompletado)
 * Sin caché ya que es una búsqueda dinámica
 */
export const searchOrganizations = async (query) => {
  if (!query || query.trim().length < 2) {
    return { organizations: [] };
  }
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/organizations/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return { organizations: [] };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al buscar organizaciones:', error);
    return { organizations: [] };
  }
};

/**
 * Obtener todas las organizaciones con estadísticas (solo admin)
 */
export const getAllOrganizations = async () => {
  const key = '/admin/organizations';
  return await cachedRequest(key, () => api.get(key), CACHE_TTL.MEDIUM);
};

/**
 * Crear una nueva organización (solo admin)
 */
export const createOrganization = async (organizationData) => {
  invalidateCachePattern('/organizations');
  invalidateCachePattern('/admin/organizations');
  return await api.post('/admin/organizations', organizationData);
};

/**
 * Actualizar una organización (solo admin)
 */
export const updateOrganization = async (id, organizationData) => {
  invalidateCachePattern('/organizations');
  invalidateCachePattern('/admin/organizations');
  return await api.put(`/admin/organizations/${id}`, organizationData);
};

/**
 * Eliminar una organización (solo admin)
 */
export const deleteOrganization = async (id) => {
  invalidateCachePattern('/organizations');
  invalidateCachePattern('/admin/organizations');
  return await api.delete(`/admin/organizations/${id}`);
};

/**
 * Obtener estadísticas de una organización (solo admin)
 */
export const getOrganizationStats = async (id) => {
  const key = `/admin/organizations/${id}/stats`;
  return await cachedRequest(key, () => api.get(key), CACHE_TTL.SHORT);
};

export default {
  getOrganizations,
  searchOrganizations,
  getAllOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationStats,
};

