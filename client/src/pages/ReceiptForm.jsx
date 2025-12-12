import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/invoice.module.css'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'

const ReceiptForm = () => {
    const navigate = useNavigate()
    const [receiptData, setReceiptData] = useState({
        receipt_no: '',
        date: new Date().toISOString().split('T')[0],
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



    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!receiptData.party_name || !receiptData.amount) {
            toast.error('Please fill in Party Name and Amount')
            return
        }

        try {
            const token = localStorage.getItem('token')
            await axios.post(
                `${import.meta.env.VITE_BASE_URL}/receipts`,
                receiptData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            toast.success('Receipt submitted for approval!')
            setTimeout(() => {
                const role = localStorage.getItem('userRole') || 'AM'
                navigate(`/dashboard/${role.toLowerCase()}`)
            }, 2000)
        } catch (error) {
            console.error('Error submitting receipt:', error)
            const errorMessage = error.response?.data?.message || 'Failed to submit receipt'
            toast.error(errorMessage)
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

                    <h2 className={styles.pageTitle}>Create Receipt Entry</h2>

                    <div className={styles.formCard}>
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Receipt No *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.receipt_no}
                                        onChange={(e) => setReceiptData({ ...receiptData, receipt_no: e.target.value })}
                                        placeholder="Enter receipt number"
                                        required
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
                                        value={receiptData.amount}
                                        onChange={(e) => setReceiptData({ ...receiptData, amount: e.target.value })}
                                        placeholder="0.00"
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
                                        placeholder="Purchase/Work Order No"
                                    />
                                </div>
                                <div className={" col-md-4"}>
                                    <label className={styles.formLabel}>Receipt Center</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.receipt_center}
                                        onChange={(e) => setReceiptData({ ...receiptData, receipt_center: e.target.value })}
                                        placeholder="Center name"
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
                                        placeholder="e.g., Income"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Debit To</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.debit_to}
                                        onChange={(e) => setReceiptData({ ...receiptData, debit_to: e.target.value })}
                                        placeholder="Account name"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Credit To</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.credit_to}
                                        onChange={(e) => setReceiptData({ ...receiptData, credit_to: e.target.value })}
                                        placeholder="Account name"
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
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Document No</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.document_no}
                                        onChange={(e) => setReceiptData({ ...receiptData, document_no: e.target.value })}
                                        placeholder="Document number"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>UTR/IMPS No.</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.utr_imps_no}
                                        onChange={(e) => setReceiptData({ ...receiptData, utr_imps_no: e.target.value })}
                                        placeholder="Transaction reference"
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-12">
                                    <label className={styles.formLabel}>Remarks</label>
                                    <textarea
                                        className={styles.formInput}
                                        value={receiptData.remarks}
                                        onChange={(e) => setReceiptData({ ...receiptData, remarks: e.target.value })}
                                        placeholder="Additional notes"
                                        rows="3"
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

export default ReceiptForm
