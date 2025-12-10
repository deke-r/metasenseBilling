import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/invoice.module.css'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'

const AccountInvoiceForm = () => {
    const navigate = useNavigate()
    const [file, setFile] = useState(null)
    const [invoiceData, setInvoiceData] = useState({
        invoice_no: '',
        date: new Date().toISOString().split('T')[0],
        party_name: '',
        amount: '',
        po_wo_no: '',
        accounting_entry_type: '',
        debit_to: '',
        credit_to: '',
        ledger_balance: '',
        remarks: ''
    })

    useEffect(() => {
        const fetchNextInvoiceNo = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/account-invoices/next-number`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )
                setInvoiceData(prev => ({ ...prev, invoice_no: response.data.invoice_no }))
            } catch (error) {
                console.error('Error fetching invoice number:', error)
                toast.error('Failed to fetch invoice number')
            }
        }

        fetchNextInvoiceNo()
    }, [])

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile)
        } else {
            toast.error('Please select a PDF file')
            e.target.value = null
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!invoiceData.party_name || !invoiceData.amount) {
            toast.error('Please fill in Party Name and Amount')
            return
        }

        try {
            const token = localStorage.getItem('token')
            const formData = new FormData()
            formData.append('data', JSON.stringify(invoiceData))
            if (file) {
                formData.append('file', file)
            }

            await axios.post(
                `${import.meta.env.VITE_BASE_URL}/account-invoices`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            )

            toast.success('Account Invoice submitted for approval!')
            setTimeout(() => {
                const role = localStorage.getItem('userRole') || 'AM'
                navigate(`/dashboard/${role.toLowerCase()}`)
            }, 2000)
        } catch (error) {
            console.error('Error submitting account invoice:', error)
            toast.error('Failed to submit account invoice')
        }
    }

    return (
        <div className={styles.invoiceContainer}>
            <Toaster position="top-right" />
            <Navbar />

            <div className={styles.formSection}>
                <div className="container">
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); const role = localStorage.getItem('userRole') || 'AM'; navigate(`/dashboard/${role.toLowerCase()}`) }}
                        className={styles.backButton}
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </a>

                    <h2 className={styles.pageTitle}>Create Account Invoice Entry</h2>

                    <div className={styles.formCard}>
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Invoice No *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.invoice_no}
                                        readOnly
                                        style={{ background: '#f9fafb', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Date *</label>
                                    <input
                                        type="date"
                                        className={styles.formInput}
                                        value={invoiceData.date}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Party Name *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.party_name}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, party_name: e.target.value })}
                                        placeholder="Enter party name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={styles.formInput}
                                        value={invoiceData.amount}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, amount: e.target.value })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>PO/WO No.</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.po_wo_no}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, po_wo_no: e.target.value })}
                                        placeholder="Purchase/Work Order No"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Accounting Entry Type</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.accounting_entry_type}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, accounting_entry_type: e.target.value })}
                                        placeholder="e.g., Revenue"
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Debit To</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.debit_to}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, debit_to: e.target.value })}
                                        placeholder="Account name"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Credit To</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.credit_to}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, credit_to: e.target.value })}
                                        placeholder="Account name"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Ledger Balance</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={styles.formInput}
                                        value={invoiceData.ledger_balance}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, ledger_balance: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Upload Invoice PDF</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                            id="fileUpload"
                                        />
                                        <label
                                            htmlFor="fileUpload"
                                            className={styles.formInput}
                                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <Upload size={16} />
                                            {file ? file.name : 'Choose PDF file'}
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Remarks</label>
                                    <textarea
                                        className={styles.formInput}
                                        value={invoiceData.remarks}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, remarks: e.target.value })}
                                        placeholder="Additional notes"
                                        rows="1"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <button
                                    type="submit"
                                    style={{
                                        background: '#0C4379',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 32px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '500'
                                    }}
                                >
                                    Submit for Approval
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AccountInvoiceForm
