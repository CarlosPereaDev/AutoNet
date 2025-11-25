/**
 * Servicio de autenticación
 */

import api from './api';

/**
 * Registrar una nueva organización y usuario administrador
 * @param {Object} registerData - Datos de registro
 * @param {string} registerData.organization_name - Nombre de la empresa
 * @param {string} registerData.name - Nombre completo del usuario
 * @param {string} registerData.email - Correo electrónico
 * @param {string} registerData.password - Contraseña
 * @param {string} registerData.password_confirmation - Confirmación de contraseña
 * @returns {Promise<Object>} Datos del usuario y token
 */
export const register = async (registerData) => {
  // Login y registro no requieren token
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(registerData),
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.errors) {
      const errorMessages = Object.values(data.errors).flat();
      throw new Error(errorMessages.join(', ') || data.message || 'Error en el registro');
    }
    throw new Error(data.message || 'Error en el registro');
  }

  // Guardar token y usuario en localStorage
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  if (data.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  return data;
};

/**
 * Iniciar sesión
 * @param {Object} credentials - Credenciales de acceso
 * @param {string} credentials.email - Correo electrónico
 * @param {string} credentials.password - Contraseña
 * @returns {Promise<Object>} Datos del usuario y token
 */
export const login = async (credentials) => {
  // Login y registro no requieren token
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.errors) {
      const errorMessages = Object.values(data.errors).flat();
      throw new Error(errorMessages.join(', ') || data.message || 'Error en el inicio de sesión');
    }
    throw new Error(data.message || 'Error en el inicio de sesión');
  }

  // Guardar token y usuario en localStorage
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  if (data.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  return data;
};

/**
 * Cerrar sesión
 * @returns {Promise<Object>} Mensaje de confirmación
 */
export const logout = async () => {
  try {
    await api.post('/logout');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  } finally {
    // Limpiar localStorage independientemente del resultado
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/**
 * Enviar heartbeat para mantener el estado activo
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const sendHeartbeat = async () => {
  try {
    await api.post('/heartbeat');
  } catch (error) {
    console.error('Error al enviar heartbeat:', error);
  }
};

/**
 * Obtener el usuario actual desde localStorage
 * @returns {Object|null} Datos del usuario o null si no está autenticado
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error al parsear usuario:', error);
    return null;
  }
};

/**
 * Obtener el token de autenticación
 * @returns {string|null} Token o null si no existe
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Verificar si el usuario está autenticado
 * @returns {boolean} true si está autenticado, false en caso contrario
 */
export const isAuthenticated = () => {
  return !!getToken() && !!getCurrentUser();
};

/**
 * Obtener la URL base del backend
 * @returns {string} URL del backend
 */
const getBackendUrl = () => {
  return import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
};

/**
 * Redirigir a Google OAuth para iniciar sesión
 */
export const redirectToGoogle = () => {
  const backendUrl = getBackendUrl();
  window.location.href = `${backendUrl}/auth/google`;
};

/**
 * Obtener datos temporales de Google para completar el registro
 * @param {string} tempToken - Token temporal de la sesión
 * @returns {Promise<Object>} Datos de Google (email, name)
 */
export const getGoogleRegistrationData = async (tempToken) => {
  const backendUrl = getBackendUrl();
  const response = await fetch(`${backendUrl}/auth/google/registration-data?token=${tempToken}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener los datos de registro');
  }

  return data;
};

/**
 * Completar registro después de autenticación con Google
 * @param {Object} registrationData - Datos para completar el registro
 * @param {string} registrationData.organization_name - Nombre de la empresa
 * @param {string} registrationData.role - Rol del usuario (jefe o trabajador)
 * @param {string} registrationData.token - Token temporal de la sesión
 * @returns {Promise<Object>} Datos del usuario y token
 */
export const completeGoogleRegistration = async (registrationData) => {
  const backendUrl = getBackendUrl();
  const response = await fetch(`${backendUrl}/auth/google/complete-registration`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(registrationData),
  });

  const contentType = response.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    throw new Error(`Error del servidor: ${text || response.statusText}`);
  }

  if (!response.ok) {
    if (data.errors) {
      const errorMessages = Object.values(data.errors).flat();
      throw new Error(errorMessages.join(', ') || data.message || 'Error al completar el registro');
    }
    throw new Error(data.message || 'Error al completar el registro');
  }

  // Guardar token y usuario
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  if (data.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  return data;
};

/**
 * Procesar token de la URL (cuando viene de Google OAuth)
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} Datos del usuario
 */
export const processTokenFromUrl = async (token) => {
  if (!token) {
    throw new Error('Token no proporcionado');
  }

  // Guardar el token
  localStorage.setItem('token', token);

  // Obtener información del usuario desde el backend
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const response = await fetch(`${apiUrl}/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener datos del usuario');
  }

  const data = await response.json();

  if (!data.user) {
    throw new Error('No se recibieron datos del usuario');
  }

  // Guardar usuario
  localStorage.setItem('user', JSON.stringify(data.user));

  return data.user;
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated,
  redirectToGoogle,
  getGoogleRegistrationData,
  completeGoogleRegistration,
  processTokenFromUrl,
  sendHeartbeat,
};

