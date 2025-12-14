/**
 * Configuración base de la API
 */

import { deduplicatedRequest } from './requestManager';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Función helper para hacer peticiones HTTP con deduplicación
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Obtener token del localStorage si existe
  const token = localStorage.getItem('token');
  
  // Configurar headers por defecto
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  // Agregar token de autenticación si existe
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Configuración de la petición
  const config = {
    ...options,
    headers,
  };

  try {
    // Usar deduplicatedRequest para evitar llamadas duplicadas
    const data = await deduplicatedRequest(url, config);
    return data;
  } catch (error) {
    // Si es un error de red, lanzar mensaje más claro
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Error de conexión con el servidor. Por favor, verifica que el servidor esté ejecutándose.');
      networkError.isNetworkError = true;
      throw networkError;
    }
    // Si es un error de abort, no propagarlo como error crítico
    if (error.message === 'Petición cancelada') {
      throw error;
    }
    // Si ya tiene response, mantenerlo
    if (!error.response) {
      error.response = { data: { message: error.message } };
    }
    throw error;
  }
}

/**
 * Métodos HTTP helpers
 */
export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, data, options = {}) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data, options = {}) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  patch: (endpoint, data, options = {}) => request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;


