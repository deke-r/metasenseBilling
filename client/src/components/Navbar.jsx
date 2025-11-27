import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import { logout } from '../utils/auth'
import { LogOut } from 'lucide-react'
import styles from '../styles/dashboard.module.css'

const Navbar = () => {
    const navigate = useNavigate()
    const [userName, setUserName] = useState('')
    const [userEmail, setUserEmail] = useState('')

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            const decoded = jwtDecode(token)
            setUserEmail(decoded.email)
    
            setUserName(decoded.name)
        }
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/', { replace: true })
    }

    return (
        <nav className={`${styles.navbar}`}>
            <div className="container">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <img src="/img/logo.png" alt="logo" width={40} />
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-end d-none d-md-block">
                            <p className={styles.welcomeText}>
                                Welcome back, <span className={styles.userName}>{userName}</span>
                            </p>
                            <p className={styles.welcomeText} style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                {userEmail}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className={styles.logoutBtn}
                        >
                            <LogOut size={18} className="me-2" style={{ display: 'inline' }} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
