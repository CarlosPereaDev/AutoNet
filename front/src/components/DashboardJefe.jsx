import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRightFromBracket, 
  faTasks,
  faCar,
  faTractor,
  faUsers,
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faChartLine,
  faBell,
  faArrowUp,
  faArrowDown,
  faBars,
  faWrench,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { logout, getCurrentUser, processTokenFromUrl } from '../services/authService';
import { getJefeStats } from '../services/dashboardService';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import logo from '../assets/Logo.svg';
import './Dashboard.css';
import './ChartStyles.css'; // Importar estilos del gráfico mejorado

function DashboardJefe() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();
  const token = searchParams.get('token');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    totalVehicles: 0,
    totalMachinery: 0,
    totalWorkers: 0,
    activeWorkers: 0,
    activeWorkSessions: 0,
    pendingMaintenance: 0,
    totalHoursWorked: 0,
    productivityRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('12months');

  useEffect(() => {
    if (token) {
      processTokenFromUrl(token)
        .then(() => {
          navigate('/dashboard/jefe', { replace: true });
        })
        .catch((error) => {
          console.error('Error al procesar token:', error);
          navigate('/', { replace: true });
        });
    }
  }, [token, navigate]);

  // Cargar estadísticas desde el backend
  const fetchStats = async () => {
    try {
      const data = await getJefeStats(false, selectedPeriod); // false para no usar caché y obtener datos actualizados
      setStats(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStats();
  }, [selectedPeriod]); // Recargar cuando cambie el período

  // Polling para actualizar estadísticas automáticamente cada 5 segundos (igual que las tareas)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Cerrar sidebar al hacer clic fuera en móvil
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

  const taskCompletionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  // Valores animados
  const animatedTotalTasks = useAnimatedNumber(stats.totalTasks);
  const animatedCompletedTasks = useAnimatedNumber(stats.completedTasks);
  const animatedPendingTasks = useAnimatedNumber(stats.pendingTasks);
  const animatedTotalVehicles = useAnimatedNumber(stats.totalVehicles);
  const animatedTotalMachinery = useAnimatedNumber(stats.totalMachinery);
  const animatedTotalWorkers = useAnimatedNumber(stats.totalWorkers);
  const animatedActiveWorkers = useAnimatedNumber(stats.activeWorkers || 0);
  const animatedPendingMaintenance = useAnimatedNumber(stats.pendingMaintenance);
  const animatedProductivityRate = useAnimatedNumber(stats.productivityRate, 2000, 1, '%');
  const animatedTaskCompletionRate = useAnimatedNumber(taskCompletionRate, 2000, 0, '%');
  const animatedTotalHoursWorked = useAnimatedNumber(stats.totalHoursWorked || 0, 2000, 0, 'h');
  const animatedActiveWorkSessions = useAnimatedNumber(stats.activeWorkSessions || 0);

  // Calcular datos para gráficos
  const getChartData = () => {
    if (!stats.monthlyData || stats.monthlyData.length === 0) {
      return {
        completed: [],
        inProgress: [],
        hours: [],
        maxValue: 1
      };
    }

    const maxValue = stats.maxChartValue || 1;
    
    return {
      completed: stats.monthlyData.map(d => 
        maxValue > 0 ? Math.round((d.completed / maxValue) * 100) : 0
      ),
      inProgress: stats.monthlyData.map(d => 
        maxValue > 0 ? Math.round((d.in_progress / maxValue) * 100) : 0
      ),
      hours: stats.monthlyData.map(d => d.hours || 0),
      maxHours: Math.max(...stats.monthlyData.map(d => d.hours || 0), 1),
      labels: stats.monthlyData.map(d => d.label || d.month || '')
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
            to="/dashboard/jefe" 
            className={`nav-item ${location.pathname === '/dashboard/jefe' ? 'active' : ''}`}
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
            <h1 className="welcome-title">Bienvenido, {user?.name || 'Jefe'}</h1>
            <p className="welcome-subtitle">
              Mide el rendimiento de tu organización y supervisa el estado de tus recursos.
            </p>
          </div>
          <div className="welcome-actions">
            <button className="btn-secondary">Exportar datos ↓</button>
            <button className="btn-primary">Crear reporte</button>
          </div>
        </section>

        {/* KPI Cards Grid */}
        <section className="kpi-grid">
          {/* Total Tasks */}
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
              <div className="kpi-value">{animatedTotalTasks}</div>
              <div className="kpi-label">Tareas totales</div>
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

          {/* Vehicles */}
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon kpi-icon-info">
                <FontAwesomeIcon icon={faCar} />
              </div>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{animatedTotalVehicles}</div>
              <div className="kpi-label">Vehículos</div>
            </div>
          </div>

          {/* Machinery */}
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon kpi-icon-secondary">
                <FontAwesomeIcon icon={faTractor} />
              </div>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{animatedTotalMachinery}</div>
              <div className="kpi-label">Maquinaria</div>
            </div>
          </div>

          {/* Workers */}
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon kpi-icon-success">
                <FontAwesomeIcon icon={faUsers} />
              </div>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{animatedTotalWorkers}</div>
              <div className="kpi-label">Trabajadores</div>
              {stats.totalWorkers > 0 && (
                <div className="kpi-sublabel" style={{ marginTop: '4px', fontSize: '12px', color: 'var(--color-primary)' }}>
                  {animatedActiveWorkers} activos
                </div>
              )}
            </div>
          </div>

          {/* Pending Maintenance */}
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon kpi-icon-warning">
                <FontAwesomeIcon icon={faWrench} />
              </div>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{animatedPendingMaintenance}</div>
              <div className="kpi-label">Mantenimientos pendientes</div>
            </div>
          </div>

          {/* Productivity Rate */}
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon kpi-icon-primary">
                <FontAwesomeIcon icon={faChartBar} />
              </div>
              {stats.productivityTrend !== undefined && stats.productivityTrend !== 0 && (
                <div className={`kpi-trend ${stats.productivityTrend >= 0 ? 'trend-up' : 'trend-down'}`}>
                  <FontAwesomeIcon icon={stats.productivityTrend >= 0 ? faArrowUp : faArrowDown} />
                  <span>{Math.abs(stats.productivityTrend)}%</span>
                </div>
              )}
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{animatedProductivityRate}</div>
              <div className="kpi-label">Tasa de productividad</div>
            </div>
          </div>
        </section>

        {/* Charts Grid */}
        <section className="charts-grid">
          {/* Task Progress - Large Chart */}
          <div className="chart-card large">
            <div className="chart-header">
              <div>
                <div className="chart-title">Progreso de tareas</div>
                <div className="chart-value">{animatedTaskCompletionRate}</div>
                {stats.tasksTrend !== undefined && stats.tasksTrend !== 0 && (
                  <div className={`chart-trend ${stats.tasksTrend >= 0 ? 'trend-up' : 'trend-down'}`}>
                    <FontAwesomeIcon icon={stats.tasksTrend >= 0 ? faArrowUp : faArrowDown} />
                    <span>{Math.abs(stats.tasksTrend)}%</span>
                  </div>
                )}
              </div>
              <select 
                className="chart-select"
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  setLoading(true);
                }}
              >
                <option value="7days">Últimos 7 días</option>
                <option value="4weeks">Últimas 4 semanas</option>
                <option value="3months">Últimos 3 meses</option>
                <option value="6months">Últimos 6 meses</option>
                <option value="12months">Últimos 12 meses</option>
              </select>
            </div>
            <div className="chart-content">
              {stats.totalTasks === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray)' }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>No hay tareas registradas aún</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Las estadísticas aparecerán cuando crees tareas</p>
                </div>
              ) : (
                <div className="chart-container">
                  <div className="chart-bars-area">
                    {stats.monthlyData && stats.monthlyData.length > 0 ? (
                      stats.monthlyData.map((data, i) => {
                        // Calcular totales y proporciones
                        const total = (data.completed || 0) + (data.in_progress || 0);
                        const maxTotal = Math.max(...stats.monthlyData.map(d => (d.completed || 0) + (d.in_progress || 0)), 1);
                        
                        // Altura de la barra (mínimo 4% para que sea visible si es muy pequeña pero tiene datos, o si es 0 se ve la base)
                        // Si el total es 0, altura es 0 (o un mínimo visual muy bajo del contenedor padre)
                        const heightPercent = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                        
                        // Proporción de los segmentos
                        const completedRatio = total > 0 ? (data.completed / total) * 100 : 0;
                        const inProgressRatio = total > 0 ? (data.in_progress / total) * 100 : 0;

                        return (
                          <div key={i} className="chart-column-group group">
                            <div className="chart-bar-stack" style={{ height: `${Math.max(heightPercent, total > 0 ? 4 : 2)}%` }}>
                              {/* Segmento en progreso (arriba en column-reverse) */}
                              <div 
                                className="bar-segment in-progress" 
                                style={{ height: `${inProgressRatio}%` }}
                              ></div>
                              {/* Segmento completado (abajo en column-reverse) */}
                              <div 
                                className="bar-segment completed" 
                                style={{ height: `${completedRatio}%` }}
                              ></div>
                            </div>
                            <div className="chart-label">{data.label || data.month}</div>
                            
                            {/* Tooltip */}
                            <div className="chart-tooltip">
                              <div className="tooltip-header">{data.label || data.month}</div>
                              <div className="tooltip-row">
                                <div><span className="tooltip-dot completed"></span>Completadas</div>
                                <span className="tooltip-value">{data.completed || 0}</span>
                              </div>
                              <div className="tooltip-row">
                                <div><span className="tooltip-dot in-progress"></span>En progreso</div>
                                <span className="tooltip-value">{data.in_progress || 0}</span>
                              </div>
                              <div className="tooltip-row" style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed var(--border-color)' }}>
                                <div style={{ color: 'var(--text-primary)' }}>Total</div>
                                <span className="tooltip-value">{total}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      Array.from({ length: selectedPeriod === '7days' ? 7 : selectedPeriod === '4weeks' ? 4 : selectedPeriod === '3months' ? 3 : selectedPeriod === '6months' ? 6 : 12 }, (_, i) => (
                        <div key={i} className="chart-column-group">
                          <div className="chart-bar-stack" style={{ height: '2%', opacity: 0.3 }}></div>
                          <div className="chart-label">-</div>
                        </div>
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
                    <div className="mini-chart-bars">
                      {chartData.hours.length > 0 ? (
                        chartData.hours.map((hours, i) => {
                          const height = chartData.maxHours > 0 ? Math.max((hours / chartData.maxHours) * 100, 5) : 5;
                          return (
                            <div 
                              key={i} 
                              className="mini-bar" 
                              style={{ height: `${height}%` }}
                              title={`${hours}h - ${chartData.labels[i] || ''}`}
                            ></div>
                          );
                        })
                      ) : (
                        Array.from({ length: 12 }, (_, i) => (
                          <div key={i} className="mini-bar" style={{ height: '5%', opacity: 0.3 }}></div>
                        ))
                      )}
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

          {/* Active Workers */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Trabajadores activos</div>
                <div className="chart-value">{animatedActiveWorkers}</div>
              </div>
            </div>
            <div className="chart-content">
              {stats.totalWorkers === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-gray)', fontSize: '12px' }}>
                  <p style={{ margin: 0 }}>No hay trabajadores registrados</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
                    <div style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '50%', 
                      border: '8px solid var(--color-primary-rgba-20)',
                      borderTopColor: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <div style={{ 
                        position: 'absolute', 
                        fontSize: '24px', 
                        fontWeight: 'bold',
                        color: 'var(--color-primary)'
                      }}>
                        {stats.activeWorkers || 0}/{stats.totalWorkers || 0}
                      </div>
                    </div>
                  </div>
                  <div className="chart-footer-text">
                    <span className="live-indicator"></span>
                    {stats.activeWorkers || 0} de {stats.totalWorkers || 0} trabajadores en línea
                    {stats.totalWorkers > 0 && (
                      <span style={{ marginLeft: '8px', color: 'var(--color-gray)', fontSize: '11px' }}>
                        ({Math.round(((stats.activeWorkers || 0) / stats.totalWorkers) * 100)}% activos)
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
    </div>
  );
}

export default DashboardJefe;
