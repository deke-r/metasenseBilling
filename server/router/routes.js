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

// Save invoice and increment counter
router.post('/invoice/save', verifyToken, async (req, res) => {
    try {
        const { invoiceData } = req.body;

        // Update invoice counter
        await con.query('UPDATE invoice_counter SET current_invoice_no = current_invoice_no + 1 WHERE id = 1');

        res.status(200).json({ message: "Invoice saved successfully" });
    } catch (error) {
        console.error('Error saving invoice:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;


