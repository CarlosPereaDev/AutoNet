import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado para animar números desde 0 hasta el valor final
 * @param {number} targetValue - El valor final al que debe llegar la animación
 * @param {number} duration - Duración de la animación en milisegundos (default: 2000)
 * @param {number} decimals - Número de decimales a mostrar (default: 0)
 * @param {string} suffix - Sufijo a agregar después del número (ej: '%', 'h')
 * @returns {string} - El valor animado formateado
 */
export const useAnimatedNumber = (targetValue, duration = 2000, decimals = 0, suffix = '') => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const animationFrameRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Convertir el valor a número
    const endValue = typeof targetValue === 'number' 
      ? targetValue 
      : (targetValue != null ? parseFloat(targetValue) : 0);
    
    // Verificar si es un número válido
    if (isNaN(endValue) || !isFinite(endValue)) {
      setAnimatedValue(0);
      return;
    }

    // Si el valor es 0, establecer directamente sin animación
    if (endValue === 0) {
      setAnimatedValue(0);
      return;
    }

    // Reiniciar la animación cuando cambia el valor objetivo
    setAnimatedValue(0);

    const startTime = Date.now();
    const startValue = 0;

    // Función de animación usando requestAnimationFrame para suavidad
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Función de easing (ease-out) para una animación más natural
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (endValue - startValue) * easeOut;
      setAnimatedValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Asegurar que llegue exactamente al valor final
        setAnimatedValue(endValue);
        animationFrameRef.current = null;
      }
    };

    // Pequeño delay para que la animación se vea mejor
    timeoutRef.current = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(animate);
    }, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetValue, duration]);

  // Formatear el valor con decimales y sufijo
  const formattedValue = animatedValue.toFixed(decimals);
  // Eliminar ceros innecesarios después del punto decimal
  const cleanValue = decimals > 0 ? parseFloat(formattedValue).toString() : Math.round(animatedValue).toString();
  
  return suffix ? `${cleanValue}${suffix}` : cleanValue;
};

