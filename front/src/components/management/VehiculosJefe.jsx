import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCar,
  faPlus,
  faSearch,
  faEdit,
  faTrash,
  faWrench,
  faGasPump,
  faGauge
} from '@fortawesome/free-solid-svg-icons';
import { processTokenFromUrl } from '../../services/authService';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../../services/vehicleService';
import { useToast } from '../common/Toast';
import Select from '../common/Select';
import '../styles/Dashboard.css';

function VehiculosJefe() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const toast = useToast();
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
    plateType: 'new',
    brand: '',
    model: '',
    year: '',
    current_mileage: '',
    current_fuel_level: '',
    status: 'active'
  });
  const [plateValid, setPlateValid] = useState(null);

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
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredVehicles = vehicles.filter(vehicle =>
    (vehicle.name && vehicle.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (vehicle.plate && vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (vehicle.brand && vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (vehicle.model && vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Validación de matrícula española
  const validateSpanishPlate = (plate, type) => {
    if (!plate) return false;

    // Normalizar la matrícula (mayúsculas y sin espacios extra)
    const normalized = plate.trim().toUpperCase().replace(/[\s-]/g, '');

    // Matrícula nueva (0000 BBB)
    // 4 dígitos seguidos de 3 letras (sin vocales excepto quizás en remolques, pero la norma general es sin vocales)
    // La norma real excluye vocales (A, E, I, O, U) y Ñ, Q.
    const newFormatRegex = /^[0-9]{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/;

    // Matrícula antigua (A 0000 A o A 0000 AA)
    // 1 o 2 letras provincia, 4 dígitos, 0, 1 o 2 letras serie
    const oldFormatRegex = /^[A-Z]{1,2}[0-9]{4}[A-Z]{0,2}$/;

    // Matrícula de remolque (R 0000 BBB)
    const trailerRegex = /^R[0-9]{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/;

    if (type === 'new') {
      return newFormatRegex.test(normalized);
    } else if (type === 'old') {
      return oldFormatRegex.test(normalized);
    } else {
      // Auto-detectar
      return newFormatRegex.test(normalized) || oldFormatRegex.test(normalized) || trailerRegex.test(normalized);
    }
  };

  const handlePlateChange = (e) => {
    const val = e.target.value.toUpperCase();
    setFormData({ ...formData, plate: val });
    setPlateValid(validateSpanishPlate(val, formData.plateType));
  };

  const handlePlateTypeChange = (e) => {
    const type = e.target.value;
    setFormData({ ...formData, plateType: type });
    if (formData.plate) {
      setPlateValid(validateSpanishPlate(formData.plate, type));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      plate: '',
      plateType: 'new',
      brand: '',
      model: '',
      year: '',
      current_mileage: '',
      current_fuel_level: '',
      status: 'active'
    });
    setPlateValid(null);
    setEditingVehicle(null);
    setSubmitting(false);
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name || '',
      plate: vehicle.plate || '',
      plateType: 'new', // Default, podría inferirse
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      current_mileage: vehicle.current_mileage || '',
      current_fuel_level: vehicle.current_fuel_level || '',
      status: vehicle.status || 'active'
    });
    setPlateValid(validateSpanishPlate(vehicle.plate, 'new'));
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!plateValid && formData.plate) {
        toast.warning('La matrícula parece inválida, pero se guardará.');
      }

      const vehicleData = {
        name: formData.name,
        plate: formData.plate,
        brand: formData.brand,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : null,
        current_mileage: formData.current_mileage ? parseFloat(formData.current_mileage) : 0,
        current_fuel_level: formData.current_fuel_level ? parseFloat(formData.current_fuel_level) : 0,
        status: formData.status
      };

      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, vehicleData);
        toast.success('Vehículo actualizado correctamente');
      } else {
        await createVehicle(vehicleData);
        toast.success('Vehículo creado correctamente');
      }

      await fetchVehicles();
      handleCloseModal();
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
      }

      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (vehicle) => {
    setVehicleToDelete(vehicle);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    if (deleting) return;
    setShowDeleteModal(false);
    setVehicleToDelete(null);
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;
    setDeleting(true);
    try {
      await deleteVehicle(vehicleToDelete.id);
      await fetchVehicles();
      toast.success('Vehículo eliminado correctamente');
      cancelDelete();
    } catch (error) {
      console.error('Error al eliminar vehículo:', error);
      toast.error('Error al eliminar el vehículo');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <section className="dashboard-welcome-section">
        <div>
          <h1 className="welcome-title">Gestión de Vehículos</h1>
          <p className="welcome-subtitle">
            Administra la flota de vehículos, añade nuevos registros y controla su estado.
          </p>
        </div>
        <div className="welcome-actions">
          <button className="btn-primary" onClick={handleOpenModal}>
            <FontAwesomeIcon icon={faPlus} />
            <span>Nuevo Vehículo</span>
          </button>
        </div>
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
            {!searchTerm && (
              <button
                className="btn-text"
                onClick={handleOpenModal}
                style={{ marginTop: '8px' }}
              >
                Registrar el primer vehículo
              </button>
            )}
          </div>
        ) : (
          <div className="tasks-view-grid">
            {filteredVehicles.map(vehicle => (
              <div key={vehicle.id} className={`task-card task-card-${vehicle.status || 'active'}`}>
                <div className="task-card-header">
                  <div className="task-status-badge">
                    <span className={`status-text ${vehicle.status === 'active' ? 'status-completed' :
                      vehicle.status === 'maintenance' ? 'status-warning' :
                        ''
                      }`}>
                      {vehicle.status === 'active' ? 'Activo' :
                        vehicle.status === 'maintenance' ? 'Mantenimiento' :
                          'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="task-card-body">
                  <h3 className="task-card-title">
                    {vehicle.name || `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Vehículo sin nombre'}
                  </h3>

                  {vehicle.incidents_count > 0 && (
                    <div className="task-card-description" style={{ color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FontAwesomeIcon icon={faWrench} style={{ fontSize: '12px' }} />
                      <span>{vehicle.incidents_count} incidencias</span>
                    </div>
                  )}

                  <div className="task-card-meta">
                    {vehicle.plate && (
                      <div className="task-meta-item" title="Matrícula">
                        <FontAwesomeIcon icon={faCar} />
                        <span>{vehicle.plate}</span>
                      </div>
                    )}
                    {vehicle.current_fuel_level !== null && vehicle.current_fuel_level !== undefined && (
                      <div className="task-meta-item" title="Nivel de Combustible">
                        <FontAwesomeIcon icon={faGasPump} />
                        <span>{Number(vehicle.current_fuel_level)}%</span>
                      </div>
                    )}
                    {vehicle.current_mileage !== null && vehicle.current_mileage !== undefined && (
                      <div className="task-meta-item" title="Kilometraje">
                        <FontAwesomeIcon icon={faGauge} />
                        <span>{Number(vehicle.current_mileage).toLocaleString()} km</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="task-card-actions">
                  <button
                    className="action-btn action-edit"
                    onClick={() => handleEdit(vehicle)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Editar</span>
                  </button>
                  <button
                    className="action-btn action-delete"
                    onClick={() => confirmDelete(vehicle)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal Crear/Editar */}
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
              <button
                className="modal-close"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre interno (opcional)</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Furgoneta reparto 1"
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
                    { value: 'maintenance', label: 'En mantenimiento' }
                  ]}
                />
              </div>

              <div className="form-row">
                <Select
                  label="Tipo Matrícula"
                  name="plateType"
                  value={formData.plateType}
                  onChange={handlePlateTypeChange}
                  options={[
                    { value: 'new', label: 'Europa (0000 BBB)' },
                    { value: 'old', label: 'Provincial (M 0000 AB)' }
                  ]}
                />
                <div className="form-group">
                  <label>
                    Matrícula
                    {plateValid === true && <span style={{ color: 'var(--color-success)', marginLeft: '8px' }}>✓</span>}
                    {plateValid === false && formData.plate && <span style={{ color: 'var(--color-error)', marginLeft: '8px' }}>✗</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.plate}
                    onChange={handlePlateChange}
                    placeholder={formData.plateType === 'new' ? '1234 BBC' : 'M 1234 AB'}
                    style={{
                      borderColor: plateValid === false && formData.plate ? 'var(--color-error)' :
                        plateValid === true ? 'var(--color-success)' : undefined
                    }}
                    required
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
                    placeholder="Ej. Toyota"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Modelo</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Ej. Hilux"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Año</label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="Ej. 2023"
                  />
                </div>
                <div className="form-group">
                  <label>Kilometraje (km)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.current_mileage}
                    onChange={(e) => setFormData({ ...formData, current_mileage: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Nivel de Combustible Actual (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.current_fuel_level}
                  onChange={(e) => setFormData({ ...formData, current_fuel_level: e.target.value })}
                  placeholder="0-100"
                />
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
                  {submitting ? 'Guardando...' : editingVehicle ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
            </div>
            <div style={{ padding: '20px 0' }}>
              <p>¿Estás seguro de que deseas eliminar el vehículo <strong>{vehicleToDelete?.name || vehicleToDelete?.plate}</strong>?</p>
              <p style={{ color: 'var(--color-warning)', marginTop: '8px', fontSize: '0.9rem' }}>
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={cancelDelete}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ background: 'var(--color-error)' }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default VehiculosJefe;
