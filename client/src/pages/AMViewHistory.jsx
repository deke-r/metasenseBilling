import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/approvals.module.css'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'

const AMViewHistory = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('payments')
    const [statusFilter, setStatusFilter] = useState('all')
    const [fromDate, setFromDate] = useState(() => {
        const date = new Date()
        date.setDate(date.getDate() - 30) // 30 days ago
        return date.toISOString().split('T')[0]
    })
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
    const [payments, setPayments] = useState([])
    const [receipts, setReceipts] = useState([])
    const [accountInvoices, setAccountInvoices] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (fromDate && toDate) {
            fetchData()
        }
    }, [activeTab, statusFilter, fromDate, toDate])

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const headers = { 'Authorization': `Bearer ${token}` }

            // Fetch all statuses if 'all' is selected
            if (statusFilter === 'all') {
                const [paymentsRes, receiptsRes, invoicesRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_BASE_URL}/payments`, { headers }),
                    axios.get(`${import.meta.env.VITE_BASE_URL}/receipts`, { headers }),
                    axios.get(`${import.meta.env.VITE_BASE_URL}/account-invoices`, { headers })
                ])

                // Filter by date range and created by current user
                const filterByDate = (items) => items.filter(item => {
                    const itemDate = new Date(item.date)
                    return itemDate >= new Date(fromDate) && itemDate <= new Date(toDate)
                })

                setPayments(filterByDate(paymentsRes.data))
                setReceipts(filterByDate(receiptsRes.data))
                setAccountInvoices(filterByDate(invoicesRes.data))
            } else {
                const [paymentsRes, receiptsRes, invoicesRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_BASE_URL}/payments?status=${statusFilter}`, { headers }),
                    axios.get(`${import.meta.env.VITE_BASE_URL}/receipts?status=${statusFilter}`, { headers }),
                    axios.get(`${import.meta.env.VITE_BASE_URL}/account-invoices?status=${statusFilter}`, { headers })
                ])

                // Filter by date range
                const filterByDate = (items) => items.filter(item => {
                    const itemDate = new Date(item.date)
                    return itemDate >= new Date(fromDate) && itemDate <= new Date(toDate)
                })

                setPayments(filterByDate(paymentsRes.data))
                setReceipts(filterByDate(receiptsRes.data))
                setAccountInvoices(filterByDate(invoicesRes.data))
            }
            setLoading(false)
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load history')
            setLoading(false)
        }
    }

    const handleEdit = (type, id) => {
        // Navigate to edit page based on type
        if (type === 'payment') {
            navigate(`/payment/edit/${id}`)
        } else if (type === 'receipt') {
            navigate(`/receipt/edit/${id}`)
        } else if (type === 'invoice') {
            navigate(`/account-invoice/edit/${id}`)
        }
    }

    const renderPayments = () => (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Payment No</th>
                        <th>Date</th>
                        <th>Party Name</th>
                        <th>Amount</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Approved/Rejected By</th>
                        <th>Approved/Rejected At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {payments.length === 0 ? (
                        <tr><td colSpan="9" className={styles.emptyState}>No payments found</td></tr>
                    ) : (
                        payments.map(payment => (
                            <tr key={payment.id}>
                                <td>{payment.payment_no}</td>
                                <td>{new Date(payment.date).toLocaleDateString('en-IN')}</td>
                                <td>{payment.party_name}</td>
                                <td>₹{parseFloat(payment.amount).toLocaleString('en-IN')}</td>
                                <td>{payment.payment_category || '-'}</td>
                                <td>
                                    <span className={`${styles.badge} ${payment.status === 'approved' ? styles.badgeApproved :
                                        payment.status === 'rejected' ? styles.badgeRejected :
                                            payment.status === 'resubmit' ? styles.badgeResubmit :
                                                styles.badgePending
                                        }`}>
                                        {payment.status}
                                    </span>
                                </td>
                                <td>{payment.approved_by_name || '-'}</td>
                                <td>{payment.approved_at ? new Date(payment.approved_at).toLocaleString('en-IN') : '-'}</td>
                                <td>
                                    {payment.status === 'resubmit' && (
                                        <button
                                            className={styles.editButton}
                                            onClick={() => handleEdit('payment', payment.id)}
                                            title="Edit and Resubmit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )

    const renderReceipts = () => (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Receipt No</th>
                        <th>Date</th>
                        <th>Party Name</th>
                        <th>Amount</th>
                        <th>PO/WO No</th>
                        <th>Status</th>
                        <th>Approved/Rejected By</th>
                        <th>Approved/Rejected At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {receipts.length === 0 ? (
                        <tr><td colSpan="9" className={styles.emptyState}>No receipts found</td></tr>
                    ) : (
                        receipts.map(receipt => (
                            <tr key={receipt.id}>
                                <td>{receipt.receipt_no}</td>
                                <td>{new Date(receipt.date).toLocaleDateString('en-IN')}</td>
                                <td>{receipt.party_name}</td>
                                <td>₹{parseFloat(receipt.amount).toLocaleString('en-IN')}</td>
                                <td>{receipt.po_wo_no || '-'}</td>
                                <td>
                                    <span className={`${styles.badge} ${receipt.status === 'approved' ? styles.badgeApproved :
                                        receipt.status === 'rejected' ? styles.badgeRejected :
                                            receipt.status === 'resubmit' ? styles.badgeResubmit :
                                                styles.badgePending
                                        }`}>
                                        {receipt.status}
                                    </span>
                                </td>
                                <td>{receipt.approved_by_name || '-'}</td>
                                <td>{receipt.approved_at ? new Date(receipt.approved_at).toLocaleString('en-IN') : '-'}</td>
                                <td>
                                    {receipt.status === 'resubmit' && (
                                        <button
                                            className={styles.editButton}
                                            onClick={() => handleEdit('receipt', receipt.id)}
                                            title="Edit and Resubmit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )

    const renderAccountInvoices = () => (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Invoice No</th>
                        <th>Date</th>
                        <th>Party Name</th>
                        <th>Amount</th>
                        <th>PO/WO No</th>
                        <th>Status</th>
                        <th>Approved/Rejected By</th>
                        <th>Approved/Rejected At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {accountInvoices.length === 0 ? (
                        <tr><td colSpan="9" className={styles.emptyState}>No account invoices found</td></tr>
                    ) : (
                        accountInvoices.map(invoice => (
                            <tr key={invoice.id}>
                                <td>{invoice.invoice_no}</td>
                                <td>{new Date(invoice.date).toLocaleDateString('en-IN')}</td>
                                <td>{invoice.party_name}</td>
                                <td>₹{parseFloat(invoice.amount).toLocaleString('en-IN')}</td>
                                <td>{invoice.po_wo_no || '-'}</td>
                                <td>
                                    <span className={`${styles.badge} ${invoice.status === 'approved' ? styles.badgeApproved :
                                        invoice.status === 'rejected' ? styles.badgeRejected :
                                            invoice.status === 'resubmit' ? styles.badgeResubmit :
                                                styles.badgePending
                                        }`}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td>{invoice.approved_by_name || '-'}</td>
                                <td>{invoice.approved_at ? new Date(invoice.approved_at).toLocaleString('en-IN') : '-'}</td>
                                <td>
                                    {invoice.status === 'resubmit' && (
                                        <button
                                            className={styles.editButton}
                                            onClick={() => handleEdit('invoice', invoice.id)}
                                            title="Edit and Resubmit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )

    return (
        <div className={styles.approvalContainer}>
            <Toaster position="top-right" />
            <Navbar />

            <div className={styles.contentSection}>
                <div className="container">
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); navigate('/dashboard/am') }}
                        className={styles.backButton}
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </a>

                    <h2 className={styles.pageTitle}>My Submissions</h2>

                    {/* Filters */}
                    <div className={styles.filterSection}>
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className={styles.formLabel}>Status</label>
                                <select
                                    className={styles.formInput}
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="resubmit">Resubmit</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className={styles.formLabel}>From Date</label>
                                <input
                                    type="date"
                                    className={styles.formInput}
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>
                            <div className="col-md-3">
                                <label className={styles.formLabel}>To Date</label>
                                <input
                                    type="date"
                                    className={styles.formInput}
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>
                            <div className="col-md-3 d-flex align-items-end">
                                <button
                                    className={styles.searchButton}
                                    onClick={fetchData}
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mt-4">
                        <ul className={`nav ${styles.navTabs}`} role="tablist">
                            <li className={`nav-item ${styles.navItem}`} role="presentation">
                                <button
                                    className={`nav-link ${styles.navLink} ${activeTab === 'payments' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('payments')}
                                    type="button"
                                >
                                    Payments ({payments.length})
                                </button>
                            </li>
                            <li className={`nav-item ${styles.navItem}`} role="presentation">
                                <button
                                    className={`nav-link ${styles.navLink} ${activeTab === 'receipts' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('receipts')}
                                    type="button">
                                    Receipts ({receipts.length})
                                </button>
                            </li>
                            <li className={`nav-item ${styles.navItem}`} role="presentation">
                                <button
                                    className={`nav-link ${styles.navLink} ${activeTab === 'invoices' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('invoices')}
                                    type="button"
                                >
                                    Account Invoices ({accountInvoices.length})
                                </button>
                            </li>
                        </ul>

                        <div className="tab-content mt-3">
                            {loading ? (
                                <div className={styles.loadingState}>Loading...</div>
                            ) : (
                                <>
                                    {activeTab === 'payments' && renderPayments()}
                                    {activeTab === 'receipts' && renderReceipts()}
                                    {activeTab === 'invoices' && renderAccountInvoices()}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AMViewHistory
