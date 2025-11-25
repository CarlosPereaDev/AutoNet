import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRightFromBracket, 
  faTasks,
  faCar,
  faTractor,
  faChartLine,
  faBell,
  faBars,
  faSearch,
  faEdit,
  faGasPump,
  faGauge,
  faClock,
  faWrench
} from '@fortawesome/free-solid-svg-icons';
import { logout, getCurrentUser, processTokenFromUrl } from '../services/authService';
import { getVehicles, updateVehicle } from '../services/vehicleService';
import { getMachineries, updateMachinery } from '../services/machineryService';
import logo from '../assets/Logo.svg';
import './Dashboard.css';

function ActualizarDatos({ type = 'vehiculos' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();
  const token = searchParams.get('token');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (token) {
      processTokenFromUrl(token)
        .then(() => {
          const path = type === 'vehiculos' 
            ? '/dashboard/trabajador/actualizar-vehiculos' 
            : '/dashboard/trabajador/actualizar-maquinaria';
          navigate(path, { replace: true });
        })
        .catch((error) => {
          console.error('Error al procesar token:', error);
          navigate('/', { replace: true });
        });
    }
  }, [token, navigate, type]);

  // Cargar datos desde el backend
  const fetchData = async () => {
    try {
      if (type === 'vehiculos') {
        const response = await getVehicles(false); // false para no usar caché
        setItems(response.vehicles || []);
      } else {
        const response = await getMachineries(false); // false para no usar caché
        setItems(response.machineries || []);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [type]);

  // Polling para actualizar datos automáticamente cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }, [type]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    if (sidebarOpen) {
      const handleClickOutside = (e) => {
        if (window.innerWidth < 768 && !e.target.closest('.dashboard-sidebar') && !e.target.closest('.sidebar-toggle')) {
          setSidebarOpen(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sidebarOpen]);

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    if (type === 'vehiculos') {
      return (item.plate && item.plate.toLowerCase().includes(searchLower)) ||
             (item.brand && item.brand.toLowerCase().includes(searchLower)) ||
             (item.model && item.model.toLowerCase().includes(searchLower)) ||
             (item.name && item.name.toLowerCase().includes(searchLower));
    } else {
      return (item.name && item.name.toLowerCase().includes(searchLower)) ||
             (item.serial_number && item.serial_number.toLowerCase().includes(searchLower)) ||
             (item.type && item.type.toLowerCase().includes(searchLower));
    }
  });

  const startEdit = (item) => {
    setEditingItem(item);
    if (type === 'vehiculos') {
      setFormData({
        current_mileage: item.current_mileage || '',
        current_fuel_level: item.current_fuel_level || '',
        status: item.status || 'active',
      });
    } else {
      setFormData({
        current_hours: item.current_hours || '',
        status: item.status || 'active',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
    setSubmitting(false);
  };

  const handleSave = async () => {
    if (!editingItem || submitting) return;

    setSubmitting(true);

    try {
      const submitData = {};
      
      if (type === 'vehiculos') {
        if (formData.current_mileage !== undefined && formData.current_mileage !== '') {
          submitData.current_mileage = parseFloat(formData.current_mileage);
        }
        if (formData.current_fuel_level !== undefined && formData.current_fuel_level !== '') {
          submitData.current_fuel_level = parseFloat(formData.current_fuel_level);
        }
        if (formData.status) {
          submitData.status = formData.status;
        }
        await updateVehicle(editingItem.id, submitData);
      } else {
        if (formData.current_hours !== undefined && formData.current_hours !== '') {
          submitData.current_hours = parseFloat(formData.current_hours);
        }
        if (formData.status) {
          submitData.status = formData.status;
        }
        await updateMachinery(editingItem.id, submitData);
      }
      
      // Recargar datos desde el servidor
      await fetchData();
      
      handleCloseModal();
    } catch (error) {
      console.error('Error al actualizar:', error);
      let errorMessage = 'Error al actualizar los datos';
      
      if (error.response?.data) {
        if (error.response.data.errors) {
          const errors = error.response.data.errors;
          const errorMessages = Object.values(errors).flat();
          errorMessage = errorMessages.join('\n');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`${errorMessage}\n\nPor favor, intenta de nuevo.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-dark">
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logo} alt="AutoNet" className="sidebar-logo-img" />
            <span className="sidebar-logo-text">AutoNet</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to="/dashboard/trabajador" 
            className={`nav-item ${location.pathname === '/dashboard/trabajador' ? 'active' : ''}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faChartLine} />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/dashboard/trabajador/tareas" 
            className={`nav-item ${location.pathname.startsWith('/dashboard/trabajador/tareas') ? 'active' : ''}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faTasks} />
            <span>Mis Tareas</span>
          </Link>
          <Link 
            to="/dashboard/trabajador/actualizar-vehiculos" 
            className={`nav-item ${location.pathname.startsWith('/dashboard/trabajador/actualizar-vehiculos') ? 'active' : ''}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faCar} />
            <span>Actualizar Vehículos</span>
          </Link>
          <Link 
            to="/dashboard/trabajador/actualizar-maquinaria" 
            className={`nav-item ${location.pathname.startsWith('/dashboard/trabajador/actualizar-maquinaria') ? 'active' : ''}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faTractor} />
            <span>Actualizar Maquinaria</span>
          </Link>
          <Link 
            to="/dashboard/trabajador/notificaciones" 
            className={`nav-item ${location.pathname.startsWith('/dashboard/trabajador/notificaciones') ? 'active' : ''}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faBell} />
            <span>Notificaciones</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'Usuario'}</div>
              <div className="user-role">Trabajador</div>
            </div>
            <button className="sidebar-logout-btn" onClick={handleLogout} title="Cerrar Sesión">
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
          </div>
        </div>
      </aside>

      <div className="dashboard-main-content">
        <header className="dashboard-top-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <FontAwesomeIcon icon={faBars} />
          </button>
        </header>

        <section className="dashboard-welcome-section">
          <div>
            <h1 className="welcome-title">
              {type === 'vehiculos' ? 'Actualizar Datos de Vehículos' : 'Actualizar Datos de Maquinaria'}
            </h1>
            <p className="welcome-subtitle">
              {type === 'vehiculos' 
                ? 'Actualiza datos de vehículos como combustible, kilometraje o incidencias.'
                : 'Actualiza datos de maquinaria como horómetro, horas de uso o incidencias.'}
            </p>
          </div>
        </section>

        <section className="dashboard-filters-section">
          <div className="filters-search">
            <div className="search-box">
              <FontAwesomeIcon icon={faSearch} />
              <input 
                type="text" 
                placeholder={`Buscar ${type === 'vehiculos' ? 'vehículos' : 'maquinaria'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="dashboard-content-section">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-gray)' }}>
              <p>Cargando {type === 'vehiculos' ? 'vehículos' : 'maquinaria'}...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray)' }}>
              <FontAwesomeIcon icon={type === 'vehiculos' ? faCar : faTractor} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>
                {searchTerm 
                  ? `No se encontraron ${type === 'vehiculos' ? 'vehículos' : 'maquinaria'} con ese término` 
                  : `No hay ${type === 'vehiculos' ? 'vehículos' : 'maquinaria'} registrados`}
              </p>
            </div>
          ) : (
            <div className="tasks-list">
              {filteredItems.map(item => (
              <div key={item.id} className="task-card">
                <div className="task-card-header">
                  <div className="task-status-badge">
                    <FontAwesomeIcon 
                      icon={type === 'vehiculos' ? faCar : faTractor} 
                      className="status-icon-primary"
                    />
                    <span className={`status-text ${
                      item.status === 'active' ? 'status-completed' : 
                      item.status === 'maintenance' ? 'status-warning' : 
                      'status-pending'
                    }`}>
                      {item.status === 'active' ? 'Activo' : 
                       item.status === 'maintenance' ? 'En Mantenimiento' : 
                       'Inactivo'}
                    </span>
                  </div>
                  {item.status === 'maintenance' && (
                    <div className="task-priority-badge priority-high">Requiere atención</div>
                  )}
                </div>
                <div className="task-card-body">
                  <h3 className="task-card-title">
                    {type === 'vehiculos' 
                      ? item.name || `${item.brand || ''} ${item.model || ''}`.trim() || 'Sin nombre'
                      : item.name || 'Sin nombre'}
                  </h3>
                  <div className="task-card-meta">
                    {type === 'vehiculos' ? (
                      <>
                        {item.plate && (
                          <div className="task-meta-item">
                            <FontAwesomeIcon icon={faCar} />
                            <span>Placa: {item.plate}</span>
                          </div>
                        )}
                        {item.year && (
                          <div className="task-meta-item">
                            <FontAwesomeIcon icon={faCar} />
                            <span>Año: {item.year}</span>
                          </div>
                        )}
                        {item.current_mileage !== null && item.current_mileage !== undefined && (
                          <div className="task-meta-item">
                            <FontAwesomeIcon icon={faGauge} />
                            <span>Kilometraje: {Number(item.current_mileage).toLocaleString()} km</span>
                          </div>
                        )}
                        {item.current_fuel_level !== null && item.current_fuel_level !== undefined && (
                          <div className="task-meta-item">
                            <FontAwesomeIcon icon={faGasPump} />
                            <span>Combustible: {Number(item.current_fuel_level)}%</span>
                          </div>
                        )}
                        {item.status === 'maintenance' && (
                          <div className="task-meta-item">
                            <FontAwesomeIcon icon={faWrench} />
                            <span className="status-warning">En mantenimiento</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {item.serial_number && (
                          <div className="task-meta-item">
                            <FontAwesomeIcon icon={faTractor} />
                            <span>Serial: {item.serial_number}</span>
                          </div>
                        )}
                        {item.current_hours !== null && item.current_hours !== undefined && (
                          <div className="task-meta-item">
                            <FontAwesomeIcon icon={faClock} />
                            <span>Horas: {Number(item.current_hours).toLocaleString()}h</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="task-card-actions">
                  <button 
                    className="action-btn action-edit"
                    onClick={() => startEdit(item)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Actualizar Datos</span>
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}
        </section>

        {/* Modal para editar */}
        {showModal && editingItem && (
          <div 
            className="modal-overlay" 
            onClick={handleCloseModal}
            style={{ pointerEvents: submitting ? 'none' : 'auto' }}
          >
            <div 
              className="modal-content" 
              onClick={(e) => e.stopPropagation()}
              style={{ pointerEvents: 'auto' }}
            >
              <div className="modal-header">
                <h2>Actualizar {type === 'vehiculos' ? 'Vehículo' : 'Maquinaria'}</h2>
                <button 
                  className="modal-close" 
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  ×
                </button>
              </div>
              <div className="task-form">
                {type === 'vehiculos' ? (
                  <>
                    <div className="form-group">
                      <label>Kilometraje actual</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.current_mileage}
                        onChange={(e) => setFormData({...formData, current_mileage: e.target.value})}
                        placeholder="Kilometraje"
                      />
                    </div>
                    <div className="form-group">
                      <label>Nivel de combustible (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.current_fuel_level}
                        onChange={(e) => setFormData({...formData, current_fuel_level: e.target.value})}
                        placeholder="0-100"
                      />
                    </div>
                    <div className="form-group">
                      <label>Estado</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                        <option value="maintenance">En mantenimiento</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Horas actuales</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.current_hours}
                        onChange={(e) => setFormData({...formData, current_hours: e.target.value})}
                        placeholder="Horas"
                      />
                    </div>
                    <div className="form-group">
                      <label>Estado</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                        <option value="maintenance">En mantenimiento</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={handleCloseModal}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={handleSave}
                    disabled={submitting}
                  >
                    {submitting ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
    </div>
  );
}

export default ActualizarDatos;

