import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Upload, FileText } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/invoice.module.css'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'

const EditAccountInvoiceForm = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [file, setFile] = useState(null)
    const [existingPDF, setExistingPDF] = useState(null)
    const [loading, setLoading] = useState(true)
    const [invoiceNumbers, setInvoiceNumbers] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [searchTimeout, setSearchTimeout] = useState(null)
    const [mgRemark, setMgRemark] = useState('')

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        defaultValues: {
            invoice_no: '',
            date: '',
            party_name: '',
            amount: '',
            po_wo_no: '',
            accounting_entry_type: '',
            debit_to: '',
            credit_to: '',
            ledger_balance: '',
            remarks: ''
        }
    })

    const invoiceNoValue = watch('invoice_no')

    // Fetch existing invoice data
    useEffect(() => {
        const fetchInvoiceData = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/account-invoices/${id}`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                )

                const invoice = response.data

                // Pre-fill form fields
                setValue('invoice_no', invoice.invoice_no || '')
                setValue('date', invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : '')
                setValue('party_name', invoice.party_name || '')
                setValue('amount', invoice.amount || '')
                setValue('po_wo_no', invoice.po_wo_no || '')
                setValue('accounting_entry_type', invoice.accounting_entry_type || '')
                setValue('debit_to', invoice.debit_to || '')
                setValue('credit_to', invoice.credit_to || '')
                setValue('ledger_balance', invoice.ledger_balance || '')
                setValue('remarks', invoice.remarks || '')

                // Set existing PDF and MG remark
                setExistingPDF(invoice.invoice_pdf_file || null)
                setMgRemark(invoice.mg_remark || '')
                setLoading(false)
            } catch (error) {
                console.error('Error fetching invoice:', error)
                toast.error('Failed to load invoice data')
                setTimeout(() => navigate('/am-view-history'), 2000)
            }
        }

        fetchInvoiceData()
    }, [id, setValue, navigate])

    // Search invoice numbers as user types
    const searchInvoiceNumbers = async (query) => {
        if (!query || query.trim() === '') {
            setInvoiceNumbers([])
            setShowSuggestions(false)
            return
        }

        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/invoice/numbers`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            )

            const filtered = response.data.filter(inv =>
                inv.invoice_no.toLowerCase().includes(query.toLowerCase())
            )
            setInvoiceNumbers(filtered)
            setShowSuggestions(filtered.length > 0)
        } catch (error) {
            console.error('Error searching invoice numbers:', error)
        }
    }

    const handleInvoiceNoChange = (e) => {
        const value = e.target.value
        setValue('invoice_no', value)

        if (searchTimeout) clearTimeout(searchTimeout)

        const timeout = setTimeout(() => {
            searchInvoiceNumbers(value)
        }, 300)

        setSearchTimeout(timeout)
    }

    const handleInvoiceSelect = (invoice) => {
        setValue('invoice_no', invoice.invoice_no)
        setValue('party_name', invoice.client_name || '')
        setValue('amount', invoice.total_amount || '')
        setShowSuggestions(false)
        setInvoiceNumbers([])
        toast.success('Invoice details auto-filled!')
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(`.${styles.autocompleteWrapper}`)) {
                setShowSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout)
            }
        }
    }, [searchTimeout])

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

    const onSubmit = async (data) => {
        try {
            const token = localStorage.getItem('token')
            const formData = new FormData()

            // Backend will automatically change status from resubmit to pending
            formData.append('data', JSON.stringify(data))

            // Add file if new one is uploaded
            if (file) {
                formData.append('file', file)
            }

            await axios.put(
                `${import.meta.env.VITE_BASE_URL}/account-invoices/${id}`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            )

            toast.success('Account Invoice updated and resubmitted for approval!')
            setTimeout(() => {
                navigate('/am-view-history')
            }, 2000)
        } catch (error) {
            console.error('Error updating account invoice:', error)
            toast.error('Failed to update account invoice')
        }
    }

    if (loading) {
        return (
            <div className={styles.invoiceContainer}>
                <Navbar />
                <div className={styles.contentSection}>
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

            <div className={styles.contentSection}>
                <div className="container">
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); navigate('/am-view-history') }}
                        className={styles.backButton}
                    >
                        <ArrowLeft size={18} />
                        Back to History
                    </a>

                    <h2 className={styles.pageTitle}>Edit Account Invoice</h2>

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

                    <form onSubmit={handleSubmit(onSubmit)} className={styles.invoiceForm}>
                        <div className="row g-3">
                            {/* Invoice No with Autocomplete */}
                            <div className="col-md-6">
                                <label className={styles.formLabel}>
                                    Invoice No <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.autocompleteWrapper}>
                                    <input
                                        type="text"
                                        className={`${styles.formInput} ${errors.invoice_no ? styles.inputError : ''}`}
                                        {...register('invoice_no', { required: 'Invoice number is required' })}
                                        autoComplete="off"
                                        disabled
                                        readOnly
                                    />
                                    {showSuggestions && invoiceNumbers.length > 0 && (
                                        <div className={styles.suggestionsList}>
                                            {invoiceNumbers.map((invoice, index) => (
                                                <div
                                                    key={index}
                                                    className={styles.suggestionItem}
                                                    onClick={() => handleInvoiceSelect(invoice)}
                                                >
                                                    <div className={styles.suggestionInvoiceNo}>{invoice.invoice_no}</div>
                                                    <div className={styles.suggestionDetails}>
                                                        {invoice.client_name} - ₹{parseFloat(invoice.total_amount).toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {errors.invoice_no && (
                                    <span className={styles.errorMessage}>{errors.invoice_no.message}</span>
                                )}
                            </div>

                            {/* Date */}
                            <div className="col-md-6">
                                <label className={styles.formLabel}>
                                    Date <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="date"
                                    className={`${styles.formInput} ${errors.date ? styles.inputError : ''}`}
                                    {...register('date', { required: 'Date is required' })}
                                />
                                {errors.date && (
                                    <span className={styles.errorMessage}>{errors.date.message}</span>
                                )}
                            </div>

                            {/* Party Name */}
                            <div className="col-md-6">
                                <label className={styles.formLabel}>
                                    Party Name <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={`${styles.formInput} ${errors.party_name ? styles.inputError : ''}`}
                                    {...register('party_name', { required: 'Party name is required' })}
                                />
                                {errors.party_name && (
                                    <span className={styles.errorMessage}>{errors.party_name.message}</span>
                                )}
                            </div>

                            {/* Amount */}
                            <div className="col-md-6">
                                <label className={styles.formLabel}>
                                    Amount <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={`${styles.formInput} ${errors.amount ? styles.inputError : ''}`}
                                    {...register('amount', {
                                        required: 'Amount is required',
                                        min: { value: 0.01, message: 'Amount must be greater than 0' }
                                    })}
                                />
                                {errors.amount && (
                                    <span className={styles.errorMessage}>{errors.amount.message}</span>
                                )}
                            </div>

                            {/* PO/WO No */}
                            <div className="col-md-6">
                                <label className={styles.formLabel}>PO/WO No</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    {...register('po_wo_no')}
                                />
                            </div>

                            {/* Accounting Entry Type */}
                            <div className="col-md-6">
                                <label className={styles.formLabel}>
                                    Accounting Entry Type <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={`${styles.formInput} ${errors.accounting_entry_type ? styles.inputError : ''}`}
                                    {...register('accounting_entry_type', { required: 'Accounting entry type is required' })}
                                />
                                {errors.accounting_entry_type && (
                                    <span className={styles.errorMessage}>{errors.accounting_entry_type.message}</span>
                                )}
                            </div>

                            {/* Debit To */}
                            <div className="col-md-6">
                                <label className={styles.formLabel}>
                                    Debit To <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={`${styles.formInput} ${errors.debit_to ? styles.inputError : ''}`}
                                    {...register('debit_to', { required: 'Debit to is required' })}
                                />
                                {errors.debit_to && (
                                    <span className={styles.errorMessage}>{errors.debit_to.message}</span>
                                )}
                            </div>

                            {/* Credit To */}
                            <div className="col-md-6">
                                <label className={styles.formLabel}>
                                    Credit To <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={`${styles.formInput} ${errors.credit_to ? styles.inputError : ''}`}
                                    {...register('credit_to', { required: 'Credit to is required' })}
                                />
                                {errors.credit_to && (
                                    <span className={styles.errorMessage}>{errors.credit_to.message}</span>
                                )}
                            </div>

                            {/* Ledger Balance */}
                            <div className="col-md-6">
                                <label className={styles.formLabel}>Ledger Balance</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    {...register('ledger_balance')}
                                />
                            </div>

                            {/* Remarks */}
                            <div className="col-md-6">
                                <label className={styles.formLabel}>Remarks</label>
                                <textarea
                                    className={styles.formInput}
                                    rows="3"
                                    {...register('remarks')}
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
    )
}

export default EditAccountInvoiceForm
