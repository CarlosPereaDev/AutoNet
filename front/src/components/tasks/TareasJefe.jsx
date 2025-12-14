import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTasks,
  faCar,
  faTractor,
  faUsers,
  faPlus,
  faSearch,
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faEdit,
  faTrash,
  faList,
  faThLarge
} from '@fortawesome/free-solid-svg-icons';
import { logout, getCurrentUser, processTokenFromUrl } from '../../services/authService';
import { getTasks, deleteTask, createTask, updateTask } from '../../services/taskService';
import { getWorkers } from '../../services/workerService';
import { getVehicles } from '../../services/vehicleService';
import { getMachineries } from '../../services/machineryService';
import { useElapsedTime } from '../../hooks/useElapsedTime';
import { useToast } from '../common/Toast';
import Select from '../common/Select';
import '../styles/Dashboard.css';

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

function TareasJefe() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [machineries, setMachineries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    vehicle_id: '',
    machinery_id: '',
    estimated_hours: '',
    deadline: ''
  });

  useEffect(() => {
    if (token) {
      processTokenFromUrl(token)
        .then(() => {
          navigate('/dashboard/jefe/tareas', { replace: true });
        })
        .catch((error) => {
          console.error('Error al procesar token:', error);
          navigate('/', { replace: true });
        });
    }
  }, [token, navigate]);

  // Cargar tareas, trabajadores, vehículos y maquinaria desde el backend
  const fetchData = async () => {
    try {
      const [tasksData, workersData, vehiclesData, machineriesData] = await Promise.all([
        getTasks(false), // false para no usar caché y obtener datos actualizados
        getWorkers(),
        getVehicles(false),
        getMachineries(false)
      ]);
      setTasks(tasksData.tasks || []);
      setWorkers(workersData.workers || []);
      setVehicles(vehiclesData.vehicles || []);
      setMachineries(machineriesData.machineries || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);

  // Polling para actualizar tareas automáticamente cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }, []);



  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const workerName = task.assigned_to?.name || '';
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDeleteTask = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    setDeleting(true);
    try {
      await deleteTask(taskToDelete.id);
      // Eliminar de la lista sin recargar todo
      setTasks(tasks.filter(t => t.id !== taskToDelete.id));
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      toast.error('Error al eliminar la tarea');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteTask = () => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const handleOpenModal = (task = null) => {
    // Asegurar que el modal esté cerrado antes de abrirlo
    if (showModal) {
      handleCloseModal();
      // Pequeño delay para asegurar que el estado se actualice
      setTimeout(() => {
        openModalWithTask(task);
      }, 100);
    } else {
      openModalWithTask(task);
    }
  };

  const openModalWithTask = (task = null) => {
    if (task) {
      setEditingTask(task);
      // Manejar assigned_to que puede ser un objeto o un ID
      const assignedToId = typeof task.assigned_to === 'object'
        ? task.assigned_to?.id || task.assigned_to_id
        : task.assigned_to || task.assigned_to_id;

      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        assigned_to: assignedToId ? String(assignedToId) : '',
        vehicle_id: task.vehicle_id ? String(task.vehicle_id) : '',
        machinery_id: task.machinery_id ? String(task.machinery_id) : '',
        estimated_hours: task.estimated_hours || '',
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        vehicle_id: '',
        machinery_id: '',
        estimated_hours: '',
        deadline: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    // Cerrar el modal y resetear todo
    setShowModal(false);
    setEditingTask(null);
    setSubmitting(false);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      assigned_to: '',
      vehicle_id: '',
      machinery_id: '',
      estimated_hours: '',
      deadline: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('handleSubmit llamado', { submitting, formData, workers: workers.length });

    // Prevenir múltiples envíos
    if (submitting) {
      console.log('Ya se está enviando el formulario, ignorando click');
      return;
    }

    // Validar título
    if (!formData.title || formData.title.trim() === '') {
      toast.warning('El título de la tarea es obligatorio');
      return;
    }

    // Validar assigned_to solo si se proporciona
    let assignedToId = null;
    if (formData.assigned_to && formData.assigned_to !== '' && formData.assigned_to !== '0') {
      assignedToId = parseInt(formData.assigned_to);
      if (isNaN(assignedToId) || assignedToId <= 0) {
        toast.warning('El trabajador seleccionado no es válido');
        return;
      }

      // Verificar que el trabajador existe en la lista
      const workerExists = workers.some(w => w.id === assignedToId);
      if (!workerExists) {
        toast.warning('El trabajador seleccionado no es válido. Por favor, recarga la página.');
        return;
      }
    }

    // Validar y formatear deadline si existe
    let deadlineValue = null;
    if (formData.deadline && formData.deadline !== '') {
      const deadlineDate = new Date(formData.deadline + 'T00:00:00');
      if (isNaN(deadlineDate.getTime())) {
        toast.warning('La fecha límite no es válida');
        return;
      }
      deadlineValue = formData.deadline;
    }

    // Ahora sí, activar el estado de envío
    setSubmitting(true);

    try {

      // Preparar datos para enviar
      const submitData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        priority: formData.priority,
        assigned_to: assignedToId || null,
        vehicle_id: formData.vehicle_id && formData.vehicle_id !== '' ? parseInt(formData.vehicle_id) : null,
        machinery_id: formData.machinery_id && formData.machinery_id !== '' ? parseInt(formData.machinery_id) : null,
        estimated_hours: formData.estimated_hours && formData.estimated_hours !== ''
          ? parseFloat(formData.estimated_hours)
          : null,
        deadline: deadlineValue
      };

      console.log('Enviando datos de tarea:', submitData);

      let response;
      try {
        if (editingTask) {
          response = await updateTask(editingTask.id, submitData);
          console.log('Respuesta de actualización:', response);

          // Actualizar la tarea en la lista sin recargar todo
          const updatedTask = response?.task || response;
          if (updatedTask && updatedTask.id) {
            setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
            handleCloseModal();
          } else {
            // Fallback: recargar si no viene la tarea en la respuesta
            console.warn('No se recibió la tarea actualizada, recargando lista...');
            await fetchData();
            handleCloseModal();
          }
        } else {
          response = await createTask(submitData);
          console.log('Respuesta de creación:', response);

          // Agregar la nueva tarea al inicio de la lista sin recargar todo
          const newTask = response?.task || response;
          console.log('Tarea recibida:', newTask);

          if (newTask && newTask.id) {
            console.log('Agregando tarea a la lista:', newTask);
            setTasks([newTask, ...tasks]);
            setSubmitting(false);
            handleCloseModal();
          } else {
            // Fallback: recargar si no viene la tarea en la respuesta
            console.warn('No se recibió la tarea creada en el formato esperado, recargando lista...');
            console.warn('Respuesta completa:', response);
            try {
              await fetchData();
              setSubmitting(false);
              handleCloseModal();
            } catch (reloadError) {
              console.error('Error al recargar tareas:', reloadError);
              setSubmitting(false);
              toast.warning('La tarea se creó pero no se pudo actualizar la lista. Por favor, recarga la página.');
            }
          }
        }
      } catch (createError) {
        // Si hay error, lanzarlo para que se maneje en el catch externo
        throw createError;
      }
    } catch (error) {
      console.error('Error completo al guardar tarea:', error);
      console.error('Error response:', error.response);
      console.error('Error stack:', error.stack);

      let errorMessage = 'Error al guardar la tarea';

      if (error.response?.data) {
        if (error.response.data.errors) {
          // Errores de validación
          const errors = error.response.data.errors;
          const errorMessages = Object.values(errors).flat();
          errorMessage = errorMessages.join('\n');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Mostrar error más detallado
      toast.error(errorMessage);
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return faCheckCircle;
      case 'in_progress': return faClock;
      case 'paused': return faClock;
      case 'pending': return faExclamationTriangle;
      default: return faTasks;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'paused': return 'warning';
      case 'pending': return 'warning';
      default: return 'primary';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  return (
    <>
      {/* Page Header */}
      <section className="dashboard-welcome-section">
        <div>
          <h1 className="welcome-title">Gestión de Tareas</h1>
          <p className="welcome-subtitle">
            Asigna y supervisa trabajos, indicando recursos, tiempo estimado y fecha de entrega.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!showModal && !submitting) {
              handleOpenModal();
            }
          }}
          disabled={showModal || submitting}
          title={showModal ? 'Cierra el modal actual primero' : 'Crear nueva tarea'}
          style={{
            pointerEvents: (showModal || submitting) ? 'none' : 'auto',
            opacity: (showModal || submitting) ? 0.5 : 1
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Nueva Tarea</span>
        </button>
      </section>

      {/* Filters and Search Toolbar */}
      <section className="dashboard-toolbar">
        <div className="toolbar-search">
          <div className="search-box icon-left">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Buscar por nombre, trabajador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="toolbar-filters">
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

          <div className="view-toggles">
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista de Lista"
            >
              <FontAwesomeIcon icon={faList} />
            </button>
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista de Cuadrícula"
            >
              <FontAwesomeIcon icon={faThLarge} />
            </button>
          </div>
        </div>
      </section>

      {/* Tasks List */}
      <section className="dashboard-content-section">
        {
          loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-gray)' }} >
              <p>Cargando tareas...</p>
            </div >
          ) : filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray)' }}>
              <FontAwesomeIcon icon={faTasks} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>
                {searchTerm || filter !== 'all'
                  ? 'No se encontraron tareas con los filtros seleccionados'
                  : 'No hay tareas registradas'}
              </p>
              <p style={{ fontSize: '14px', opacity: 0.7 }}>
                {!searchTerm && filter === 'all' && 'Crea tu primera tarea para comenzar'}
              </p>
            </div>
          ) : (
            <div className={`tasks-view-${viewMode}`}>
              {filteredTasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`task-card task-card-${task.status}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* List View Color Stripe */}
                  {viewMode === 'list' && (
                    <div className={`task-status-stripe stripe-${task.status}`}></div>
                  )}

                  <div className="task-card-header">
                    <div className="task-status-badge">
                      {/* Icon is decorative in grid view, text is main */}
                      {viewMode === 'grid' && (
                        <FontAwesomeIcon
                          icon={getStatusIcon(task.status)}
                          className={`status-icon-${getStatusColor(task.status)}`}
                        />
                      )}
                      <span className={`status-text status-${task.status}`}>
                        {task.status === 'in_progress' ? 'En Progreso' :
                          task.status === 'completed' ? 'Completada' :
                            task.status === 'paused' ? 'Pausada' : 'Pendiente'}
                      </span>
                    </div>
                    <div className={`task-priority-badge priority-${task.priority || 'medium'}`}>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                    </div>
                  </div>

                  <div className="task-card-body">
                    <h3 className="task-card-title">{task.title}</h3>
                    {task.description && viewMode === 'grid' && (
                      <p className="task-card-description">{task.description}</p>
                    )}

                    {/* Meta Information Container */}
                    <div className="task-card-meta">
                      <div className="task-meta-row">
                        <div className="task-meta-item">
                          <FontAwesomeIcon icon={faUsers} />
                          <span>{task.assigned_to?.name || (task.assigned_to === null ? 'Disponible' : 'Sin asignar')}</span>
                        </div>

                        <div className="task-meta-item">
                          <FontAwesomeIcon icon={faClock} />
                          <span>{task.deadline ? new Date(task.deadline).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
                        </div>
                      </div>

                      {/* Extra details only if they exist */}
                      {(task.vehicle || task.machinery) && (
                        <div className="task-meta-row">
                          {task.vehicle && (
                            <div className="task-meta-item">
                              <FontAwesomeIcon icon={faCar} />
                              <span>{task.vehicle.plate}</span>
                            </div>
                          )}
                          {task.machinery && (
                            <div className="task-meta-item">
                              <FontAwesomeIcon icon={faTractor} />
                              <span>{task.machinery.name}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <TaskElapsedTime task={task} />
                    </div>
                  </div>

                  <div className="task-card-actions">
                    <button className="action-btn action-edit" onClick={() => handleOpenModal(task)} title="Editar Tarea">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button className="action-btn action-delete" onClick={() => handleDeleteTask(task)} title="Eliminar Tarea">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </section >

      {/* Modal de confirmación para eliminar tarea */}
      {
        showDeleteModal && taskToDelete && (
          <div
            className="modal-overlay"
            onClick={deleting ? undefined : cancelDeleteTask}
            style={{ pointerEvents: deleting ? 'none' : 'auto' }}
          >
            <div
              className="modal-content alert-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ pointerEvents: 'auto', maxWidth: '500px' }}
            >
              <div className="modal-header">
                <h2>Confirmar eliminación</h2>
                <button className="modal-close" onClick={cancelDeleteTask} disabled={deleting}>×</button>
              </div>
              <div style={{ padding: '24px' }}>
                <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--color-white)', lineHeight: '1.5' }}>
                  ¿Estás seguro de que deseas eliminar la tarea <strong>"{taskToDelete.title}"</strong>?
                </p>
                <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--color-gray)', lineHeight: '1.5' }}>
                  Esta acción no se puede deshacer. La tarea será eliminada permanentemente.
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={cancelDeleteTask}
                    disabled={deleting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={confirmDeleteTask}
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
        )
      }

      {/* Modal para crear/editar tarea */}
      {
        showModal && (
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
                <h2>{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
                <button className="modal-close" onClick={handleCloseModal}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="task-form">
                <div className="form-group">
                  <label>Título *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Título de la tarea"
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción detallada de la tarea"
                    rows="4"
                  />
                </div>

                <div className="form-row">
                  <Select
                    label="Prioridad"
                    name="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    options={[
                      { value: 'low', label: 'Baja' },
                      { value: 'medium', label: 'Media' },
                      { value: 'high', label: 'Alta' }
                    ]}
                    required
                  />

                  {workers.length === 0 ? (
                    <div className="form-group">
                      <label>Trabajador (opcional)</label>
                      <div style={{ padding: '12px', background: 'rgba(23, 162, 184, 0.1)', borderRadius: '12px', color: 'var(--color-info)', fontSize: '13px', border: '1px solid rgba(23, 162, 184, 0.2)' }}>
                        No hay trabajadores disponibles. La tarea quedará disponible para que cualquier trabajador la reserve.
                      </div>
                    </div>
                  ) : (
                    <Select
                      label="Trabajador (opcional)"
                      name="assigned_to"
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      options={[
                        { value: '', label: 'Sin asignar (disponible para reservar)' },
                        ...workers.map(worker => ({
                          value: worker.id,
                          label: worker.name
                        }))
                      ]}
                    />
                  )}
                </div>

                <div className="form-row">
                  <Select
                    label="Vehículo (opcional)"
                    name="vehicle_id"
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                    options={[
                      { value: '', label: 'Sin vehículo' },
                      ...vehicles.filter(v => v.status === 'active').map(vehicle => ({
                        value: vehicle.id,
                        label: `${vehicle.name || `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || vehicle.plate} - ${vehicle.plate}`
                      }))
                    ]}
                  />

                  <Select
                    label="Maquinaria (opcional)"
                    name="machinery_id"
                    value={formData.machinery_id}
                    onChange={(e) => setFormData({ ...formData, machinery_id: e.target.value })}
                    options={[
                      { value: '', label: 'Sin maquinaria' },
                      ...machineries.filter(m => m.status === 'active').map(machinery => ({
                        value: machinery.id,
                        label: `${machinery.name}${machinery.serial_number ? ` - ${machinery.serial_number}` : ''}`
                      }))
                    ]}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Horas estimadas</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.estimated_hours}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha límite</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    />
                  </div>
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
                    onClick={(e) => {
                      console.log('Botón submit clickeado', { submitting, formData });
                      // No prevenir el comportamiento por defecto aquí, el form lo maneja
                    }}
                  >
                    {submitting ? 'Guardando...' : (editingTask ? 'Actualizar' : 'Crear') + ' Tarea'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </>
  );
}

export default TareasJefe;

