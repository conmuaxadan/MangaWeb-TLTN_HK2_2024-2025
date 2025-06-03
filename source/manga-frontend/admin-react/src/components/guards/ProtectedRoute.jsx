import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { isLogin, userPermissions } = useAuth();

  if (!isLogin) {
    return <Navigate to="/login" replace />;
  }

  if (!userPermissions.includes(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
