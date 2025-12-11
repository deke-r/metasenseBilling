import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Upload } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/invoice.module.css'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'

const AccountInvoiceForm = () => {
    const navigate = useNavigate()
    const [file, setFile] = useState(null)
    const [invoiceNumbers, setInvoiceNumbers] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [searchTimeout, setSearchTimeout] = useState(null)

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        defaultValues: {
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
        }
    })

    const invoiceNoValue = watch('invoice_no')

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
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            // Filter invoice numbers that match the query
            const filtered = response.data.filter(inv =>
                inv.invoice_no.toLowerCase().includes(query.toLowerCase())
            )
            setInvoiceNumbers(filtered)
            setShowSuggestions(filtered.length > 0)
        } catch (error) {
            console.error('Error searching invoice numbers:', error)
        }
    }

    // Handle invoice number input change with debounce
    const handleInvoiceNoChange = (e) => {
        const value = e.target.value
        setValue('invoice_no', value)

        if (searchTimeout) clearTimeout(searchTimeout)

        const timeout = setTimeout(() => {
            searchInvoiceNumbers(value)
        }, 300)

        setSearchTimeout(timeout)
    }

    // Handle invoice selection from suggestions
    const handleInvoiceSelect = (invoice) => {
        setValue('invoice_no', invoice.invoice_no)
        setValue('party_name', invoice.client_name || '')
        setValue('amount', invoice.total_amount || '')
        setShowSuggestions(false)
        setInvoiceNumbers([])
        toast.success('Invoice details auto-filled!')
    }

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(`.${styles.autocompleteWrapper}`)) {
                setShowSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Cleanup timeout on unmount
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

    const onSubmit = async (data) => {
        if (!file) {
            toast.error('Please upload a PDF file')
            return
        }

        try {
            const token = localStorage.getItem('token')
            const formData = new FormData()
            formData.append('data', JSON.stringify(data))
            formData.append('file', file)

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
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Invoice No *</label>
                                    <div className={styles.autocompleteWrapper}>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            {...register('invoice_no', { required: 'Invoice number is required' })}
                                            onChange={handleInvoiceNoChange}
                                            placeholder="e.g., SENSE/25-26/0148"
                                            autoComplete="off"
                                        />
                                        {showSuggestions && invoiceNumbers.length > 0 && (
                                            <div className={styles.suggestionsList}>
                                                {invoiceNumbers.map((invoice, index) => (
                                                    <div
                                                        key={index}
                                                        className={styles.suggestionItem}
                                                        onClick={() => handleInvoiceSelect(invoice)}
                                                    >
                                                        <div className={styles.suggestionName}>{invoice.invoice_no}</div>
                                                        {(invoice.client_name || invoice.total_amount) && (
                                                            <div className={styles.suggestionDetails}>
                                                                {invoice.client_name && <span>{invoice.client_name}</span>}
                                                                {invoice.client_name && invoice.total_amount && <span> • </span>}
                                                                {invoice.total_amount && <span>₹{invoice.total_amount}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {errors.invoice_no && (
                                        <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                                            {errors.invoice_no.message}
                                        </span>
                                    )}
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Date *</label>
                                    <input
                                        type="date"
                                        className={styles.formInput}
                                        {...register('date', { required: 'Date is required' })}
                                    />
                                    {errors.date && (
                                        <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                                            {errors.date.message}
                                        </span>
                                    )}
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Party Name *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        {...register('party_name', { required: 'Party name is required' })}
                                        placeholder="Enter party name"
                                    />
                                    {errors.party_name && (
                                        <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                                            {errors.party_name.message}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={styles.formInput}
                                        {...register('amount', {
                                            required: 'Amount is required',
                                            min: { value: 0.01, message: 'Amount must be greater than 0' }
                                        })}
                                        placeholder="0.00"
                                    />
                                    {errors.amount && (
                                        <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                                            {errors.amount.message}
                                        </span>
                                    )}
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>PO/WO No. *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        {...register('po_wo_no', { required: 'PO/WO number is required' })}
                                        placeholder="Purchase/Work Order No"
                                    />
                                    {errors.po_wo_no && (
                                        <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                                            {errors.po_wo_no.message}
                                        </span>
                                    )}
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Accounting Entry Type *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        {...register('accounting_entry_type', { required: 'Accounting entry type is required' })}
                                        placeholder="e.g., Revenue"
                                    />
                                    {errors.accounting_entry_type && (
                                        <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                                            {errors.accounting_entry_type.message}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Debit To *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        {...register('debit_to', { required: 'Debit account is required' })}
                                        placeholder="Account name"
                                    />
                                    {errors.debit_to && (
                                        <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                                            {errors.debit_to.message}
                                        </span>
                                    )}
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Credit To *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        {...register('credit_to', { required: 'Credit account is required' })}
                                        placeholder="Account name"
                                    />
                                    {errors.credit_to && (
                                        <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                                            {errors.credit_to.message}
                                        </span>
                                    )}
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Ledger Balance *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={styles.formInput}
                                        {...register('ledger_balance', { required: 'Ledger balance is required' })}
                                        placeholder="0.00"
                                    />
                                    {errors.ledger_balance && (
                                        <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                                            {errors.ledger_balance.message}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Upload Invoice PDF *</label>
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
                                    {!file && (
                                        <span style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                                            PDF file is required
                                        </span>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Remarks</label>
                                    <textarea
                                        className={styles.formInput}
                                        {...register('remarks')}
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
