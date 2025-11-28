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
    try {
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

            await con.query(clientQuery, [
                invoiceData.clientName.trim(),
                invoiceData.clientPhone || '',
                invoiceData.clientAddress || '',
                invoiceData.clientGst || ''
            ]);
        }

        // Update invoice counter
        await con.query('UPDATE invoice_counter SET current_invoice_no = current_invoice_no + 1 WHERE id = 1');

        res.status(200).json({ message: "Invoice saved successfully" });
    } catch (error) {
        console.error('Error saving invoice:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;


