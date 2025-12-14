import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars,
    faBell,
    faUser,
    faRightFromBracket,
    faCog
} from '@fortawesome/free-solid-svg-icons';
import { logout, getCurrentUser } from '../../services/authService';
import logo from '../../assets/Logo.svg';
import '../styles/Dashboard.css';

function Navbar({ toggleSidebar, role }) {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const notificationsPath = role === 'jefe' ? '/dashboard/jefe/notificaciones' : '/dashboard/trabajador/notificaciones';

    return (
        <nav className="dashboard-navbar">
            <div className="navbar-left">
                <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle Sidebar">
                    <FontAwesomeIcon icon={faBars} />
                </button>
                <div className="navbar-brand-mobile">
                    <img src={logo} alt="AutoNet" className="navbar-logo" />
                    <span className="navbar-title">AutoNet</span>
                </div>
            </div>

            <div className="navbar-right">
                {/* Notifications */}
                <Link to={notificationsPath} className="navbar-action-btn" title="Notificaciones">
                    <FontAwesomeIcon icon={faBell} />
                    {/* <span className="notification-badge"></span> */}
                </Link>

                {/* User Profile */}
                <div className="navbar-profile" ref={profileMenuRef}>
                    <button
                        className="navbar-profile-btn"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div className="user-avatar-small">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="user-name-small">{user?.name?.split(' ')[0] || 'Usuario'}</span>
                    </button>

                    {showProfileMenu && (
                        <div className="profile-dropdown">
                            <div className="dropdown-header">
                                <div className="dropdown-user-name">{user?.name}</div>
                                <div className="dropdown-user-role">{role === 'jefe' ? 'Jefe' : 'Trabajador'}</div>
                            </div>
                            <div className="dropdown-divider"></div>
                            {/* 
              <Link to="/profile" className="dropdown-item">
                <FontAwesomeIcon icon={faUser} />
                <span>Mi Perfil</span>
              </Link>
               */}
                            <button onClick={handleLogout} className="dropdown-item danger">
                                <FontAwesomeIcon icon={faRightFromBracket} />
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
