import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if specific roles are required
  if (roles.length > 0 && user) {
    if (!roles.includes(user.role)) {
      return (
        <div className="page-container">
          <div className="alert alert-danger">
            <h3>Access Denied</h3>
            <p>You do not have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default PrivateRoute;