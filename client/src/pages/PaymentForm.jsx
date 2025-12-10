import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/invoice.module.css'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'

const PaymentForm = () => {
    const navigate = useNavigate()
    const [file, setFile] = useState(null)
    const [paymentData, setPaymentData] = useState({
        payment_no: '',
        date: new Date().toISOString().split('T')[0],
        party_name: '',
        transaction_type: '',
        amount: '',
        requested_by: '',
        payment_category: '',
        payment_center: '',
        accounting_entry_type: '',
        debit_to: '',
        credit_to: '',
        ledger_balance: '',
        total_budget: '',
        available_budget: '',
        document_no: '',
        utr_imps_no: '',
        remarks: ''
    })

    useEffect(() => {
        const fetchNextPaymentNo = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/payments/next-number`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )
                setPaymentData(prev => ({ ...prev, payment_no: response.data.payment_no }))
            } catch (error) {
                console.error('Error fetching payment number:', error)
                toast.error('Failed to fetch payment number')
            }
        }

        fetchNextPaymentNo()
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

        if (!paymentData.party_name || !paymentData.amount) {
            toast.error('Please fill in Party Name and Amount')
            return
        }

        try {
            const token = localStorage.getItem('token')
            const formData = new FormData()
            formData.append('data', JSON.stringify(paymentData))
            if (file) {
                formData.append('file', file)
            }

            await axios.post(
                `${import.meta.env.VITE_BASE_URL}/payments`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            )

            toast.success('Payment submitted for approval!')
            setTimeout(() => {
                const role = localStorage.getItem('userRole') || 'AM'
                navigate(`/dashboard/${role.toLowerCase()}`)
            }, 2000)
        } catch (error) {
            console.error('Error submitting payment:', error)
            toast.error('Failed to submit payment')
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

                    <h2 className={styles.pageTitle}>Create Payment Entry</h2>

                    <div className={styles.formCard}>
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Payment No *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.payment_no}
                                        readOnly
                                        style={{ background: '#f9fafb', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Date *</label>
                                    <input
                                        type="date"
                                        className={styles.formInput}
                                        value={paymentData.date}
                                        onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Party Name *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.party_name}
                                        onChange={(e) => setPaymentData({ ...paymentData, party_name: e.target.value })}
                                        placeholder="Enter party name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Transaction Type</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.transaction_type}
                                        onChange={(e) => setPaymentData({ ...paymentData, transaction_type: e.target.value })}
                                        placeholder="e.g., Bank Transfer"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={styles.formInput}
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Requested By</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.requested_by}
                                        onChange={(e) => setPaymentData({ ...paymentData, requested_by: e.target.value })}
                                        placeholder="Requester name"
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Payment Category</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.payment_category}
                                        onChange={(e) => setPaymentData({ ...paymentData, payment_category: e.target.value })}
                                        placeholder="e.g., Operational"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Payment Center</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.payment_center}
                                        onChange={(e) => setPaymentData({ ...paymentData, payment_center: e.target.value })}
                                        placeholder="Center name"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Accounting Entry Type</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.accounting_entry_type}
                                        onChange={(e) => setPaymentData({ ...paymentData, accounting_entry_type: e.target.value })}
                                        placeholder="e.g., Expense"
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Debit To</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.debit_to}
                                        onChange={(e) => setPaymentData({ ...paymentData, debit_to: e.target.value })}
                                        placeholder="Account name"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Credit To</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.credit_to}
                                        onChange={(e) => setPaymentData({ ...paymentData, credit_to: e.target.value })}
                                        placeholder="Account name"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Ledger Balance</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={styles.formInput}
                                        value={paymentData.ledger_balance}
                                        onChange={(e) => setPaymentData({ ...paymentData, ledger_balance: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Total Budget</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={styles.formInput}
                                        value={paymentData.total_budget}
                                        onChange={(e) => setPaymentData({ ...paymentData, total_budget: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Available Budget</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={styles.formInput}
                                        value={paymentData.available_budget}
                                        onChange={(e) => setPaymentData({ ...paymentData, available_budget: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Document No</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.document_no}
                                        onChange={(e) => setPaymentData({ ...paymentData, document_no: e.target.value })}
                                        placeholder="Document number"
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>UTR/IMPS No</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.utr_imps_no}
                                        onChange={(e) => setPaymentData({ ...paymentData, utr_imps_no: e.target.value })}
                                        placeholder="Transaction reference"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Upload PDF</label>
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
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Remarks</label>
                                    <textarea
                                        className={styles.formInput}
                                        value={paymentData.remarks}
                                        onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
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

export default PaymentForm
