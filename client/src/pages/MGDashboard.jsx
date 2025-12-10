import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import dashboardStyles from '../styles/dashboard.module.css'
import styles from '../styles/approvals.module.css'
import { Lock, FileCheck, History } from 'lucide-react'
import axios from 'axios'

const MGDashboard = () => {
    const navigate = useNavigate()
    const [amUsers, setAmUsers] = useState([])

    useEffect(() => {
        fetchAMUsers()
    }, [])

    const fetchAMUsers = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/users/am-list`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )
            setAmUsers(response.data)
        } catch (error) {
            console.error('Error fetching AM users:', error)
        }
    }

    const quickActions = [
        {
            title: 'View Approvals',
            description: 'Review pending entries',
            icon: <FileCheck />,
            path: '/view-approvals'
        },
        {
            title: 'View History',
            description: 'View approved/rejected entries',
            icon: <History />,
            path: '/view-history'
        },
        {
            title: 'Change Password',
            description: 'Update your password',
            icon: <Lock />,
            path: '/change-password'
        }
    ]

    return (
        <div className={dashboardStyles.dashboardContainer}>
            <Navbar />

            <div className={dashboardStyles.mainContent}>
                <div className="container">
                    <h2 className={dashboardStyles.sectionTitle}>Management Dashboard</h2>

                    {/* Quick Actions */}
                    <div className="mt-4">
                        <h3 className={dashboardStyles.sectionTitle}>Quick Actions</h3>
                        <div className={dashboardStyles.quickActions}>
                            {quickActions.map((action, index) => (
                                <div
                                    key={index}
                                    className={dashboardStyles.actionCard}
                                    onClick={() => navigate(action.path)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={dashboardStyles.actionIcon}>
                                        {action.icon}
                                    </div>
                                    <h4 className={dashboardStyles.actionTitle}>{action.title}</h4>
                                    <p className={dashboardStyles.actionDescription}>{action.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AM Users Last Login */}
                    <div className="mt-5">
                        <h3 className={dashboardStyles.sectionTitle}>Accounts Manager Activity</h3>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Last Login</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {amUsers.length === 0 ? (
                                        <tr><td colSpan="3" className={styles.emptyState}>No AM users found</td></tr>
                                    ) : (
                                        amUsers.map(user => (
                                            <tr key={user.user_id}>
                                                <td className='text-capitalize'>{user.name}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                    {user.last_login ? (
                                                        new Date(user.last_login).toLocaleString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })
                                                    ) : (
                                                        'Never logged in'
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MGDashboard
