import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Printer } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/invoice.module.css'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'

const Invoice = () => {
    const navigate = useNavigate()
    const [invoiceData, setInvoiceData] = useState({
        invoiceNo: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        clientName: '',
        clientPhone: '',
        clientAddress: '',
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
        taxRate: 0,
        paymentInfo: {
            bankName: '',
            accountName: '',
            accountNo: '',
            payBy: ''
        },
        sellerName: '',
        sellerAddress: ''
    })
    const [nextInvoiceNumber, setNextInvoiceNumber] = useState(null)

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
                    invoiceNo: response.data.invoiceNo
                }))
                setNextInvoiceNumber(response.data.nextNumber)
            } catch (error) {
                console.error('Error fetching invoice number:', error)
                toast.error('Failed to fetch invoice number')
            }
        }

        fetchNextInvoiceNumber()
    }, [])

    const addItem = () => {
        setInvoiceData({
            ...invoiceData,
            items: [...invoiceData.items, { description: '', quantity: 1, unitPrice: 0 }]
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
                navigate('/dashboard/admin')
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
                        onClick={(e) => { e.preventDefault(); navigate('/dashboard/admin') }}
                        className={styles.backButton}
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </a>

                    <h2 className={styles.pageTitle}>Generate Invoice</h2>

                    <div className={styles.formCard}>
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

                        {/* Client Information */}
                        <div className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>Client Information</h3>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Client Name *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.clientName}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                                        placeholder="Imani Olowe"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Phone Number</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.clientPhone}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, clientPhone: e.target.value })}
                                        placeholder="+123-456-7890"
                                    />
                                </div>
                                <div className="col-12">
                                    <label className={styles.formLabel}>Address</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.clientAddress}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, clientAddress: e.target.value })}
                                        placeholder="63 Ivy Road, Hawkville, GA, USA 31036"
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
                                        <div className="col-md-5">
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
                                            <label className={styles.formLabel}>Quantity</label>
                                            <input
                                                type="number"
                                                className={styles.formInput}
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                min="1"
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className={styles.formLabel}>Unit Price (₹)</label>
                                            <input
                                                type="number"
                                                className={styles.formInput}
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        <div className="col-md-2 d-flex align-items-end">
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
                            <h3 className={styles.sectionTitle}>Gst</h3>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className={styles.formLabel}>Tax Rate (%)</label>
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
                                        onChange={(e) => setInvoiceData({
                                            ...invoiceData,
                                            paymentInfo: { ...invoiceData.paymentInfo, bankName: e.target.value }
                                        })}
                                        placeholder="Briard Bank"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Account Name</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.paymentInfo.accountName}
                                        onChange={(e) => setInvoiceData({
                                            ...invoiceData,
                                            paymentInfo: { ...invoiceData.paymentInfo, accountName: e.target.value }
                                        })}
                                        placeholder="Samira Hadid"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Account Number</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.paymentInfo.accountNo}
                                        onChange={(e) => setInvoiceData({
                                            ...invoiceData,
                                            paymentInfo: { ...invoiceData.paymentInfo, accountNo: e.target.value }
                                        })}
                                        placeholder="123-456-7890"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Pay By Date</label>
                                    <input
                                        type="date"
                                        className={styles.formInput}
                                        value={invoiceData.paymentInfo.payBy}
                                        onChange={(e) => setInvoiceData({
                                            ...invoiceData,
                                            paymentInfo: { ...invoiceData.paymentInfo, payBy: e.target.value }
                                        })}
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
                                        placeholder="Samira Hadid"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Seller Address</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={invoiceData.sellerAddress}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, sellerAddress: e.target.value })}
                                        placeholder="123 Anywhere St., Any City, ST 12345"
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
                <div className={styles.invoicePage}>
                    {/* Header */}
                    <div className={styles.invoiceHeader}>
                        <div className={styles.logoSection}>
                            <img src="/img/logo.png" alt="MetaSense Logo" className={styles.logo} />
                        </div>
                        <div className={styles.invoiceTitle}>INVOICE</div>
                    </div>

                    {/* Client and Invoice Info */}
                    <div className={styles.invoiceInfo}>
                        <div className={styles.billedTo}>
                            <div className={styles.label}>BILLED TO:</div>
                            <div className={styles.clientName}>{invoiceData.clientName || 'Client Name'}</div>
                            <div className={styles.clientDetails}>{invoiceData.clientPhone}</div>
                            <div className={styles.clientDetails}>{invoiceData.clientAddress}</div>
                        </div>
                        <div className={styles.invoiceDetails}>
                            <div className={styles.invoiceNumber}>Invoice No. {invoiceData.invoiceNo || '00000'}</div>
                            <div className={styles.invoiceDate}>
                                {invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date'}
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className={styles.itemsTable}>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoiceData.items.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.description || 'Item'}</td>
                                    <td>{item.quantity}</td>
                                    <td>₹{item.unitPrice.toFixed(2)}</td>
                                    <td>₹{(item.quantity * item.unitPrice).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className={styles.totalsSection}>
                        <div className={styles.totalRow}>
                            <span>Subtotal</span>
                            <span>₹{calculateSubtotal().toFixed(2)}</span>
                        </div>
                        <div className={styles.totalRow}>
                            <span>Tax ({invoiceData.taxRate}%)</span>
                            <span>₹{calculateTax().toFixed(2)}</span>
                        </div>
                        <div className={styles.totalRowFinal}>
                            <span>Total</span>
                            <span>₹{calculateTotal().toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={styles.invoiceFooter}>
                        <div className={styles.paymentInfo}>
                            <div className={styles.paymentLabel}>PAYMENT INFORMATION</div>
                            <div className={styles.paymentDetails}>{invoiceData.paymentInfo.bankName}</div>
                            <div className={styles.paymentDetails}>Account Name: {invoiceData.paymentInfo.accountName}</div>
                            <div className={styles.paymentDetails}>Account No.: {invoiceData.paymentInfo.accountNo}</div>
                            <div className={styles.paymentDetails}>
                                Pay by: {invoiceData.paymentInfo.payBy ? new Date(invoiceData.paymentInfo.payBy).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                            </div>
                        </div>
                        <div className={styles.companyInfo}>
                            <div className={styles.companyName}>MetaSense C/O Sense Project Pvt Ltd</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Invoice
