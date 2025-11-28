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

// Get next invoice number
router.get('/invoice/next-number', verifyToken, async (req, res) => {
    try {
        // Get current invoice number
        const [rows] = await con.query('SELECT current_invoice_no, prefix FROM invoice_counter WHERE id = 1');

        if (rows.length === 0) {
            return res.status(404).json({ message: "Invoice counter not initialized" });
        }

        const nextNumber = rows[0].current_invoice_no + 1;
        const prefix = rows[0].prefix || 'INV';
        const invoiceNo = `${prefix}-${String(nextNumber).padStart(5, '0')}`;

        res.status(200).json({ invoiceNo, nextNumber });
    } catch (error) {
        console.error('Error fetching invoice number:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Save or update client details
router.post('/clients/save', verifyToken, async (req, res) => {
    try {
        const { name, phone, address, gst } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: "Client name is required" });
        }

        // Insert or update client using ON DUPLICATE KEY UPDATE
        const query = `
            INSERT INTO clients (name, phone, address, gst) 
            VALUES (?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
                phone = VALUES(phone), 
                address = VALUES(address),
                gst = VALUES(gst),
                updated_at = CURRENT_TIMESTAMP
        `;

        await con.query(query, [name.trim(), phone || '', address || '', gst || '']);

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
            SELECT id, name, phone, address, gst 
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

        // Save client details if provided
        if (invoiceData.clientName && invoiceData.clientName.trim() !== '') {
            const clientQuery = `
                INSERT INTO clients (name, phone, address, gst) 
                VALUES (?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                    phone = VALUES(phone), 
                    address = VALUES(address),
                    gst = VALUES(gst),
                    updated_at = CURRENT_TIMESTAMP
            `;

            await connection.query(clientQuery, [
                invoiceData.clientName.trim(),
                invoiceData.clientPhone || '',
                invoiceData.clientAddress || '',
                invoiceData.clientGst || ''
            ]);
        }

        // Calculate totals
        const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxAmount = (subtotal * invoiceData.taxRate) / 100;
        const totalAmount = subtotal + taxAmount;

        // Insert invoice
        const invoiceQuery = `
            INSERT INTO invoices (
                invoice_no, invoice_date, client_name, client_phone, client_address, client_gst,
                tax_rate, subtotal, tax_amount, total_amount,
                seller_name, regd_address, offc_address,
                payment_bank_name, payment_account_name, payment_account_no, payment_ifsc_code, payment_branch
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [invoiceResult] = await connection.query(invoiceQuery, [
            invoiceData.invoiceNo,
            invoiceData.invoiceDate,
            invoiceData.clientName || '',
            invoiceData.clientPhone || '',
            invoiceData.clientAddress || '',
            invoiceData.clientGst || '',
            invoiceData.taxRate,
            subtotal,
            taxAmount,
            totalAmount,
            invoiceData.sellerName || '',
            invoiceData.regdAddress || '',
            invoiceData.offcAddress || '',
            invoiceData.paymentInfo.bankName || '',
            invoiceData.paymentInfo.accountName || '',
            invoiceData.paymentInfo.accountNo || '',
            invoiceData.paymentInfo.ifscCode || '',
            invoiceData.paymentInfo.branch || ''
        ]);

        const invoiceId = invoiceResult.insertId;

        // Insert invoice items
        const itemQuery = `
            INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, line_total, item_order)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        for (let i = 0; i < invoiceData.items.length; i++) {
            const item = invoiceData.items[i];
            const lineTotal = item.quantity * item.unitPrice;
            await connection.query(itemQuery, [
                invoiceId,
                item.description || '',
                item.quantity,
                item.unitPrice,
                lineTotal,
                i + 1
            ]);
        }

        // Update invoice counter
        await connection.query('UPDATE invoice_counter SET current_invoice_no = current_invoice_no + 1 WHERE id = 1');

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

        // Fetch invoice items
        const itemsQuery = `
            SELECT description, quantity, unit_price, line_total
            FROM invoice_items
            WHERE invoice_id = ?
            ORDER BY item_order ASC
        `;
        const [itemsRows] = await con.query(itemsQuery, [id]);

        // Format response to match frontend structure
        const invoiceData = {
            invoiceNo: invoice.invoice_no,
            invoiceDate: invoice.invoice_date,
            clientName: invoice.client_name,
            clientPhone: invoice.client_phone,
            clientAddress: invoice.client_address,
            clientGst: invoice.client_gst,
            items: itemsRows.map(item => ({
                description: item.description,
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.unit_price)
            })),
            taxRate: parseFloat(invoice.tax_rate),
            sellerName: invoice.seller_name,
            regdAddress: invoice.regd_address,
            offcAddress: invoice.offc_address,
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



