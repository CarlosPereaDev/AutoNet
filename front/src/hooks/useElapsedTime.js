import { useState, useEffect } from 'react';

/**
 * Hook para calcular y mostrar el tiempo transcurrido desde una fecha
 * @param {string|Date} startDate - Fecha de inicio
 * @param {boolean} active - Si el temporizador está activo
 * @returns {string} Tiempo transcurrido formateado
 */
export const useElapsedTime = (startDate, active = true) => {
  const [elapsedTime, setElapsedTime] = useState('');

  useEffect(() => {
    if (!startDate || !active) {
      setElapsedTime('');
      return;
    }

    const calculateElapsed = () => {
      const start = new Date(startDate);
      const now = new Date();
      const diff = now - start;

      if (diff < 0) {
        setElapsedTime('');
        return;
      }

      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        setElapsedTime(`${days}d ${hours % 24}h ${minutes % 60}m`);
      } else if (hours > 0) {
        setElapsedTime(`${hours}h ${minutes % 60}m`);
      } else if (minutes > 0) {
        setElapsedTime(`${minutes}m ${seconds % 60}s`);
      } else {
        setElapsedTime(`${seconds}s`);
      }
    };

    // Calcular inmediatamente
    calculateElapsed();

    // Actualizar cada segundo
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startDate, active]);

  return elapsedTime;
};

export default useElapsedTime;


