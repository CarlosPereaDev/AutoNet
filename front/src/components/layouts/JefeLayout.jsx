import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRightFromBracket,
  faTasks,
  faCar,
  faTractor,
  faUsers,
  faChartLine,
  faBell,
  faMapMarkerAlt,
  faBars
} from '@fortawesome/free-solid-svg-icons';
import { logout, getCurrentUser } from '../../services/authService';
import logo from '../../assets/Logo.svg';
import '../styles/Dashboard.css';

function JefeLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
            className={`nav-item ${location.pathname === '/dashboard/jefe' || location.pathname === '/dashboard/jefe/' ? 'active' : ''}`}
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
            to="/dashboard/jefe/ubicacion-trabajadores"
            className={`nav-item ${location.pathname.startsWith('/dashboard/jefe/ubicacion-trabajadores') ? 'active' : ''}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            <span>Ubicación Trabajadores</span>
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
        <Outlet />
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
    </div>
  );
}

export default JefeLayout;

