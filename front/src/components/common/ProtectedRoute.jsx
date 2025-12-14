import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../../services/authService';

function ProtectedRoute({ children, requiredRole = null }) {
  const [searchParams] = useSearchParams();
  const tokenInUrl = searchParams.get('token');
  
  // Si hay un token en la URL, permitir el acceso (el componente hijo lo procesará)
  // Esto es necesario para el flujo de Google OAuth
  if (tokenInUrl) {
    return children;
  }
  
  // Si no hay token en URL, verificar autenticación normal
  const authenticated = isAuthenticated();
  const user = getCurrentUser();

  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirigir al dashboard correspondiente según el rol
    if (user?.role === 'admin') {
      return <Navigate to="/admin/organizations" replace />;
    } else if (user?.role === 'jefe') {
      return <Navigate to="/dashboard/jefe" replace />;
    } else {
      return <Navigate to="/dashboard/trabajador" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;

