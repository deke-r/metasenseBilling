import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/invoice.module.css'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'

const EditReceiptForm = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [mgRemark, setMgRemark] = useState('')
    const [receiptData, setReceiptData] = useState({
        receipt_no: '',
        date: '',
        party_name: '',
        amount: '',
        po_wo_no: '',
        receipt_center: '',
        accounting_entry_type: '',
        debit_to: '',
        credit_to: '',
        ledger_balance: '',
        document_no: '',
        utr_imps_no: '',
        remarks: ''
    })

    // Fetch existing receipt data
    useEffect(() => {
        const fetchReceiptData = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/receipts/${id}`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                )

                const receipt = response.data

                // Pre-fill form fields
                setReceiptData({
                    receipt_no: receipt.receipt_no || '',
                    date: receipt.date ? new Date(receipt.date).toISOString().split('T')[0] : '',
                    party_name: receipt.party_name || '',
                    amount: receipt.amount || '',
                    po_wo_no: receipt.po_wo_no || '',
                    receipt_center: receipt.receipt_center || '',
                    accounting_entry_type: receipt.accounting_entry_type || '',
                    debit_to: receipt.debit_to || '',
                    credit_to: receipt.credit_to || '',
                    ledger_balance: receipt.ledger_balance || '',
                    document_no: receipt.document_no || '',
                    utr_imps_no: receipt.utr_imps_no || '',
                    remarks: receipt.remarks || ''
                })

                setMgRemark(receipt.mg_remark || '')
                setLoading(false)
            } catch (error) {
                console.error('Error fetching receipt:', error)
                toast.error('Failed to load receipt data')
                setTimeout(() => navigate('/am-view-history'), 2000)
            }
        }

        fetchReceiptData()
    }, [id, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!receiptData.party_name || !receiptData.amount) {
            toast.error('Please fill in Party Name and Amount')
            return
        }

        try {
            const token = localStorage.getItem('token')

            await axios.put(
                `${import.meta.env.VITE_BASE_URL}/receipts/${id}`,
                receiptData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            toast.success('Receipt updated and resubmitted for approval!')
            setTimeout(() => {
                navigate('/am-view-history')
            }, 2000)
        } catch (error) {
            console.error('Error updating receipt:', error)
            const errorMessage = error.response?.data?.message || 'Failed to update receipt'
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

                    <h2 className={styles.pageTitle}>Edit Receipt Entry</h2>

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
                                    <label className={styles.formLabel}>Receipt No *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.receipt_no}
                                        readOnly
                                        style={{ background: '#f9fafb', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Date *</label>
                                    <input
                                        type="date"
                                        className={styles.formInput}
                                        value={receiptData.date}
                                        onChange={(e) => setReceiptData({ ...receiptData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Party Name *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.party_name}
                                        onChange={(e) => setReceiptData({ ...receiptData, party_name: e.target.value })}
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
                                        value={receiptData.amount}
                                        onChange={(e) => setReceiptData({ ...receiptData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>PO/WO No.</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.po_wo_no}
                                        onChange={(e) => setReceiptData({ ...receiptData, po_wo_no: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Receipt Center</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.receipt_center}
                                        onChange={(e) => setReceiptData({ ...receiptData, receipt_center: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Accounting Entry Type</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.accounting_entry_type}
                                        onChange={(e) => setReceiptData({ ...receiptData, accounting_entry_type: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Debit To</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.debit_to}
                                        onChange={(e) => setReceiptData({ ...receiptData, debit_to: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Credit To</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.credit_to}
                                        onChange={(e) => setReceiptData({ ...receiptData, credit_to: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Ledger Balance</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={styles.formInput}
                                        value={receiptData.ledger_balance}
                                        onChange={(e) => setReceiptData({ ...receiptData, ledger_balance: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Document No</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.document_no}
                                        onChange={(e) => setReceiptData({ ...receiptData, document_no: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>UTR/IMPS No.</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.utr_imps_no}
                                        onChange={(e) => setReceiptData({ ...receiptData, utr_imps_no: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-12">
                                    <label className={styles.formLabel}>Remarks</label>
                                    <textarea
                                        className={styles.formInput}
                                        rows="3"
                                        value={receiptData.remarks}
                                        onChange={(e) => setReceiptData({ ...receiptData, remarks: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>

                            {/* Submit Button */}
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
                                    Update and Resubmit for Approval
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditReceiptForm
