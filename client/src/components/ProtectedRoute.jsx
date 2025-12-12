import { Navigate, useLocation } from 'react-router-dom';
import { isTokenValid, getUserRole, logout } from '../utils/auth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const location = useLocation();
    const isAuthenticated = isTokenValid();
    const userRole = getUserRole();

    // 1. Check if token is valid
    if (!isAuthenticated) {
        logout(); // Ensure cleanup
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // 2. Check if user has permission (if allowedRoles is defined)
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        if (userRole === 'AM') {
            return <Navigate to="/dashboard/am" replace />;
        } else if (userRole === 'MG') {
            return <Navigate to="/dashboard/mg" replace />;
        } else {
            // Fallback for unknown roles or if dashboard access is also restricted (unlikely here)
            logout();
            return <Navigate to="/" replace />;
        }
    }

    // 3. Authorized
    return children;
};

export default ProtectedRoute;
