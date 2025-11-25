import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRightFromBracket, 
  faTasks,
  faCar,
  faTractor,
  faChartLine,
  faBell,
  faBars,
  faCheckCircle,
  faClock,
  faArrowUp,
  faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import { logout, getCurrentUser, processTokenFromUrl } from '../services/authService';
import { getTrabajadorStats } from '../services/dashboardService';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import logo from '../assets/Logo.svg';
import './Dashboard.css';

function DashboardTrabajador() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();
  const token = searchParams.get('token');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    myTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    totalHoursWorked: 0,
    tasksThisMonth: 0,
    hoursTrend: 0,
    tasksTrend: 0,
    completionRate: 0,
    monthlyData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      processTokenFromUrl(token)
        .then(() => {
          navigate('/dashboard/trabajador', { replace: true });
        })
        .catch((error) => {
          console.error('Error al procesar token:', error);
          navigate('/', { replace: true });
        });
    }
  }, [token, navigate]);

  // Cargar estadísticas desde el backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        console.log('Cargando estadísticas del trabajador...');
        const data = await getTrabajadorStats();
        console.log('Datos recibidos del backend:', data);
        
        // Asegurar que todos los campos estén presentes
        setStats({
          myTasks: data.myTasks || 0,
          pendingTasks: data.pendingTasks || 0,
          completedTasks: data.completedTasks || 0,
          inProgressTasks: data.inProgressTasks || 0,
          totalHoursWorked: data.totalHoursWorked || 0,
          tasksThisMonth: data.tasksThisMonth || 0,
          hoursTrend: data.hoursTrend || 0,
          tasksTrend: data.tasksTrend || 0,
          completionRate: data.completionRate || 0,
          monthlyData: data.monthlyData || []
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        console.error('Error response:', error.response);
        // Mantener valores por defecto en caso de error
        setStats({
          myTasks: 0,
          pendingTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          totalHoursWorked: 0,
          tasksThisMonth: 0,
          hoursTrend: 0,
          tasksTrend: 0,
          completionRate: 0,
          monthlyData: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

  const taskCompletionRate = stats.completionRate || (stats.myTasks > 0 
    ? Math.round((stats.completedTasks / stats.myTasks) * 100) 
    : 0);

  // Valores animados
  const animatedMyTasks = useAnimatedNumber(stats.myTasks);
  const animatedCompletedTasks = useAnimatedNumber(stats.completedTasks);
  const animatedPendingTasks = useAnimatedNumber(stats.pendingTasks);
  const animatedInProgressTasks = useAnimatedNumber(stats.inProgressTasks);
  const animatedTotalHoursWorked = useAnimatedNumber(stats.totalHoursWorked || 0, 2000, 0, 'h');
  const animatedTaskCompletionRate = useAnimatedNumber(taskCompletionRate, 2000, 0, '%');
  const animatedTasksThisMonth = useAnimatedNumber(stats.tasksThisMonth || 0);

  // Calcular datos para gráficos
  const getChartData = () => {
    if (!stats.monthlyData || stats.monthlyData.length === 0) {
      return {
        completed: [],
        hours: [],
        maxValue: 1,
        maxHours: 1,
        months: []
      };
    }

    const maxCompleted = Math.max(...stats.monthlyData.map(d => d.completed || 0), 1);
    const maxHours = Math.max(...stats.monthlyData.map(d => d.hours || 0), 1);
    
    return {
      completed: stats.monthlyData.map(d => 
        maxCompleted > 0 ? Math.round(((d.completed || 0) / maxCompleted) * 100) : 0
      ),
      hours: stats.monthlyData.map(d => d.hours || 0),
      maxHours: maxHours,
      months: stats.monthlyData.map(d => d.month || '')
    };
  };

  const chartData = getChartData();

  return (
    <div className="dashboard-dark">
      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="dashboard-main-content">
        {/* Top Header - Solo visible en móvil */}
        <header className="dashboard-top-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <FontAwesomeIcon icon={faBars} />
          </button>
        </header>

        {/* Welcome Section */}
        <section className="dashboard-welcome-section">
          <div>
            <h1 className="welcome-title">Bienvenido, {user?.name || 'Trabajador'}</h1>
            <p className="welcome-subtitle">
              Gestiona tus tareas asignadas y actualiza información de vehículos y maquinaria.
            </p>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <section style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray)' }}>
            <p style={{ fontSize: '16px' }}>Cargando estadísticas...</p>
          </section>
        )}

        {/* KPI Cards Grid */}
        {!loading && (
        <section className="kpi-grid">
          {/* My Tasks */}
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon kpi-icon-primary">
                <FontAwesomeIcon icon={faTasks} />
              </div>
              {stats.tasksTrend !== undefined && stats.tasksTrend !== 0 && (
                <div className={`kpi-trend ${stats.tasksTrend >= 0 ? 'trend-up' : 'trend-down'}`}>
                  <FontAwesomeIcon icon={stats.tasksTrend >= 0 ? faArrowUp : faArrowDown} />
                  <span>{Math.abs(stats.tasksTrend)}%</span>
                </div>
              )}
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{animatedMyTasks}</div>
              <div className="kpi-label">Mis tareas</div>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon kpi-icon-success">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{animatedCompletedTasks}</div>
              <div className="kpi-label">Tareas completadas</div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon kpi-icon-warning">
                <FontAwesomeIcon icon={faClock} />
              </div>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{animatedPendingTasks}</div>
              <div className="kpi-label">Tareas pendientes</div>
            </div>
          </div>

          {/* In Progress */}
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon kpi-icon-info">
                <FontAwesomeIcon icon={faTasks} />
              </div>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{animatedInProgressTasks}</div>
              <div className="kpi-label">En progreso</div>
            </div>
          </div>

          {/* Hours Worked */}
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon kpi-icon-secondary">
                <FontAwesomeIcon icon={faClock} />
              </div>
              {stats.hoursTrend !== undefined && stats.hoursTrend !== 0 && (
                <div className={`kpi-trend ${stats.hoursTrend >= 0 ? 'trend-up' : 'trend-down'}`}>
                  <FontAwesomeIcon icon={stats.hoursTrend >= 0 ? faArrowUp : faArrowDown} />
                  <span>{Math.abs(stats.hoursTrend)}%</span>
                </div>
              )}
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{animatedTotalHoursWorked}</div>
              <div className="kpi-label">Horas este mes</div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon kpi-icon-success">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{animatedTaskCompletionRate}</div>
              <div className="kpi-label">Tasa de completación</div>
            </div>
          </div>
        </section>
        )}

        {/* Charts Grid */}
        {!loading && (
        <section className="charts-grid">
          {/* Task Progress - Large Chart */}
          <div className="chart-card large">
            <div className="chart-header">
              <div>
                <div className="chart-title">Progreso de mis tareas</div>
                <div className="chart-value">{animatedTaskCompletionRate}</div>
              </div>
            </div>
            <div className="chart-content">
              {stats.myTasks === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray)' }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>No tienes tareas asignadas aún</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Las estadísticas aparecerán cuando te asignen tareas</p>
                </div>
              ) : (
                <div className="chart-placeholder">
                  <div className="chart-bars">
                    {chartData.completed.length > 0 ? (
                      chartData.completed.map((height, i) => (
                        <div 
                          key={i} 
                          className="chart-bar" 
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${stats.monthlyData?.[i]?.month || ''}: ${stats.monthlyData?.[i]?.completed || 0} completadas`}
                        ></div>
                      ))
                    ) : (
                      Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="chart-bar" style={{ height: '5%', opacity: 0.3 }}></div>
                      ))
                    )}
                  </div>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-dot primary"></div>
                      <span>Completadas ({stats.completedTasks || 0})</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-dot info"></div>
                      <span>En progreso ({stats.inProgressTasks || 0})</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tasks This Month */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Tareas este mes</div>
                <div className="chart-value">{animatedTasksThisMonth}</div>
                {stats.tasksTrend !== undefined && stats.tasksTrend !== 0 && (
                  <div className={`chart-trend ${stats.tasksTrend >= 0 ? 'trend-up' : 'trend-down'}`}>
                    <FontAwesomeIcon icon={stats.tasksTrend >= 0 ? faArrowUp : faArrowDown} />
                    <span>{Math.abs(stats.tasksTrend)}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className="chart-content">
              {stats.tasksThisMonth === 0 && chartData.completed.every(c => c === 0) ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-gray)', fontSize: '12px' }}>
                  <p style={{ margin: 0 }}>No has completado tareas este mes</p>
                </div>
              ) : (
                <>
                  <div className="mini-chart">
                    <div className="mini-chart-bars">
                      {chartData.completed.length > 0 ? (
                        chartData.completed.map((height, i) => (
                          <div 
                            key={i} 
                            className="mini-bar" 
                            style={{ height: `${Math.max(height, 5)}%` }}
                            title={`${stats.monthlyData?.[i]?.completed || 0} tareas - ${chartData.months[i]}`}
                          ></div>
                        ))
                      ) : (
                        Array.from({ length: 6 }, (_, i) => (
                          <div key={i} className="mini-bar" style={{ height: '5%', opacity: 0.3 }}></div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="chart-footer-text">
                    Últimos 6 meses <a href="#">Ver historial</a>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Hours Worked */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Horas trabajadas</div>
                <div className="chart-value">{animatedTotalHoursWorked}</div>
                {stats.hoursTrend !== undefined && stats.hoursTrend !== 0 && (
                  <div className={`chart-trend ${stats.hoursTrend >= 0 ? 'trend-up' : 'trend-down'}`}>
                    <FontAwesomeIcon icon={stats.hoursTrend >= 0 ? faArrowUp : faArrowDown} />
                    <span>{Math.abs(stats.hoursTrend)}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className="chart-content">
              {stats.totalHoursWorked === 0 && chartData.hours.every(h => h === 0) ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-gray)', fontSize: '12px' }}>
                  <p style={{ margin: 0 }}>No hay horas registradas este mes</p>
                </div>
              ) : (
                <>
                  <div className="mini-chart">
                    <div className="mini-chart-line">
                      <svg className="line-chart" viewBox="0 0 200 100" preserveAspectRatio="none">
                        {chartData.hours.length > 0 && chartData.maxHours > 0 ? (
                          <polyline
                            points={chartData.hours.map((hours, i) => {
                              const x = (i / (chartData.hours.length - 1 || 1)) * 200;
                              const y = 100 - (hours / chartData.maxHours) * 90;
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        ) : (
                          <polyline
                            points="0,100 200,100"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            opacity="0.3"
                          />
                        )}
                      </svg>
                    </div>
                  </div>
                  <div className="chart-footer-text">
                    Este mes: {stats.totalHoursWorked || 0}h {stats.hoursTrend !== undefined && stats.hoursTrend !== 0 && (
                      <span style={{ color: stats.hoursTrend >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                        ({stats.hoursTrend >= 0 ? '+' : ''}{stats.hoursTrend}% vs mes anterior)
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
        )}
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
    </div>
  );
}

export default DashboardTrabajador;
