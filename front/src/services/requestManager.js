/**
 * Gestor de peticiones para evitar llamadas duplicadas y stackearse
 */

// Mapa de peticiones en curso
const pendingRequests = new Map();

// AbortControllers para cancelar peticiones
const abortControllers = new Map();

/**
 * Genera una clave única para una petición
 */
function getRequestKey(endpoint, options = {}) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${endpoint}:${body}`;
}

/**
 * Realiza una petición con deduplicación
 * Si ya hay una petición idéntica en curso, devuelve la misma promesa
 */
export async function deduplicatedRequest(endpoint, options = {}) {
  const key = getRequestKey(endpoint, options);
  
  // Si ya hay una petición idéntica en curso, devolver la misma promesa
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  // Crear AbortController para poder cancelar la petición
  const abortController = new AbortController();
  abortControllers.set(key, abortController);

  // Crear la petición
  const requestPromise = fetch(endpoint, {
    ...options,
    signal: abortController.signal,
  })
    .then(async (response) => {
      // Limpiar después de completar
      pendingRequests.delete(key);
      abortControllers.delete(key);
      
      // Parsear respuesta
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
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
      } else {
        const text = await response.text();
        const data = { message: text || 'Error en la petición' };
        if (!response.ok) {
          const error = new Error(data.message);
          error.response = {
            status: response.status,
            statusText: response.statusText,
            data: data
          };
          throw error;
        }
        return data;
      }
    })
    .catch((error) => {
      // Limpiar en caso de error
      pendingRequests.delete(key);
      abortControllers.delete(key);
      
      // Si fue cancelado, no lanzar error
      if (error.name === 'AbortError') {
        return Promise.reject(new Error('Petición cancelada'));
      }
      throw error;
    });

  // Guardar la petición en curso
  pendingRequests.set(key, requestPromise);

  return requestPromise;
}

/**
 * Cancela todas las peticiones pendientes de un endpoint específico
 */
export function cancelPendingRequests(endpoint, options = {}) {
  const key = getRequestKey(endpoint, options);
  const abortController = abortControllers.get(key);
  
  if (abortController) {
    abortController.abort();
    pendingRequests.delete(key);
    abortControllers.delete(key);
  }
}

/**
 * Cancela todas las peticiones pendientes
 */
export function cancelAllPendingRequests() {
  abortControllers.forEach((controller) => {
    controller.abort();
  });
  pendingRequests.clear();
  abortControllers.clear();
}

/**
 * Verifica si hay una petición pendiente para un endpoint
 */
export function hasPendingRequest(endpoint, options = {}) {
  const key = getRequestKey(endpoint, options);
  return pendingRequests.has(key);
}




