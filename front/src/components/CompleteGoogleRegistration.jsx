import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faUser, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { getGoogleRegistrationData, completeGoogleRegistration } from '../services/authService';
import { getOrganizations } from '../services/organizationService';
import logo from '../assets/Logo.svg';
import './Login.css';

function CompleteGoogleRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tempToken = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    organization_name: '',
    role: 'trabajador'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const organizationsLoadedRef = useRef(false);

  useEffect(() => {
    if (!tempToken) {
      setError('Token de registro no encontrado. Por favor, inicia sesión nuevamente con Google.');
      return;
    }

    // Obtener datos de Google de la sesión (opcional)
    getGoogleRegistrationData(tempToken).catch(() => {
      // Silenciar errores, el formulario funcionará igual
    });
  }, [tempToken]);

  // Cargar organizaciones una sola vez al montar (ya están en caché si se cargaron antes)
  useEffect(() => {
    if (!organizationsLoadedRef.current) {
      organizationsLoadedRef.current = true;
      loadOrganizations();
    }
  }, []); // Solo una vez al montar

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!tempToken) {
      setError('Token de registro no encontrado. Por favor, inicia sesión nuevamente con Google.');
      setLoading(false);
      return;
    }

    try {
      const data = await completeGoogleRegistration({
        organization_name: formData.organization_name,
        role: formData.role,
        token: tempToken,
      });

      // Redirigir según el rol
      navigate(data.user.role === 'jefe' ? '/dashboard/jefe' : '/dashboard/trabajador');
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Error de conexión. Verifica que el servidor esté corriendo y que la URL sea correcta.');
      } else {
        setError(err.message || 'Error al completar el registro');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container min-h-screen flex items-center justify-center p-5 relative overflow-hidden">
      <div className={`login-card register-mode`}>
        <div className={`text-center mb-6 flex flex-col items-center justify-center`}>
          <img src={logo} alt="AutoNet Logo" className="w-[120px] h-auto mx-auto mb-3 block transition-transform duration-300 hover:scale-105" />
          <h1 className="text-[22px] font-bold text-[var(--color-dark)] m-0 mb-1 tracking-[-0.5px]">Completar Registro</h1>
          <p className="text-[13px] text-[var(--text-secondary)] m-0">
            Completa los datos de tu empresa para finalizar el registro
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="organization_name" className="text-[13px] font-semibold text-[var(--color-dark)] ml-1">
              Empresa
            </label>
            <div className="input-wrapper relative flex items-center">
              <FontAwesomeIcon icon={faBuilding} className="input-icon" />
              <select
                id="organization_name"
                name="organization_name"
                className="form-input"
                value={formData.organization_name}
                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
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
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              Selecciona la empresa a la que perteneces
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-[13px] font-semibold text-[var(--color-dark)] ml-1 mb-1">
              Tipo de Usuario
            </label>
            <div className="flex gap-2.5">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="jefe"
                  checked={formData.role === 'jefe'}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value, organization_name: '' });
                  }}
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
                  checked={formData.role === 'trabajador'}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value, organization_name: '' });
                  }}
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

          <button type="submit" className="login-button mt-2" disabled={loading}>
            {loading ? 'Completando registro...' : 'Completar Registro'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompleteGoogleRegistration;

