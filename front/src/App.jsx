import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import Login from './components/Login';
import CompleteGoogleRegistration from './components/CompleteGoogleRegistration';
import DashboardJefe from './components/DashboardJefe';
import DashboardTrabajador from './components/DashboardTrabajador';
import TareasJefe from './components/TareasJefe';
import VehiculosJefe from './components/VehiculosJefe';
import MaquinariaJefe from './components/MaquinariaJefe';
import TrabajadoresJefe from './components/TrabajadoresJefe';
import Notificaciones from './components/Notificaciones';
import TareasTrabajador from './components/TareasTrabajador';
import ActualizarDatos from './components/ActualizarDatos';
import SuperUsuario from './components/SuperUsuario';
import ProtectedRoute from './components/ProtectedRoute';
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
              <DashboardJefe />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/jefe/tareas"
          element={
            <ProtectedRoute requiredRole="jefe">
              <TareasJefe />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/jefe/vehiculos"
          element={
            <ProtectedRoute requiredRole="jefe">
              <VehiculosJefe />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/jefe/maquinaria"
          element={
            <ProtectedRoute requiredRole="jefe">
              <MaquinariaJefe />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/jefe/trabajadores"
          element={
            <ProtectedRoute requiredRole="jefe">
              <TrabajadoresJefe />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/jefe/notificaciones"
          element={
            <ProtectedRoute requiredRole="jefe">
              <Notificaciones role="jefe" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/trabajador"
          element={
            <ProtectedRoute requiredRole="trabajador">
              <DashboardTrabajador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/trabajador/tareas"
          element={
            <ProtectedRoute requiredRole="trabajador">
              <TareasTrabajador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/trabajador/actualizar-vehiculos"
          element={
            <ProtectedRoute requiredRole="trabajador">
              <ActualizarDatos type="vehiculos" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/trabajador/actualizar-maquinaria"
          element={
            <ProtectedRoute requiredRole="trabajador">
              <ActualizarDatos type="maquinaria" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/trabajador/notificaciones"
          element={
            <ProtectedRoute requiredRole="trabajador">
              <Notificaciones role="trabajador" />
            </ProtectedRoute>
          }
        />
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
  );
}

export default App
