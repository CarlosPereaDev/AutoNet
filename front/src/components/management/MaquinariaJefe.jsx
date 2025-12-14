import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTractor,
  faPlus,
  faSearch,
  faEdit,
  faTrash,
  faWrench,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { logout, getCurrentUser, processTokenFromUrl } from '../../services/authService';
import { getMachineries, createMachinery, updateMachinery, deleteMachinery } from '../../services/machineryService';
import { useToast } from '../common/Toast';
import Select from '../common/Select';
import '../styles/Dashboard.css';

function MaquinariaJefe() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const toast = useToast();
  const [machinery, setMachinery] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMachinery, setEditingMachinery] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [machineryToDelete, setMachineryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    brand: '',
    model: '',
    serial_number: '',
    current_hours: '',
    status: 'active'
  });

  useEffect(() => {
    if (token) {
      processTokenFromUrl(token)
        .then(() => {
          navigate('/dashboard/jefe/maquinaria', { replace: true });
        })
        .catch((error) => {
          console.error('Error al procesar token:', error);
          navigate('/', { replace: true });
        });
    }
  }, [token, navigate]);

  // Cargar maquinaria desde el backend
  const fetchMachinery = async () => {
    try {
      const data = await getMachineries(false); // false para no usar caché
      setMachinery(data.machineries || []);
    } catch (error) {
      console.error('Error al cargar maquinaria:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMachinery();
  }, []);

  // Polling para actualizar maquinaria automáticamente cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMachinery();
    }, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }, []);



  const filteredMachinery = machinery.filter(item =>
    (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.type && item.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenModal = (machineryItem = null) => {
    if (machineryItem) {
      setEditingMachinery(machineryItem);
      setFormData({
        name: machineryItem.name || '',
        type: machineryItem.type || '',
        brand: machineryItem.brand || '',
        model: machineryItem.model || '',
        serial_number: machineryItem.serial_number || '',
        current_hours: machineryItem.current_hours || '',
        status: machineryItem.status || 'active'
      });
    } else {
      setEditingMachinery(null);
      setFormData({
        name: '',
        type: '',
        brand: '',
        model: '',
        serial_number: '',
        current_hours: '',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMachinery(null);
    setSubmitting(false);
    setFormData({
      name: '',
      type: '',
      brand: '',
      model: '',
      serial_number: '',
      current_hours: '',
      status: 'active'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (submitting) return;

    // Validaciones
    if (!formData.name || formData.name.trim() === '') {
      toast.warning('El nombre de la maquinaria es obligatorio');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        type: formData.type?.trim() || null,
        brand: formData.brand?.trim() || null,
        model: formData.model?.trim() || null,
        serial_number: formData.serial_number?.trim() || null,
        current_hours: formData.current_hours ? parseFloat(formData.current_hours) : null,
        status: formData.status
      };

      let response;
      if (editingMachinery) {
        response = await updateMachinery(editingMachinery.id, submitData);
        const updatedMachinery = response?.machinery || response;
        if (updatedMachinery && updatedMachinery.id) {
          setMachinery(machinery.map(m => m.id === editingMachinery.id ? updatedMachinery : m));
          handleCloseModal();
        } else {
          await fetchMachinery();
          handleCloseModal();
        }
      } else {
        response = await createMachinery(submitData);
        const newMachinery = response?.machinery || response;
        if (newMachinery && newMachinery.id) {
          setMachinery([newMachinery, ...machinery]);
          setSubmitting(false);
          handleCloseModal();
        } else {
          await fetchMachinery();
          setSubmitting(false);
          handleCloseModal();
        }
      }
    } catch (error) {
      console.error('Error al guardar maquinaria:', error);
      let errorMessage = 'Error al guardar la maquinaria';

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

  const handleDeleteMachinery = (machineryItem) => {
    setMachineryToDelete(machineryItem);
    setShowDeleteModal(true);
  };

  const confirmDeleteMachinery = async () => {
    if (!machineryToDelete) return;

    setDeleting(true);
    try {
      await deleteMachinery(machineryToDelete.id);
      setMachinery(machinery.filter(m => m.id !== machineryToDelete.id));
      setShowDeleteModal(false);
      setMachineryToDelete(null);
    } catch (error) {
      console.error('Error al eliminar maquinaria:', error);
      toast.error('Error al eliminar la maquinaria');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteMachinery = () => {
    setShowDeleteModal(false);
    setMachineryToDelete(null);
  };

  return (
    <>
      <section className="dashboard-welcome-section">
        <div>
          <h1 className="welcome-title">Gestión de Maquinaria</h1>
          <p className="welcome-subtitle">
            Gestiona y supervisa el estado de la maquinaria de tu organización.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => handleOpenModal()}
          disabled={showModal || submitting}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Nueva Maquinaria</span>
        </button>
      </section>

      <section className="dashboard-filters-section">
        <div className="filters-search">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Buscar maquinaria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="dashboard-content-section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-gray)' }}>
            <p>Cargando maquinaria...</p>
          </div>
        ) : filteredMachinery.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray)' }}>
            <FontAwesomeIcon icon={faTractor} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>
              {searchTerm
                ? 'No se encontró maquinaria con los criterios de búsqueda'
                : 'No hay maquinaria registrada'}
            </p>
            <p style={{ fontSize: '14px', opacity: 0.7 }}>
              {!searchTerm && 'Crea tu primera maquinaria para comenzar'}
            </p>
          </div>
        ) : (
          <div className="tasks-view-grid">
            {filteredMachinery.map(item => (
              <div key={item.id} className={`task-card machinery-card-${item.status || 'active'}`}>
                <div className="task-card-header">
                  <div className="task-status-badge">
                    <span className={`status-text ${item.status === 'active' ? 'status-completed' : item.status === 'maintenance' ? 'status-warning' : 'status-pending'}`}>
                      {item.status === 'active' ? 'Activa' : item.status === 'maintenance' ? 'En Mantenimiento' : 'Inactiva'}
                    </span>
                  </div>
                </div>
                <div className="task-card-body">
                  <h3 className="task-card-title">{item.name || 'Sin nombre'}</h3>
                  <div className="task-card-meta">
                    {item.serial_number && (
                      <div className="task-meta-item" title="Serial">
                        <FontAwesomeIcon icon={faTractor} />
                        <span>#{item.serial_number}</span>
                      </div>
                    )}
                    {item.brand && item.model && (
                      <div className="task-meta-item" title="Modelo">
                        <span>{item.brand} {item.model}</span>
                      </div>
                    )}
                    {item.current_hours !== null && item.current_hours !== undefined && (
                      <div className="task-meta-item" title="Horas de uso">
                        <FontAwesomeIcon icon={faClock} />
                        <span>{Number(item.current_hours).toLocaleString()}h</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="task-card-actions">
                  <button className="action-btn action-edit" onClick={() => handleOpenModal(item)}>
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Editar</span>
                  </button>
                  <button className="action-btn action-delete" onClick={() => handleDeleteMachinery(item)}>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {/* Modal de confirmación para eliminar maquinaria */}
      {
        showDeleteModal && machineryToDelete && (
          <div
            className="modal-overlay"
            onClick={deleting ? undefined : cancelDeleteMachinery}
            style={{ pointerEvents: deleting ? 'none' : 'auto' }}
          >
            <div
              className="modal-content alert-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ pointerEvents: 'auto', maxWidth: '500px' }}
            >
              <div className="modal-header">
                <h2>Confirmar eliminación</h2>
                <button className="modal-close" onClick={cancelDeleteMachinery} disabled={deleting}>×</button>
              </div>
              <div style={{ padding: '24px' }}>
                <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--color-white)', lineHeight: '1.5' }}>
                  ¿Estás seguro de que deseas eliminar la maquinaria <strong>"{machineryToDelete.name}"</strong>?
                </p>
                <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--color-gray)', lineHeight: '1.5' }}>
                  Esta acción no se puede deshacer. La maquinaria será eliminada permanentemente.
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={cancelDeleteMachinery}
                    disabled={deleting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={confirmDeleteMachinery}
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

      {/* Modal para crear/editar maquinaria */}
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
                <h2>{editingMachinery ? 'Editar Maquinaria' : 'Nueva Maquinaria'}</h2>
                <button className="modal-close" onClick={handleCloseModal} disabled={submitting}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="task-form">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ej: Excavadora CAT 320"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo</label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder="Ej: Excavadora"
                    />
                  </div>

                  <div className="form-group">
                    <label>Número de Serie</label>
                    <input
                      type="text"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      placeholder="CAT-320-001"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Marca</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Caterpillar"
                    />
                  </div>

                  <div className="form-group">
                    <label>Modelo</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="320"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Horas actuales</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.current_hours}
                    onChange={(e) => setFormData({ ...formData, current_hours: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <Select
                  label="Estado"
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: 'active', label: 'Activo' },
                    { value: 'inactive', label: 'Inactivo' },
                    { value: 'maintenance', label: 'En Mantenimiento' }
                  ]}
                  required
                />

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
                    {submitting ? 'Guardando...' : (editingMachinery ? 'Actualizar' : 'Crear') + ' Maquinaria'}
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

export default MaquinariaJefe;

