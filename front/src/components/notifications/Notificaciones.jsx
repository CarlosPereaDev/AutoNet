import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faBell,
  faSearch,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { processTokenFromUrl } from '../../services/authService';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../services/notificationService';
import { useToast } from '../common/Toast';
import '../styles/Dashboard.css';

function Notificaciones({ role = 'jefe' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (token) {
      processTokenFromUrl(token)
        .then(() => {
          const path = role === 'jefe' ? '/dashboard/jefe/notificaciones' : '/dashboard/trabajador/notificaciones';
          navigate(path, { replace: true });
        })
        .catch((error) => {
          console.error('Error al procesar token:', error);
          navigate('/', { replace: true });
        });
    }
  }, [token, navigate, role]);

  // Cargar notificaciones desde el backend
  const loadNotifications = async () => {
    try {
      const data = await getNotifications(false); // false para no usar caché
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadNotifications();
  }, []);

  // Polling para actualizar notificaciones automáticamente cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  const filteredNotifications = notifications.filter(notif =>
    notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notif.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_completed':
      case 'success': return faCheckCircle;
      case 'task_started':
      case 'task_assigned':
      case 'task_updated':
      case 'task_reserved':
      case 'vehicle_updated':
      case 'machinery_updated':
      case 'info': return faInfoCircle;
      case 'task_paused':
      case 'warning': return faExclamationTriangle;
      default: return faBell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'task_completed':
      case 'success': return 'success';
      case 'task_started':
      case 'task_assigned':
      case 'task_updated':
      case 'task_reserved':
      case 'vehicle_updated':
      case 'machinery_updated':
      case 'info': return 'info';
      case 'task_paused':
      case 'warning': return 'warning';
      default: return 'primary';
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n));
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })));
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      toast.error('Error al eliminar la notificación');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <section className="dashboard-welcome-section">
        <div>
          <h1 className="welcome-title">Notificaciones</h1>
          <p className="welcome-subtitle">
            {role === 'jefe'
              ? 'Recibe notificaciones sobre tareas completadas o incidencias.'
              : 'Recibe notificaciones sobre el estado de tus tareas.'}
          </p>
        </div>
      </section>

      <section className="dashboard-filters-section">
        <div className="filters-search">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Buscar notificaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="dashboard-content-section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-gray)' }}>
            <p>Cargando notificaciones...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray)' }}>
            <FontAwesomeIcon icon={faBell} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>
              {searchTerm
                ? 'No se encontraron notificaciones con los criterios de búsqueda'
                : 'No hay notificaciones'}
            </p>
          </div>
        ) : (
          <>
            {notifications.filter(n => !n.read).length > 0 && (
              <div style={{ marginBottom: '16px', textAlign: 'right' }}>
                <button
                  className="btn-secondary"
                  onClick={handleMarkAllAsRead}
                  style={{ fontSize: '14px', padding: '8px 16px' }}
                >
                  Marcar todas como leídas
                </button>
              </div>
            )}
            <div className="tasks-view-list">
              {filteredNotifications.map(notif => (
                <div key={notif.id} className={`task-card notification-card-${getNotificationColor(notif.type)} ${!notif.read ? 'notification-unread' : ''}`}>
                  <div className="task-card-header">
                    <div className="task-status-badge">
                      <FontAwesomeIcon
                        icon={getNotificationIcon(notif.type)}
                        className={`status-icon-${getNotificationColor(notif.type)}`}
                      />
                      <span className={`status-text status-${getNotificationColor(notif.type)}`}>
                        {notif.type === 'task_completed' ? 'Tarea Completada' :
                          notif.type === 'task_started' ? 'Tarea Iniciada' :
                            notif.type === 'task_assigned' ? 'Tarea Asignada' :
                              notif.type === 'task_updated' ? 'Tarea Actualizada' :
                                notif.type === 'task_reserved' ? 'Tarea Reservada' :
                                  notif.type === 'task_paused' ? 'Tarea Pausada' :
                                    notif.type === 'vehicle_updated' ? 'Vehículo Actualizado' :
                                      notif.type === 'machinery_updated' ? 'Maquinaria Actualizada' :
                                        'Notificación'}
                      </span>
                    </div>
                    {!notif.read && (
                      <div className="task-priority-badge priority-high">Nueva</div>
                    )}
                  </div>
                  <div className="task-card-body">
                    <h3 className="task-card-title">{notif.title}</h3>
                    <p className="notification-message" style={{ margin: '8px 0', color: 'var(--color-gray)', lineHeight: '1.5' }}>
                      {notif.message}
                    </p>
                    <div className="task-card-meta">
                      <div className="task-meta-item">
                        <span>{formatDate(notif.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="task-card-actions">
                    {!notif.read && (
                      <button
                        className="action-btn action-approve"
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <span>Marcar como leída</span>
                      </button>
                    )}
                    <button
                      className="action-btn action-delete"
                      onClick={() => handleDeleteNotification(notif.id)}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

export default Notificaciones;
