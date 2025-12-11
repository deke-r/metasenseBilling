import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, FileText } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/invoice.module.css'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'

const EditReceiptForm = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [file, setFile] = useState(null)
    const [existingPDF, setExistingPDF] = useState(null)
    const [loading, setLoading] = useState(true)
    const [mgRemark, setMgRemark] = useState('')
    const [receiptData, setReceiptData] = useState({
        receipt_no: '',
        date: '',
        party_name: '',
        amount: '',
        po_wo_no: '',
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
                    remarks: receipt.remarks || ''
                })

                // Set existing PDF and MG remark
                setExistingPDF(receipt.file_pdf || null)
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

        if (!receiptData.party_name || !receiptData.amount) {
            toast.error('Please fill in Party Name and Amount')
            return
        }

        try {
            const token = localStorage.getItem('token')
            const formData = new FormData()

            // Backend will automatically change status from resubmit to pending
            formData.append('data', JSON.stringify(receiptData))

            // Add file if new one is uploaded
            if (file) {
                formData.append('file', file)
            }

            await axios.put(
                `${import.meta.env.VITE_BASE_URL}/receipts/${id}`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            )

            toast.success('Receipt updated and resubmitted for approval!')
            setTimeout(() => {
                navigate('/am-view-history')
            }, 2000)
        } catch (error) {
            console.error('Error updating receipt:', error)
            toast.error('Failed to update receipt')
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
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Receipt No *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.receipt_no}
                                        onChange={(e) => setReceiptData({ ...receiptData, receipt_no: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Date *</label>
                                    <input
                                        type="date"
                                        className={styles.formInput}
                                        value={receiptData.date}
                                        onChange={(e) => setReceiptData({ ...receiptData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Party Name *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.party_name}
                                        onChange={(e) => setReceiptData({ ...receiptData, party_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
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
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>PO/WO No</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={receiptData.po_wo_no}
                                        onChange={(e) => setReceiptData({ ...receiptData, po_wo_no: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Remarks</label>
                                    <textarea
                                        className={styles.formInput}
                                        rows="3"
                                        value={receiptData.remarks}
                                        onChange={(e) => setReceiptData({ ...receiptData, remarks: e.target.value })}
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

export default EditReceiptForm
