/**
 * Sistema de caché global para evitar llamadas duplicadas
 * Maneja caché en memoria y peticiones en curso para evitar duplicados
 */

const cache = new Map();
const pendingRequests = new Map(); // Para evitar peticiones duplicadas simultáneas

// TTL por defecto según tipo de dato
export const CACHE_TTL = {
  SHORT: 10000,      // 10 segundos - datos que cambian frecuentemente
  MEDIUM: 30000,     // 30 segundos - datos moderadamente estables
  LONG: 300000,      // 5 minutos - datos estables (organizaciones, usuarios)
  VERY_LONG: 600000, // 10 minutos - datos muy estables
};

const DEFAULT_TTL = CACHE_TTL.MEDIUM;

/**
 * Obtener un valor del caché
 * @param {string} key - Clave del caché
 * @returns {any|null} - Valor en caché o null si no existe o expiró
 */
export const getCache = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  
  // Verificar si expiró
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
};

/**
 * Guardar un valor en el caché
 * @param {string} key - Clave del caché
 * @param {any} value - Valor a guardar
 * @param {number} ttl - Tiempo de vida en milisegundos (default: 30s)
 */
export const setCache = (key, value, ttl = DEFAULT_TTL) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttl
  });
};

/**
 * Invalidar un elemento del caché
 * @param {string} key - Clave a invalidar
 */
export const invalidateCache = (key) => {
  cache.delete(key);
  // También cancelar peticiones pendientes para esta clave
  if (pendingRequests.has(key)) {
    pendingRequests.delete(key);
  }
};

/**
 * Invalidar todas las claves que coincidan con un patrón
 * @param {string} pattern - Patrón a buscar (ej: '/tasks')
 */
export const invalidateCachePattern = (pattern) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
  // También limpiar peticiones pendientes que coincidan
  for (const key of pendingRequests.keys()) {
    if (key.includes(pattern)) {
      pendingRequests.delete(key);
    }
  }
};

/**
 * Limpiar todo el caché
 */
export const clearCache = () => {
  cache.clear();
  pendingRequests.clear();
};

/**
 * Wrapper mejorado para funciones async con caché
 * Evita peticiones duplicadas simultáneas
 * @param {string} key - Clave del caché
 * @param {Function} fn - Función async a ejecutar
 * @param {number} ttl - Tiempo de vida en milisegundos
 * @param {boolean} useCache - Si false, ignora el caché y hace la petición
 * @returns {Promise<any>} - Resultado de la función o del caché
 */
export const cachedRequest = async (key, fn, ttl = DEFAULT_TTL, useCache = true) => {
  // Si no usar caché, ejecutar directamente
  if (!useCache) {
    return await fn();
  }

  // Intentar obtener del caché primero
  const cached = getCache(key);
  if (cached !== null) {
    return cached;
  }
  
  // Si ya hay una petición en curso para esta clave, esperar a que termine
  if (pendingRequests.has(key)) {
    return await pendingRequests.get(key);
  }
  
  // Crear nueva petición y guardarla en pendingRequests
  const requestPromise = (async () => {
    try {
      const result = await fn();
      setCache(key, result, ttl);
      return result;
    } catch (error) {
      // En caso de error, no guardar en caché pero lanzar el error
      throw error;
    } finally {
      // Limpiar la petición pendiente
      pendingRequests.delete(key);
    }
  })();
  
  pendingRequests.set(key, requestPromise);
  return await requestPromise;
};

/**
 * Obtener estadísticas del caché (útil para debugging)
 */
export const getCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  for (const [key, item] of cache.entries()) {
    if (now > item.expiresAt) {
      expiredEntries++;
    } else {
      validEntries++;
    }
  }
  
  return {
    totalEntries: cache.size,
    validEntries,
    expiredEntries,
    pendingRequests: pendingRequests.size,
  };
};

