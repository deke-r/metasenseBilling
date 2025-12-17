import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import styles from '../styles/dashboard.module.css'

const RecentActivity = ({ invoices, loading }) => {
    const navigate = useNavigate()

    return (
        <div className="mt-5 mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
                    Recent Activity
                </h3>
                <button
                    className="btn btn-link text-decoration-none"
                    onClick={() => navigate('/view-invoices')}
                    style={{ color: '#0C4379', fontWeight: 500 }}
                >
                    View All
                </button>
            </div>

            <div className={styles.activitySection}>
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Amount</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4">Loading...</td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4">No recent invoices found</td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td><strong>{invoice.invoice_no}</strong></td>
                                        <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                                        <td>{invoice.client_name}</td>
                                        <td>Rs.{parseFloat(invoice.total_amount).toFixed(2)}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => navigate('/view-invoices')}
                                            >
                                                <Eye size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default RecentActivity
