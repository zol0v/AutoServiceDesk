import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RootRedirect() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'Admin') {
    return <Navigate to="/admin/categories" replace />;
  }

  if (role === 'Master') {
    return <Navigate to="/queue/new" replace />;
  }

  return <Navigate to="/tickets" replace />;
}