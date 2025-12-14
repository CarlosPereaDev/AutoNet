import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTasks,
  faChartLine,
  faBell,
  faCheckCircle,
  faClock,
  faArrowUp,
  faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import { getCurrentUser, processTokenFromUrl } from '../../services/authService';
import { getTrabajadorStats } from '../../services/dashboardService';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { usePolling } from '../../hooks/usePolling';
import '../styles/Dashboard.css';
import '../styles/ChartStyles.css';

function DashboardTrabajador() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();
  const token = searchParams.get('token');
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
  const fetchStats = async () => {
    try {
      const data = await getTrabajadorStats(false); // false para no usar caché y obtener datos actualizados

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
      if (error.message !== 'Petición cancelada') {
        console.error('Error al cargar estadísticas:', error);
      }
      // En caso de error, mantener los valores actuales (no resetear)
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStats();
  }, []);

  // Polling optimizado que evita llamadas duplicadas
  usePolling(fetchStats, 5000);

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
        inProgress: [],
        hours: [],
        maxValue: 1,
        maxHours: 1,
        labels: []
      };
    }

    const maxValue = Math.max(
      ...stats.monthlyData.map(d => (d.completed || 0) + (d.in_progress || 0)),
      1
    );
    const maxHours = Math.max(...stats.monthlyData.map(d => d.hours || 0), 1);

    return {
      completed: stats.monthlyData.map(d => d.completed || 0),
      inProgress: stats.monthlyData.map(d => d.in_progress || 0),
      hours: stats.monthlyData.map(d => d.hours || 0),
      maxHours: maxHours,
      labels: stats.monthlyData.map(d => d.label || d.month || '')
    };
  };

  const chartData = getChartData();

  return (
    <>
      {/* Welcome Section */}
      <section className="dashboard-welcome-section">
        <div>
          <h1 className="welcome-title">Bienvenido, {user?.name || 'Trabajador'}</h1>
          <p className="welcome-subtitle">
            Gestiona tus tareas asignadas y actualiza información de vehículos y maquinaria.
          </p>
        </div>
        <div className="welcome-actions">
          <Link to="/dashboard/trabajador/tareas" className="btn-secondary">
            Ver mis tareas →
          </Link>
          <Link to="/dashboard/trabajador/notificaciones" className="btn-primary">
            Ver notificaciones
          </Link>
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
                {stats.tasksTrend !== undefined && stats.tasksTrend !== 0 && (
                  <div className={`chart-trend ${stats.tasksTrend >= 0 ? 'trend-up' : 'trend-down'}`}>
                    <FontAwesomeIcon icon={stats.tasksTrend >= 0 ? faArrowUp : faArrowDown} />
                    <span>{Math.abs(stats.tasksTrend)}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className="chart-content">
              {stats.myTasks === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray)' }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>No tienes tareas asignadas aún</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Las estadísticas aparecerán cuando te asignen tareas</p>
                </div>
              ) : (
                <div className="chart-container">
                  <div className="chart-bars-area">
                    {stats.monthlyData && stats.monthlyData.length > 0 ? (
                      stats.monthlyData.map((data, i) => {
                        // Calcular totales y proporciones
                        const total = (data.completed || 0) + (data.in_progress || 0);
                        const maxTotal = Math.max(...stats.monthlyData.map(d => (d.completed || 0) + (d.in_progress || 0)), 1);

                        // Altura de la barra
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
                            <div className="chart-label">{data.label || data.month || ''}</div>

                            {/* Tooltip */}
                            <div className="chart-tooltip">
                              <div className="tooltip-header">{data.label || data.month || ''}</div>
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
                      Array.from({ length: 6 }, (_, i) => (
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
                        chartData.completed.map((count, i) => {
                          const maxCompleted = Math.max(...chartData.completed, 1);
                          const heightPercent = maxCompleted > 0 ? Math.max((count / maxCompleted) * 100, 5) : 5;
                          return (
                            <div
                              key={i}
                              className="mini-bar"
                              style={{ height: `${heightPercent}%` }}
                              title={`${count} tareas - ${chartData.labels[i] || ''}`}
                            ></div>
                          );
                        })
                      ) : (
                        Array.from({ length: 6 }, (_, i) => (
                          <div key={i} className="mini-bar" style={{ height: '5%', opacity: 0.3 }}></div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="chart-footer-text">
                    Últimos 6 meses
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
    </>
  );
}

export default DashboardTrabajador;
