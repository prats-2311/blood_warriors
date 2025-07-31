import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthRequired, useRoleAccess } from "../hooks/useAuth";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const { isAuthenticated, loading, user } = useAuthRequired();
  const { hasAccess } = useRoleAccess(allowedRoles);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store the attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && !hasAccess) {
    return (
      <div className="access-denied">
        <div className="access-denied__content">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p>Required roles: {allowedRoles.join(', ')}</p>
          <p>Your role: {user?.userType}</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
