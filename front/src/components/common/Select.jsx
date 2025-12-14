import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons';
import '../styles/Select.css';

/**
 * Componente Select personalizado (sin select nativo)
 * @param {Object} props
 * @param {string} props.label - Etiqueta del select
 * @param {string} props.name - Nombre del campo
 * @param {string} props.value - Valor seleccionado
 * @param {Function} props.onChange - Función de cambio (recibe el valor)
 * @param {Array} props.options - Array de opciones [{value, label}]
 * @param {string} props.placeholder - Texto placeholder
 * @param {boolean} props.required - Si es requerido
 * @param {boolean} props.disabled - Si está deshabilitado
 * @param {string} props.className - Clases CSS adicionales
 * @param {string} props.error - Mensaje de error
 */
function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  required = false,
  disabled = false,
  className = '',
  error = null,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);
  const selectId = `select-${name || Math.random().toString(36).substr(2, 9)}`;

  // Encontrar la opción seleccionada
  const selectedOption = options.find(opt => {
    const optValue = typeof opt === 'object' ? opt.value : opt;
    return String(optValue) === String(value);
  });

  const displayValue = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : placeholder;

  // Actualizar posición del dropdown cuando se abre o se hace scroll
  useEffect(() => {
    if (isOpen && selectRef.current) {
      const updatePosition = () => {
        const rect = selectRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 6,
          left: rect.left,
          width: rect.width
        });
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Manejar teclado
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
          event.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            handleSelect(options[focusedIndex]);
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, focusedIndex, options]);

  const handleSelect = (option) => {
    const optValue = typeof option === 'object' ? option.value : option;
    onChange({ target: { name, value: optValue } });
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      const newIsOpen = !isOpen;
      setIsOpen(newIsOpen);
      if (newIsOpen && selectRef.current) {
        // Calcular posición del dropdown
        const rect = selectRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 6,
          left: rect.left,
          width: rect.width
        });
        // Encontrar el índice de la opción seleccionada
        const currentIndex = options.findIndex(opt => {
          const optValue = typeof opt === 'object' ? opt.value : opt;
          return String(optValue) === String(value);
        });
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
    }
  };

  return (
    <div 
      className={`select-wrapper ${className} ${error ? 'select-error' : ''} ${disabled ? 'select-disabled' : ''} ${isOpen ? 'select-open' : ''}`}
      {...props}
    >
      {label && (
        <label htmlFor={selectId} className="select-label">
          {label}
          {required && <span className="select-required">*</span>}
        </label>
      )}
      <div className="select-container">
        <button
          id={selectId}
          type="button"
          ref={selectRef}
          className={`select-input ${!selectedOption ? 'select-placeholder' : ''}`}
          onClick={toggleDropdown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="select-value">{displayValue}</span>
          <div className="select-arrow">
            <FontAwesomeIcon icon={faChevronDown} />
          </div>
        </button>
        
        {isOpen && !disabled && (
          <div 
            ref={dropdownRef}
            className="select-dropdown"
            role="listbox"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`
            }}
          >
            {options.length === 0 ? (
              <div className="select-option select-option-empty">
                No hay opciones disponibles
              </div>
            ) : (
              options.map((option, index) => {
                const optValue = typeof option === 'object' ? option.value : option;
                const optLabel = typeof option === 'object' ? option.label : option;
                const isSelected = String(optValue) === String(value);
                const isFocused = index === focusedIndex;
                
                return (
                  <div
                    key={optValue}
                    className={`select-option ${isSelected ? 'select-option-selected' : ''} ${isFocused ? 'select-option-focused' : ''}`}
                    onClick={() => handleSelect(option)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="select-option-label">{optLabel}</span>
                    {isSelected && (
                      <FontAwesomeIcon icon={faCheck} className="select-option-check" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      {error && <span className="select-error-message">{error}</span>}
    </div>
  );
}

export default Select;
