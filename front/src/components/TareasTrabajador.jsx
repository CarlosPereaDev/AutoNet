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
  faCheckCircle,
  faClock,
  faPlay,
  faStop,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import { logout, getCurrentUser, processTokenFromUrl, sendHeartbeat } from '../services/authService';
import { getMyTasks, updateTask } from '../services/taskService';
import { useElapsedTime } from '../hooks/useElapsedTime';
import logo from '../assets/Logo.svg';
import './Dashboard.css';

// Componente para mostrar el tiempo transcurrido
function TaskElapsedTime({ task }) {
  const elapsedTime = useElapsedTime(
    task.started_at || (task.status === 'in_progress' ? task.created_at : null),
    task.status === 'in_progress'
  );
  
  if (!elapsedTime) return null;
  
  return (
    <div className="task-meta-item" style={{ color: 'var(--color-primary)' }}>
      <FontAwesomeIcon icon={faClock} />
      <span>Tiempo transcurrido: {elapsedTime}</span>
    </div>
  );
}

function TareasTrabajador() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();
  const token = searchParams.get('token');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (token) {
      processTokenFromUrl(token)
        .then(() => {
          navigate('/dashboard/trabajador/tareas', { replace: true });
        })
        .catch((error) => {
          console.error('Error al procesar token:', error);
          navigate('/', { replace: true });
        });
    }
  }, [token, navigate]);

  // Cargar tareas desde el backend
  const fetchTasks = async () => {
    try {
      const response = await getMyTasks(false); // false para no usar caché y obtener datos actualizados
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, []);

  // Polling para actualizar tareas automáticamente cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
    }, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // Heartbeat para mantener el estado activo cada 2 minutos
  useEffect(() => {
    // Enviar heartbeat inmediatamente al montar
    sendHeartbeat();
    
    // Enviar heartbeat cada 2 minutos
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 120000); // 2 minutos

    return () => clearInterval(heartbeatInterval);
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

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const acceptTask = async (id) => {
    try {
      await updateTask(id, { status: 'in_progress' });
      // Recargar tareas para obtener started_at actualizado
      await fetchTasks();
    } catch (error) {
      console.error('Error al aceptar tarea:', error);
      alert('Error al aceptar la tarea. Por favor, intenta de nuevo.');
    }
  };

  const completeTask = async (id) => {
    try {
      await updateTask(id, { status: 'completed' });
      // Recargar tareas para obtener completed_at actualizado
      await fetchTasks();
    } catch (error) {
      console.error('Error al completar tarea:', error);
      alert('Error al completar la tarea. Por favor, intenta de nuevo.');
    }
  };

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTask(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <h1 className="welcome-title">Mis Tareas</h1>
            <p className="welcome-subtitle">
              Gestiona tus tareas asignadas, visualízalas, acéptalas y registra su inicio y finalización.
            </p>
          </div>
        </section>

        <section className="dashboard-filters-section">
          <div className="filters-search">
            <div className="search-box">
              <FontAwesomeIcon icon={faSearch} />
              <input 
                type="text" 
                placeholder="Buscar tareas..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Todas
              </button>
              <button 
                className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                Pendientes
              </button>
              <button 
                className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`}
                onClick={() => setFilter('in_progress')}
              >
                En Progreso
              </button>
              <button 
                className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completadas
              </button>
            </div>
          </div>
        </section>

        <section className="dashboard-content-section">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-gray)' }}>
              <p>Cargando tareas...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray)' }}>
              <FontAwesomeIcon icon={faTasks} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>
                {searchTerm || filter !== 'all' 
                  ? 'No se encontraron tareas con los filtros seleccionados' 
                  : 'No tienes tareas asignadas'}
              </p>
              <p style={{ fontSize: '14px', opacity: 0.7 }}>
                {!searchTerm && filter === 'all' && 'Las tareas asignadas aparecerán aquí'}
              </p>
            </div>
          ) : (
            <div className="tasks-list">
              {filteredTasks.map(task => (
              <div key={task.id} className={`task-card task-card-${task.status}`}>
                <div className="task-card-header">
                  <div className="task-status-badge">
                    <FontAwesomeIcon 
                      icon={task.status === 'completed' ? faCheckCircle : task.status === 'in_progress' ? faClock : faTasks} 
                      className={`status-icon-${task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'info' : 'warning'}`}
                    />
                    <span className={`status-text status-${task.status}`}>
                      {task.status === 'in_progress' ? 'En Progreso' : 
                       task.status === 'completed' ? 'Completada' : 'Pendiente'}
                    </span>
                  </div>
                  <div className={`task-priority-badge priority-${task.priority}`}>
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                  </div>
                </div>
                <div className="task-card-body">
                  <h3 className="task-card-title">{task.title}</h3>
                  {task.description && (
                    <p className="task-card-description">{task.description}</p>
                  )}
                  <div className="task-card-meta">
                    {task.deadline && (
                      <div className="task-meta-item">
                        <FontAwesomeIcon icon={faClock} />
                        <span>Fecha límite: {new Date(task.deadline).toLocaleDateString('es-ES')}</span>
                      </div>
                    )}
                    {task.assigned_by && (
                      <div className="task-meta-item">
                        <FontAwesomeIcon icon={faTasks} />
                        <span>Asignada por: {task.assigned_by?.name || 'Jefe'}</span>
                      </div>
                    )}
                    {task.vehicle && (
                      <div className="task-meta-item">
                        <FontAwesomeIcon icon={faCar} />
                        <span>Vehículo: {task.vehicle.name || task.vehicle.plate}</span>
                      </div>
                    )}
                    {task.machinery && (
                      <div className="task-meta-item">
                        <FontAwesomeIcon icon={faTractor} />
                        <span>Maquinaria: {task.machinery.name}</span>
                      </div>
                    )}
                    {task.estimated_hours && (
                      <div className="task-meta-item">
                        <FontAwesomeIcon icon={faClock} />
                        <span>Horas estimadas: {task.estimated_hours}h</span>
                      </div>
                    )}
                    <TaskElapsedTime task={task} />
                  </div>
                </div>
                <div className="task-card-actions">
                  {task.status === 'pending' && (
                    <button 
                      className="action-btn action-approve"
                      onClick={() => acceptTask(task.id)}
                    >
                      <FontAwesomeIcon icon={faPlay} />
                      <span>Aceptar</span>
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button 
                      className="action-btn action-approve"
                      onClick={() => completeTask(task.id)}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Completar</span>
                    </button>
                  )}
                  {task.status === 'completed' && (
                    <button 
                      className="action-btn action-edit"
                      onClick={() => handleViewDetails(task)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      <span>Ver Detalles</span>
                    </button>
                  )}
                </div>
              </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Modal para ver detalles de la tarea */}
      {showDetailsModal && selectedTask && (
        <div 
          className="modal-overlay" 
          onClick={handleCloseDetailsModal}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto', maxWidth: '600px' }}
          >
            <div className="modal-header">
              <h2>Detalles de la Tarea</h2>
              <button className="modal-close" onClick={handleCloseDetailsModal}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-white)', fontSize: '20px' }}>
                  {selectedTask.title}
                </h3>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <div className={`task-priority-badge priority-${selectedTask.priority}`} style={{ margin: 0 }}>
                    Prioridad: {selectedTask.priority === 'high' ? 'Alta' : selectedTask.priority === 'medium' ? 'Media' : 'Baja'}
                  </div>
                  <div className={`task-status-badge`} style={{ margin: 0 }}>
                    <span className={`status-text status-${selectedTask.status}`}>
                      {selectedTask.status === 'completed' ? 'Completada' : 
                       selectedTask.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedTask.description && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-white)', fontSize: '16px', fontWeight: '600' }}>
                    Descripción
                  </h4>
                  <p style={{ margin: 0, color: 'var(--color-gray)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {selectedTask.description}
                  </p>
                </div>
              )}

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px',
                marginBottom: '24px'
              }}>
                {selectedTask.assigned_by && (
                  <div style={{ 
                    padding: '12px', 
                    background: 'var(--color-dark-lighter)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-gray)', marginBottom: '4px' }}>
                      Asignada por
                    </div>
                    <div style={{ color: 'var(--color-white)', fontWeight: '500' }}>
                      {selectedTask.assigned_by?.name || 'Jefe'}
                    </div>
                  </div>
                )}

                {selectedTask.vehicle && (
                  <div style={{ 
                    padding: '12px', 
                    background: 'var(--color-dark-lighter)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-gray)', marginBottom: '4px' }}>
                      Vehículo asignado
                    </div>
                    <div style={{ color: 'var(--color-white)', fontWeight: '500' }}>
                      {selectedTask.vehicle.name || selectedTask.vehicle.plate}
                    </div>
                    {selectedTask.vehicle.plate && (
                      <div style={{ fontSize: '11px', color: 'var(--color-gray)', marginTop: '4px' }}>
                        Placa: {selectedTask.vehicle.plate}
                      </div>
                    )}
                  </div>
                )}

                {selectedTask.machinery && (
                  <div style={{ 
                    padding: '12px', 
                    background: 'var(--color-dark-lighter)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-gray)', marginBottom: '4px' }}>
                      Maquinaria asignada
                    </div>
                    <div style={{ color: 'var(--color-white)', fontWeight: '500' }}>
                      {selectedTask.machinery.name}
                    </div>
                    {selectedTask.machinery.serial_number && (
                      <div style={{ fontSize: '11px', color: 'var(--color-gray)', marginTop: '4px' }}>
                        Serial: {selectedTask.machinery.serial_number}
                      </div>
                    )}
                  </div>
                )}

                {selectedTask.estimated_hours && (
                  <div style={{ 
                    padding: '12px', 
                    background: 'var(--color-dark-lighter)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-gray)', marginBottom: '4px' }}>
                      Horas estimadas
                    </div>
                    <div style={{ color: 'var(--color-white)', fontWeight: '500' }}>
                      {selectedTask.estimated_hours}h
                    </div>
                  </div>
                )}

                {selectedTask.deadline && (
                  <div style={{ 
                    padding: '12px', 
                    background: 'var(--color-dark-lighter)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-gray)', marginBottom: '4px' }}>
                      Fecha límite
                    </div>
                    <div style={{ color: 'var(--color-white)', fontWeight: '500' }}>
                      {formatDate(selectedTask.deadline)}
                    </div>
                  </div>
                )}

                {selectedTask.started_at && (
                  <div style={{ 
                    padding: '12px', 
                    background: 'var(--color-dark-lighter)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-gray)', marginBottom: '4px' }}>
                      Iniciada el
                    </div>
                    <div style={{ color: 'var(--color-white)', fontWeight: '500' }}>
                      {formatDate(selectedTask.started_at)}
                    </div>
                  </div>
                )}

                {selectedTask.completed_at && (
                  <div style={{ 
                    padding: '12px', 
                    background: 'var(--color-dark-lighter)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-gray)', marginBottom: '4px' }}>
                      Completada el
                    </div>
                    <div style={{ color: 'var(--color-primary)', fontWeight: '500' }}>
                      {formatDate(selectedTask.completed_at)}
                    </div>
                  </div>
                )}
              </div>

              {selectedTask.started_at && selectedTask.completed_at && (
                <div style={{ 
                  padding: '12px', 
                  background: 'var(--color-dark-lighter)', 
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '24px'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-gray)', marginBottom: '4px' }}>
                    Tiempo total
                  </div>
                  <div style={{ color: 'var(--color-white)', fontWeight: '500' }}>
                    {(() => {
                      const start = new Date(selectedTask.started_at);
                      const end = new Date(selectedTask.completed_at);
                      const diffMs = end - start;
                      const diffHours = Math.floor(diffMs / 3600000);
                      const diffMins = Math.floor((diffMs % 3600000) / 60000);
                      if (diffHours > 0) {
                        return `${diffHours}h ${diffMins}m`;
                      }
                      return `${diffMins}m`;
                    })()}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={handleCloseDetailsModal}
                  style={{ width: '100%' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TareasTrabajador;

