import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'teacher' | 'admin';
  requireAdminEmail?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, requireAdminEmail }: ProtectedRouteProps) => {
  const { currentUser, userProfile } = useAuth();
  const ADMIN_EMAIL = 'sksvmacet@gmail.com';

  if (!currentUser) return <Navigate to="/login" />;

  if (requiredRole && userProfile?.role !== requiredRole) {
    return <Navigate to="/login" />;
  }

  if (requireAdminEmail && userProfile?.email !== ADMIN_EMAIL) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;