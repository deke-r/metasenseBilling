import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/approvals.module.css'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'

const ViewApprovals = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('payments')
    const [payments, setPayments] = useState([])
    const [receipts, setReceipts] = useState([])
    const [accountInvoices, setAccountInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const [remarkModal, setRemarkModal] = useState({ show: false, id: null, type: '', action: '' })
    const [remark, setRemark] = useState('')

    useEffect(() => {
        fetchAllData()
    }, [])

    const fetchAllData = async () => {
        try {
            const token = localStorage.getItem('token')
            const headers = { 'Authorization': `Bearer ${token}` }

            const [paymentsRes, receiptsRes, invoicesRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BASE_URL}/payments?status=pending`, { headers }),
                axios.get(`${import.meta.env.VITE_BASE_URL}/receipts?status=pending`, { headers }),
                axios.get(`${import.meta.env.VITE_BASE_URL}/account-invoices?status=pending`, { headers })
            ])

            setPayments(paymentsRes.data)
            setReceipts(receiptsRes.data)
            setAccountInvoices(invoicesRes.data)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load pending approvals')
            setLoading(false)
        }
    }

    const handleApprove = async (id, type) => {
        try {
            const token = localStorage.getItem('token')
            await axios.post(
                `${import.meta.env.VITE_BASE_URL}/${type}/${id}/approve`,
                {},
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            )
            toast.success('Approved successfully!')
            fetchAllData()
        } catch (error) {
            console.error('Error approving:', error)
            toast.error('Failed to approve')
        }
    }

    const handleReject = async () => {
        if (!remark.trim()) {
            toast.error('Please provide a remark')
            return
        }

        try {
            const token = localStorage.getItem('token')
            await axios.post(
                `${import.meta.env.VITE_BASE_URL}/${remarkModal.type}/${remarkModal.id}/reject`,
                { remark },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            )
            toast.success('Rejected successfully!')
            setRemarkModal({ show: false, id: null, type: '', action: '' })
            setRemark('')
            fetchAllData()
        } catch (error) {
            console.error('Error rejecting:', error)
            toast.error('Failed to reject')
        }
    }

    const openRemarkModal = (id, type, action) => {
        setRemarkModal({ show: true, id, type, action })
        setRemark('')
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
                        <th>Created By</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {payments.length === 0 ? (
                        <tr><td colSpan="7" className={styles.emptyState}>No pending payments</td></tr>
                    ) : (
                        payments.map(payment => (
                            <tr key={payment.id}>
                                <td>{payment.payment_no}</td>
                                <td>{new Date(payment.date).toLocaleDateString('en-IN')}</td>
                                <td>{payment.party_name}</td>
                                <td>₹{parseFloat(payment.amount).toLocaleString('en-IN')}</td>
                                <td>{payment.payment_category || '-'}</td>
                                <td>{payment.created_by_name}</td>
                                <td>
                                    <button
                                        className={styles.btnApprove}
                                        onClick={() => handleApprove(payment.id, 'payments')}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className={styles.btnReject}
                                        onClick={() => openRemarkModal(payment.id, 'payments', 'reject')}
                                    >
                                        Reject
                                    </button>
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
                        <th>Created By</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {receipts.length === 0 ? (
                        <tr><td colSpan="7" className={styles.emptyState}>No pending receipts</td></tr>
                    ) : (
                        receipts.map(receipt => (
                            <tr key={receipt.id}>
                                <td>{receipt.receipt_no}</td>
                                <td>{new Date(receipt.date).toLocaleDateString('en-IN')}</td>
                                <td>{receipt.party_name}</td>
                                <td>₹{parseFloat(receipt.amount).toLocaleString('en-IN')}</td>
                                <td>{receipt.po_wo_no || '-'}</td>
                                <td>{receipt.created_by_name}</td>
                                <td>
                                    <button
                                        className={styles.btnApprove}
                                        onClick={() => handleApprove(receipt.id, 'receipts')}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className={styles.btnReject}
                                        onClick={() => openRemarkModal(receipt.id, 'receipts', 'reject')}
                                    >
                                        Reject
                                    </button>
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
                        <th>Created By</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {accountInvoices.length === 0 ? (
                        <tr><td colSpan="7" className={styles.emptyState}>No pending account invoices</td></tr>
                    ) : (
                        accountInvoices.map(invoice => (
                            <tr key={invoice.id}>
                                <td>{invoice.invoice_no}</td>
                                <td>{new Date(invoice.date).toLocaleDateString('en-IN')}</td>
                                <td>{invoice.party_name}</td>
                                <td>₹{parseFloat(invoice.amount).toLocaleString('en-IN')}</td>
                                <td>{invoice.po_wo_no || '-'}</td>
                                <td>{invoice.created_by_name}</td>
                                <td>
                                    <button
                                        className={styles.btnApprove}
                                        onClick={() => handleApprove(invoice.id, 'account-invoices')}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className={styles.btnReject}
                                        onClick={() => openRemarkModal(invoice.id, 'account-invoices', 'reject')}
                                    >
                                        Reject
                                    </button>
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
                        onClick={(e) => { e.preventDefault(); const role = localStorage.getItem('userRole') || 'MG'; navigate(`/dashboard/${role.toLowerCase()}`) }}
                        className={styles.backButton}
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </a>

                    <h2 className={styles.pageTitle}>Pending Approvals</h2>

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
                                    type="button"
                                >
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

            {/* Remark Modal */}
            {remarkModal.show && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h5 className={styles.modalTitle}>Reject Entry</h5>
                            <button
                                type="button"
                                className={styles.btnClose}
                                onClick={() => setRemarkModal({ show: false, id: null, type: '', action: '' })}
                            >&times;</button>
                        </div>
                        <div className={styles.modalBody}>
                            <label className={styles.formLabel}>Remark *</label>
                            <textarea
                                className={styles.textarea}
                                rows="4"
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                placeholder="Enter reason for rejection..."
                            />
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => setRemarkModal({ show: false, id: null, type: '', action: '' })}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={styles.btnDanger}
                                onClick={handleReject}
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ViewApprovals
