import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faRightFromBracket,
    faTasks,
    faCar,
    faTractor,
    faChartLine,
    faBell,
    faBars
} from '@fortawesome/free-solid-svg-icons';
import { logout, getCurrentUser } from '../../services/authService';
import logo from '../../assets/Logo.svg';
import '../styles/Dashboard.css';

function TrabajadorLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getCurrentUser();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
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

                <Outlet />
            </div>

            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
        </div>
    );
}

export default TrabajadorLayout;
