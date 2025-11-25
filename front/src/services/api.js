/**
 * Configuración base de la API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Función helper para hacer peticiones HTTP
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
    const response = await fetch(url, config);
    
    // Intentar parsear JSON, pero manejar errores si no es JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text || 'Error en la petición' };
    }

    // Si la respuesta no es exitosa, crear un error con la respuesta completa
    if (!response.ok) {
      const error = new Error(data.message || 'Error en la petición');
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: data
      };
      throw error;
    }

    return data;
  } catch (error) {
    // Si es un error de red, lanzar mensaje más claro
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Error de conexión con el servidor. Por favor, verifica que el servidor esté ejecutándose.');
      networkError.isNetworkError = true;
      throw networkError;
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


