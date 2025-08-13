import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check authentication status and session timeout
    const authStatus = localStorage.getItem('isAdminAuthenticated') === 'true';
    const loginTime = localStorage.getItem('adminLoginTime');
    
    if (authStatus && loginTime) {
      const currentTime = new Date().getTime();
      const sessionDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
      
      if (currentTime - parseInt(loginTime) > sessionDuration) {
        // Session expired, clear authentication
        localStorage.removeItem('isAdminAuthenticated');
        localStorage.removeItem('adminLoginTime');
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    } else {
      setIsAuthenticated(false);
    }
    
    setIsChecking(false);
  }, []);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;