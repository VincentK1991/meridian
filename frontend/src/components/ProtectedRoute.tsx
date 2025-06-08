import { Navigate, useLocation } from 'react-router-dom';
import { useIsAuthenticated } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useIsAuthenticated();
  const location = useLocation();

  console.log('ProtectedRoute check:', { isAuthenticated, isLoading, path: location.pathname });

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to signin
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to signin');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  console.log('User authenticated, rendering protected content');
  // If authenticated, render the protected content
  return <>{children}</>;
}
