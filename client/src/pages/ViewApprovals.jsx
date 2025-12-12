import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, FileText } from 'lucide-react'
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
    const [selectedItem, setSelectedItem] = useState(null)
    const [selectedType, setSelectedType] = useState('')
    const [remark, setRemark] = useState('')
    const [showOffcanvas, setShowOffcanvas] = useState(false)

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

    const handleViewDetails = (item, type) => {
        setSelectedItem(item)
        setSelectedType(type)
        setRemark('')
        setShowOffcanvas(true)
    }

    const handleAction = async (action) => {
        if (!remark.trim()) {
            toast.error('Remark is mandatory for all actions')
            return
        }

        try {
            const token = localStorage.getItem('token')
            const endpoint = action === 'approve' ? 'approve' :
                action === 'reject' ? 'reject' : 'resubmit'

            await axios.post(
                `${import.meta.env.VITE_BASE_URL}/${selectedType}/${selectedItem.id}/${endpoint}`,
                { remark },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            )

            const actionText = action === 'approve' ? 'Approved' :
                action === 'reject' ? 'Rejected' : 'Sent for re-edit'
            toast.success(`${actionText} successfully!`)
            setShowOffcanvas(false)
            setSelectedItem(null)
            setRemark('')
            fetchAllData()
        } catch (error) {
            console.error(`Error ${action}ing:`, error)
            toast.error(`Failed to ${action}`)
        }
    }

    const viewPDF = (pdfPath) => {
        if (pdfPath) {
            window.open(`${import.meta.env.VITE_PDF_URL}${pdfPath}`, '_blank')
        } else {
            toast.error('No PDF available')
        }
    }

    const renderDetailFields = () => {
        if (!selectedItem) return null

        if (selectedType === 'payments') {
            return (
                <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Payment No</span>
                        <div className={styles.detailValue}>{selectedItem.payment_no}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Date</span>
                        <div className={styles.detailValue}>{new Date(selectedItem.date).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Party Name</span>
                        <div className={styles.detailValue}>{selectedItem.party_name}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Amount</span>
                        <div className={styles.detailValue}>₹{parseFloat(selectedItem.amount).toLocaleString('en-IN')}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Transaction Type</span>
                        <div className={styles.detailValue}>{selectedItem.transaction_type || '-'}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Category</span>
                        <div className={styles.detailValue}>{selectedItem.payment_category || '-'}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Center</span>
                        <div className={styles.detailValue}>{selectedItem.payment_center || '-'}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Debit To</span>
                        <div className={styles.detailValue}>{selectedItem.debit_to || '-'}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Credit To</span>
                        <div className={styles.detailValue}>{selectedItem.credit_to || '-'}</div>
                    </div>
                    <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                        <span className={styles.detailLabel}>Remarks</span>
                        <div className={styles.detailValue}>{selectedItem.remarks || '-'}</div>
                    </div>
                </div>
            )
        } else if (selectedType === 'receipts') {
            return (
                <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Receipt No</span>
                        <div className={styles.detailValue}>{selectedItem.receipt_no}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Date</span>
                        <div className={styles.detailValue}>{new Date(selectedItem.date).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Party Name</span>
                        <div className={styles.detailValue}>{selectedItem.party_name}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Amount</span>
                        <div className={styles.detailValue}>₹{parseFloat(selectedItem.amount).toLocaleString('en-IN')}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>PO/WO No</span>
                        <div className={styles.detailValue}>{selectedItem.po_wo_no || '-'}</div>
                    </div>
                    <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                        <span className={styles.detailLabel}>Remarks</span>
                        <div className={styles.detailValue}>{selectedItem.remarks || '-'}</div>
                    </div>
                </div>
            )
        } else {
            return (
                <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Invoice No</span>
                        <div className={styles.detailValue}>{selectedItem.invoice_no}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Date</span>
                        <div className={styles.detailValue}>{new Date(selectedItem.date).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Party Name</span>
                        <div className={styles.detailValue}>{selectedItem.party_name}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Amount</span>
                        <div className={styles.detailValue}>₹{parseFloat(selectedItem.amount).toLocaleString('en-IN')}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>PO/WO No</span>
                        <div className={styles.detailValue}>{selectedItem.po_wo_no || '-'}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Accounting Entry Type</span>
                        <div className={styles.detailValue}>{selectedItem.accounting_entry_type || '-'}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Debit To</span>
                        <div className={styles.detailValue}>{selectedItem.debit_to || '-'}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Credit To</span>
                        <div className={styles.detailValue}>{selectedItem.credit_to || '-'}</div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Ledger Balance</span>
                        <div className={styles.detailValue}>{selectedItem.ledger_balance || '-'}</div>
                    </div>
                    <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                        <span className={styles.detailLabel}>Remarks</span>
                        <div className={styles.detailValue}>{selectedItem.remarks || '-'}</div>
                    </div>
                </div>
            )
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
                                        className={styles.btnView}
                                        onClick={() => handleViewDetails(payment, 'payments')}
                                        title="View Details"
                                    >
                                        <Eye size={16} />
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
                                        className={styles.btnView}
                                        onClick={() => handleViewDetails(receipt, 'receipts')}
                                        title="View Details"
                                    >
                                        <Eye size={16} />
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
                                        className={styles.btnView}
                                        onClick={() => handleViewDetails(invoice, 'account-invoices')}
                                        title="View Details"
                                    >
                                        <Eye size={16} />
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
                        <ul className={`nav nav-tabs ${styles.navTabs}`} role="tablist">
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

            {/* Bootstrap Offcanvas with Custom Styling */}
            <div
                className={`offcanvas offcanvas-end ${styles.offcanvasCustom} ${showOffcanvas ? 'show' : ''}`}
                tabIndex="-1"
                style={{ visibility: showOffcanvas ? 'visible' : 'hidden' }}
            >
                <div className={`offcanvas-header ${styles.offcanvasHeader}`}>
                    <h5 className={`offcanvas-title ${styles.offcanvasTitle}`}>
                        {selectedType === 'payments' ? 'Payment' :
                            selectedType === 'receipts' ? 'Receipt' : 'Account Invoice'} Details
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowOffcanvas(false)}></button>
                </div>
                <div className={`offcanvas-body ${styles.offcanvasBody}`}>
                    {selectedItem && (
                        <>
                            {/* Details Section */}
                            <div className={styles.detailSection}>
                                {renderDetailFields()}
                            </div>

                            {/* PDF Button */}
                            {(selectedItem.file_pdf || selectedItem.invoice_pdf_file) && (
                                <div className={styles.detailSection}>
                                    <button
                                        className={styles.pdfButton}
                                        onClick={() => viewPDF(selectedItem.file_pdf || selectedItem.invoice_pdf_file)}
                                    >
                                        <FileText size={18} />
                                        View PDF Document
                                    </button>
                                </div>
                            )}

                            {/* Remarks Section */}
                            <div className={styles.remarksSection}>
                                <label className={styles.remarksLabel}>
                                    Remarks * (Mandatory)
                                </label>
                                <textarea
                                    className={styles.remarksTextarea}
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                    placeholder="Enter your remarks for this submission..."
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className={styles.actionsSection}>
                                <button
                                    className={styles.btnApproveCustom}
                                    onClick={() => handleAction('approve')}
                                >
                                    Approve
                                </button>
                                <button
                                    className={styles.btnResubmitCustom}
                                    onClick={() => handleAction('resubmit')}
                                >
                                    Send for Re-edit
                                </button>
                                <button
                                    className={styles.btnRejectCustom}
                                    onClick={() => handleAction('reject')}
                                >
                                    Reject
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Backdrop */}
            {showOffcanvas && (
                <div
                    className="offcanvas-backdrop fade show"
                    onClick={() => setShowOffcanvas(false)}
                    style={{ zIndex: 1040 }}
                ></div>
            )}
        </div>
    )
}

export default ViewApprovals
