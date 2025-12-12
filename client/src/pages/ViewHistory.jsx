import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, FileText } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/approvals.module.css'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'

const ViewHistory = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('payments')
    const [statusFilter, setStatusFilter] = useState('all')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [payments, setPayments] = useState([])
    const [receipts, setReceipts] = useState([])
    const [accountInvoices, setAccountInvoices] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [selectedType, setSelectedType] = useState('')
    const [showOffcanvas, setShowOffcanvas] = useState(false)

    useEffect(() => {
        fetchData(true)
    }, [activeTab])

    const fetchData = async (isInitialLoad = false) => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const headers = { 'Authorization': `Bearer ${token}` }

            // Build query params
            let paymentsUrl = `${import.meta.env.VITE_BASE_URL}/payments`
            let receiptsUrl = `${import.meta.env.VITE_BASE_URL}/receipts`
            let invoicesUrl = `${import.meta.env.VITE_BASE_URL}/account-invoices`

            // Add status filter if not 'all' and NOT initial load (or even for initial load if we want all)
            // User requested "by default all should be selected".
            if (!isInitialLoad && statusFilter !== 'all') {
                paymentsUrl += `?status=${statusFilter}`
                receiptsUrl += `?status=${statusFilter}`
                invoicesUrl += `?status=${statusFilter}`
            }

            const [paymentsRes, receiptsRes, invoicesRes] = await Promise.all([
                axios.get(paymentsUrl, { headers }),
                axios.get(receiptsUrl, { headers }),
                axios.get(invoicesUrl, { headers })
            ])

            // Filter logic
            const processData = (items) => {
                let processed = items

                // Date filter only if dates provided
                if (fromDate && toDate) {
                    processed = processed.filter(item => {
                        if (!item.date) return false
                        const itemDate = new Date(item.date)

                        // Parse inputs as active local day start/end
                        const [startY, startM, startD] = fromDate.split('-').map(Number)
                        const start = new Date(startY, startM - 1, startD, 0, 0, 0, 0)

                        const [endY, endM, endD] = toDate.split('-').map(Number)
                        const end = new Date(endY, endM - 1, endD, 23, 59, 59, 999)

                        return itemDate >= start && itemDate <= end
                    })
                }

                // If initial load and no search performed, get last 20
                if (isInitialLoad && (!fromDate || !toDate)) {
                    // Sort by date descending (though items might be by ID or creation, let's assume date or ID)
                    // Assuming API returns data, we default to last 20.
                    // We sort by date (newest first) then take top 20.
                    processed = processed.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20)
                }

                return processed
            }

            setPayments(processData(paymentsRes.data))
            setReceipts(processData(receiptsRes.data))
            setAccountInvoices(processData(invoicesRes.data))
            setLoading(false)
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load history')
            setLoading(false)
        }
    }

    const handleSearch = () => {
        if (fromDate && !toDate) {
            toast.error('Please select To Date')
            return
        }
        if (toDate && !fromDate) {
            toast.error('Please select From Date')
            return
        }
        fetchData(false)
    }

    const handleViewDetails = (item, type) => {
        setSelectedItem(item)
        setSelectedType(type)
        setShowOffcanvas(true)
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
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Created By</span>
                        <div className={styles.detailValue}>{selectedItem.created_by_name}</div>
                    </div>
                    {selectedItem.mg_remark && (
                        <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                            <span className={styles.detailLabel}>Manager's Remark</span>
                            <div className={styles.detailValue}>{selectedItem.mg_remark}</div>
                        </div>
                    )}
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
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Created By</span>
                        <div className={styles.detailValue}>{selectedItem.created_by_name}</div>
                    </div>
                    {selectedItem.mg_remark && (
                        <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                            <span className={styles.detailLabel}>Manager's Remark</span>
                            <div className={styles.detailValue}>{selectedItem.mg_remark}</div>
                        </div>
                    )}
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
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Created By</span>
                        <div className={styles.detailValue}>{selectedItem.created_by_name}</div>
                    </div>
                    {selectedItem.mg_remark && (
                        <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                            <span className={styles.detailLabel}>Manager's Remark</span>
                            <div className={styles.detailValue}>{selectedItem.mg_remark}</div>
                        </div>
                    )}
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
                        <th>Status</th>
                        <th>Approved By</th>
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
                                <td>{payment.created_by_name}</td>
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
                        <th>Status</th>
                        <th>Approved By</th>
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
                                <td>{receipt.created_by_name}</td>
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
                        <th>Status</th>
                        <th>Approved By</th>
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
                                <td>{invoice.created_by_name}</td>
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

                    <h2 className={styles.pageTitle}>View History</h2>

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
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="resubmit">Re-edit</option>
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
                                    min={fromDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>
                            <div className="col-md-3 d-flex align-items-end">
                                <button
                                    className={styles.searchButton}
                                    onClick={handleSearch}
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>

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

            {/* Bootstrap Offcanvas - View Details */}
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

export default ViewHistory
