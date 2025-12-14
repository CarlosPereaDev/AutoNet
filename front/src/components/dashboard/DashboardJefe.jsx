import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTasks,
  faCar,
  faTractor,
  faUsers,
  faCheckCircle,
  faClock,
  faArrowUp,
  faArrowDown,
  faWrench,
  faChartBar,
  faKey,
  faCopy
} from '@fortawesome/free-solid-svg-icons';
import { getCurrentUser, processTokenFromUrl } from '../../services/authService';
import { getJefeStats } from '../../services/dashboardService';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { usePolling } from '../../hooks/usePolling';
import { useToast } from '../common/Toast';
import '../styles/Dashboard.css';
import '../styles/ChartStyles.css';

function DashboardJefe() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(getCurrentUser());
  const token = searchParams.get('token');
  const toast = useToast();
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
        .then((userData) => {
          setUser(userData);
          navigate('/dashboard/jefe', { replace: true });
        })
        .catch((error) => {
          console.error('Error al procesar token:', error);
          navigate('/', { replace: true });
        });
    } else {
      // Recargar información del usuario para obtener el código actualizado
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        fetch(`${apiUrl}/user`, {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Accept': 'application/json',
          },
        })
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              localStorage.setItem('user', JSON.stringify(data.user));
              setUser(data.user);
            }
          })
          .catch(err => console.error('Error al cargar usuario:', err));
      }
    }
  }, [token, navigate]);

  // Cargar estadísticas desde el backend
  const fetchStats = async () => {
    try {
      const data = await getJefeStats(false, selectedPeriod); // false para no usar caché y obtener datos actualizados
      setStats(data);
    } catch (error) {
      if (error.message !== 'Petición cancelada') {
        console.error('Error al cargar estadísticas:', error);
      }
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStats();
  }, [selectedPeriod]); // Recargar cuando cambie el período

  // Polling optimizado que evita llamadas duplicadas
  usePolling(fetchStats, 5000, [selectedPeriod]);

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
    <>
      {/* Welcome Section */}
      <section className="dashboard-welcome-section">
        <div style={{ flex: 1 }}>
          <h1 className="welcome-title">Bienvenido, {user?.name || 'Jefe'}</h1>
          <p className="welcome-subtitle">
            Mide el rendimiento de tu organización y supervisa el estado de tus recursos.
          </p>
          {user?.organization?.code && (
            <div style={{
              marginTop: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'var(--color-dark-darkest)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <FontAwesomeIcon icon={faKey} style={{ color: 'var(--color-primary)', fontSize: '12px', opacity: 0.8 }} />
              <span style={{ fontSize: '12px', color: 'var(--color-gray)', opacity: 0.7 }}>
                Código empresa:
              </span>
              <code style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--color-primary)',
                letterSpacing: '1.5px',
                fontFamily: 'monospace'
              }}>
                {user.organization.code}
              </code>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(user.organization.code);
                    toast.success('Código copiado');
                  } catch (err) {
                    toast.error('Error al copiar');
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-gray)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                  opacity: 0.6
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = 'var(--color-primary)';
                  e.target.style.opacity = '1';
                  e.target.style.background = 'rgba(20, 184, 166, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = 'var(--color-gray)';
                  e.target.style.opacity = '0.6';
                  e.target.style.background = 'transparent';
                }}
                title="Copiar código - Comparte este código con tus trabajadores para que se registren"
              >
                <FontAwesomeIcon icon={faCopy} style={{ fontSize: '11px' }} />
              </button>
            </div>
          )}
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
    </>
  );
}

export default DashboardJefe;
