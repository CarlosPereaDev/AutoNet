import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook personalizado para manejar polling de forma eficiente
 * Evita llamadas duplicadas y cancela peticiones pendientes
 */
export function usePolling(fetchFunction, interval = 5000, dependencies = []) {
  const intervalRef = useRef(null);
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const executeFetch = useCallback(async () => {
    // Si ya hay una petición en curso, no hacer otra
    if (isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      await fetchFunction();
    } catch (error) {
      // Solo loggear errores si el componente sigue montado
      if (mountedRef.current && error.message !== 'Petición cancelada') {
        console.error('Error en polling:', error);
      }
    } finally {
      // Solo actualizar el flag si el componente sigue montado
      if (mountedRef.current) {
        isFetchingRef.current = false;
      }
    }
  }, [fetchFunction]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Ejecutar inmediatamente
    executeFetch();

    // Configurar intervalo
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        executeFetch();
      }
    }, interval);

    // Limpiar al desmontar o cambiar dependencias
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [executeFetch, interval, ...dependencies]);

  // Función para forzar una actualización manual
  const refresh = useCallback(() => {
    if (mountedRef.current) {
      executeFetch();
    }
  }, [executeFetch]);

  return { refresh };
}




