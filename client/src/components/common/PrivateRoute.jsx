import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Still resolving auth state
  if (loading) {
    return <LoadingSpinner size="lg" text="Loading..." />;
  }

  // Not authenticated → go to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // Authenticated but user not yet loaded → wait
  if (!user) {
    return <LoadingSpinner size="lg" text="Loading user..." />;
  }

  // Role-based access check
  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">
          <h3>Access Denied</h3>
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
