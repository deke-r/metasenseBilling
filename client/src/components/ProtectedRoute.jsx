import { Navigate } from 'react-router-dom';
import { isTokenValid } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = isTokenValid();

    if (!isAuthenticated) {

        return <Navigate to="/" replace />;
    }


    return children;
};

export default ProtectedRoute;
