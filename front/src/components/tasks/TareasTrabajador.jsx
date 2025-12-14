import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTasks,
  faCar,
  faTractor,
  faSearch,
  faCheckCircle,
  faClock,
  faPlay,
  faEdit,
  faPause,
  faHandPaper,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { getCurrentUser, processTokenFromUrl, sendHeartbeat } from '../../services/authService';
import { getMyTasks, getAvailableTasks, updateTask, reserveTask } from '../../services/taskService';
import { useElapsedTime } from '../../hooks/useElapsedTime';
import { useToast } from '../common/Toast';
import '../styles/Dashboard.css';

// Componente para mostrar el tiempo transcurrido
function TaskElapsedTime({ task }) {
  const elapsedTime = useElapsedTime(
    task.started_at || (task.status === 'in_progress' ? task.created_at : null),
    task.status === 'in_progress' // Solo contar tiempo cuando está en progreso, no cuando está pausada
  );

  if (!elapsedTime || task.status === 'paused') return null;

  return (
    <div className="task-meta-item" style={{ color: 'var(--color-primary)' }}>
      <FontAwesomeIcon icon={faClock} />
      <span>Tiempo transcurrido: {elapsedTime}</span>
    </div>
  );
}

function TareasTrabajador() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('my'); // 'my' o 'available'
  const watchIdRef = React.useRef(null);
  const lastLocationUpdateRef = React.useRef(0);

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

  // Cargar tareas disponibles
  const fetchAvailableTasks = async () => {
    try {
      const response = await getAvailableTasks(false);
      setAvailableTasks(response.tasks || []);
    } catch (error) {
      console.error('Error al cargar tareas disponibles:', error);
    } finally {
      setLoadingAvailable(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setLoadingAvailable(true);
    fetchTasks();
    fetchAvailableTasks();
  }, []);

  // Polling para actualizar tareas automáticamente cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
      fetchAvailableTasks();
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

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredAvailableTasks = availableTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });



  // Función para actualizar la ubicación en el backend
  const updateUserLocation = async (latitude, longitude) => {
    try {
      // Limitar actualizaciones a una cada 10 segundos
      const now = Date.now();
      if (now - lastLocationUpdateRef.current < 10000) return;

      lastLocationUpdateRef.current = now;

      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/user/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });
    } catch (error) {
      console.error('Error al enviar ubicación:', error);
    }
  };

  // Iniciar seguimiento de ubicación
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocalización no soportada');
      return;
    }

    if (watchIdRef.current) return; // Ya está rastreando

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        updateUserLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        toast.error('No se pudo obtener la ubicación. Asegúrate de permitir el acceso.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Detener seguimiento
  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Efecto para gestionar el tracking basado en tareas activas
  useEffect(() => {
    const hasActiveTask = tasks.some(t => t.status === 'in_progress');

    if (hasActiveTask) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    // Cleanup al desmontar
    return () => stopLocationTracking();
  }, [tasks]);

  const acceptTask = async (id) => {
    // Pedir ubicación antes de comenzar
    if (navigator.geolocation) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
      } catch (error) {
        toast.error('Es necesario permitir la ubicación para comenzar la tarea.');
        return;
      }
    }

    try {
      await updateTask(id, { status: 'in_progress' });
      await fetchTasks();
      toast.success('Tarea iniciada. Se compartirá tu ubicación mientras trabajas.');
    } catch (error) {
      console.error('Error al iniciar tarea:', error);
      toast.error('Error al iniciar la tarea.');
    }
  };

  const reserveTaskHandler = async (id) => {
    try {
      await reserveTask(id);
      // Recargar tareas
      await fetchTasks();
      await fetchAvailableTasks();
      toast.success('Tarea reservada correctamente');
    } catch (error) {
      console.error('Error al reservar tarea:', error);
      const errorMessage = error.response?.data?.message || 'Error al reservar la tarea. Por favor, intenta de nuevo.';
      toast.error(errorMessage);
    }
  };

  const pauseTask = async (id) => {
    try {
      await updateTask(id, { status: 'paused' });
      await fetchTasks();
      toast.info('Tarea pausada');
    } catch (error) {
      console.error('Error al pausar tarea:', error);
      toast.error('Error al pausar la tarea. Por favor, intenta de nuevo.');
    }
  };

  const resumeTask = async (id) => {
    try {
      await updateTask(id, { status: 'in_progress' });
      await fetchTasks();
      toast.success('Tarea reanudada');
    } catch (error) {
      console.error('Error al continuar tarea:', error);
      toast.error('Error al continuar la tarea. Por favor, intenta de nuevo.');
    }
  };

  const completeTask = async (id) => {
    try {
      await updateTask(id, { status: 'completed' });
      // Recargar tareas para obtener completed_at actualizado
      await fetchTasks();
      await fetchAvailableTasks();
      toast.success('¡Tarea completada!');
    } catch (error) {
      console.error('Error al completar tarea:', error);
      toast.error('Error al completar la tarea. Por favor, intenta de nuevo.');
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
    <>
      <section className="dashboard-welcome-section">
        <div>
          <h1 className="welcome-title">Mis Tareas</h1>
          <p className="welcome-subtitle">
            Gestiona tus tareas asignadas, reserva nuevas tareas disponibles, pausa y continúa tu trabajo.
          </p>
        </div>
      </section>

      {/* Tabs para cambiar entre mis tareas y disponibles */}
      <section className="dashboard-filters-section">
        <div className="filter-tabs" style={{ marginBottom: '16px', width: 'fit-content' }}>
          <button
            className={`filter-tab ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            Mis Tareas
          </button>
          <button
            className={`filter-tab ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Tareas Disponibles
          </button>
        </div>
      </section>

      {activeTab === 'my' && (
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
            <div className="filter-tabs">
              <button
                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Todas
              </button>
              <button
                className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                Pendientes
              </button>
              <button
                className={`filter-tab ${filter === 'in_progress' ? 'active' : ''}`}
                onClick={() => setFilter('in_progress')}
              >
                En Progreso
              </button>
              <button
                className={`filter-tab ${filter === 'paused' ? 'active' : ''}`}
                onClick={() => setFilter('paused')}
              >
                Pausadas
              </button>
              <button
                className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completadas
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'available' && (
        <section className="dashboard-filters-section">
          <div className="filters-search">
            <div className="search-box">
              <FontAwesomeIcon icon={faSearch} />
              <input
                type="text"
                placeholder="Buscar tareas disponibles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </section>
      )}

      <section className="dashboard-content-section">
        {activeTab === 'my' && (
          <>
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
              <div className="tasks-view-grid">
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
                            task.status === 'completed' ? 'Completada' :
                              task.status === 'paused' ? 'Pausada' : 'Pendiente'}
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

                      <TaskElapsedTime task={task} />

                      <div className="task-card-meta">
                        {task.deadline && (
                          <div className="task-meta-item" title="Fecha límite">
                            <FontAwesomeIcon icon={faClock} />
                            <span>{new Date(task.deadline).toLocaleDateString('es-ES')}</span>
                          </div>
                        )}
                        {task.vehicle && (
                          <div className="task-meta-item" title="Vehículo">
                            <FontAwesomeIcon icon={faCar} />
                            <span>{task.vehicle.name || task.vehicle.plate}</span>
                          </div>
                        )}
                        {task.machinery && (
                          <div className="task-meta-item" title="Maquinaria">
                            <FontAwesomeIcon icon={faTractor} />
                            <span>{task.machinery.name}</span>
                          </div>
                        )}
                        {task.estimated_hours && (
                          <div className="task-meta-item" title="Horas estimadas">
                            <FontAwesomeIcon icon={faClock} />
                            <span>{task.estimated_hours}h</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="task-card-actions">
                      {task.status === 'pending' && (
                        <button
                          className="action-btn action-approve"
                          onClick={() => acceptTask(task.id)}
                        >
                          <FontAwesomeIcon icon={faPlay} />
                          <span>Iniciar</span>
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <>
                          <button
                            className="action-btn action-edit"
                            onClick={() => pauseTask(task.id)}
                          >
                            <FontAwesomeIcon icon={faPause} />
                            <span>Pausar</span>
                          </button>
                          <button
                            className="action-btn action-approve"
                            onClick={() => completeTask(task.id)}
                          >
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span>Completar</span>
                          </button>
                        </>
                      )}
                      {task.status === 'paused' && (
                        <>
                          <button
                            className="action-btn action-approve"
                            onClick={() => resumeTask(task.id)}
                          >
                            <FontAwesomeIcon icon={faPlay} />
                            <span>Continuar</span>
                          </button>
                          <button
                            className="action-btn action-edit"
                            onClick={() => handleViewDetails(task)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                            <span>Detalles</span>
                          </button>
                        </>
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
          </>
        )}

        {activeTab === 'available' && (
          <>
            {loadingAvailable ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-gray)' }}>
                <p>Cargando tareas disponibles...</p>
              </div>
            ) : filteredAvailableTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray)' }}>
                <FontAwesomeIcon icon={faTasks} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>
                  {searchTerm
                    ? 'No se encontraron tareas disponibles con los filtros seleccionados'
                    : 'No hay tareas disponibles para reservar'}
                </p>
                <p style={{ fontSize: '14px', opacity: 0.7 }}>
                  {!searchTerm && 'Las tareas sin asignar aparecerán aquí'}
                </p>
              </div>
            ) : (
              <div className="tasks-view-grid">
                {filteredAvailableTasks.map(task => (
                  <div key={task.id} className={`task-card task-card-pending`}>
                    <div className="task-card-header">
                      <div className="task-status-badge">
                        <FontAwesomeIcon
                          icon={faTasks}
                          className="status-icon-warning"
                        />
                        <span className="status-text status-pending">
                          Disponible
                        </span>
                      </div>
                      <div className={`task-priority-badge priority-${task.priority || 'medium'}`}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                      </div>
                    </div>
                    <div className="task-card-body">
                      <h3 className="task-card-title">{task.title}</h3>
                      {task.description && (
                        <p className="task-card-description">{task.description}</p>
                      )}
                      <div className="task-card-meta">
                        {task.vehicle && (
                          <div className="task-meta-item" title="Vehículo">
                            <FontAwesomeIcon icon={faCar} />
                            <span>{task.vehicle.name || task.vehicle.plate}</span>
                          </div>
                        )}
                        {task.machinery && (
                          <div className="task-meta-item" title="Maquinaria">
                            <FontAwesomeIcon icon={faTractor} />
                            <span>{task.machinery.name}</span>
                          </div>
                        )}
                        {task.estimated_hours && (
                          <div className="task-meta-item" title="Horas estimadas">
                            <FontAwesomeIcon icon={faClock} />
                            <span>{task.estimated_hours}h</span>
                          </div>
                        )}
                        {task.deadline && (
                          <div className="task-meta-item" title="Fecha límite">
                            <FontAwesomeIcon icon={faClock} />
                            <span>{new Date(task.deadline).toLocaleDateString('es-ES')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="task-card-actions">
                      <button
                        className="action-btn action-approve"
                        onClick={() => reserveTaskHandler(task.id)}
                      >
                        <FontAwesomeIcon icon={faHandPaper} />
                        <span>Reservar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Modal para ver detalles de la tarea */}
      {showDetailsModal && selectedTask && (
        <div
          className="modal-overlay"
          onClick={handleCloseDetailsModal}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Detalles de la Tarea</h2>
              <button className="modal-close" onClick={handleCloseDetailsModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div>
              <h3 className="modal-details-title">
                {selectedTask.title}
              </h3>
              <div className="modal-details-badges">
                <div className={`task-priority-badge priority-${selectedTask.priority}`} style={{ margin: 0 }}>
                  Prioridad: {selectedTask.priority === 'high' ? 'Alta' : selectedTask.priority === 'medium' ? 'Media' : 'Baja'}
                </div>
                <div className={`task-status-badge`} style={{ margin: 0 }}>
                  <span className={`status-text status-${selectedTask.status}`}>
                    {selectedTask.status === 'completed' ? 'Completada' :
                      selectedTask.status === 'in_progress' ? 'En Progreso' :
                        selectedTask.status === 'paused' ? 'Pausada' : 'Pendiente'}
                  </span>
                </div>
              </div>

              {selectedTask.description && (
                <div className="modal-details-section">
                  <h4 className="modal-details-section-title">Descripción</h4>
                  <p className="modal-details-description">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              <div className="modal-details-grid">
                {selectedTask.assigned_by && (
                  <div className="modal-details-info-box">
                    <div className="modal-details-info-label">Asignada por</div>
                    <div className="modal-details-info-value">
                      {selectedTask.assigned_by?.name || 'Jefe'}
                    </div>
                  </div>
                )}

                {selectedTask.vehicle && (
                  <div className="modal-details-info-box">
                    <div className="modal-details-info-label">Vehículo asignado</div>
                    <div className="modal-details-info-value">
                      {selectedTask.vehicle.name || selectedTask.vehicle.plate}
                    </div>
                    {selectedTask.vehicle.plate && (
                      <div style={{ fontSize: '11px', color: 'var(--color-gray)', marginTop: '8px' }}>
                        Placa: {selectedTask.vehicle.plate}
                      </div>
                    )}
                  </div>
                )}

                {selectedTask.machinery && (
                  <div className="modal-details-info-box">
                    <div className="modal-details-info-label">Maquinaria asignada</div>
                    <div className="modal-details-info-value">
                      {selectedTask.machinery.name}
                    </div>
                    {selectedTask.machinery.serial_number && (
                      <div style={{ fontSize: '11px', color: 'var(--color-gray)', marginTop: '8px' }}>
                        Serial: {selectedTask.machinery.serial_number}
                      </div>
                    )}
                  </div>
                )}

                {selectedTask.estimated_hours && (
                  <div className="modal-details-info-box">
                    <div className="modal-details-info-label">Horas estimadas</div>
                    <div className="modal-details-info-value">
                      {selectedTask.estimated_hours}h
                    </div>
                  </div>
                )}

                {selectedTask.deadline && (
                  <div className="modal-details-info-box">
                    <div className="modal-details-info-label">Fecha límite</div>
                    <div className="modal-details-info-value">
                      {formatDate(selectedTask.deadline)}
                    </div>
                  </div>
                )}

                {selectedTask.started_at && (
                  <div className="modal-details-info-box">
                    <div className="modal-details-info-label">Iniciada el</div>
                    <div className="modal-details-info-value">
                      {formatDate(selectedTask.started_at)}
                    </div>
                  </div>
                )}

                {selectedTask.completed_at && (
                  <div className="modal-details-info-box">
                    <div className="modal-details-info-label">Completada el</div>
                    <div className="modal-details-info-value success">
                      {formatDate(selectedTask.completed_at)}
                    </div>
                  </div>
                )}
              </div>

              {selectedTask.started_at && selectedTask.completed_at && (
                <div className="modal-details-time-box">
                  <div className="modal-details-info-label">Tiempo total</div>
                  <div className="modal-details-info-value" style={{ fontSize: '18px', marginTop: '4px' }}>
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
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TareasTrabajador;
