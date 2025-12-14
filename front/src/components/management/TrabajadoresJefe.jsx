import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faSearch,
  faEdit,
  faTrash,
  faUser,
  faPhone,
  faTimes,
  faEnvelope,
  faTasks
} from '@fortawesome/free-solid-svg-icons';
import { logout, getCurrentUser, processTokenFromUrl } from '../../services/authService';
import { getWorkers, createWorker, updateWorker, deleteWorker } from '../../services/workerService';
import { useToast } from '../common/Toast';
import '../styles/Dashboard.css';

function TrabajadoresJefe() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const token = searchParams.get('token');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });

  useEffect(() => {
    if (token) {
      processTokenFromUrl(token)
        .then(() => {
          navigate('/dashboard/jefe/trabajadores', { replace: true });
        })
        .catch((error) => {
          console.error('Error al procesar token:', error);
          navigate('/', { replace: true });
        });
    }
  }, [token, navigate]);

  useEffect(() => {
    loadWorkers();
  }, []);

  // Polling para actualizar trabajadores automáticamente cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadWorkers();
    }, 10000); // Actualizar cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  const loadWorkers = async () => {
    try {
      const data = await getWorkers(false); // false para no usar caché
      setWorkers(data.workers || []);
    } catch (error) {
      console.error('Error al cargar trabajadores:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleOpenModal = (worker = null) => {
    if (worker) {
      setEditingWorker(worker);
      setFormData({
        name: worker.name || '',
        email: worker.email || '',
        password: '',
        password_confirmation: ''
      });
    } else {
      setEditingWorker(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setShowModal(false);
    setEditingWorker(null);
    setSubmitting(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (submitting) return;

    // Validaciones
    if (!formData.name || formData.name.trim() === '') {
      toast.warning('El nombre es obligatorio');
      return;
    }

    if (!formData.email || formData.email.trim() === '') {
      toast.warning('El email es obligatorio');
      return;
    }

    if (!editingWorker && (!formData.password || formData.password.length < 8)) {
      toast.warning('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (formData.password && formData.password !== formData.password_confirmation) {
      toast.warning('Las contraseñas no coinciden');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim()
      };

      // Solo incluir contraseña si se está creando o editando y se proporciona
      if (!editingWorker || (editingWorker && formData.password)) {
        submitData.password = formData.password;
        submitData.password_confirmation = formData.password_confirmation;
      }

      if (editingWorker) {
        await updateWorker(editingWorker.id, submitData);
      } else {
        await createWorker(submitData);
      }

      await loadWorkers();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar trabajador:', error);
      let errorMessage = 'Error al guardar el trabajador';

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

      toast.error(errorMessage);
      setSubmitting(false);
    }
  };

  const handleDeleteWorker = (worker) => {
    setWorkerToDelete(worker);
    setShowDeleteModal(true);
  };

  const confirmDeleteWorker = async () => {
    if (!workerToDelete) return;

    setDeleting(true);
    try {
      await deleteWorker(workerToDelete.id);
      setWorkers(workers.filter(w => w.id !== workerToDelete.id));
      setShowDeleteModal(false);
      setWorkerToDelete(null);
    } catch (error) {
      console.error('Error al eliminar trabajador:', error);
      const errorMessage = error.response?.data?.message || 'Error al eliminar el trabajador';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteWorker = () => {
    setShowDeleteModal(false);
    setWorkerToDelete(null);
  };

  const filteredWorkers = workers.filter(worker => {
    // Filtro de búsqueda por nombre o email
    const matchesSearch = !searchTerm ||
      worker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por estado
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = worker.is_active === true;
    } else if (statusFilter === 'inactive') {
      matchesStatus = worker.is_active === false;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <>

      <section className="dashboard-welcome-section">
        <div>
          <h1 className="welcome-title">Gestión de Trabajadores</h1>
          <p className="welcome-subtitle">
            Administra usuarios y roles, modificando permisos o desactivando cuentas.
          </p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <span>Nuevo Trabajador</span>
        </button>
      </section>

      <section className="dashboard-filters-section">
        <div className="filters-search">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Buscar trabajadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-tabs">
            <button
              className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Todos
            </button>
            <button
              className={`filter-tab ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              Activos
            </button>
            <button
              className={`filter-tab ${statusFilter === 'inactive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('inactive')}
            >
              Inactivos
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-content-section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-gray)' }}>
            <p>Cargando trabajadores...</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray)' }}>
            <FontAwesomeIcon icon={faUsers} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>
              {searchTerm
                ? 'No se encontraron trabajadores con los criterios de búsqueda'
                : 'No hay trabajadores registrados'}
            </p>
            <p style={{ fontSize: '14px', opacity: 0.7 }}>
              {!searchTerm && 'Crea tu primer trabajador para comenzar'}
            </p>
          </div>
        ) : (
          <div className="tasks-view-grid">
            {filteredWorkers.map(worker => (
              <div key={worker.id} className={`task-card task-card-${worker.is_active ? 'active' : 'inactive'}`}>
                <div className="task-card-header">
                  <div className="task-status-badge">
                    <span className={`status-text ${worker.is_active ? 'status-completed' : 'status-pending'}`}>
                      {worker.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="task-card-body">
                  <h3 className="task-card-title">{worker.name}</h3>
                  <div className="task-card-meta">
                    <div className="task-meta-item" title="Email" style={{ marginTop: '4px' }}>
                      <FontAwesomeIcon icon={faEnvelope} />
                      <span>{worker.email}</span>
                    </div>
                  </div>
                </div>
                <div className="task-card-actions">
                  <button className="action-btn action-edit" onClick={() => handleOpenModal(worker)}>
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Editar</span>
                  </button>
                  <button className="action-btn action-delete" onClick={() => handleDeleteWorker(worker)}>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>


      {/* Modal de confirmación para eliminar trabajador */}
      {showDeleteModal && workerToDelete && (
        <div
          className="modal-overlay"
          onClick={deleting ? undefined : cancelDeleteWorker}
          style={{ pointerEvents: deleting ? 'none' : 'auto' }}
        >
          <div
            className="modal-content alert-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto', maxWidth: '500px' }}
          >
            <div className="modal-header">
              <h2>Confirmar eliminación</h2>
              <button className="modal-close" onClick={cancelDeleteWorker} disabled={deleting}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--color-white)', lineHeight: '1.5' }}>
                ¿Estás seguro de que deseas eliminar al trabajador <strong>"{workerToDelete.name}"</strong> ({workerToDelete.email})?
              </p>
              <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--color-gray)', lineHeight: '1.5' }}>
                Esta acción no se puede deshacer. El trabajador será eliminado permanentemente y perderá acceso al sistema.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cancelDeleteWorker}
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={confirmDeleteWorker}
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

      {/* Modal para crear/editar trabajador */}
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
              <h2>{editingWorker ? 'Editar Trabajador' : 'Nuevo Trabajador'}</h2>
              <button
                className="modal-close"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-group">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Nombre completo del trabajador"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{editingWorker ? 'Nueva contraseña (opcional)' : 'Contraseña *'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingWorker}
                    minLength={8}
                    placeholder={editingWorker ? 'Dejar vacío para mantener la actual' : 'Mínimo 8 caracteres'}
                  />
                </div>

                {formData.password && (
                  <div className="form-group">
                    <label>Confirmar contraseña *</label>
                    <input
                      type="password"
                      value={formData.password_confirmation}
                      onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                      required={!!formData.password}
                      placeholder="Repite la contraseña"
                    />
                  </div>
                )}
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
                  {submitting ? 'Guardando...' : (editingWorker ? 'Guardar Cambios' : 'Crear Trabajador')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default TrabajadoresJefe;
