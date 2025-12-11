import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RecentActivity from '../components/RecentActivity'
import styles from '../styles/dashboard.module.css'
import {
    FileText,
    DollarSign,
    PlusCircle,
    Lock,
    Settings,
    FileBarChart,
    CreditCard,
    Receipt,
    History
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const Dashboard = () => {
    const navigate = useNavigate()
    const [recentInvoices, setRecentInvoices] = useState([])
    const [totalInvoices, setTotalInvoices] = useState(0)
    const [loading, setLoading] = useState(true)
    const [dashboardStats, setDashboardStats] = useState({
        totalInvoices: 0,
        totalRevenue: 0,
        activeClients: 0,
        revenueChange: { percent: 0, positive: true },
        newClientsThisMonth: 0,
        pendingPayments: 0,
        pendingReceipts: 0,
        pendingAccountInvoices: 0
    })

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token')

            // Fetch dashboard statistics
            const statsResponse = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/dashboard/stats`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )
            setDashboardStats(statsResponse.data)

            // Fetch all invoices for recent activity
            const invoicesResponse = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/invoice/all`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            const allInvoices = invoicesResponse.data
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

    // Stats data using real data from API
    const stats = [
        {
            label: 'Total Invoices',
            value: dashboardStats.totalInvoices.toString(),
            change: 'All time',
            positive: true,
            icon: <FileText />,
            color: 'black'
        },
        {
            label: 'Pending Payments',
            value: dashboardStats.pendingPayments.toString(),
            change: 'Awaiting approval',
            positive: dashboardStats.pendingPayments === 0,
            icon: <CreditCard />,
            color: 'lightGray'
        },
        {
            label: 'Pending Receipts',
            value: dashboardStats.pendingReceipts.toString(),
            change: 'Awaiting approval',
            positive: dashboardStats.pendingReceipts === 0,
            icon: <Receipt />,
            color: 'mediumGray'
        },
        {
            label: 'Pending Invoices',
            value: dashboardStats.pendingAccountInvoices.toString(),
            change: 'Awaiting approval',
            positive: dashboardStats.pendingAccountInvoices === 0,
            icon: <FileBarChart />,
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
            title: 'Create Payment',
            description: 'Submit payment entry',
            icon: <DollarSign />,
            path: '/payment/new'
        },
        {
            title: 'Create Receipt',
            description: 'Submit receipt entry',
            icon: <FileBarChart />,
            path: '/receipt/new'
        },
        {
            title: 'Create Account Invoice',
            description: 'Submit account invoice',
            icon: <CreditCard />,
            path: '/account-invoice/new'
        },
        {
            title: 'View History',
            description: 'View my submissions',
            icon: <History />,
            path: '/am-view-history'
        },
        {
            title: 'Change Password',
            description: 'Update your password',
            icon: <Lock />,
            path: '/change-password'
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