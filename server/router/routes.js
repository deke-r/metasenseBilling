const express = require('express');
const router = express.Router();
const con = require('../db/config');
var jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
};

// Get dashboard statistics
router.get('/dashboard/stats', verifyToken, async (req, res) => {
    try {
        // Get total invoices count
        const [countResult] = await con.query('SELECT COUNT(*) as total FROM invoices');
        const totalInvoices = countResult[0].total;

        // Get total revenue (sum of all invoice amounts)
        const [revenueResult] = await con.query('SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM invoices');
        const totalRevenue = parseFloat(revenueResult[0].total_revenue);

        // Get active clients count (unique client names from invoices)
        const [clientsResult] = await con.query(`
            SELECT COUNT(DISTINCT client_name) as active_clients 
            FROM invoices 
            WHERE client_name IS NOT NULL AND client_name != ''
        `);
        const activeClients = clientsResult[0].active_clients;

        // Get revenue from last month for comparison
        const [lastMonthResult] = await con.query(`
            SELECT COALESCE(SUM(total_amount), 0) as last_month_revenue 
            FROM invoices 
            WHERE invoice_date >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH) 
            AND invoice_date < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        `);
        const lastMonthRevenue = parseFloat(lastMonthResult[0].last_month_revenue);

        // Get revenue from current month
        const [currentMonthResult] = await con.query(`
            SELECT COALESCE(SUM(total_amount), 0) as current_month_revenue 
            FROM invoices 
            WHERE invoice_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        `);
        const currentMonthRevenue = parseFloat(currentMonthResult[0].current_month_revenue);

        // Calculate revenue change percentage
        let revenueChangePercent = 0;
        let revenueChangePositive = true;
        if (lastMonthRevenue > 0) {
            revenueChangePercent = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1);
            revenueChangePositive = revenueChangePercent >= 0;
        } else if (currentMonthRevenue > 0) {
            revenueChangePercent = 100;
            revenueChangePositive = true;
        }

        // Get new clients this month
        const [newClientsResult] = await con.query(`
            SELECT COUNT(DISTINCT client_name) as new_clients 
            FROM invoices 
            WHERE invoice_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
            AND client_name IS NOT NULL AND client_name != ''
        `);
        const newClientsThisMonth = newClientsResult[0].new_clients;

        // Get pending payments count
        const [pendingPaymentsResult] = await con.query(`
            SELECT COUNT(*) as pending_payments 
            FROM payments 
            WHERE status = 'pending'
        `);
        const pendingPayments = pendingPaymentsResult[0].pending_payments;

        // Get pending receipts count
        const [pendingReceiptsResult] = await con.query(`
            SELECT COUNT(*) as pending_receipts 
            FROM receipts 
            WHERE status = 'pending'
        `);
        const pendingReceipts = pendingReceiptsResult[0].pending_receipts;

        // Get pending account invoices count
        const [pendingAccountInvoicesResult] = await con.query(`
            SELECT COUNT(*) as pending_account_invoices 
            FROM account_invoices 
            WHERE status = 'pending'
        `);
        const pendingAccountInvoices = pendingAccountInvoicesResult[0].pending_account_invoices;

        res.status(200).json({
            totalInvoices,
            totalRevenue,
            activeClients,
            revenueChange: {
                percent: Math.abs(revenueChangePercent),
                positive: revenueChangePositive
            },
            newClientsThisMonth,
            pendingPayments,
            pendingReceipts,
            pendingAccountInvoices
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get next invoice number
router.get('/invoice/next-number', verifyToken, async (req, res) => {
    try {
        // Get current invoice number and ack number
        const [rows] = await con.query('SELECT current_invoice_no, current_ack_no, prefix FROM invoice_counter WHERE id = 1');

        if (rows.length === 0) {
            return res.status(404).json({ message: "Invoice counter not initialized" });
        }

        const nextNumber = rows[0].current_invoice_no + 1;
        const nextAckNo = (rows[0].current_ack_no || 120250000000000) + 1;
        const prefix = rows[0].prefix || 'SPPL';

        // Generate random IRN (64-char hex)
        const chars = '0123456789abcdef';
        let generatedIrn = '';
        for (let i = 0; i < 64; i++) {
            generatedIrn += chars[Math.floor(Math.random() * chars.length)];
        }

        // Calculate financial year (April to March)
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

        let financialYearStart, financialYearEnd;
        if (currentMonth >= 4) {
            // April onwards: current year to next year
            financialYearStart = currentYear;
            financialYearEnd = currentYear + 1;
        } else {
            // January to March: previous year to current year
            financialYearStart = currentYear - 1;
            financialYearEnd = currentYear;
        }

        const financialYear = `${String(financialYearStart).slice(-2)}-${String(financialYearEnd).slice(-2)}`;
        const invoiceNo = `${prefix}/${financialYear}/${String(nextNumber).padStart(4, '0')}`;

        res.status(200).json({ invoiceNo, nextNumber, nextAckNo, generatedIrn });
    } catch (error) {
        console.error('Error fetching invoice number:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Save or update client details
router.post('/clients/save', verifyToken, async (req, res) => {
    try {
        const { name, phone, address, gst, state_name, state_code } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: "Client name is required" });
        }

        // Insert or update client using ON DUPLICATE KEY UPDATE
        const query = `
            INSERT INTO clients (name, phone, address, gst, state_name, state_code) 
            VALUES (?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
                phone = VALUES(phone), 
                address = VALUES(address),
                gst = VALUES(gst),
                state_name = VALUES(state_name),
                state_code = VALUES(state_code),
                updated_at = CURRENT_TIMESTAMP
        `;

        await con.query(query, [name.trim(), phone || '', address || '', gst || '', state_name || '', state_code || '']);

        res.status(200).json({ message: "Client saved successfully" });
    } catch (error) {
        console.error('Error saving client:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Search clients by name (for autocomplete)
router.get('/clients/search', verifyToken, async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim() === '') {
            return res.status(200).json([]);
        }

        // Search for clients with names matching the query
        const searchQuery = `
            SELECT id, name, phone, address, gst, state_name, state_code 
            FROM clients 
            WHERE name LIKE ? 
            ORDER BY name ASC 
            LIMIT 10
        `;

        const [rows] = await con.query(searchQuery, [`%${query.trim()}%`]);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error searching clients:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get company settings
router.get('/settings/company', verifyToken, async (req, res) => {
    try {
        const [rows] = await con.query('SELECT * FROM company_settings LIMIT 1');

        if (rows.length === 0) {
            return res.status(404).json({ message: "Company settings not found" });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching company settings:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Save invoice and increment counter
router.post('/invoice/save', verifyToken, async (req, res) => {
    const connection = await con.getConnection();
    try {
        await connection.beginTransaction();

        const { invoiceData } = req.body;

        // Auto-generate IRN if missing (64-character hex string)
        if (!invoiceData.irn) {
            const chars = '0123456789abcdef';
            let irn = '';
            for (let i = 0; i < 64; i++) {
                irn += chars[Math.floor(Math.random() * chars.length)];
            }
            invoiceData.irn = irn;
        }

        // Auto-generate Ack No if missing (15-digit number)
        if (!invoiceData.askNo) {
            let askNo = '';
            for (let i = 0; i < 15; i++) {
                askNo += Math.floor(Math.random() * 10);
            }
            invoiceData.askNo = askNo;
        }

        // Auto-generate Ack Date if missing (Use current date)
        if (!invoiceData.askDate) {
            invoiceData.askDate = new Date();
        }

        // Save client details if provided
        if (invoiceData.clientName && invoiceData.clientName.trim() !== '') {
            const clientQuery = `
                INSERT INTO clients (name, phone, address, gst, state_name, state_code) 
                VALUES (?, ?, ?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                    phone = VALUES(phone), 
                    address = VALUES(address),
                    gst = VALUES(gst),
                    state_name = VALUES(state_name),
                    state_code = VALUES(state_code),
                    updated_at = CURRENT_TIMESTAMP
            `;

            await connection.query(clientQuery, [
                invoiceData.clientName.trim(),
                invoiceData.clientPhone || '',
                invoiceData.clientAddress || '',
                invoiceData.clientGst || '',
                invoiceData.buyerStateName || '',
                invoiceData.buyerStateCode || ''
            ]);
        }

        // Calculate totals
        const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxAmount = (subtotal * invoiceData.taxRate) / 100;
        const totalAmount = subtotal + taxAmount;

        // Insert invoice with all new fields
        const invoiceQuery = `
            INSERT INTO invoices (
                irn, invoice_no, ask_no, ask_date, invoice_date,
                client_name, client_phone, client_address, client_gst,
                buyer_gstin, buyer_state_name, buyer_state_code,
                consignee_name, consignee_address, consignee_gstin, consignee_state_name, consignee_state_code,
                tax_rate, subtotal, tax_amount, total_amount,
                seller_name, seller_gstin, seller_state_name, seller_state_code, seller_email,
                regd_address, offc_address,
                delivery_note, mode_terms_of_payment, reference_no_date, other_references,
                buyers_order_no, buyers_order_date, dispatch_doc_no, delivery_note_date,
                dispatched_through, destination, terms_of_delivery,
                payment_bank_name, payment_account_name, payment_account_no, payment_ifsc_code, payment_branch
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [invoiceResult] = await connection.query(invoiceQuery, [
            invoiceData.irn || '',
            invoiceData.invoiceNo,
            invoiceData.askNo || '',
            invoiceData.askDate || null,
            invoiceData.invoiceDate,
            invoiceData.clientName || '',
            invoiceData.clientPhone || '',
            invoiceData.clientAddress || '',
            invoiceData.clientGst || '',
            invoiceData.buyerGstin || '',
            invoiceData.buyerStateName || '',
            invoiceData.buyerStateCode || '',
            invoiceData.consigneeName || '',
            invoiceData.consigneeAddress || '',
            invoiceData.consigneeGstin || '',
            invoiceData.consigneeStateName || '',
            invoiceData.consigneeStateCode || '',
            invoiceData.taxRate,
            subtotal,
            taxAmount,
            totalAmount,
            invoiceData.sellerName || '',
            invoiceData.sellerGstin || '',
            invoiceData.sellerStateName || '',
            invoiceData.sellerStateCode || '',
            invoiceData.sellerEmail || '',
            invoiceData.regdAddress || '',
            invoiceData.offcAddress || '',
            invoiceData.deliveryNote || '',
            invoiceData.modeTermsOfPayment || '',
            invoiceData.referenceNoDate || '',
            invoiceData.otherReferences || '',
            invoiceData.buyersOrderNo || '',
            invoiceData.buyersOrderDate || null,
            invoiceData.dispatchDocNo || '',
            invoiceData.deliveryNoteDate || null,
            invoiceData.dispatchedThrough || '',
            invoiceData.destination || '',
            invoiceData.termsOfDelivery || '',
            invoiceData.paymentInfo.bankName || '',
            invoiceData.paymentInfo.accountName || '',
            invoiceData.paymentInfo.accountNo || '',
            invoiceData.paymentInfo.ifscCode || '',
            invoiceData.paymentInfo.branch || ''
        ]);

        const invoiceId = invoiceResult.insertId;

        // Insert invoice items with HSN/SAC and per_unit
        const itemQuery = `
            INSERT INTO invoice_items (invoice_id, description, hsn_sac, quantity, unit_price, per_unit, line_total, item_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (let i = 0; i < invoiceData.items.length; i++) {
            const item = invoiceData.items[i];
            const lineTotal = item.quantity * item.unitPrice;
            await connection.query(itemQuery, [
                invoiceId,
                item.description || '',
                item.hsnSac || '',
                item.quantity,
                item.unitPrice,
                item.perUnit || 'piece',
                lineTotal,
                i + 1
            ]);
        }

        // Update invoice counter
        await connection.query('UPDATE invoice_counter SET current_invoice_no = current_invoice_no + 1, current_ack_no = current_ack_no + 1 WHERE id = 1');

        await connection.commit();
        res.status(200).json({ message: "Invoice saved successfully", invoiceId });
    } catch (error) {
        await connection.rollback();
        console.error('Error saving invoice:', error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        connection.release();
    }
});

// Get all invoices
router.get('/invoice/all', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT id, invoice_no, invoice_date, client_name, total_amount, created_at
            FROM invoices
            ORDER BY created_at DESC
        `;

        const [rows] = await con.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Search invoice by invoice number (for autocomplete in account invoice form)
router.get('/invoice/search-by-number', verifyToken, async (req, res) => {
    try {
        const { invoice_no } = req.query;

        if (!invoice_no || invoice_no.trim() === '') {
            return res.status(200).json(null);
        }

        const query = `
            SELECT invoice_no, client_name, total_amount
            FROM invoices
            WHERE invoice_no = ?
            LIMIT 1
        `;

        const [rows] = await con.query(query, [invoice_no.trim()]);

        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(200).json(null);
        }
    } catch (error) {
        console.error('Error searching invoice:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get all invoice numbers for dropdown (for account invoice form)
router.get('/invoice/numbers', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT invoice_no, client_name, total_amount
            FROM invoices
            ORDER BY created_at DESC
        `;

        const [rows] = await con.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching invoice numbers:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get single invoice by ID
router.get('/invoice/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch invoice details
        const invoiceQuery = `
            SELECT * FROM invoices WHERE id = ?
        `;
        const [invoiceRows] = await con.query(invoiceQuery, [id]);

        if (invoiceRows.length === 0) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        const invoice = invoiceRows[0];

        // Fetch invoice items with HSN/SAC and per_unit
        const itemsQuery = `
            SELECT description, hsn_sac, quantity, unit_price, per_unit, line_total
            FROM invoice_items
            WHERE invoice_id = ?
            ORDER BY item_order ASC
        `;
        const [itemsRows] = await con.query(itemsQuery, [id]);

        // Format response to match frontend structure
        const invoiceData = {
            // IRN and Ask details
            irn: invoice.irn || '',
            askNo: invoice.ask_no || '',
            askDate: invoice.ask_date || '',

            // Invoice details
            invoiceNo: invoice.invoice_no,
            invoiceDate: invoice.invoice_date,

            // Client/Buyer details
            clientName: invoice.client_name,
            clientPhone: invoice.client_phone,
            clientAddress: invoice.client_address,
            clientGst: invoice.client_gst,
            buyerGstin: invoice.buyer_gstin || '',
            buyerStateName: invoice.buyer_state_name || '',
            buyerStateCode: invoice.buyer_state_code || '',

            // Consignee details
            consigneeName: invoice.consignee_name || '',
            consigneeAddress: invoice.consignee_address || '',
            consigneeGstin: invoice.consignee_gstin || '',
            consigneeStateName: invoice.consignee_state_name || '',
            consigneeStateCode: invoice.consignee_state_code || '',

            // Items with HSN/SAC
            items: itemsRows.map(item => ({
                description: item.description,
                hsnSac: item.hsn_sac || '',
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.unit_price),
                perUnit: item.per_unit || 'piece'
            })),

            taxRate: parseFloat(invoice.tax_rate),

            // Seller details
            sellerName: invoice.seller_name,
            sellerGstin: invoice.seller_gstin || '',
            sellerStateName: invoice.seller_state_name || '',
            sellerStateCode: invoice.seller_state_code || '',
            sellerEmail: invoice.seller_email || '',
            regdAddress: invoice.regd_address,
            offcAddress: invoice.offc_address,

            // Delivery and shipping details
            deliveryNote: invoice.delivery_note || '',
            modeTermsOfPayment: invoice.mode_terms_of_payment || '',
            referenceNoDate: invoice.reference_no_date || '',
            otherReferences: invoice.other_references || '',
            buyersOrderNo: invoice.buyers_order_no || '',
            buyersOrderDate: invoice.buyers_order_date || '',
            dispatchDocNo: invoice.dispatch_doc_no || '',
            deliveryNoteDate: invoice.delivery_note_date || '',
            dispatchedThrough: invoice.dispatched_through || '',
            destination: invoice.destination || '',
            termsOfDelivery: invoice.terms_of_delivery || '',

            // Payment info
            paymentInfo: {
                bankName: invoice.payment_bank_name,
                accountName: invoice.payment_account_name,
                accountNo: invoice.payment_account_no,
                ifscCode: invoice.payment_ifsc_code,
                branch: invoice.payment_branch
            }
        };

        res.status(200).json(invoiceData);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;



