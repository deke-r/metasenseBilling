import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/viewinvoices.module.css'
import invoiceStyles from '../styles/invoice.module.css'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'

const ViewInvoices = () => {
    const navigate = useNavigate()
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedInvoice, setSelectedInvoice] = useState(null)
    const [showPrintView, setShowPrintView] = useState(false)

    useEffect(() => {
        fetchInvoices()
    }, [])

    const fetchInvoices = async () => {
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
            setInvoices(response.data)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching invoices:', error)
            toast.error('Failed to fetch invoices')
            setLoading(false)
        }
    }

    const handleViewPDF = async (invoiceId) => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/invoice/${invoiceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )
            setSelectedInvoice(response.data)
            setShowPrintView(true)

            // Trigger print after a short delay to ensure content is rendered
            setTimeout(() => {
                window.print()
                setShowPrintView(false)
                setSelectedInvoice(null)
            }, 500)
        } catch (error) {
            console.error('Error fetching invoice details:', error)
            toast.error('Failed to load invoice')
        }
    }

    const calculateSubtotal = (items) => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    }

    const calculateTax = (items, taxRate) => {
        return (calculateSubtotal(items) * taxRate) / 100
    }

    const calculateTotal = (items, taxRate) => {
        return calculateSubtotal(items) + calculateTax(items, taxRate)
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    if (showPrintView && selectedInvoice) {
        return (
            <div className={invoiceStyles.invoicePreview} style={{ display: 'block' }}>
                <div className={invoiceStyles.invoicePage}>
                    {/* Header */}
                    <div className={invoiceStyles.invoiceHeader}>
                        <div className={invoiceStyles.logoSection}>
                            <img src="/img/logo.png" alt="MetaSense Logo" className={invoiceStyles.logo} />
                            <div className={invoiceStyles.companyBranding}>
                                <div className={invoiceStyles.brandName}>MetaSense</div>
                            </div>
                        </div>
                        <div className={invoiceStyles.invoiceTitle}>INVOICE</div>
                    </div>

                    {/* Client and Invoice Info */}
                    <div className={invoiceStyles.invoiceInfo}>
                        <div className={invoiceStyles.billedTo}>
                            <div className={invoiceStyles.label}>BILLED TO:</div>
                            <div className={invoiceStyles.clientName}>{selectedInvoice.clientName}</div>
                            <div className={invoiceStyles.clientDetails}>{selectedInvoice.clientPhone}</div>
                            <div className={invoiceStyles.clientDetails}>{selectedInvoice.clientAddress}</div>
                            {selectedInvoice.clientGst && (
                                <div className={invoiceStyles.clientDetails}>GST: {selectedInvoice.clientGst}</div>
                            )}
                        </div>
                        <div className={invoiceStyles.invoiceDetails}>
                            <div className={invoiceStyles.invoiceNumber}>Invoice No. {selectedInvoice.invoiceNo}</div>
                            <div className={invoiceStyles.invoiceDate}>{formatDate(selectedInvoice.invoiceDate)}</div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className={invoiceStyles.itemsTable}>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedInvoice.items.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.description}</td>
                                    <td>{item.quantity}</td>
                                    <td>Rs.{item.unitPrice.toFixed(2)}</td>
                                    <td>Rs.{(item.quantity * item.unitPrice).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className={invoiceStyles.totalsSection}>
                        <div className={invoiceStyles.totalRow}>
                            <span>Subtotal</span>
                            <span>Rs.{calculateSubtotal(selectedInvoice.items).toFixed(2)}</span>
                        </div>
                        <div className={invoiceStyles.totalRow}>
                            <span>GST ({selectedInvoice.taxRate}%)</span>
                            <span>Rs.{calculateTax(selectedInvoice.items, selectedInvoice.taxRate).toFixed(2)}</span>
                        </div>
                        <div className={invoiceStyles.totalRowFinal}>
                            <span>Total</span>
                            <span>Rs.{calculateTotal(selectedInvoice.items, selectedInvoice.taxRate).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={invoiceStyles.invoiceFooter}>
                        <div className={invoiceStyles.paymentInfo}>
                            <div className={invoiceStyles.paymentLabel}>PAYMENT INFORMATION</div>
                            <div className={invoiceStyles.paymentDetails}>{selectedInvoice.paymentInfo.bankName}</div>
                            <div className={invoiceStyles.paymentDetails}>Account Name: {selectedInvoice.paymentInfo.accountName}</div>
                            <div className={invoiceStyles.paymentDetails}>Account No.: {selectedInvoice.paymentInfo.accountNo}</div>
                            <div className={invoiceStyles.paymentDetails}>IFSC Code: {selectedInvoice.paymentInfo.ifscCode}</div>
                            <div className={invoiceStyles.paymentDetails}>Branch: {selectedInvoice.paymentInfo.branch}</div>
                        </div>
                        <div className={invoiceStyles.companyInfo}>
                            <div className={invoiceStyles.companyName}>MetaSense C/o Sense Project Pvt. Ltd.</div>
                            <div className={invoiceStyles.companyDetails}>Regd Address: {selectedInvoice.regdAddress}</div>
                            <div className={invoiceStyles.companyDetails}>Office Address: {selectedInvoice.offcAddress}</div>
                            <div className={invoiceStyles.stampWrapper}>
                                <img src="/img/stamp.png" alt="Stamp" className={invoiceStyles.stamp} />
                                <img src="/img/signature.png" alt="Signature" className={invoiceStyles.signature} />
                            </div>
                        </div>
                    </div>

                    {/* Contact Footer */}
                    <div className={invoiceStyles.contactFooter}>
                        <div className={invoiceStyles.contactItem}>
                            <span className={invoiceStyles.contactIcon}>📞</span>
                            <span>+91-9599196874</span>
                        </div>
                        <div className={invoiceStyles.contactItem}>
                            <span className={invoiceStyles.contactIcon}>✉️</span>
                            <span>info@metasense.in</span>
                        </div>
                        <div className={invoiceStyles.contactItem}>
                            <span className={invoiceStyles.contactIcon}>🌐</span>
                            <span>www.metasense.in</span>
                        </div>
                        <div className={invoiceStyles.contactItem}>
                            <img src="/img/insta.png" alt="Instagram" className={invoiceStyles.contactIconImg} />
                            <span>@metasensedigital</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <Toaster position="top-right" />
            <Navbar />

            <div className={styles.content}>
                <div className="container">
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); navigate('/dashboard/admin') }}
                        className={styles.backButton}
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </a>

                    <h2 className={styles.pageTitle}>View Invoices</h2>

                    {loading ? (
                        <div className={styles.loading}>Loading invoices...</div>
                    ) : invoices.length === 0 ? (
                        <div className={styles.noData}>No invoices found</div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.invoiceTable}>
                                <thead>
                                    <tr>
                                        <th>Invoice No.</th>
                                        <th>Date</th>
                                        <th>Client Name</th>
                                        <th>Total Amount</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id}>
                                            <td>{invoice.invoice_no}</td>
                                            <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                                            <td>{invoice.client_name}</td>
                                            <td>Rs.{parseFloat(invoice.total_amount).toFixed(2)}</td>
                                            <td>
                                                <button
                                                    className={styles.viewButton}
                                                    onClick={() => handleViewPDF(invoice.id)}
                                                >
                                                    <Eye size={16} />
                                                    View PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ViewInvoices
