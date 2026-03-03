import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';

export const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="inline-block mb-6">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole && requiredRole !== 'ANY') {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="inline-block mb-6">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Initializing StockFlow...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};
