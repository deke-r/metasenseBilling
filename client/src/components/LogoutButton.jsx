import { useNavigate } from 'react-router-dom'
import { logout } from '../utils/auth'

const LogoutButton = ({ className = '' }) => {
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/', { replace: true })
    }

    return (
        <button
            onClick={handleLogout}
            className={className}
        >
            Logout
        </button>
    )
}

export default LogoutButton
