import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faBuilding,
  faUser,
  faUserTie
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import logo from '../assets/Logo.svg';
import { login, register, redirectToGoogle } from '../services/authService';
import { getOrganizations } from '../services/organizationService';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login({ error: initialError = null }) {
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    organization_name: '',
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'trabajador'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [rememberMe, setRememberMe] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const organizationsLoadedRef = useRef(false);

  // Si hay un error inicial, mostrarlo
  React.useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  // Cargar organizaciones al montar el componente (una sola vez)
  React.useEffect(() => {
    // Solo cargar si no se han cargado antes
    if (!organizationsLoadedRef.current) {
      organizationsLoadedRef.current = true;
      loadOrganizations();
    }
  }, []); // Solo se ejecuta una vez al montar

  const loadOrganizations = async () => {
    // Si ya hay organizaciones cargadas, no hacer nada
    if (organizations.length > 0) {
      return;
    }

    setLoadingOrganizations(true);
    try {
      const data = await getOrganizations(true); // Usar caché
      setOrganizations(data.organizations || []);
    } catch (error) {
      console.error('Error al cargar organizaciones:', error);
      setOrganizations([]);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData({
      ...registerData,
      [name]: value
    });
    // Las organizaciones ya están cargadas al inicio, no es necesario recargarlas
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(formData);
      
      // Redirigir según el rol del usuario
      if (response.user && response.user.role) {
        if (response.user.role === 'jefe') {
          navigate('/dashboard/jefe');
        } else {
          navigate('/dashboard/trabajador');
        }
      }
      
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar que las contraseñas coincidan
    if (registerData.password !== registerData.password_confirmation) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Validar longitud mínima de contraseña
    if (registerData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await register(registerData);
      
      // Redirigir según el rol del usuario
      if (response.user && response.user.role) {
        if (response.user.role === 'jefe') {
          navigate('/dashboard/jefe');
        } else {
          navigate('/dashboard/trabajador');
        }
      }
      
    } catch (err) {
      setError(err.message || 'Error al registrar');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    // Evitar múltiples clics
    if (googleLoading) {
      return;
    }
    
    setGoogleLoading(true);
    redirectToGoogle();
    
    // Resetear después de un tiempo por si la redirección falla
    setTimeout(() => {
      setGoogleLoading(false);
    }, 3000);
  };

  return (
    <div className="login-container min-h-screen flex items-center justify-center p-5 relative overflow-hidden">
      <div className={`login-card ${isRegisterMode ? 'register-mode' : ''}`}>
        <div className={`text-center ${isRegisterMode ? 'mb-6' : 'mb-5'} flex flex-col items-center justify-center`}>
          <img src={logo} alt="AutoNet Logo" className="w-[120px] h-auto mx-auto mb-3 block transition-transform duration-300 hover:scale-105" />
          <h1 className="text-[22px] font-bold text-[var(--color-dark)] m-0 mb-1 tracking-[-0.5px]">Bienvenido a AutoNet</h1>
          <p className="text-[13px] text-[var(--text-secondary)] m-0">
            {isRegisterMode ? 'Crea tu cuenta de empresa' : 'Inicia sesión para continuar'}
          </p>
        </div>

        {/* Toggle entre Login y Registro - Estilo Interruptor */}
        <div className="toggle-switch-container mb-[18px]">
          <div className="toggle-switch">
            <button
              type="button"
              className={`toggle-option ${!isRegisterMode ? 'active' : ''}`}
              onClick={() => {
                setIsRegisterMode(false);
                setError('');
              }}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              className={`toggle-option ${isRegisterMode ? 'active' : ''}`}
              onClick={() => {
                setIsRegisterMode(true);
                setError('');
              }}
            >
              Registrarse
            </button>
            <span className={`toggle-slider ${isRegisterMode ? 'right' : 'left'}`}></span>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!isRegisterMode ? (
          <>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[13px] font-semibold text-[var(--color-dark)] ml-1">
                  Correo Electrónico
                </label>
                <div className="input-wrapper relative flex items-center">
                  <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    placeholder="tu@correo.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-[13px] font-semibold text-[var(--color-dark)] ml-1">
                  Contraseña
                </label>
                <div className="password-input-wrapper relative flex items-center">
                  <FontAwesomeIcon icon={faLock} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="form-input password-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs -mt-1.5 -mb-1">
                <label className="flex items-center gap-2.5 text-[var(--text-secondary)] cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="absolute opacity-0 w-0 h-0" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className={`checkbox-custom ${rememberMe ? 'checked' : ''}`}></span>
                  <span className="text-xs text-[var(--text-secondary)]">Recordarme</span>
                </label>
                <a href="#" className="text-[var(--color-primary)] no-underline font-medium transition-colors duration-200 text-xs hover:text-[var(--color-primary-dark)] hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-4.5 w-full">
              <span className="flex-1 h-px bg-[var(--border-color)]"></span>
              <span className="text-[13px] text-[var(--text-secondary)] font-medium px-1.5">O</span>
              <span className="flex-1 h-px bg-[var(--border-color)]"></span>
            </div>

            <button 
              type="button" 
              className="google-login-button"
              onClick={handleGoogleClick}
              disabled={googleLoading || loading}
            >
              <FontAwesomeIcon icon={faGoogle} className="google-icon" />
              <span>{googleLoading ? 'Redirigiendo...' : 'Continuar con Google'}</span>
            </button>
          </>
        ) : (
          <>
            <form className="flex flex-col gap-4" onSubmit={handleRegisterSubmit}>
              {/* Primera fila: Empresa y Nombre */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="organization_name" className="text-[13px] font-semibold text-[var(--color-dark)] ml-1">
                    {registerData.role === 'trabajador' ? 'Empresa' : 'Nombre de la Empresa'}
                  </label>
                  {registerData.role === 'trabajador' ? (
                    <div className="input-wrapper relative flex items-center">
                      <FontAwesomeIcon icon={faBuilding} className="input-icon" />
                      <select
                        id="organization_name"
                        name="organization_name"
                        className="form-input"
                        value={registerData.organization_name}
                        onChange={handleRegisterChange}
                        required
                        disabled={loadingOrganizations}
                      >
                        <option value="">Seleccionar empresa...</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.name}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="input-wrapper relative flex items-center">
                      <FontAwesomeIcon icon={faBuilding} className="input-icon" />
                      <input
                        type="text"
                        id="organization_name"
                        name="organization_name"
                        className="form-input"
                        placeholder="Mi Empresa S.L."
                        value={registerData.organization_name}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                  )}
                  {registerData.role === 'trabajador' && (
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                      Selecciona la empresa a la que perteneces
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="register_name" className="text-[13px] font-semibold text-[var(--color-dark)] ml-1">
                    Nombre Completo
                  </label>
                  <div className="input-wrapper relative flex items-center">
                    <FontAwesomeIcon icon={faUser} className="input-icon" />
                    <input
                      type="text"
                      id="register_name"
                      name="name"
                      className="form-input"
                      placeholder="Juan Pérez"
                      value={registerData.name}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Segunda fila: Email y Tipo de Usuario */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="register_email" className="text-[13px] font-semibold text-[var(--color-dark)] ml-1">
                    Correo Electrónico
                  </label>
                  <div className="input-wrapper relative flex items-center">
                    <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                    <input
                      type="email"
                      id="register_email"
                      name="email"
                      className="form-input"
                      placeholder="tu@correo.com"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="register_role" className="text-[13px] font-semibold text-[var(--color-dark)] ml-1">
                    Tipo de Usuario
                  </label>
                  <div className="flex gap-2.5">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="jefe"
                        checked={registerData.role === 'jefe'}
                        onChange={handleRegisterChange}
                        className="hidden peer"
                      />
                      <div className="flex flex-col gap-1.5 p-3 border-2 border-[var(--border-color)] rounded-[10px] transition-all duration-300 peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary-rgba-10)] hover:border-[var(--color-primary)]">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUserTie} className="text-[var(--color-primary)] text-base" />
                          <span className="text-sm font-semibold text-[var(--color-dark)]">Jefe</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                          Gestiona el equipo, asigna tareas y supervisa recursos de la empresa.
                        </p>
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="trabajador"
                        checked={registerData.role === 'trabajador'}
                        onChange={handleRegisterChange}
                        className="hidden peer"
                      />
                      <div className="flex flex-col gap-1.5 p-3 border-2 border-[var(--border-color)] rounded-[10px] transition-all duration-300 peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary-rgba-10)] hover:border-[var(--color-primary)]">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-[var(--color-primary)] text-base" />
                          <span className="text-sm font-semibold text-[var(--color-dark)]">Trabajador</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                          Recibe y completa tareas asignadas, actualiza datos de vehículos y maquinaria.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Tercera fila: Contraseñas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="register_password" className="text-[13px] font-semibold text-[var(--color-dark)] ml-1">
                    Contraseña
                  </label>
                  <div className="password-input-wrapper relative flex items-center">
                    <FontAwesomeIcon icon={faLock} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="register_password"
                      name="password"
                      className="form-input password-input"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="password_confirmation" className="text-[13px] font-semibold text-[var(--color-dark)] ml-1">
                    Confirmar Contraseña
                  </label>
                  <div className="password-input-wrapper relative flex items-center">
                    <FontAwesomeIcon icon={faLock} className="input-icon" />
                    <input
                      type={showPasswordConfirmation ? 'text' : 'password'}
                      id="password_confirmation"
                      name="password_confirmation"
                      className="form-input password-input"
                      placeholder="••••••••"
                      value={registerData.password_confirmation}
                      onChange={handleRegisterChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      aria-label={showPasswordConfirmation ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <FontAwesomeIcon icon={showPasswordConfirmation ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="login-button mt-2" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-4 w-full">
              <span className="flex-1 h-px bg-[var(--border-color)]"></span>
              <span className="text-[13px] text-[var(--text-secondary)] font-medium px-1.5">O</span>
              <span className="flex-1 h-px bg-[var(--border-color)]"></span>
            </div>

            <button 
              type="button" 
              className="google-login-button"
              onClick={handleGoogleClick}
              disabled={googleLoading || loading}
            >
              <FontAwesomeIcon icon={faGoogle} className="google-icon" />
              <span>{googleLoading ? 'Redirigiendo...' : 'Registrarse con Google'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;

