import { jwtDecode } from 'jwt-decode';

export const isTokenValid = () => {
    try {
        const token = localStorage.getItem('token');

        // Check if token exists
        if (!token) {
            return false;
        }

        // Decode token to check expiration
        const decodedToken = jwtDecode(token);

        // Check if token has expired
        // exp is in seconds, Date.now() is in milliseconds
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
            // Token has expired, remove it
            localStorage.removeItem('token');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error validating token:', error);
        // If there's any error decoding, consider token invalid
        localStorage.removeItem('token');
        return false;
    }
};




export const logout = () => {
    localStorage.removeItem('token');
};
