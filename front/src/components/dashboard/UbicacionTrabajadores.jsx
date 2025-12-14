import React, { useEffect, useState, useRef, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faClock,
  faSearch,
  faMap,
  faList,
  faGlobe,
  faEnvelope,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { useToast } from '../common/Toast';
import { usePolling } from '../../hooks/usePolling';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/Dashboard.css';

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function UbicacionTrabajadores() {
  const toast = useToast();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const hasFitBoundsRef = useRef(false);

  const fetchWorkersLocation = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/workers-location`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al obtener ubicaciones');
      }

      const data = await response.json();
      setWorkers(data.workers || []);
      if (loading) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error al obtener ubicaciones:', error);
      if (loading) {
        toast.error(error.message || 'Error al cargar las ubicaciones de los trabajadores');
        setLoading(false);
      }
    }
  };

  // Polling cada 5 segundos para actualización en tiempo real
  usePolling(fetchWorkersLocation, 5000, []);

  // Filtrar trabajadores según búsqueda
  const filteredWorkers = React.useMemo(() => {
    return workers.filter(worker =>
      worker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [workers, searchTerm]);

  // Inicializar y actualizar mapa cuando cambian los trabajadores o el modo de vista
  useEffect(() => {
    if (mapRef.current && viewMode === 'map') {
      const workersWithLocation = filteredWorkers.filter(w => w.latitude && w.longitude);

      if (workersWithLocation.length === 0) {
        // Si hay un mapa existente, eliminarlo
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        return;
      }

      if (!mapInstanceRef.current) {
        initializeMap();
      } else {
        updateMarkers();
      }
    }

    return () => {
      // Limpiar marcadores al desmontar o cambiar de vista
      if (viewMode !== 'map' && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current.forEach(marker => {
        if (marker.popup) {
          marker.closePopup();
        }
        mapInstanceRef.current?.removeLayer(marker);
      });
      markersRef.current = [];
    };
  }, [filteredWorkers, viewMode]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    const workersWithLocation = filteredWorkers.filter(w => w.latitude && w.longitude);
    if (workersWithLocation.length === 0) return;

    // Calcular centro del mapa (promedio de todas las ubicaciones)
    const avgLat = workersWithLocation.reduce((sum, w) => sum + parseFloat(w.latitude), 0) / workersWithLocation.length;
    const avgLng = workersWithLocation.reduce((sum, w) => sum + parseFloat(w.longitude), 0) / workersWithLocation.length;

    // Crear mapa con Leaflet
    mapInstanceRef.current = L.map(mapRef.current, {
      center: [avgLat, avgLng],
      zoom: workersWithLocation.length === 1 ? 15 : 12,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true, // Allow zooming with scroll wheel
      dragging: true
    });

    // Agregar capa de OpenStreetMap con estilo oscuro
    // Agregar capa de CartoDB Dark Matter para un look minimalista y premium
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(mapInstanceRef.current);

    // Sin filtros CSS agresivos, el mapa base ya es oscuro y limpio
    const mapContainer = mapRef.current;
    if (mapContainer) {
      mapContainer.style.filter = 'none';
      mapContainer.style.borderRadius = '16px';
    }

    updateMarkers();
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !mapRef.current) return;

    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    const workersWithLocation = filteredWorkers.filter(w => w.latitude && w.longitude);

    // Crear marcadores personalizados para cada trabajador
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 24px;
        height: 24px;
        background: #14b8a6;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });

    // Crear marcadores para cada trabajador
    workersWithLocation.forEach(worker => {
      const marker = L.marker(
        [parseFloat(worker.latitude), parseFloat(worker.longitude)],
        { icon: customIcon }
      ).addTo(mapInstanceRef.current);

      // Popup con información del trabajador
      const popupContent = `
        <div style="padding: 8px; color: #1e293b; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${worker.name}</h3>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">${worker.email}</p>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">${getLastUpdateText(worker.last_location_at)}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });

    // Ajustar zoom para mostrar todos los marcadores SOLO la primera vez
    if (workersWithLocation.length > 0 && mapInstanceRef.current && !hasFitBoundsRef.current) {
      const group = new L.featureGroup(markersRef.current);
      if (group.getLayers().length > 0) {
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        hasFitBoundsRef.current = true;
      }
    }
  };


  const getLastUpdateText = (lastLocationAt) => {
    if (!lastLocationAt) return 'Sin ubicación';
    const date = new Date(lastLocationAt);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} días`;
  };

  const openMap = (worker) => {
    if (worker.latitude && worker.longitude) {
      const url = `https://www.google.com/maps?q=${worker.latitude},${worker.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <section className="dashboard-welcome-section">
        <div>
          <h1 className="welcome-title">Ubicación de Trabajadores</h1>
          <p className="welcome-subtitle">
            Visualiza la ubicación en tiempo real de tu equipo de trabajo.
          </p>
        </div>
      </section>

      <section className="dashboard-filters-section">
        <div className="filters-search">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Buscar trabajador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="view-toggles">
            <button
              className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
              title="Vista Mapa"
            >
              <FontAwesomeIcon icon={faMap} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista Lista"
            >
              <FontAwesomeIcon icon={faList} />
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-content-section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-gray)' }}>
            <p>Cargando ubicaciones...</p>
          </div>
        ) : workers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray)' }}>
            <FontAwesomeIcon icon={faMapMarkerAlt} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <p>No hay trabajadores en tu organización</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray)' }}>
            <FontAwesomeIcon icon={faSearch} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <p>No se encontraron trabajadores con ese criterio</p>
          </div>
        ) : viewMode === 'map' ? (
          <div style={{
            margin: '24px 32px 0 32px',
            position: 'relative',
            width: 'calc(100% - 64px)',
            height: 'calc(100vh - 320px)', // Adjust height to fit screen without scrolling
            minHeight: '400px',
            maxHeight: '700px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
          }}>
            {filteredWorkers.filter(w => w.latitude && w.longitude).length === 0 ? (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 1) 100%)',
                zIndex: 1
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} style={{ fontSize: '32px', opacity: 0.4, color: 'var(--color-text-tertiary)' }} />
                </div>
                <p style={{ fontSize: '16px', fontWeight: '500', opacity: 0.7 }}>No hay trabajadores con ubicación activa</p>
                <p style={{ fontSize: '13px', opacity: 0.5, marginTop: '8px' }}>Las ubicaciones se actualizarán automáticamente cuando estén disponibles</p>
              </div>
            ) : (
              <>
                <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '600px', zIndex: 0 }} />
                {filteredWorkers.filter(w => !w.latitude || !w.longitude).length > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '24px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(12px)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--color-text-secondary)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                  }}>
                    <FontAwesomeIcon icon={faInfoCircle} style={{ color: 'var(--color-primary)' }} />
                    <span>{filteredWorkers.filter(w => !w.latitude || !w.longitude).length} trabajadores sin señal GPS reciente</span>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="tasks-view-grid">
            {filteredWorkers.map(worker => (
              <div
                key={worker.id}
                className={`task-card task-card-${worker.latitude && worker.longitude ? 'active' : 'inactive'}`}
              >
                <div className="task-card-header">
                  <div className="task-status-badge">
                    <span className={`status-text ${worker.latitude && worker.longitude ? 'status-completed' : 'status-paused'}`}>
                      {worker.latitude && worker.longitude ? 'Ubicación Activa' : 'Sin Señal GPS'}
                    </span>
                  </div>
                </div>

                <div className="task-card-body">
                  <h3 className="task-card-title">{worker.name}</h3>
                  <div className="task-card-meta">
                    <div className="task-meta-item" title="Email" style={{ width: '100%' }}>
                      <FontAwesomeIcon icon={faEnvelope} />
                      <span>{worker.email}</span>
                    </div>
                    {worker.latitude && worker.longitude ? (
                      <>
                        <div className="task-meta-item" title="Última actualización" style={{ marginTop: '8px' }}>
                          <FontAwesomeIcon icon={faClock} />
                          <span>Actualizado: {getLastUpdateText(worker.last_location_at)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="task-meta-item" style={{ color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
                        <FontAwesomeIcon icon={faMapMarkerAlt} style={{ opacity: 0.5 }} />
                        <span>Esperando ubicación...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="task-card-actions">
                  {worker.latitude && worker.longitude ? (
                    <button
                      className="action-btn action-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMap(worker);
                      }}
                      title="Ver en Google Maps"
                    >
                      <FontAwesomeIcon icon={faMap} />
                      <span>Abrir Mapa</span>
                    </button>
                  ) : (
                    <div style={{ height: '32px' }}></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default UbicacionTrabajadores;

