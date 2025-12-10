import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Printer } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/invoice.module.css'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'
import QRCode from 'qrcode'

const Invoice = () => {
    const navigate = useNavigate()
    const qrCanvasRef = useRef(null)
    const [invoiceData, setInvoiceData] = useState({
        // IRN and Ask details
        irn: '',
        askNo: '',
        askDate: new Date().toISOString().split('T')[0],

        // Invoice details
        invoiceNo: '',
        invoiceDate: new Date().toISOString().split('T')[0],

        // Client/Buyer details
        clientName: '',
        clientPhone: '',
        clientAddress: '',
        clientGst: '',
        buyerGstin: '',
        buyerStateName: '',
        buyerStateCode: '',

        // Consignee details
        consigneeName: '',
        consigneeAddress: '',
        consigneeGstin: '',
        consigneeStateName: '',
        consigneeStateCode: '',

        // Items
        items: [{ description: '', hsnSac: '', quantity: 1, unitPrice: 0, perUnit: 'ton' }],
        taxRate: 18,

        // Seller details
        sellerName: '',
        sellerGstin: '',
        sellerStateName: '',
        sellerStateCode: '',
        sellerEmail: '',
        regdAddress: '',
        offcAddress: '',

        // Delivery and shipping details
        deliveryNote: '',
        modeTermsOfPayment: '',
        referenceNoDate: '',
        otherReferences: '',
        buyersOrderNo: '',
        buyersOrderDate: '',
        dispatchDocNo: '',
        deliveryNoteDate: '',
        dispatchedThrough: '',
        destination: '',
        termsOfDelivery: '',

        // Payment info
        paymentInfo: {
            bankName: '',
            accountName: '',
            accountNo: '',
            ifscCode: '',
            branch: ''
        }
    })
    const [nextInvoiceNumber, setNextInvoiceNumber] = useState(null)
    const [clientSuggestions, setClientSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [consigneeSuggestions, setConsigneeSuggestions] = useState([])
    const [showConsigneeSuggestions, setShowConsigneeSuggestions] = useState(false)
    const [searchTimeout, setSearchTimeout] = useState(null)
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')

    // Fetch next invoice number on component mount
    useEffect(() => {
        const fetchNextInvoiceNumber = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/invoice/next-number`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )

                setInvoiceData(prev => ({
                    ...prev,
                    invoiceNo: response.data.invoiceNo,
                    irn: response.data.generatedIrn || '',
                    askNo: response.data.nextAckNo || ''
                }))
                setNextInvoiceNumber(response.data.nextNumber)
            } catch (error) {
                console.error('Error fetching invoice number:', error)
                toast.error('Failed to fetch invoice number')
            }
        }

        fetchNextInvoiceNumber()
    }, [])

    // Fetch company settings on component mount
    useEffect(() => {
        const fetchCompanySettings = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/settings/company`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )

                const settings = response.data
                setInvoiceData(prev => ({
                    ...prev,
                    paymentInfo: {
                        bankName: settings.bank_name || '',
                        accountName: settings.account_name || '',
                        accountNo: settings.account_number || '',
                        ifscCode: settings.ifsc_code || '',
                        branch: settings.branch || ''
                    },
                    sellerName: (settings.seller_name === 'Meta Sense' ? 'Sense Projects Private Limited' : settings.seller_name) || '',
                    regdAddress: settings.regd_address || '',
                    offcAddress: settings.offc_address || ''
                }))
            } catch (error) {
                console.error('Error fetching company settings:', error)
                toast.error('Failed to fetch company settings')
            }
        }

        fetchCompanySettings()
    }, [])

    // Generate QR code when IRN changes
    useEffect(() => {
        if (invoiceData.irn && invoiceData.irn.trim() !== '') {
            QRCode.toDataURL(invoiceData.irn, { width: 150, margin: 1 })
                .then(url => {
                    setQrCodeDataUrl(url)
                })
                .catch(err => {
                    console.error('Error generating QR code:', err)
                })
        } else {
            setQrCodeDataUrl('')
        }
    }, [invoiceData.irn])

    // Search clients as user types (Reusable for both)
    const searchClients = async (query, type = 'buyer') => {
        if (!query || query.trim() === '') {
            if (type === 'buyer') {
                setClientSuggestions([])
                setShowSuggestions(false)
            } else {
                setConsigneeSuggestions([])
                setShowConsigneeSuggestions(false)
            }
            return
        }

        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/clients/search?query=${encodeURIComponent(query)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            if (type === 'buyer') {
                setClientSuggestions(response.data)
                setShowSuggestions(response.data.length > 0)
            } else {
                setConsigneeSuggestions(response.data)
                setShowConsigneeSuggestions(response.data.length > 0)
            }
        } catch (error) {
            console.error('Error searching clients:', error)
        }
    }

    // Handle client name input change with debounce
    const handleClientNameChange = (e) => {
        const value = e.target.value
        setInvoiceData({ ...invoiceData, clientName: value })

        if (searchTimeout) clearTimeout(searchTimeout)

        const timeout = setTimeout(() => {
            searchClients(value, 'buyer')
        }, 300)

        setSearchTimeout(timeout)
    }

    // Handle consignee name input change with debounce
    const handleConsigneeNameChange = (e) => {
        const value = e.target.value
        setInvoiceData({ ...invoiceData, consigneeName: value })

        if (searchTimeout) clearTimeout(searchTimeout)

        const timeout = setTimeout(() => {
            searchClients(value, 'consignee')
        }, 300)

        setSearchTimeout(timeout)
    }

    // Handle client selection from suggestions
    const handleClientSelect = (client) => {
        setInvoiceData({
            ...invoiceData,
            clientName: client.name,
            clientPhone: client.phone || '',
            clientAddress: client.address || '',
            clientGst: client.gst || '',
            buyerGstin: client.gst || '',
            buyerStateName: client.state_name || '',
            buyerStateCode: client.state_code || ''
        })
        setShowSuggestions(false)
        setClientSuggestions([])
    }

    // Handle consignee selection from suggestions
    const handleConsigneeSelect = (client) => {
        setInvoiceData({
            ...invoiceData,
            consigneeName: client.name,
            consigneeAddress: client.address || '',
            consigneeGstin: client.gst || '',
            consigneeStateName: client.state_name || '',
            consigneeStateCode: client.state_code || ''
        })
        setShowConsigneeSuggestions(false)
        setConsigneeSuggestions([])
    }

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(`.${styles.autocompleteWrapper}`)) {
                setShowSuggestions(false)
                setShowConsigneeSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const addItem = () => {
        setInvoiceData({
            ...invoiceData,
            items: [...invoiceData.items, { description: '', hsnSac: '', quantity: 1, unitPrice: 0, perUnit: 'ton' }]
        })
    }

    const removeItem = (index) => {
        const newItems = invoiceData.items.filter((_, i) => i !== index)
        setInvoiceData({ ...invoiceData, items: newItems })
    }

    const updateItem = (index, field, value) => {
        const newItems = [...invoiceData.items]
        newItems[index][field] = value
        setInvoiceData({ ...invoiceData, items: newItems })
    }

    const calculateSubtotal = () => {
        return invoiceData.items.reduce((sum, item) => {
            return sum + (item.quantity * item.unitPrice)
        }, 0)
    }

    const calculateTax = () => {
        return (calculateSubtotal() * invoiceData.taxRate) / 100
    }

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax()
    }

    // Convert number to words (Indian numbering system)
    const numberToWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

        if (num === 0) return 'Zero'

        const numToWords = (n) => {
            if (n < 10) return ones[n]
            if (n < 20) return teens[n - 10]
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
            if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + numToWords(n % 100) : '')
            if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numToWords(n % 1000) : '')
            if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + numToWords(n % 100000) : '')
            return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + numToWords(n % 10000000) : '')
        }

        const rupees = Math.floor(num)
        const paise = Math.round((num - rupees) * 100)

        let words = 'INR ' + numToWords(rupees) + ' Only'
        return words
    }

    const handlePrint = async () => {
        if (!invoiceData.invoiceNo || !invoiceData.clientName) {
            toast.error('Please fill in Invoice Number and Client Name')
            return
        }

        try {
            const token = localStorage.getItem('token')

            // Save invoice and increment counter
            await axios.post(
                `${import.meta.env.VITE_BASE_URL}/invoice/save`,
                { invoiceData },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            // Trigger print
            window.print()

            // Show success message after print dialog closes
            toast.success('Invoice generated successfully!')

            // Optionally redirect back to dashboard after a delay
            setTimeout(() => {
                const role = localStorage.getItem('userRole') || 'AM'
                navigate(`/dashboard/${role.toLowerCase()}`)
            }, 2000)
        } catch (error) {
            console.error('Error saving invoice:', error)
            toast.error('Failed to save invoice')
        }
    }

    return (
        <div className={styles.invoiceContainer}>
            <Toaster position="top-right" />
            <Navbar />

            {/* Form Section - Hidden on print */}
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

                    <h2 className={styles.pageTitle}>Generate Tax Invoice</h2>

                    <div className={styles.formCard}>
                        {/* IRN and Ask Details */}
                        <div className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>IRN & Ask Details</h3>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>IRN</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.irn}
                                        readOnly
                                        placeholder="Auto-generated"
                                        style={{ background: '#f9fafb', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Ack No.</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.askNo}
                                        readOnly
                                        placeholder="Auto-generated"
                                        style={{ background: '#f9fafb', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Ack Date</label>
                                    <input
                                        type="date"
                                        className={styles.formInput}
                                        value={invoiceData.askDate}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, askDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Invoice Details */}
                        <div className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>Invoice Details</h3>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Invoice Number *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.invoiceNo}
                                        readOnly
                                        placeholder="Loading..."
                                        style={{ background: '#f9fafb', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Invoice Date</label>
                                    <input
                                        type="date"
                                        className={styles.formInput}
                                        value={invoiceData.invoiceDate}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Buyer Information */}
                        <div className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>Buyer Information</h3>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Buyer Name *</label>
                                    <div className={styles.autocompleteWrapper}>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            value={invoiceData.clientName}
                                            onChange={handleClientNameChange}
                                            placeholder="Buyer Name"
                                            autoComplete="off"
                                        />
                                        {showSuggestions && clientSuggestions.length > 0 && (
                                            <div className={styles.suggestionsList}>
                                                {clientSuggestions.map((client) => (
                                                    <div
                                                        key={client.id}
                                                        className={styles.suggestionItem}
                                                        onClick={() => handleClientSelect(client)}
                                                    >
                                                        <div className={styles.suggestionName}>{client.name}</div>
                                                        {(client.phone || client.address) && (
                                                            <div className={styles.suggestionDetails}>
                                                                {client.phone && <span>{client.phone}</span>}
                                                                {client.phone && client.address && <span> • </span>}
                                                                {client.address && <span>{client.address}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Phone Number</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.clientPhone}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, clientPhone: e.target.value })}
                                        placeholder="+91-XXXXXXXXXX"
                                    />
                                </div>
                                <div className="col-12">
                                    <label className={styles.formLabel}>Address</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.clientAddress}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, clientAddress: e.target.value })}
                                        placeholder="Buyer Address"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>GSTIN/UIN</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.buyerGstin}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, buyerGstin: e.target.value })}
                                        placeholder="GSTIN/UIN"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>State Name</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.buyerStateName}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, buyerStateName: e.target.value })}
                                        placeholder="e.g., Delhi"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>State Code</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.buyerStateCode}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, buyerStateCode: e.target.value })}
                                        placeholder="e.g., 07"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Consignee Information */}
                        <div className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>Consignee (Ship to)</h3>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Consignee Name</label>
                                    <div className={styles.autocompleteWrapper}>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            value={invoiceData.consigneeName}
                                            onChange={handleConsigneeNameChange}
                                            placeholder="Consignee Name"
                                            autoComplete="off"
                                        />
                                        {showConsigneeSuggestions && consigneeSuggestions.length > 0 && (
                                            <div className={styles.suggestionsList}>
                                                {consigneeSuggestions.map((client) => (
                                                    <div
                                                        key={client.id}
                                                        className={styles.suggestionItem}
                                                        onClick={() => handleConsigneeSelect(client)}
                                                    >
                                                        <div className={styles.suggestionName}>{client.name}</div>
                                                        {(client.phone || client.address) && (
                                                            <div className={styles.suggestionDetails}>
                                                                {client.phone && <span>{client.phone}</span>}
                                                                {client.phone && client.address && <span> • </span>}
                                                                {client.address && <span>{client.address}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Consignee Address</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.consigneeAddress}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, consigneeAddress: e.target.value })}
                                        placeholder="Consignee Address"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>GSTIN/UIN</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.consigneeGstin}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, consigneeGstin: e.target.value })}
                                        placeholder="GSTIN/UIN"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>State Name</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.consigneeStateName}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, consigneeStateName: e.target.value })}
                                        placeholder="e.g., Rajasthan"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>State Code</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.consigneeStateCode}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, consigneeStateCode: e.target.value })}
                                        placeholder="e.g., 08"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>Items</h3>
                            {invoiceData.items.map((item, index) => (
                                <div key={index} className={styles.itemRow}>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className={styles.formLabel}>Description</label>
                                            <input
                                                type="text"
                                                className={styles.formInput}
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                placeholder="Item description"
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className={styles.formLabel}>HSN/SAC</label>
                                            <input
                                                type="text"
                                                className={styles.formInput}
                                                value={item.hsnSac}
                                                onChange={(e) => updateItem(index, 'hsnSac', e.target.value)}
                                                placeholder="995463"
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className={styles.formLabel}>Quantity</label>
                                            <input
                                                type="number"
                                                className={styles.formInput}
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className={styles.formLabel}>Rate (Rs.)</label>
                                            <input
                                                type="number"
                                                className={styles.formInput}
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        <div className="col-md-1">
                                            <label className={styles.formLabel}>Per</label>
                                            <select
                                                className={styles.formInput}
                                                value={item.perUnit}
                                                onChange={(e) => updateItem(index, 'perUnit', e.target.value)}
                                            >
                                                <option value="ton">ton</option>
                                                <option value="kg">kg</option>
                                                <option value="piece">piece</option>
                                                <option value="box">box</option>
                                                <option value="unit">unit</option>
                                            </select>
                                        </div>
                                        <div className="col-md-1 d-flex align-items-end">
                                            {invoiceData.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    className={styles.removeBtn}
                                                    onClick={() => removeItem(index)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                className={styles.addItemBtn}
                                onClick={addItem}
                            >
                                <Plus size={18} />
                                Add Item
                            </button>
                        </div>

                        {/* Tax */}
                        <div className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>GST</h3>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>GST Rate (%)</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        value={invoiceData.taxRate}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, taxRate: parseFloat(e.target.value) || 0 })}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Delivery and Shipping Details */}
                        <div className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>Delivery & Shipping Details</h3>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Delivery Note</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.deliveryNote}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, deliveryNote: e.target.value })}
                                        placeholder="Delivery Note"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Mode/Terms of Payment</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.modeTermsOfPayment}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, modeTermsOfPayment: e.target.value })}
                                        placeholder="Mode/Terms of Payment"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Reference No. & Date</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.referenceNoDate}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, referenceNoDate: e.target.value })}
                                        placeholder="Reference No. & Date"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Other References</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.otherReferences}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, otherReferences: e.target.value })}
                                        placeholder="Other References"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Buyer's Order No.</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.buyersOrderNo}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, buyersOrderNo: e.target.value })}
                                        placeholder="Buyer's Order No."
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Buyer's Order Date</label>
                                    <input
                                        type="date"
                                        className={styles.formInput}
                                        value={invoiceData.buyersOrderDate}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, buyersOrderDate: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Dispatch Doc No.</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.dispatchDocNo}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, dispatchDocNo: e.target.value })}
                                        placeholder="Dispatch Doc No."
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Delivery Note Date</label>
                                    <input
                                        type="date"
                                        className={styles.formInput}
                                        value={invoiceData.deliveryNoteDate}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, deliveryNoteDate: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Dispatched through</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.dispatchedThrough}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, dispatchedThrough: e.target.value })}
                                        placeholder="Dispatched through"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Destination</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.destination}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, destination: e.target.value })}
                                        placeholder="Destination"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Terms of Delivery</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.termsOfDelivery}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, termsOfDelivery: e.target.value })}
                                        placeholder="Terms of Delivery"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Seller Information */}
                        <div className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>Seller Information</h3>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Seller Name</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.sellerName}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, sellerName: e.target.value })}
                                        placeholder="Seller Name"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Seller Email</label>
                                    <input
                                        type="email"
                                        className={styles.formInput}
                                        value={invoiceData.sellerEmail}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, sellerEmail: e.target.value })}
                                        placeholder="info@example.com"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>GSTIN/UIN</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.sellerGstin}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, sellerGstin: e.target.value })}
                                        placeholder="GSTIN/UIN"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>State Name</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.sellerStateName}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, sellerStateName: e.target.value })}
                                        placeholder="e.g., Delhi"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>State Code</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.sellerStateCode}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, sellerStateCode: e.target.value })}
                                        placeholder="e.g., 07"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Regd Address</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.regdAddress}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, regdAddress: e.target.value })}
                                        placeholder="Registered Address"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Office Address</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.offcAddress}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, offcAddress: e.target.value })}
                                        placeholder="Office Address"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>Payment Information</h3>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Bank Name</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.paymentInfo.bankName}
                                        readOnly
                                        placeholder="Loading..."
                                        style={{ background: '#f9fafb', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Account Name</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.paymentInfo.accountName}
                                        readOnly
                                        placeholder="Loading..."
                                        style={{ background: '#f9fafb', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Account Number</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.paymentInfo.accountNo}
                                        readOnly
                                        placeholder="Loading..."
                                        style={{ background: '#f9fafb', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>IFSC Code</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.paymentInfo.ifscCode}
                                        readOnly
                                        placeholder="Loading..."
                                        style={{ background: '#f9fafb', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Branch</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.paymentInfo.branch}
                                        readOnly
                                        placeholder="Loading..."
                                        style={{ background: '#f9fafb', cursor: 'not-allowed' }}
                                    />
                                </div>

                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            type="button"
                            className={styles.generateBtn}
                            onClick={handlePrint}
                        >
                            <Printer size={18} />
                            Generate Invoice (Print)
                        </button>
                    </div>
                </div>
            </div>

            {/* Invoice Preview - Visible on print */}
            <div className={styles.invoicePreview}>
                <div className={styles.taxInvoicePage}>
                    <div className={styles.titleSection}>
                        <h1 className={styles.taxInvoiceTitle}>Tax Invoice</h1>
                    </div>
                    {/* Header with IRN and QR Code */}
                    <div className={styles.taxInvoiceHeader}>
                        <div className={styles.irnSection}>
                            <div className={styles.irnLabel}>IRN : <strong>{invoiceData.irn || 'N/A'}</strong></div>
                            <div className={styles.askDetails}>
                                <div>Ack No. : <strong>{invoiceData.askNo || 'N/A'}</strong></div>
                                <div>Ack Date : <strong>{invoiceData.askDate ? new Date(invoiceData.askDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</strong></div>
                            </div>
                        </div>
                        <div className={styles.qrSection}>
                            <div className={styles.eInvoiceLabel}>e-Invoice</div>
                            {qrCodeDataUrl && (
                                <img src={qrCodeDataUrl} alt="QR Code" className={styles.qrCode} />
                            )}
                        </div>
                    </div>

                    {/* Main Invoice Table */}
                    <div className={styles.taxInvoiceBody}>
                        <table className={styles.mainInvoiceTable}>
                            <tbody>
                                {/* Seller and Invoice Details Row */}
                                <tr>
                                    <td style={{ width: '50%', verticalAlign: 'top' }}>
                                        <div className={styles.companyName}>{invoiceData.sellerName || 'Sense Projects Private Limited'}</div>
                                        <div>{invoiceData.regdAddress || 'Address'}</div>
                                        <div>GSTIN/UIN : {invoiceData.sellerGstin || 'N/A'}</div>
                                        <div>State Name : {invoiceData.sellerStateName || 'Delhi'}, Code : {invoiceData.sellerStateCode || '07'}</div>
                                        <div>E-Mail : {invoiceData.sellerEmail || 'info@senseprojects.in'}</div>
                                    </td>
                                    <td style={{ width: '50%', padding: 0, verticalAlign: 'top', height: '1px' }} rowSpan="3">
                                        <table className={styles.nestedTable}>
                                            <tbody>
                                                <tr>
                                                    <td className='border-bottom-0' style={{ width: '50%' }}>Invoice No.</td>
                                                    <td className='border-bottom-0' style={{ width: '50%' }}>Dated</td>
                                                </tr>
                                                <tr>
                                                    <td><span className={styles.semiBold}>{invoiceData.invoiceNo || 'N/A'}</span></td>
                                                    <td><span className={styles.semiBold}>{invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString('en-GB').replace(/\//g, '-') : 'N/A'}</span></td>
                                                </tr>
                                                <tr>
                                                    <td className='border-bottom-0'>Delivery Note</td>
                                                    <td className='border-bottom-0'>Mode/Terms of Payment</td>
                                                </tr>
                                                <tr>
                                                    <td>{invoiceData.deliveryNote || ''}</td>
                                                    <td>{invoiceData.modeTermsOfPayment || ''}</td>
                                                </tr>
                                                <tr>
                                                    <td className='border-bottom-0'>Reference No. & Date.</td>
                                                    <td className='border-bottom-0'>Other References</td>
                                                </tr>
                                                <tr>
                                                    <td>{invoiceData.referenceNoDate || ''}</td>
                                                    <td>{invoiceData.otherReferences || ''}</td>
                                                </tr>
                                                <tr>
                                                    <td className='border-bottom-0'>Buyer's Order No.</td>
                                                    <td className='border-bottom-0'>Dated</td>
                                                </tr>
                                                <tr>
                                                    <td>{invoiceData.buyersOrderNo || ''}</td>
                                                    <td>{invoiceData.buyersOrderDate ? new Date(invoiceData.buyersOrderDate).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</td>
                                                </tr>
                                                <tr>
                                                    <td className='border-bottom-0'>Dispatch Doc No.</td>
                                                    <td className='border-bottom-0'>Delivery Note Date</td>
                                                </tr>
                                                <tr>
                                                    <td>{invoiceData.dispatchDocNo || ''}</td>
                                                    <td>{invoiceData.deliveryNoteDate ? new Date(invoiceData.deliveryNoteDate).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</td>
                                                </tr>
                                                <tr>
                                                    <td className='border-bottom-0'>Dispatched through</td>
                                                    <td className='border-bottom-0'>Destination</td>
                                                </tr>
                                                <tr>
                                                    <td>{invoiceData.dispatchedThrough || ''}</td>
                                                    <td>{invoiceData.destination || ''}</td>
                                                </tr>
                                                <tr>
                                                    <td className='border-bottom-0 border-end-0' colSpan="2">Terms of Delivery</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan="2" className='border-end-0' style={{ height: '48px' }}>{invoiceData.termsOfDelivery || ''}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>

                                {/* Consignee Row - LEFT COLUMN ONLY */}
                                <tr>
                                    <td style={{ verticalAlign: 'top' }}>
                                        <div className={styles.sectionLabel}>Consignee (Ship to)</div>
                                        <div className={styles.consigneeName}>{invoiceData.consigneeName || invoiceData.clientName || 'Consignee Name'}</div>
                                        <div>{invoiceData.consigneeAddress || invoiceData.clientAddress || 'Address'}</div>
                                        <div>GSTIN/UIN : {invoiceData.consigneeGstin || invoiceData.buyerGstin || 'N/A'}</div>
                                        <div>State Name : {invoiceData.consigneeStateName || invoiceData.buyerStateName || 'N/A'}, Code : {invoiceData.consigneeStateCode || invoiceData.buyerStateCode || 'N/A'}</div>
                                    </td>
                                </tr>

                                {/* Buyer Row - LEFT COLUMN ONLY */}
                                <tr>
                                    <td style={{ verticalAlign: 'top' }}>
                                        <div className={styles.sectionLabel}>Buyer (Bill to)</div>
                                        <div className={styles.buyerName}>{invoiceData.clientName || 'Buyer Name'}</div>
                                        <div>{invoiceData.clientAddress || 'Address'}</div>
                                        <div>GSTIN/UIN : {invoiceData.buyerGstin || 'N/A'}</div>
                                        <div>State Name : {invoiceData.buyerStateName || 'N/A'}, Code : {invoiceData.buyerStateCode || 'N/A'}</div>
                                    </td>
                                </tr>

                            </tbody>
                        </table>

                        {/* Items Table */}
                        <table className={styles.mainInvoiceTable}>
                            <thead>
                                <tr>
                                    <th style={{ width: '4%', textAlign: 'center' }}>Sl<br />No.</th>
                                    <th style={{ width: '40%', textAlign: 'center' }}>Description of Services</th>
                                    <th style={{ width: '10%', textAlign: 'center' }}>HSN/SAC</th>
                                    <th style={{ width: '10%', textAlign: 'center' }}>Quantity</th>
                                    <th style={{ width: '12%', textAlign: 'center' }}>Rate</th>
                                    <th style={{ width: '8%', textAlign: 'center' }}>per</th>
                                    <th style={{ width: '16%', textAlign: 'center' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceData.items.map((item, index) => (
                                    <tr key={index}>
                                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                        <td style={{ textAlign: 'left', textTransform: 'capitalize' }}><span className={styles.semiBold}>{item.description || 'Item'}</span></td>
                                        <td style={{ textAlign: 'center' }}>{item.hsnSac || ''}</td>
                                        <td style={{ textAlign: 'center' }}><span className={styles.semiBold}>{item.quantity}</span></td>
                                        <td style={{ textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                                        <td style={{ textAlign: 'center' }}>{item.perUnit}</td>
                                        <td style={{ textAlign: 'right' }}><span className={styles.semiBold}>{(item.quantity * item.unitPrice).toFixed(2)}</span></td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan="2" style={{ textAlign: 'right', fontStyle: 'italic' }}><span className={styles.semiBold}>OUTPUT IGST</span></td>
                                    <td></td>
                                    <td></td>
                                    <td className='text-end'> {invoiceData.taxRate}%</td>
                                    <td></td>
                                    <td style={{ textAlign: 'right' }}>{calculateTax().toFixed(2)}</td>
                                </tr>

                                <tr className={styles.totalRow}>
                                    <td colSpan="2" className='text-end'><strong>Total</strong></td>
                                    <td></td>
                                    <td style={{ textAlign: 'center' }}><strong>{invoiceData.items.reduce((sum, item) => sum + item.quantity, 0)}</strong></td>
                                    <td colSpan=""></td>
                                    <td>    </td>
                                    <td style={{ textAlign: 'right' }}><strong>₹ {calculateTotal().toFixed(2)}</strong></td>
                                </tr>
                                <tr>
                                    <td colSpan="7">
                                        <div className={styles.amountLabel}>Amount Chargeable (in words)</div>
                                        <div className={styles.amountText}><span className={styles.semiBold}>INR {numberToWords(calculateTotal())}</span></div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* HSN Summary Table */}
                        <table className={styles.mainInvoiceTable}>
                            <thead>
                                <tr>
                                    <th rowSpan="2" style={{ verticalAlign: 'middle' }}>HSN/SAC</th>
                                    <th rowSpan="2" style={{ verticalAlign: 'middle' }}>Taxable<br />Value</th>
                                    <th colSpan="2">IGST</th>
                                    <th rowSpan="2" style={{ verticalAlign: 'middle' }}>Total<br />Tax Amount</th>
                                </tr>
                                <tr>
                                    <th>Rate</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceData.items.map((item, index) => (
                                    <tr key={index}>
                                        <td style={{ textAlign: 'center' }}>{item.hsnSac || 'N/A'}</td>
                                        <td style={{ textAlign: 'right' }}>{(item.quantity * item.unitPrice).toFixed(2)}</td>
                                        <td style={{ textAlign: 'center' }}>{invoiceData.taxRate}%</td>
                                        <td style={{ textAlign: 'right' }}>{((item.quantity * item.unitPrice * invoiceData.taxRate) / 100).toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>{((item.quantity * item.unitPrice * invoiceData.taxRate) / 100).toFixed(2)}</td>
                                    </tr>
                                ))}
                                <tr className={styles.totalRow}>
                                    <td className='text-end'><strong>Total</strong></td>
                                    <td style={{ textAlign: 'right' }}><strong>{calculateSubtotal().toFixed(2)}</strong></td>
                                    <td></td>
                                    <td style={{ textAlign: 'right' }}><strong>{calculateTax().toFixed(2)}</strong></td>
                                    <td style={{ textAlign: 'right' }}><strong>{calculateTax().toFixed(2)}</strong></td>
                                </tr>
                                <tr>
                                    <td colSpan="5" className='border-bottom-0'>
                                        <span className={` ${styles.taxAmountLabel}  border-bottom-0`}>Tax Amount (in words) : </span>
                                        <span className={` ${styles.taxAmountText} border-bottom-0`}><span className={styles.semiBold}>INR {numberToWords(calculateTax())}</span></span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Declaration and Signature */}
                        <table className={styles.mainInvoiceTable}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '50%', verticalAlign: 'top' }} className='border-top-0'>
                                        <div className={styles.declarationTitle}>Declaration</div>
                                        <div className={styles.declarationText}>
                                            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                                        </div>
                                    </td>
                                    <td style={{ width: '50%', verticalAlign: 'top', textAlign: 'right' }} className=''>
                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100px' }}>
                                            <div className={styles.forCompany}>for {invoiceData.sellerName || 'Sense Projects Private Limited'}</div>
                                            {/* <div className={styles.signatureArea}>
                                                <img src="/img/signature.png" alt="Signature" className={styles.signatureImg} />
                                                <img src="/img/stamp.png" alt="Stamp" className={styles.stampImg} />
                                            </div> */}
                                            <div className={styles.authorizedSignatory}>Authorised Signatory</div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Footer */}
                        <div className={styles.taxInvoiceFooter}>
                            This is a Computer Generated Invoice
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default Invoice
