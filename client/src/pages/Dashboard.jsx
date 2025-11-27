import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
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

const Dashboard = () => {
    const navigate = useNavigate()

    // Mock stats data - replace with actual API calls
    const stats = [
        {
            label: 'Total Invoices',
            value: '248',
            change: '+12% from last month',
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
            title: 'View Reports',
            description: 'Analytics and insights',
            icon: <FileBarChart />,
            path: '/reports'
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
                    <div className="mt-5 mb-5">
                        <h3 className={styles.sectionTitle}>
                            Recent Activity
                        </h3>
                        <div className={styles.activitySection}>
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Invoice #</th>
                                            <th>Client</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>#INV-2024-001</strong></td>
                                            <td>Acme Corporation</td>
                                            <td>₹25,000</td>
                                            <td><span className="badge bg-success">Paid</span></td>
                                            <td>Nov 25, 2024</td>
                                        </tr>
                                        <tr>
                                            <td><strong>#INV-2024-002</strong></td>
                                            <td>Tech Solutions Ltd</td>
                                            <td>₹18,500</td>
                                            <td><span className="badge bg-warning">Pending</span></td>
                                            <td>Nov 26, 2024</td>
                                        </tr>
                                        <tr>
                                            <td><strong>#INV-2024-003</strong></td>
                                            <td>Digital Innovations</td>
                                            <td>₹32,750</td>
                                            <td><span className="badge bg-success">Paid</span></td>
                                            <td>Nov 27, 2024</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard