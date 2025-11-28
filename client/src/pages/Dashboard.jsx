import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RecentActivity from '../components/RecentActivity'
import styles from '../styles/dashboard.module.css'
import {
    FileText,
    DollarSign,
    Users,
    PlusCircle,
    Lock,
    Settings,
    FileBarChart,
    CreditCard
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const Dashboard = () => {
    const navigate = useNavigate()
    const [recentInvoices, setRecentInvoices] = useState([])
    const [totalInvoices, setTotalInvoices] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/invoice/all`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            const allInvoices = response.data
            setTotalInvoices(allInvoices.length)
            // Get first 5 invoices (API returns sorted by date DESC)
            setRecentInvoices(allInvoices.slice(0, 5))
            setLoading(false)
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            // toast.error('Failed to load dashboard data')
            setLoading(false)
        }
    }

    // Mock stats data - replace with actual API calls where possible
    const stats = [
        {
            label: 'Total Invoices',
            value: totalInvoices.toString(),
            change: 'All time',
            positive: true,
            icon: <FileText />,
            color: 'black'
        },
        {
            label: 'Total Revenue',
            value: '₹4,52,890',
            change: '+18% from last month',
            positive: true,
            icon: <DollarSign />,
            color: 'lightGray'
        },
        {
            label: 'Pending Payments',
            value: '₹89,450',
            change: '-5% from last month',
            positive: false,
            icon: <CreditCard />,
            color: 'mediumGray'
        },
        {
            label: 'Active Clients',
            value: '42',
            change: '+3 new this month',
            positive: true,
            icon: <Users />,
            color: 'darkGray'
        }
    ]

    const quickActions = [
        {
            title: 'Generate Invoice',
            description: 'Create a new invoice',
            icon: <PlusCircle />,
            path: '/invoice/new'
        },
        {
            title: 'View Invoices',
            description: 'View all saved invoices',
            icon: <FileText />,
            path: '/view-invoices'
        },
        {
            title: 'Change Password',
            description: 'Update your password',
            icon: <Lock />,
            path: '/change-password'
        },
        {
            title: 'Settings',
            description: 'Manage preferences',
            icon: <Settings />,
            path: '/settings'
        }
    ]

    return (
        <div className={styles.dashboardContainer}>
            <Navbar />

            <div className={styles.mainContent}>
                <div className="container">


                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        {stats.map((stat, index) => (
                            <div key={index} className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles[stat.color]}`}>
                                    {stat.icon}
                                </div>
                                <div className={styles.statLabel}>{stat.label}</div>
                                <h3 className={styles.statValue}>{stat.value}</h3>
                                <p className={`${styles.statChange} ${stat.positive ? styles.positive : styles.negative}`}>
                                    {stat.change}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-5">
                        <h3 className={styles.sectionTitle}>
                            Quick Actions
                        </h3>
                        <div className={styles.quickActions}>
                            {quickActions.map((action, index) => (
                                <div
                                    key={index}
                                    className={styles.actionCard}
                                    onClick={() => navigate(action.path)}
                                >
                                    <div className={styles.actionIcon}>
                                        {action.icon}
                                    </div>
                                    <h4 className={styles.actionTitle}>{action.title}</h4>
                                    <p className={styles.actionDescription}>{action.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity Section */}
                    <RecentActivity invoices={recentInvoices} loading={loading} />
                </div>
            </div>
        </div>
    )
}

export default Dashboard