import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRightFromBracket,
  faBuilding,
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faUsers,
  faUserTie,
  faTimes,
  faBars,
  faEnvelope,
  faShield,
  faChevronDown,
  faChevronUp,
  faExclamationTriangle,
  faCheckCircle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { logout, getCurrentUser } from '../services/authService';
import { getAllOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../services/organizationService';
import { getAllUsers, createUser, updateUser, deleteUser } from '../services/userAdminService';
import { getOrganizations } from '../services/organizationService';
import logo from '../assets/Logo.svg';
import './Dashboard.css';

function SuperUsuario() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('organizations'); // 'organizations' o 'users'
  
  // Estados para organizaciones
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [searchTermOrgs, setSearchTermOrgs] = useState('');
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState(null);
  const [orgFormData, setOrgFormData] = useState({ name: '' });
  
  // Estados para usuarios
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTermUsers, setSearchTermUsers] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'trabajador',
    organization_id: ''
  });
  const [availableOrganizations, setAvailableOrganizations] = useState([]);
  const [expandedOrgs, setExpandedOrgs] = useState(new Set());
  
  // Estados para modales de alerta y confirmación
  const [alertModal, setAlertModal] = useState({ show: false, message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });

  useEffect(() => {
    if (activeTab === 'organizations') {
      loadOrganizations();
    } else {
      loadUsers();
      loadAvailableOrganizations();
    }
  }, [activeTab]);

  const showAlert = (message, type = 'error') => {
    setAlertModal({ show: true, message, type });
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ show: true, message, onConfirm });
  };

  const closeAlert = () => {
    setAlertModal({ show: false, message: '', type: 'error' });
  };

  const closeConfirm = () => {
    setConfirmModal({ show: false, message: '', onConfirm: null });
  };

  const handleConfirm = () => {
    if (confirmModal.onConfirm) {
      confirmModal.onConfirm();
    }
    closeConfirm();
  };

  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const data = await getAllOrganizations();
      setOrganizations(data.organizations || []);
    } catch (error) {
      console.error('Error al cargar organizaciones:', error);
      showAlert('Error al cargar las organizaciones', 'error');
    } finally {
      setLoadingOrgs(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await getAllUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      showAlert('Error al cargar los usuarios', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAvailableOrganizations = async () => {
    try {
      const data = await getOrganizations();
      setAvailableOrganizations(data.organizations || []);
    } catch (error) {
      console.error('Error al cargar organizaciones:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    if (sidebarOpen) {
      const handleClickOutside = (e) => {
        if (window.innerWidth < 768 && !e.target.closest('.dashboard-sidebar') && !e.target.closest('.sidebar-toggle')) {
          setSidebarOpen(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sidebarOpen]);

  // Funciones para organizaciones
  const handleOpenOrgModal = (organization = null) => {
    if (organization) {
      setEditingOrganization(organization);
      setOrgFormData({ name: organization.name || '' });
    } else {
      setEditingOrganization(null);
      setOrgFormData({ name: '' });
    }
    setShowOrgModal(true);
  };

  const handleCloseOrgModal = () => {
    setShowOrgModal(false);
    setEditingOrganization(null);
    setOrgFormData({ name: '' });
  };

  const handleSubmitOrg = async (e) => {
    e.preventDefault();
    if (!orgFormData.name || orgFormData.name.trim() === '') {
      showAlert('El nombre de la organización es obligatorio', 'error');
      return;
    }
    try {
      if (editingOrganization) {
        await updateOrganization(editingOrganization.id, { name: orgFormData.name.trim() });
      } else {
        await createOrganization({ name: orgFormData.name.trim() });
      }
      await loadOrganizations();
      handleCloseOrgModal();
      showAlert(editingOrganization ? 'Organización actualizada correctamente' : 'Organización creada correctamente', 'success');
      // Recargar usuarios también si están en la pestaña de usuarios
      if (activeTab === 'users') {
        await loadUsers();
      }
    } catch (error) {
      console.error('Error al guardar organización:', error);
      let errorMessage = 'Error al guardar la organización';
      if (error.response?.data) {
        if (error.response.data.errors) {
          const errors = error.response.data.errors;
          const errorMessages = Object.values(errors).flat();
          errorMessage = errorMessages.join('\n');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      showAlert(errorMessage, 'error');
    }
  };

  const handleDeleteOrg = async (organizationId) => {
    showConfirm(
      '¿Estás seguro de que deseas eliminar esta organización? Esta acción no se puede deshacer.',
      async () => {
        try {
          await deleteOrganization(organizationId);
          await loadOrganizations();
          showAlert('Organización eliminada correctamente', 'success');
          // Recargar usuarios también si están en la pestaña de usuarios
          if (activeTab === 'users') {
            await loadUsers();
          }
        } catch (error) {
          console.error('Error al eliminar organización:', error);
          const errorMessage = error.response?.data?.message || 'Error al eliminar la organización';
          showAlert(errorMessage, 'error');
        }
      }
    );
  };

  // Funciones para usuarios
  const handleOpenUserModal = (userData = null) => {
    if (userData) {
      setEditingUser(userData);
      setUserFormData({
        name: userData.name || '',
        email: userData.email || '',
        password: '',
        password_confirmation: '',
        role: userData.role || 'trabajador',
        organization_id: userData.organization_id ? String(userData.organization_id) : ''
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'trabajador',
        organization_id: ''
      });
    }
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setUserFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'trabajador',
      organization_id: ''
    });
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    
    if (!userFormData.name || userFormData.name.trim() === '') {
      showAlert('El nombre es obligatorio', 'error');
      return;
    }
    if (!userFormData.email || userFormData.email.trim() === '') {
      showAlert('El email es obligatorio', 'error');
      return;
    }
    if (!editingUser && (!userFormData.password || userFormData.password.length < 8)) {
      showAlert('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }
    if (userFormData.password && userFormData.password !== userFormData.password_confirmation) {
      showAlert('Las contraseñas no coinciden', 'error');
      return;
    }
    if (userFormData.role !== 'admin' && !userFormData.organization_id) {
      showAlert('Debes seleccionar una organización para usuarios jefe y trabajador', 'error');
      return;
    }

    try {
      const submitData = {
        name: userFormData.name.trim(),
        email: userFormData.email.trim(),
        role: userFormData.role,
        organization_id: userFormData.role === 'admin' ? null : (userFormData.organization_id ? parseInt(userFormData.organization_id) : null)
      };

      if (!editingUser || (editingUser && userFormData.password)) {
        submitData.password = userFormData.password;
        submitData.password_confirmation = userFormData.password_confirmation;
      }

      if (editingUser) {
        await updateUser(editingUser.id, submitData);
      } else {
        await createUser(submitData);
      }

      await loadUsers();
      handleCloseUserModal();
      showAlert(editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente', 'success');
      // Recargar organizaciones también si están en la pestaña de organizaciones
      if (activeTab === 'organizations') {
        await loadOrganizations();
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      let errorMessage = 'Error al guardar el usuario';
      if (error.response?.data) {
        if (error.response.data.errors) {
          const errors = error.response.data.errors;
          const errorMessages = Object.values(errors).flat();
          errorMessage = errorMessages.join('\n');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      showAlert(errorMessage, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    showConfirm(
      '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.',
      async () => {
        try {
          await deleteUser(userId);
          await loadUsers();
          showAlert('Usuario eliminado correctamente', 'success');
          // Recargar organizaciones también si están en la pestaña de organizaciones
          if (activeTab === 'organizations') {
            await loadOrganizations();
          }
        } catch (error) {
          console.error('Error al eliminar usuario:', error);
          const errorMessage = error.response?.data?.message || 'Error al eliminar el usuario';
          showAlert(errorMessage, 'error');
        }
      }
    );
  };

  const getRoleLabel = (role) => {
    const labels = {
      'admin': 'Administrador',
      'jefe': 'Jefe',
      'trabajador': 'Trabajador'
    };
    return labels[role] || role;
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return faShield;
    if (role === 'jefe') return faUserTie;
    return faUsers;
  };

  const filteredOrganizations = organizations.filter(org => 
    org.name?.toLowerCase().includes(searchTermOrgs.toLowerCase())
  );

  const toggleOrgExpansion = (orgId) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId);
    } else {
      newExpanded.add(orgId);
    }
    setExpandedOrgs(newExpanded);
  };

  // Agrupar usuarios por organización
  const usersByOrganization = {};
  const usersWithoutOrg = [];
  
  users.forEach(u => {
    if (u.organization_id && u.organization) {
      const orgId = u.organization_id;
      if (!usersByOrganization[orgId]) {
        usersByOrganization[orgId] = {
          organization: u.organization,
          users: []
        };
      }
      usersByOrganization[orgId].users.push(u);
    } else {
      usersWithoutOrg.push(u);
    }
  });

  // Filtrar usuarios según búsqueda
  const filterUsersBySearch = (userList) => {
    return userList.filter(u => 
      u.name?.toLowerCase().includes(searchTermUsers.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTermUsers.toLowerCase())
    );
  };

  // Filtrar organizaciones según búsqueda
  const filteredOrganizationsForUsers = Object.keys(usersByOrganization)
    .filter(orgId => {
      const orgData = usersByOrganization[orgId];
      const orgName = orgData.organization.name.toLowerCase();
      const hasMatchingUsers = orgData.users.some(u => 
        u.name?.toLowerCase().includes(searchTermUsers.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTermUsers.toLowerCase())
      );
      return orgName.includes(searchTermUsers.toLowerCase()) || hasMatchingUsers;
    })
    .map(orgId => ({
      id: parseInt(orgId),
      ...usersByOrganization[orgId]
    }));

  const filteredUsersWithoutOrg = filterUsersBySearch(usersWithoutOrg);

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
          <div 
            className={`nav-item ${activeTab === 'organizations' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizations')}
            style={{ cursor: 'pointer' }}
          >
            <FontAwesomeIcon icon={faBuilding} />
            <span>Organizaciones</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{ cursor: 'pointer' }}
          >
            <FontAwesomeIcon icon={faUsers} />
            <span>Usuarios</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'Administrador'}</div>
              <div className="user-role">Super Usuario</div>
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

        {activeTab === 'organizations' ? (
          <>
            <section className="dashboard-welcome-section">
              <div>
                <h1 className="welcome-title">Gestión de Organizaciones</h1>
                <p className="welcome-subtitle">
                  Administra todas las organizaciones del sistema, crea nuevas, edita o elimina existentes.
                </p>
              </div>
              <button className="btn-primary" onClick={() => handleOpenOrgModal()}>
                <FontAwesomeIcon icon={faPlus} />
                <span>Nueva Organización</span>
              </button>
            </section>

            <section className="dashboard-filters-section">
              <div className="filters-search">
                <div className="search-box">
                  <FontAwesomeIcon icon={faSearch} />
                  <input 
                    type="text" 
                    placeholder="Buscar organizaciones..." 
                    value={searchTermOrgs}
                    onChange={(e) => setSearchTermOrgs(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="dashboard-content-section">
              {loadingOrgs ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Cargando organizaciones...
                </div>
              ) : filteredOrganizations.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  {searchTermOrgs ? 'No se encontraron organizaciones con ese criterio de búsqueda' : 'No hay organizaciones registradas'}
                </div>
              ) : (
                <div className="tasks-list">
                  {filteredOrganizations.map(org => (
                    <div key={org.id} className="task-card">
                      <div className="task-card-header">
                        <div className="task-status-badge">
                          <FontAwesomeIcon icon={faBuilding} className="status-icon-primary" />
                          <span className="status-text status-completed">Activa</span>
                        </div>
                      </div>
                      <div className="task-card-body">
                        <h3 className="task-card-title">{org.name}</h3>
                        <div className="task-card-meta">
                          <div className="task-meta-item">
                            <FontAwesomeIcon icon={faUsers} />
                            <span>{org.total_users || 0} {org.total_users === 1 ? 'usuario' : 'usuarios'}</span>
                          </div>
                          <div className="task-meta-item">
                            <FontAwesomeIcon icon={faUserTie} />
                            <span>{org.total_workers || 0} {org.total_workers === 1 ? 'trabajador' : 'trabajadores'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="task-card-actions">
                        <button className="action-btn action-edit" onClick={() => handleOpenOrgModal(org)}>
                          <FontAwesomeIcon icon={faEdit} />
                          <span>Editar</span>
                        </button>
                        <button className="action-btn action-delete" onClick={() => handleDeleteOrg(org.id)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <section className="dashboard-welcome-section">
              <div>
                <h1 className="welcome-title">Gestión de Usuarios</h1>
                <p className="welcome-subtitle">
                  Administra todos los usuarios del sistema, crea nuevos, edita o elimina existentes.
                </p>
              </div>
              <button className="btn-primary" onClick={() => handleOpenUserModal()}>
                <FontAwesomeIcon icon={faPlus} />
                <span>Nuevo Usuario</span>
              </button>
            </section>

            <section className="dashboard-filters-section">
              <div className="filters-search">
                <div className="search-box">
                  <FontAwesomeIcon icon={faSearch} />
                  <input 
                    type="text" 
                    placeholder="Buscar usuarios..." 
                    value={searchTermUsers}
                    onChange={(e) => setSearchTermUsers(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="dashboard-content-section">
              {loadingUsers ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Cargando usuarios...
                </div>
              ) : filteredOrganizationsForUsers.length === 0 && filteredUsersWithoutOrg.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  {searchTermUsers ? 'No se encontraron usuarios con ese criterio de búsqueda' : 'No hay usuarios registrados'}
                </div>
              ) : (
                <div className="tasks-list">
                  {/* Mostrar organizaciones con sus usuarios */}
                  {filteredOrganizationsForUsers.map(orgData => {
                    const isExpanded = expandedOrgs.has(orgData.id);
                    const orgUsers = filterUsersBySearch(orgData.users);
                    
                    return (
                      <div key={orgData.id} className="task-card">
                        <div className="task-card-header">
                          <div className="task-status-badge">
                            <FontAwesomeIcon icon={faBuilding} className="status-icon-primary" />
                            <span className="status-text status-completed">{orgData.organization.name}</span>
                          </div>
                          {orgUsers.length > 0 && (
                            <button
                              onClick={() => toggleOrgExpansion(orgData.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '14px',
                                transition: 'color 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-light)'}
                              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
                            >
                              <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                              <span>{isExpanded ? 'Ocultar' : 'Ver'} usuarios ({orgUsers.length})</span>
                            </button>
                          )}
                        </div>
                        <div className="task-card-body">
                          <div className="task-card-meta">
                            <div className="task-meta-item">
                              <FontAwesomeIcon icon={faUsers} />
                              <span>{orgUsers.length} {orgUsers.length === 1 ? 'usuario' : 'usuarios'}</span>
                            </div>
                          </div>
                          
                          {isExpanded && orgUsers.length > 0 && (
                            <div className="user-expanded-section">
                              <div className="user-list-container">
                                {orgUsers.map(u => (
                                  <div key={u.id} className="user-item-card">
                                    <div className="user-item-info">
                                      <div className="user-item-header">
                                        <FontAwesomeIcon icon={getRoleIcon(u.role)} className="user-item-icon" />
                                        <span className="user-item-name">{u.name}</span>
                                        <span className={`user-role-badge ${u.role}`}>
                                          {getRoleLabel(u.role)}
                                        </span>
                                      </div>
                                      <div className="user-item-email">
                                        <FontAwesomeIcon icon={faEnvelope} />
                                        <span>{u.email}</span>
                                      </div>
                                    </div>
                                    <div className="user-item-actions">
                                      <button 
                                        className="action-btn action-edit" 
                                        onClick={() => handleOpenUserModal(u)}
                                        style={{ padding: '8px 14px', fontSize: '13px' }}
                                      >
                                        <FontAwesomeIcon icon={faEdit} />
                                        <span>Editar</span>
                                      </button>
                                      {u.id !== user?.id && (
                                        <button 
                                          className="action-btn action-delete" 
                                          onClick={() => handleDeleteUser(u.id)}
                                          style={{ padding: '8px 12px' }}
                                        >
                                          <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {isExpanded && orgUsers.length === 0 && (
                            <div style={{ 
                              marginTop: '20px', 
                              paddingTop: '20px', 
                              borderTop: '1px solid rgba(148, 163, 184, 0.08)',
                              textAlign: 'center',
                              color: 'var(--color-text-secondary)',
                              fontSize: '14px'
                            }}>
                              No hay usuarios que coincidan con la búsqueda
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Mostrar usuarios sin organización (admins) */}
                  {filteredUsersWithoutOrg.length > 0 && (
                    <div className="task-card">
                      <div className="task-card-header">
                        <div className="task-status-badge">
                          <FontAwesomeIcon icon={faShield} className="status-icon-primary" />
                          <span className="status-text status-completed">Sin Organización</span>
                        </div>
                      </div>
                      <div className="task-card-body">
                        <div className="task-card-meta">
                          <div className="task-meta-item">
                            <FontAwesomeIcon icon={faUsers} />
                            <span>{filteredUsersWithoutOrg.length} {filteredUsersWithoutOrg.length === 1 ? 'usuario' : 'usuarios'}</span>
                          </div>
                        </div>
                        
                        <div className="user-expanded-section">
                          <div className="user-list-container">
                            {filteredUsersWithoutOrg.map(u => (
                              <div key={u.id} className="user-item-card">
                                <div className="user-item-info">
                                  <div className="user-item-header">
                                    <FontAwesomeIcon icon={getRoleIcon(u.role)} className="user-item-icon" />
                                    <span className="user-item-name">{u.name}</span>
                                    <span className={`user-role-badge ${u.role}`}>
                                      {getRoleLabel(u.role)}
                                    </span>
                                  </div>
                                  <div className="user-item-email">
                                    <FontAwesomeIcon icon={faEnvelope} />
                                    <span>{u.email}</span>
                                  </div>
                                </div>
                                <div className="user-item-actions">
                                  <button 
                                    className="action-btn action-edit" 
                                    onClick={() => handleOpenUserModal(u)}
                                    style={{ padding: '8px 14px', fontSize: '13px' }}
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                    <span>Editar</span>
                                  </button>
                                  {u.id !== user?.id && (
                                    <button 
                                      className="action-btn action-delete" 
                                      onClick={() => handleDeleteUser(u.id)}
                                      style={{ padding: '8px 12px' }}
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Modal para crear/editar organización */}
      {showOrgModal && (
        <div className="modal-overlay" onClick={handleCloseOrgModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingOrganization ? 'Editar Organización' : 'Nueva Organización'}</h2>
              <button className="modal-close" onClick={handleCloseOrgModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleSubmitOrg} className="task-form">
              <div className="form-group">
                <label>Nombre de la organización *</label>
                <input
                  type="text"
                  value={orgFormData.name}
                  onChange={(e) => setOrgFormData({...orgFormData, name: e.target.value})}
                  required
                  placeholder="Nombre de la organización"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseOrgModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingOrganization ? 'Guardar Cambios' : 'Crear Organización'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para crear/editar usuario */}
      {showUserModal && (
        <div className="modal-overlay" onClick={handleCloseUserModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button className="modal-close" onClick={handleCloseUserModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleSubmitUser} className="task-form">
              <div className="form-group">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                  required
                  placeholder="Nombre completo del usuario"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                  required
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rol *</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setUserFormData({
                        ...userFormData,
                        role: newRole,
                        organization_id: newRole === 'admin' ? '' : userFormData.organization_id
                      });
                    }}
                    required
                  >
                    <option value="trabajador">Trabajador</option>
                    <option value="jefe">Jefe</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                {userFormData.role !== 'admin' && (
                  <div className="form-group">
                    <label>Organización *</label>
                    <select
                      value={userFormData.organization_id}
                      onChange={(e) => setUserFormData({...userFormData, organization_id: e.target.value})}
                      required={userFormData.role !== 'admin'}
                    >
                      <option value="">Seleccionar organización</option>
                      {availableOrganizations.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña *'}</label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                    required={!editingUser}
                    minLength={8}
                    placeholder={editingUser ? 'Dejar vacío para mantener la actual' : 'Mínimo 8 caracteres'}
                  />
                </div>

                {userFormData.password && (
                  <div className="form-group">
                    <label>Confirmar contraseña *</label>
                    <input
                      type="password"
                      value={userFormData.password_confirmation}
                      onChange={(e) => setUserFormData({...userFormData, password_confirmation: e.target.value})}
                      required={!!userFormData.password}
                      placeholder="Repite la contraseña"
                    />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseUserModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Alerta */}
      {alertModal.show && (
        <div className="modal-overlay" onClick={closeAlert}>
          <div className="modal-content alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FontAwesomeIcon 
                  icon={alertModal.type === 'success' ? faCheckCircle : alertModal.type === 'info' ? faInfoCircle : faExclamationTriangle} 
                  style={{ 
                    fontSize: '24px',
                    color: alertModal.type === 'success' ? 'var(--color-success)' : alertModal.type === 'info' ? 'var(--color-info)' : 'var(--color-error)'
                  }} 
                />
                <h2 style={{ margin: 0 }}>
                  {alertModal.type === 'success' ? 'Éxito' : alertModal.type === 'info' ? 'Información' : 'Error'}
                </h2>
              </div>
              <button className="modal-close" onClick={closeAlert}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ 
                margin: 0, 
                color: 'var(--color-text-primary)',
                fontSize: '15px',
                lineHeight: '1.6',
                whiteSpace: 'pre-line'
              }}>
                {alertModal.message}
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={closeAlert}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {confirmModal.show && (
        <div className="modal-overlay" onClick={closeConfirm}>
          <div className="modal-content alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FontAwesomeIcon 
                  icon={faExclamationTriangle} 
                  style={{ 
                    fontSize: '24px',
                    color: 'var(--color-warning)'
                  }} 
                />
                <h2 style={{ margin: 0 }}>Confirmar acción</h2>
              </div>
              <button className="modal-close" onClick={closeConfirm}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ 
                margin: 0, 
                color: 'var(--color-text-primary)',
                fontSize: '15px',
                lineHeight: '1.6'
              }}>
                {confirmModal.message}
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeConfirm}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleConfirm} style={{ background: 'var(--color-error)' }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperUsuario;
