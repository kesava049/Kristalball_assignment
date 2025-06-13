
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-emerald-400 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check for required roles
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
