import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye } from 'lucide-react'
import Navbar from '../components/Navbar'
import styles from '../styles/viewinvoices.module.css'
import invoiceStyles from '../styles/invoice.module.css'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'
import QRCode from 'qrcode'

const ViewInvoices = () => {
    const navigate = useNavigate()
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedInvoice, setSelectedInvoice] = useState(null)
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')

    useEffect(() => {
        fetchInvoices()
    }, [])

    // Generate QR code when invoice is selected and has IRN
    useEffect(() => {
        if (selectedInvoice && selectedInvoice.irn && selectedInvoice.irn.trim() !== '') {
            QRCode.toDataURL(selectedInvoice.irn, { width: 150, margin: 1 })
                .then(url => {
                    setQrCodeDataUrl(url)
                })
                .catch(err => {
                    console.error('Error generating QR code:', err)
                    setQrCodeDataUrl('')
                })
        } else {
            setQrCodeDataUrl('')
        }
    }, [selectedInvoice])

    const fetchInvoices = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/invoice/all`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )
            setInvoices(response.data)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching invoices:', error)
            toast.error('Failed to fetch invoices')
            setLoading(false)
        }
    }

    const mapInvoiceData = (data) => {
        // Helper to safely parse JSON items if they come as string
        let items = []
        if (typeof data.items === 'string') {
            try {
                items = JSON.parse(data.items)
            } catch (e) {
                console.error("Failed to parse items", e)
            }
        } else if (Array.isArray(data.items)) {
            items = data.items
        }

        return {
            irn: data.irn || '',
            askNo: data.askNo || data.ask_no || '',
            askDate: data.askDate || data.ask_date || '',
            invoiceNo: data.invoiceNo || data.invoice_no || '',
            invoiceDate: data.invoiceDate || data.invoice_date || '',

            // Client/Buyer
            clientName: data.clientName || data.client_name || '',
            clientAddress: data.clientAddress || data.client_address || '',
            buyerGstin: data.buyerGstin || data.clientGst || data.buyer_gstin || data.client_gst || '',
            buyerStateName: data.buyerStateName || data.buyer_state_name || '',
            buyerStateCode: data.buyerStateCode || data.buyer_state_code || '',

            // Consignee
            consigneeName: data.consigneeName || data.consignee_name || data.clientName || data.client_name || '',
            consigneeAddress: data.consigneeAddress || data.consignee_address || data.clientAddress || data.client_address || '',
            consigneeGstin: data.consigneeGstin || data.consignee_gstin || data.buyerGstin || data.buyer_gstin || '',
            consigneeStateName: data.consigneeStateName || data.consignee_state_name || data.buyerStateName || data.buyer_state_name || '',
            consigneeStateCode: data.consigneeStateCode || data.consignee_state_code || data.buyerStateCode || data.buyer_state_code || '',

            items: items.map(item => ({
                description: item.description || '',
                hsnSac: item.hsnSac || item.hsn_sac || '',
                quantity: parseFloat(item.quantity) || 0,
                unitPrice: parseFloat(item.unitPrice) || parseFloat(item.unit_price) || 0,
                perUnit: item.perUnit || item.per_unit || 'Nos'
            })),
            taxRate: parseFloat(data.taxRate || data.tax_rate) || 18,

            // Seller
            sellerName: (data.sellerName || data.seller_name) === 'Meta Sense' ? 'Sense Projects Private Limited' : (data.sellerName || data.seller_name || 'Sense Projects Private Limited'),
            sellerGstin: data.sellerGstin || data.seller_gstin || '07AAPCS9265G1ZH',
            sellerStateName: data.sellerStateName || data.seller_state_name || 'Delhi',
            sellerStateCode: data.sellerStateCode || data.seller_state_code || '07',
            sellerEmail: data.sellerEmail || data.seller_email || 'info@senseprojects.in',
            regdAddress: data.regdAddress || data.regd_address || 'Regd Address',
            offcAddress: data.offcAddress || data.offc_address || 'Office Address',

            // Delivery & Others
            deliveryNote: data.deliveryNote || data.delivery_note || '',
            modeTermsOfPayment: data.modeTermsOfPayment || data.mode_terms_payment || '',
            referenceNoDate: data.referenceNoDate || data.reference_no_date || '',
            otherReferences: data.otherReferences || data.other_references || '',
            buyersOrderNo: data.buyersOrderNo || data.buyers_order_no || '',
            buyersOrderDate: data.buyersOrderDate || data.buyers_order_date || '',
            dispatchDocNo: data.dispatchDocNo || data.dispatch_doc_no || '',
            deliveryNoteDate: data.deliveryNoteDate || data.delivery_note_date || '',
            dispatchedThrough: data.dispatchedThrough || data.dispatched_through || '',
            destination: data.destination || '',
            termsOfDelivery: data.termsOfDelivery || data.terms_of_delivery || ''
        }
    }

    const handleViewPDF = async (invoiceId) => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/invoice/${invoiceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )
            const mappedData = mapInvoiceData(response.data)
            setSelectedInvoice(mappedData)

            // Trigger print after a short delay to ensure content is rendered
            setTimeout(() => {
                window.print()
            }, 500)
        } catch (error) {
            console.error('Error fetching invoice details:', error)
            toast.error('Failed to load invoice')
        }
    }

    const calculateSubtotal = (items) => {
        if (!items) return 0
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    }

    const calculateTax = (items, taxRate) => {
        if (!items) return 0
        return (calculateSubtotal(items) * taxRate) / 100
    }

    const calculateTotal = (items, taxRate) => {
        if (!items) return 0
        return calculateSubtotal(items) + calculateTax(items, taxRate)
    }

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

        let res = 'INR ' + numToWords(rupees)
        if (paise > 0) {
            res += ' and ' + numToWords(paise) + ' Paise'
        }
        return res + ' Only'
    }

    return (
        <>
            <div className={styles.container}>
                <Toaster position="top-right" />
                <Navbar />

                {/* List View */}
                <div className={styles.content}>
                    <div className="container">
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); navigate('/dashboard/admin') }}
                            className={styles.backButton}
                        >
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </a>

                        <h2 className={styles.pageTitle}>View Invoices</h2>

                        {loading ? (
                            <div className={styles.loading}>Loading invoices...</div>
                        ) : invoices.length === 0 ? (
                            <div className={styles.noData}>No invoices found</div>
                        ) : (
                            <div className={styles.tableContainer}>
                                <table className={styles.invoiceTable}>
                                    <thead>
                                        <tr>
                                            <th>Invoice No.</th>
                                            <th>Date</th>
                                            <th>Client Name</th>
                                            <th>Total Amount</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.map((invoice) => (
                                            <tr key={invoice.id}>
                                                <td>{invoice.invoice_no}</td>
                                                <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                                                <td>{invoice.client_name}</td>
                                                <td>Rs. {parseFloat(invoice.total_amount).toFixed(2)}</td>
                                                <td>
                                                    <button
                                                        className={styles.viewButton}
                                                        onClick={() => handleViewPDF(invoice.id)}
                                                    >
                                                        <Eye size={16} />
                                                        View PDF
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden Print View */}
            {selectedInvoice && (
                <div className={invoiceStyles.invoicePreview}>
                    <div className={invoiceStyles.taxInvoicePage}>
                        {/* Header with IRN and QR Code */}
                        <div className={invoiceStyles.titleSection}>
                            <h1 className={invoiceStyles.taxInvoiceTitle}>Tax Invoice</h1>
                        </div>
                        {/* Header with IRN and QR Code */}
                        <div className={invoiceStyles.taxInvoiceHeader}>
                            <div className={invoiceStyles.irnSection}>
                                <div className={invoiceStyles.irnLabel}>IRN : <strong>{selectedInvoice.irn || 'N/A'}</strong></div>
                                <div className={invoiceStyles.askDetails}>
                                    <div>Ack No. : <strong>{selectedInvoice.askNo || 'N/A'}</strong></div>
                                    <div>Ack Date : <strong>{selectedInvoice.askDate ? new Date(selectedInvoice.askDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</strong></div>
                                </div>
                            </div>
                            <div className={invoiceStyles.qrSection}>
                                <div className={invoiceStyles.eInvoiceLabel}>e-Invoice</div>
                                {qrCodeDataUrl && (
                                    <img src={qrCodeDataUrl} alt="QR Code" className={invoiceStyles.qrCode} />
                                )}
                            </div>
                        </div>

                        {/* Main Invoice Table */}
                        <div className={invoiceStyles.taxInvoiceBody}>
                            <table className={invoiceStyles.mainInvoiceTable}>
                                <tbody>
                                    {/* Seller and Invoice Details Row */}
                                    <tr>
                                        <td style={{ width: '50%', verticalAlign: 'top' }}>
                                            <div className={invoiceStyles.companyName}>{selectedInvoice.sellerName || 'Sense Projects Private Limited'}</div>
                                            <div>{selectedInvoice.regdAddress || 'Address'}</div>
                                            <div>GSTIN/UIN : {selectedInvoice.sellerGstin || 'N/A'}</div>
                                            <div>State Name : {selectedInvoice.sellerStateName || 'Delhi'}, Code : {selectedInvoice.sellerStateCode || '07'}</div>
                                            <div>E-Mail : {selectedInvoice.sellerEmail || 'info@senseprojects.in'}</div>
                                        </td>
                                        <td style={{ width: '50%', padding: 0, verticalAlign: 'top', height: '1px' }} rowSpan="3">
                                            <table className={invoiceStyles.nestedTable}>
                                                <tbody>
                                                    <tr>
                                                        <td className='border-bottom-0' style={{ width: '50%' }}>Invoice No.</td>
                                                        <td className='border-bottom-0' style={{ width: '50%' }}>Dated</td>
                                                    </tr>
                                                    <tr>
                                                        <td><span className={invoiceStyles.semiBold}>{selectedInvoice.invoiceNo || 'N/A'}</span></td>
                                                        <td><span className={invoiceStyles.semiBold}>{selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-GB').replace(/\//g, '-') : 'N/A'}</span></td>
                                                    </tr>
                                                    <tr>
                                                        <td className='border-bottom-0'>Delivery Note</td>
                                                        <td className='border-bottom-0'>Mode/Terms of Payment</td>
                                                    </tr>
                                                    <tr>
                                                        <td>{selectedInvoice.deliveryNote || ''}</td>
                                                        <td>{selectedInvoice.modeTermsOfPayment || ''}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className='border-bottom-0'>Reference No. & Date.</td>
                                                        <td className='border-bottom-0'>Other References</td>
                                                    </tr>
                                                    <tr>
                                                        <td>{selectedInvoice.referenceNoDate || ''}</td>
                                                        <td>{selectedInvoice.otherReferences || ''}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className='border-bottom-0'>Buyer's Order No.</td>
                                                        <td className='border-bottom-0'>Dated</td>
                                                    </tr>
                                                    <tr>
                                                        <td>{selectedInvoice.buyersOrderNo || ''}</td>
                                                        <td>{selectedInvoice.buyersOrderDate ? new Date(selectedInvoice.buyersOrderDate).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className='border-bottom-0'>Dispatch Doc No.</td>
                                                        <td className='border-bottom-0'>Delivery Note Date</td>
                                                    </tr>
                                                    <tr>
                                                        <td>{selectedInvoice.dispatchDocNo || ''}</td>
                                                        <td>{selectedInvoice.deliveryNoteDate ? new Date(selectedInvoice.deliveryNoteDate).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className='border-bottom-0'>Dispatched through</td>
                                                        <td className='border-bottom-0'>Destination</td>
                                                    </tr>
                                                    <tr>
                                                        <td>{selectedInvoice.dispatchedThrough || ''}</td>
                                                        <td>{selectedInvoice.destination || ''}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className='border-bottom-0 border-end-0' colSpan="2">Terms of Delivery</td>
                                                    </tr>
                                                    <tr>
                                                        <td colSpan="2" className='border-end-0' style={{ height: '48px' }}>{selectedInvoice.termsOfDelivery || ''}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>

                                    {/* Consignee Row - LEFT COLUMN ONLY */}
                                    <tr>
                                        <td style={{ verticalAlign: 'top' }}>
                                            <div className={invoiceStyles.sectionLabel}>Consignee (Ship to)</div>
                                            <div className={invoiceStyles.consigneeName}>{selectedInvoice.consigneeName || selectedInvoice.clientName || 'Consignee Name'}</div>
                                            <div>{selectedInvoice.consigneeAddress || selectedInvoice.clientAddress || 'Address'}</div>
                                            <div>GSTIN/UIN : {selectedInvoice.consigneeGstin || selectedInvoice.buyerGstin || 'N/A'}</div>
                                            <div>State Name : {selectedInvoice.consigneeStateName || selectedInvoice.buyerStateName || 'N/A'}, Code : {selectedInvoice.consigneeStateCode || selectedInvoice.buyerStateCode || 'N/A'}</div>
                                        </td>
                                    </tr>

                                    {/* Buyer Row - LEFT COLUMN ONLY */}
                                    <tr>
                                        <td style={{ verticalAlign: 'top' }}>
                                            <div className={invoiceStyles.sectionLabel}>Buyer (Bill to)</div>
                                            <div className={invoiceStyles.buyerName}>{selectedInvoice.clientName || 'Buyer Name'}</div>
                                            <div>{selectedInvoice.clientAddress || 'Address'}</div>
                                            <div>GSTIN/UIN : {selectedInvoice.buyerGstin || 'N/A'}</div>
                                            <div>State Name : {selectedInvoice.buyerStateName || 'N/A'}, Code : {selectedInvoice.buyerStateCode || 'N/A'}</div>
                                        </td>
                                    </tr>

                                </tbody>
                            </table>

                            {/* Items Table */}
                            <table className={invoiceStyles.mainInvoiceTable}>
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
                                    {selectedInvoice.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className='border-bottom-0 border-top-0' style={{ textAlign: 'center' }}>{index + 1}</td>
                                            <td className='border-bottom-0 border-top-0' style={{ textAlign: 'left', textTransform: 'capitalize' }}><span className={invoiceStyles.semiBold}>{item.description || 'Item'}</span></td>
                                            <td className='border-bottom-0 border-top-0' style={{ textAlign: 'center' }}>{item.hsnSac || ''}</td>
                                            <td className='border-bottom-0 border-top-0' style={{ textAlign: 'center' }}><span className={invoiceStyles.semiBold}>{item.quantity}</span></td>
                                            <td className='border-bottom-0 border-top-0' style={{ textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                                            <td className='border-bottom-0 border-top-0' style={{ textAlign: 'center' }}>{item.perUnit}</td>
                                            <td className='border-bottom-0 border-top-0' style={{ textAlign: 'right' }}><span className={invoiceStyles.semiBold}>{(item.quantity * item.unitPrice).toFixed(2)}</span></td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td className='border-top-0'></td>
                                        <td colSpan="" className='border-top-0' style={{ textAlign: 'right', fontStyle: 'italic' }}><span className={invoiceStyles.semiBold}>OUTPUT IGST</span></td>
                                        <td className='border-top-0'></td>
                                        <td className='border-top-0'></td>
                                        <td className='text-end border-top-0'> {selectedInvoice.taxRate}%</td>
                                        <td className='border-top-0'></td>
                                        <td className='border-top-0' style={{ textAlign: 'right' }}>{calculateTax(selectedInvoice.items, selectedInvoice.taxRate).toFixed(2)}</td>
                                    </tr>

                                    <tr className={invoiceStyles.totalRow}>
                                        <td></td>
                                        <td colSpan="" className='text-end'><strong>Total</strong></td>
                                        <td></td>
                                        <td style={{ textAlign: 'center' }}><strong>{selectedInvoice.items.reduce((sum, item) => sum + item.quantity, 0)}</strong></td>
                                        <td colSpan=""></td>
                                        <td>    </td>
                                        <td style={{ textAlign: 'right' }}><strong>₹ {calculateTotal(selectedInvoice.items, selectedInvoice.taxRate).toFixed(2)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td colSpan="7">
                                            <div className={invoiceStyles.amountLabel}>Amount Chargeable (in words)</div>
                                            <div className={invoiceStyles.amountText}><span className={invoiceStyles.semiBold}>INR {numberToWords(calculateTotal(selectedInvoice.items, selectedInvoice.taxRate))}</span></div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* HSN Summary Table */}
                            <table className={invoiceStyles.mainInvoiceTable}>
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
                                    {selectedInvoice.items.map((item, index) => (
                                        <tr key={index}>
                                            <td style={{ textAlign: 'center' }}>{item.hsnSac || 'N/A'}</td>
                                            <td style={{ textAlign: 'right' }}>{(item.quantity * item.unitPrice).toFixed(2)}</td>
                                            <td style={{ textAlign: 'center' }}>{selectedInvoice.taxRate}%</td>
                                            <td style={{ textAlign: 'right' }}>{((item.quantity * item.unitPrice * selectedInvoice.taxRate) / 100).toFixed(2)}</td>
                                            <td style={{ textAlign: 'right' }}>{((item.quantity * item.unitPrice * selectedInvoice.taxRate) / 100).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className={invoiceStyles.totalRow}>
                                        <td className='text-end'><strong>Total</strong></td>
                                        <td style={{ textAlign: 'right' }}><strong>{calculateSubtotal(selectedInvoice.items).toFixed(2)}</strong></td>
                                        <td></td>
                                        <td style={{ textAlign: 'right' }}><strong>{calculateTax(selectedInvoice.items, selectedInvoice.taxRate).toFixed(2)}</strong></td>
                                        <td style={{ textAlign: 'right' }}><strong>{calculateTax(selectedInvoice.items, selectedInvoice.taxRate).toFixed(2)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td colSpan="5" className='border-bottom-0'>
                                            <span className={` ${invoiceStyles.taxAmountLabel}  border-bottom-0`}>Tax Amount (in words) : </span>
                                            <span className={` ${invoiceStyles.taxAmountText} border-bottom-0`}><span className={invoiceStyles.semiBold}>INR {numberToWords(calculateTax(selectedInvoice.items, selectedInvoice.taxRate))}</span></span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Declaration and Signature */}
                            <table className={invoiceStyles.mainInvoiceTable}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '50%', verticalAlign: 'top' }} className='border-top-0'>
                                            <div className={invoiceStyles.declarationTitle}>Declaration</div>
                                            <div className={invoiceStyles.declarationText}>
                                                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                                            </div>
                                        </td>
                                        <td style={{ width: '50%', verticalAlign: 'top', textAlign: 'right' }} className=''>
                                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100px' }}>
                                                <div className={invoiceStyles.forCompany}>for {selectedInvoice.sellerName || 'Sense Projects Private Limited'}</div>
                                                {/* <div className={invoiceStyles.signatureArea}>
                                                    <img src="/img/signature.png" alt="Signature" className={invoiceStyles.signatureImg} />
                                                    <img src="/img/stamp.png" alt="Stamp" className={invoiceStyles.stampImg} />
                                                </div> */}
                                                <div className={invoiceStyles.authorizedSignatory}>Authorised Signatory</div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Footer */}
                            <div className={invoiceStyles.taxInvoiceFooter}>
                                This is a Computer Generated Invoice
                            </div>
                        </div>
                    </div>
                </div >
            )}
        </>
    )
}

export default ViewInvoices
