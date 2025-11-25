import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRightFromBracket, 
  faTasks,
  faCar,
  faTractor,
  faUsers,
  faChartLine,
  faBell,
  faBars,
  faPlus,
  faSearch,
  faEdit,
  faTrash,
  faWrench,
  faGasPump,
  faGauge
} from '@fortawesome/free-solid-svg-icons';
import { logout, getCurrentUser, processTokenFromUrl } from '../services/authService';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../services/vehicleService';
import logo from '../assets/Logo.svg';
import './Dashboard.css';

function VehiculosJefe() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();
  const token = searchParams.get('token');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    plate: '',
    brand: '',
    model: '',
    year: '',
    current_mileage: '',
    current_fuel_level: '',
    status: 'active'
  });

  useEffect(() => {
    if (token) {
      processTokenFromUrl(token)
        .then(() => {
          navigate('/dashboard/jefe/vehiculos', { replace: true });
        })
        .catch((error) => {
          console.error('Error al procesar token:', error);
          navigate('/', { replace: true });
        });
    }
  }, [token, navigate]);

  // Cargar vehículos desde el backend
  const fetchVehicles = async () => {
    try {
      const data = await getVehicles(false); // false para no usar caché
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchVehicles();
  }, []);

  // Polling para actualizar vehículos automáticamente cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchVehicles();
    }, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }, []);

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

  const filteredVehicles = vehicles.filter(vehicle => 
    (vehicle.plate && vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (vehicle.brand && vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (vehicle.model && vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (vehicle.name && vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenModal = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        name: vehicle.name || '',
        plate: vehicle.plate || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        current_mileage: vehicle.current_mileage || '',
        current_fuel_level: vehicle.current_fuel_level || '',
        status: vehicle.status || 'active'
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        name: '',
        plate: '',
        brand: '',
        model: '',
        year: '',
        current_mileage: '',
        current_fuel_level: '',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVehicle(null);
    setSubmitting(false);
    setFormData({
      name: '',
      plate: '',
      brand: '',
      model: '',
      year: '',
      current_mileage: '',
      current_fuel_level: '',
      status: 'active'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (submitting) return;

    // Validaciones
    if (!formData.name || formData.name.trim() === '') {
      alert('El nombre del vehículo es obligatorio');
      return;
    }

    if (!formData.plate || formData.plate.trim() === '') {
      alert('La placa del vehículo es obligatoria');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        plate: formData.plate.trim(),
        brand: formData.brand?.trim() || null,
        model: formData.model?.trim() || null,
        year: formData.year ? parseInt(formData.year) : null,
        current_mileage: formData.current_mileage ? parseFloat(formData.current_mileage) : null,
        current_fuel_level: formData.current_fuel_level ? parseFloat(formData.current_fuel_level) : null,
        status: formData.status
      };

      let response;
      if (editingVehicle) {
        response = await updateVehicle(editingVehicle.id, submitData);
        const updatedVehicle = response?.vehicle || response;
        if (updatedVehicle && updatedVehicle.id) {
          setVehicles(vehicles.map(v => v.id === editingVehicle.id ? updatedVehicle : v));
          handleCloseModal();
        } else {
          await fetchVehicles();
          handleCloseModal();
        }
      } else {
        response = await createVehicle(submitData);
        const newVehicle = response?.vehicle || response;
        if (newVehicle && newVehicle.id) {
          setVehicles([newVehicle, ...vehicles]);
          setSubmitting(false);
          handleCloseModal();
        } else {
          await fetchVehicles();
          setSubmitting(false);
          handleCloseModal();
        }
      }
    } catch (error) {
      console.error('Error al guardar vehículo:', error);
      let errorMessage = 'Error al guardar el vehículo';
      
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
      
      alert(`Error: ${errorMessage}\n\nPor favor, verifica los datos e intenta nuevamente.`);
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = (vehicle) => {
    setVehicleToDelete(vehicle);
    setShowDeleteModal(true);
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    
    setDeleting(true);
    try {
      await deleteVehicle(vehicleToDelete.id);
      setVehicles(vehicles.filter(v => v.id !== vehicleToDelete.id));
      setShowDeleteModal(false);
      setVehicleToDelete(null);
    } catch (error) {
      console.error('Error al eliminar vehículo:', error);
      alert('Error al eliminar el vehículo');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteVehicle = () => {
    setShowDeleteModal(false);
    setVehicleToDelete(null);
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
            to="/dashboard/jefe" 
            className={`nav-item ${location.pathname === '/dashboard/jefe' ? 'active' : ''}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faChartLine} />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/dashboard/jefe/tareas" 
            className={`nav-item ${location.pathname.startsWith('/dashboard/jefe/tareas') ? 'active' : ''}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faTasks} />
            <span>Tareas</span>
          </Link>
          <Link 
            to="/dashboard/jefe/vehiculos" 
            className={`nav-item ${location.pathname.startsWith('/dashboard/jefe/vehiculos') ? 'active' : ''}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faCar} />
            <span>Vehículos</span>
          </Link>
          <Link 
            to="/dashboard/jefe/maquinaria" 
            className={`nav-item ${location.pathname.startsWith('/dashboard/jefe/maquinaria') ? 'active' : ''}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faTractor} />
            <span>Maquinaria</span>
          </Link>
          <Link 
            to="/dashboard/jefe/trabajadores" 
            className={`nav-item ${location.pathname.startsWith('/dashboard/jefe/trabajadores') ? 'active' : ''}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faUsers} />
            <span>Trabajadores</span>
          </Link>
          <Link 
            to="/dashboard/jefe/notificaciones" 
            className={`nav-item ${location.pathname.startsWith('/dashboard/jefe/notificaciones') ? 'active' : ''}`}
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
              <div className="user-role">Jefe</div>
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
            <h1 className="welcome-title">Gestión de Vehículos</h1>
            <p className="welcome-subtitle">
              Consulta información de vehículos, kilometraje, horas de uso y combustible para control de mantenimiento.
            </p>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => handleOpenModal()}
            disabled={showModal || submitting}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Nuevo Vehículo</span>
          </button>
        </section>

        <section className="dashboard-filters-section">
          <div className="filters-search">
            <div className="search-box">
              <FontAwesomeIcon icon={faSearch} />
              <input 
                type="text" 
                placeholder="Buscar vehículos..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="dashboard-content-section">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-gray)' }}>
              <p>Cargando vehículos...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray)' }}>
              <FontAwesomeIcon icon={faCar} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>
                {searchTerm 
                  ? 'No se encontraron vehículos con los criterios de búsqueda' 
                  : 'No hay vehículos registrados'}
              </p>
              <p style={{ fontSize: '14px', opacity: 0.7 }}>
                {!searchTerm && 'Crea tu primer vehículo para comenzar'}
              </p>
            </div>
          ) : (
            <div className="tasks-list">
              {filteredVehicles.map(vehicle => (
              <div key={vehicle.id} className={`task-card vehicle-card-${vehicle.status || 'active'}`}>
                <div className="task-card-header">
                  <div className="task-status-badge">
                    <FontAwesomeIcon icon={faCar} className="status-icon-primary" />
                    <span className={`status-text ${vehicle.status === 'active' ? 'status-completed' : 'status-warning'}`}>
                      {vehicle.status === 'active' ? 'Activo' : 'En Mantenimiento'}
                    </span>
                  </div>
                  {vehicle.status === 'maintenance' && (
                    <div className="task-priority-badge priority-high">En Mantenimiento</div>
                  )}
                </div>
                <div className="task-card-body">
                  <h3 className="task-card-title">
                    {vehicle.name || `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Sin nombre'}
                  </h3>
                  <div className="task-card-meta">
                    <div className="task-meta-item">
                      <FontAwesomeIcon icon={faCar} />
                      <span>Placa: {vehicle.plate}</span>
                    </div>
                    {vehicle.year && (
                      <div className="task-meta-item">
                        <FontAwesomeIcon icon={faCar} />
                        <span>Año: {vehicle.year}</span>
                      </div>
                    )}
                    <div className="task-meta-item">
                      <FontAwesomeIcon icon={faGauge} />
                      <span>Kilometraje: {vehicle.current_mileage ? vehicle.current_mileage.toLocaleString() : 'N/A'} km</span>
                    </div>
                    <div className="task-meta-item">
                      <FontAwesomeIcon icon={faGasPump} />
                      <span>Combustible: {vehicle.current_fuel_level || 0}%</span>
                    </div>
                    {vehicle.status === 'maintenance' && (
                      <div className="task-meta-item">
                        <FontAwesomeIcon icon={faWrench} />
                        <span className="status-warning">Requiere atención</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="task-card-actions">
                  <button className="action-btn action-edit" onClick={() => handleOpenModal(vehicle)}>
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Editar</span>
                  </button>
                  <button className="action-btn action-delete" onClick={() => handleDeleteVehicle(vehicle)}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Modal de confirmación para eliminar vehículo */}
      {showDeleteModal && vehicleToDelete && (
        <div 
          className="modal-overlay" 
          onClick={deleting ? undefined : cancelDeleteVehicle}
          style={{ pointerEvents: deleting ? 'none' : 'auto' }}
        >
          <div 
            className="modal-content alert-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto', maxWidth: '500px' }}
          >
            <div className="modal-header">
              <h2>Confirmar eliminación</h2>
              <button className="modal-close" onClick={cancelDeleteVehicle} disabled={deleting}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--color-white)', lineHeight: '1.5' }}>
                ¿Estás seguro de que deseas eliminar el vehículo <strong>"{vehicleToDelete.name || `${vehicleToDelete.brand} ${vehicleToDelete.model}`}"</strong> (Placa: {vehicleToDelete.plate})?
              </p>
              <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--color-gray)', lineHeight: '1.5' }}>
                Esta acción no se puede deshacer. El vehículo será eliminado permanentemente.
              </p>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={cancelDeleteVehicle}
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={confirmDeleteVehicle}
                  disabled={deleting}
                  style={{ 
                    background: deleting ? 'var(--color-gray)' : 'linear-gradient(135deg, var(--color-error) 0%, #dc3545 100%)',
                    boxShadow: deleting ? 'none' : '0 4px 12px rgba(220, 53, 69, 0.3)'
                  }}
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear/editar vehículo */}
      {showModal && (
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
              <h2>{editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
              <button className="modal-close" onClick={handleCloseModal} disabled={submitting}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Ej: Camión 01"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Placa *</label>
                  <input
                    type="text"
                    value={formData.plate}
                    onChange={(e) => setFormData({...formData, plate: e.target.value.toUpperCase()})}
                    required
                    placeholder="ABC-1234"
                  />
                </div>

                <div className="form-group">
                  <label>Año</label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    placeholder="2020"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Marca</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    placeholder="Toyota"
                  />
                </div>

                <div className="form-group">
                  <label>Modelo</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    placeholder="Hilux"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Kilometraje actual</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.current_mileage}
                    onChange={(e) => setFormData({...formData, current_mileage: e.target.value})}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Nivel de combustible (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.current_fuel_level}
                    onChange={(e) => setFormData({...formData, current_fuel_level: e.target.value})}
                    placeholder="0-100"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Estado *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  required
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="maintenance">En Mantenimiento</option>
                </select>
              </div>

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
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : (editingVehicle ? 'Actualizar' : 'Crear') + ' Vehículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehiculosJefe;

