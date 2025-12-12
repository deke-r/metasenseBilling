import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, FileText } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/invoice.module.css'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'

const EditPaymentForm = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [file, setFile] = useState(null)
    const [existingPDF, setExistingPDF] = useState(null)
    const [loading, setLoading] = useState(true)
    const [mgRemark, setMgRemark] = useState('')
    const [paymentData, setPaymentData] = useState({
        payment_no: '',
        date: '',
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

    // Fetch existing payment data
    useEffect(() => {
        const fetchPaymentData = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/payments/${id}`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                )

                const payment = response.data

                // Pre-fill form fields
                setPaymentData({
                    payment_no: payment.payment_no || '',
                    date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : '',
                    party_name: payment.party_name || '',
                    transaction_type: payment.transaction_type || '',
                    amount: payment.amount || '',
                    requested_by: payment.requested_by || '',
                    payment_category: payment.payment_category || '',
                    payment_center: payment.payment_center || '',
                    accounting_entry_type: payment.accounting_entry_type || '',
                    debit_to: payment.debit_to || '',
                    credit_to: payment.credit_to || '',
                    ledger_balance: payment.ledger_balance || '',
                    total_budget: payment.total_budget || '',
                    available_budget: payment.available_budget || '',
                    document_no: payment.document_no || '',
                    utr_imps_no: payment.utr_imps_no || '',
                    remarks: payment.remarks || ''
                })

                // Set existing PDF and MG remark
                setExistingPDF(payment.file_pdf || null)
                setMgRemark(payment.mg_remark || '')
                setLoading(false)
            } catch (error) {
                console.error('Error fetching payment:', error)
                toast.error('Failed to load payment data')
                setTimeout(() => navigate('/am-view-history'), 2000)
            }
        }

        fetchPaymentData()
    }, [id, navigate])

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile)
        } else {
            toast.error('Please select a PDF file')
            e.target.value = null
        }
    }

    const viewExistingPDF = () => {
        if (existingPDF) {
            window.open(`${import.meta.env.VITE_PDF_URL}${existingPDF}`, '_blank')
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

            // Backend will automatically change status from resubmit to pending
            formData.append('data', JSON.stringify(paymentData))

            // Add file if new one is uploaded
            if (file) {
                formData.append('file', file)
            }

            await axios.put(
                `${import.meta.env.VITE_BASE_URL}/payments/${id}`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            )

            toast.success('Payment updated and resubmitted for approval!')
            setTimeout(() => {
                navigate('/am-view-history')
            }, 2000)
        } catch (error) {
            console.error('Error updating payment:', error)
            const errorMessage = error.response?.data?.message || 'Failed to update payment'
            toast.error(errorMessage)
        }
    }

    if (loading) {
        return (
            <div className={styles.invoiceContainer}>
                <Navbar />
                <div className={styles.formSection}>
                    <div className="container">
                        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.invoiceContainer}>
            <Toaster position="top-right" />
            <Navbar />

            <div className={styles.formSection}>
                <div className="container">
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); navigate('/am-view-history') }}
                        className={styles.backButton}
                    >
                        <ArrowLeft size={18} />
                        Back to History
                    </a>

                    <h2 className={styles.pageTitle}>Edit Payment Entry</h2>

                    {/* Manager's Remark */}
                    {mgRemark && (
                        <div style={{
                            background: '#fff3cd',
                            border: '1px solid #ffc107',
                            padding: '1rem',
                            borderRadius: '0',
                            marginBottom: '1.5rem'
                        }}>
                            <strong>Manager's Remark:</strong> {mgRemark}
                        </div>
                    )}

                    <div className={styles.formCard}>
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Payment No *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.payment_no}
                                        onChange={(e) => setPaymentData({ ...paymentData, payment_no: e.target.value })}
                                        required
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
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Transaction Type</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.transaction_type}
                                        onChange={(e) => setPaymentData({ ...paymentData, transaction_type: e.target.value })}
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
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Payment Category</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.payment_category}
                                        onChange={(e) => setPaymentData({ ...paymentData, payment_category: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Payment Center</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.payment_center}
                                        onChange={(e) => setPaymentData({ ...paymentData, payment_center: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Accounting Entry Type</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.accounting_entry_type}
                                        onChange={(e) => setPaymentData({ ...paymentData, accounting_entry_type: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Debit To</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.debit_to}
                                        onChange={(e) => setPaymentData({ ...paymentData, debit_to: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Credit To</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.credit_to}
                                        onChange={(e) => setPaymentData({ ...paymentData, credit_to: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Ledger Balance</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.ledger_balance}
                                        onChange={(e) => setPaymentData({ ...paymentData, ledger_balance: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Total Budget</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.total_budget}
                                        onChange={(e) => setPaymentData({ ...paymentData, total_budget: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Available Budget</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.available_budget}
                                        onChange={(e) => setPaymentData({ ...paymentData, available_budget: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Document No</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.document_no}
                                        onChange={(e) => setPaymentData({ ...paymentData, document_no: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>UTR/IMPS No</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={paymentData.utr_imps_no}
                                        onChange={(e) => setPaymentData({ ...paymentData, utr_imps_no: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-8">
                                    <label className={styles.formLabel}>Remarks</label>
                                    <textarea
                                        className={styles.formInput}
                                        rows="3"
                                        value={paymentData.remarks}
                                        onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                                    ></textarea>
                                </div>

                                {/* Existing PDF */}
                                {existingPDF && (
                                    <div className="col-12">
                                        <label className={styles.formLabel}>Current PDF</label>
                                        <button
                                            type="button"
                                            onClick={viewExistingPDF}
                                            className={styles.viewPdfButton}
                                        >
                                            <FileText size={18} />
                                            View Current PDF
                                        </button>
                                    </div>
                                )}

                                {/* Upload New PDF */}
                                <div className="col-12">
                                    <label className={styles.formLabel}>
                                        {existingPDF ? 'Upload New PDF (Optional - replaces current)' : 'Upload PDF'}
                                    </label>
                                    <div className={styles.fileUpload}>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                            className={styles.fileInput}
                                            id="pdfFile"
                                        />
                                        <label htmlFor="pdfFile" className={styles.fileLabel}>
                                            <Upload size={20} />
                                            {file ? file.name : 'Choose PDF file'}
                                        </label>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="col-12">
                                    <button type="submit" className={styles.submitButton}>
                                        Update and Resubmit for Approval
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditPaymentForm
