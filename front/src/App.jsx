import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import Login from './components/forms/Login';
import CompleteGoogleRegistration from './components/forms/CompleteGoogleRegistration';
import DashboardJefe from './components/dashboard/DashboardJefe';
import DashboardTrabajador from './components/dashboard/DashboardTrabajador';
import TareasJefe from './components/tasks/TareasJefe';
import VehiculosJefe from './components/management/VehiculosJefe';
import MaquinariaJefe from './components/management/MaquinariaJefe';
import TrabajadoresJefe from './components/management/TrabajadoresJefe';
import Notificaciones from './components/notifications/Notificaciones';
import TareasTrabajador from './components/tasks/TareasTrabajador';
import ActualizarDatos from './components/management/ActualizarDatos';
import SuperUsuario from './components/admin/SuperUsuario';
import UbicacionTrabajadores from './components/dashboard/UbicacionTrabajadores';
import JefeLayout from './components/layouts/JefeLayout';
import TrabajadorLayout from './components/layouts/TrabajadorLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import { ToastProvider } from './components/common/Toast';
import { isAuthenticated, getCurrentUser } from './services/authService';

function LoginWrapper() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    if (token) {
      // Guardar el token del callback de Google
      localStorage.setItem('token', token);

      // Obtener información del usuario desde el backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      fetch(`${apiUrl}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            // Redirigir según el rol
            if (data.user.role === 'admin') {
              window.location.href = '/admin/organizations';
            } else if (data.user.role === 'jefe') {
              window.location.href = '/dashboard/jefe';
            } else {
              window.location.href = '/dashboard/trabajador';
            }
          }
        })
        .catch(() => {
          // Si falla, intentar recargar
          window.location.href = window.location.pathname;
        });
    }
  }, [token]);

  if (error) {
    return <Login error={error} />;
  }

  if (isAuthenticated()) {
    const user = getCurrentUser();
    if (user?.role === 'admin') {
      return <Navigate to="/admin/organizations" replace />;
    } else if (user?.role === 'jefe') {
      return <Navigate to="/dashboard/jefe" replace />;
    } else {
      return <Navigate to="/dashboard/trabajador" replace />;
    }
  }

  return <Login />;
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<LoginWrapper />}
          />
          <Route
            path="/complete-google-registration"
            element={<CompleteGoogleRegistration />}
          />
          <Route
            path="/dashboard/jefe"
            element={
              <ProtectedRoute requiredRole="jefe">
                <JefeLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardJefe />} />
            <Route path="tareas" element={<TareasJefe />} />
            <Route path="vehiculos" element={<VehiculosJefe />} />
            <Route path="maquinaria" element={<MaquinariaJefe />} />
            <Route path="trabajadores" element={<TrabajadoresJefe />} />
            <Route path="notificaciones" element={<Notificaciones role="jefe" />} />
            <Route path="ubicacion-trabajadores" element={<UbicacionTrabajadores />} />
          </Route>
          <Route
            path="/dashboard/trabajador"
            element={
              <ProtectedRoute requiredRole="trabajador">
                <TrabajadorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardTrabajador />} />
            <Route path="tareas" element={<TareasTrabajador />} />
            <Route path="actualizar-vehiculos" element={<ActualizarDatos type="vehiculos" />} />
            <Route path="actualizar-maquinaria" element={<ActualizarDatos type="maquinaria" />} />
            <Route path="notificaciones" element={<Notificaciones role="trabajador" />} />
          </Route>
          <Route
            path="/admin/organizations"
            element={
              <ProtectedRoute requiredRole="admin">
                <SuperUsuario />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App
