const express = require('express');
const router = express.Router();
const con = require('../db/config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(' ')[1];
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/account-invoices');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'invoice-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Get all account invoices
router.get('/account-invoices', verifyToken, async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT ai.*, 
                   creator.name as created_by_name,
                   approver.name as approved_by_name
            FROM account_invoices ai
            LEFT JOIN users creator ON ai.created_by = creator.user_id
            LEFT JOIN users approver ON ai.approved_by = approver.user_id
        `;

        const params = [];
        if (status) {
            query += ' WHERE ai.status = ?';
            params.push(status);
        }

        query += ' ORDER BY ai.created_at DESC';

        const [rows] = await con.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching account invoices:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get single account invoice
router.get('/account-invoices/:id', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT ai.*, 
                   creator.name as created_by_name,
                   approver.name as approved_by_name
            FROM account_invoices ai
            LEFT JOIN users creator ON ai.created_by = creator.user_id
            LEFT JOIN users approver ON ai.approved_by = approver.user_id
            WHERE ai.id = ?
        `;

        const [rows] = await con.query(query, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Account invoice not found" });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching account invoice:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Create account invoice (AM only)
router.post('/account-invoices', verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (req.user.role !== 'AM') {
            return res.status(403).json({ message: "Only AM can create account invoices" });
        }

        const invoiceData = JSON.parse(req.body.data);
        const filePath = req.file ? `/uploads/account-invoices/${req.file.filename}` : null;

        const query = `
            INSERT INTO account_invoices (
                invoice_no, date, party_name, amount, po_wo_no,
                accounting_entry_type, debit_to, credit_to, ledger_balance,
                invoice_pdf_file, remarks, created_by, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;

        const [result] = await con.query(query, [
            invoiceData.invoice_no,
            invoiceData.date,
            invoiceData.party_name,
            invoiceData.amount,
            invoiceData.po_wo_no,
            invoiceData.accounting_entry_type,
            invoiceData.debit_to,
            invoiceData.credit_to,
            invoiceData.ledger_balance,
            filePath,
            invoiceData.remarks,
            req.user.user_id
        ]);

        res.status(201).json({
            message: "Account invoice created successfully",
            id: result.insertId
        });
    } catch (error) {
        console.error('Error creating account invoice:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update account invoice (AM only, if pending)
router.put('/account-invoices/:id', verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (req.user.role !== 'AM') {
            return res.status(403).json({ message: "Only AM can update account invoices" });
        }

        const [existing] = await con.query(
            'SELECT * FROM account_invoices WHERE id = ? AND created_by = ?',
            [req.params.id, req.user.user_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Account invoice not found" });
        }

        if (existing[0].status !== 'pending') {
            return res.status(403).json({ message: "Cannot edit approved/rejected invoice" });
        }

        const invoiceData = JSON.parse(req.body.data);
        const filePath = req.file ? `/uploads/account-invoices/${req.file.filename}` : existing[0].invoice_pdf_file;

        const query = `
            UPDATE account_invoices SET
                date = ?, party_name = ?, amount = ?, po_wo_no = ?,
                accounting_entry_type = ?, debit_to = ?, credit_to = ?,
                ledger_balance = ?, invoice_pdf_file = ?, remarks = ?
            WHERE id = ?
        `;

        await con.query(query, [
            invoiceData.date,
            invoiceData.party_name,
            invoiceData.amount,
            invoiceData.po_wo_no,
            invoiceData.accounting_entry_type,
            invoiceData.debit_to,
            invoiceData.credit_to,
            invoiceData.ledger_balance,
            filePath,
            invoiceData.remarks,
            req.params.id
        ]);

        res.status(200).json({ message: "Account invoice updated successfully" });
    } catch (error) {
        console.error('Error updating account invoice:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Approve account invoice (MG only)
router.post('/account-invoices/:id/approve', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'MG') {
            return res.status(403).json({ message: "Only MG can approve account invoices" });
        }

        const query = `
            UPDATE account_invoices 
            SET status = 'approved', approved_by = ?, approved_at = NOW()
            WHERE id = ? AND status = 'pending'
        `;

        const [result] = await con.query(query, [req.user.user_id, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Account invoice not found or already processed" });
        }

        res.status(200).json({ message: "Account invoice approved successfully" });
    } catch (error) {
        console.error('Error approving account invoice:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Reject account invoice (MG only)
router.post('/account-invoices/:id/reject', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'MG') {
            return res.status(403).json({ message: "Only MG can reject account invoices" });
        }

        const query = `
            UPDATE account_invoices 
            SET status = 'rejected', approved_by = ?, approved_at = NOW()
            WHERE id = ? AND status = 'pending'
        `;

        const [result] = await con.query(query, [req.user.user_id, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Account invoice not found or already processed" });
        }

        res.status(200).json({ message: "Account invoice rejected successfully" });
    } catch (error) {
        console.error('Error rejecting account invoice:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get next account invoice number
router.get('/account-invoices/next-number', verifyToken, async (req, res) => {
    try {
        const [rows] = await con.query(
            'SELECT invoice_no FROM account_invoices ORDER BY id DESC LIMIT 1'
        );

        let nextNumber = 1;
        if (rows.length > 0 && rows[0].invoice_no) {
            const lastNumber = parseInt(rows[0].invoice_no.replace(/\D/g, ''));
            nextNumber = lastNumber + 1;
        }

        const invoiceNo = `AINV${String(nextNumber).padStart(6, '0')}`;
        res.status(200).json({ invoice_no: invoiceNo });
    } catch (error) {
        console.error('Error generating invoice number:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
