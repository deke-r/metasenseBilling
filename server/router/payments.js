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
        const uploadDir = path.join(__dirname, '../uploads/payments');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
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
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all payments (filtered by role)
router.get('/payments', verifyToken, async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT p.*, 
                   creator.name as created_by_name,
                   approver.name as approved_by_name
            FROM payments p
            LEFT JOIN users creator ON p.created_by = creator.user_id
            LEFT JOIN users approver ON p.approved_by = approver.user_id
        `;

        const params = [];
        if (status) {
            query += ' WHERE p.status = ?';
            params.push(status);
        }

        query += ' ORDER BY p.created_at DESC';

        const [rows] = await con.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get single payment
router.get('/payments/:id', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT p.*, 
                   creator.name as created_by_name,
                   approver.name as approved_by_name
            FROM payments p
            LEFT JOIN users creator ON p.created_by = creator.user_id
            LEFT JOIN users approver ON p.approved_by = approver.user_id
            WHERE p.id = ?
        `;

        const [rows] = await con.query(query, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Create payment (AM only)
router.post('/payments', verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (req.user.role !== 'AM') {
            return res.status(403).json({ message: "Only AM can create payments" });
        }

        const paymentData = JSON.parse(req.body.data);
        const filePath = req.file ? `/uploads/payments/${req.file.filename}` : null;

        const query = `
            INSERT INTO payments (
                payment_no, date, party_name, transaction_type, amount,
                requested_by, payment_category, payment_center, accounting_entry_type,
                debit_to, credit_to, ledger_balance, total_budget, available_budget,
                document_no, utr_imps_no, file_pdf, remarks, created_by, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;

        const [result] = await con.query(query, [
            paymentData.payment_no,
            paymentData.date,
            paymentData.party_name,
            paymentData.transaction_type,
            paymentData.amount,
            paymentData.requested_by,
            paymentData.payment_category,
            paymentData.payment_center,
            paymentData.accounting_entry_type,
            paymentData.debit_to,
            paymentData.credit_to,
            paymentData.ledger_balance,
            paymentData.total_budget,
            paymentData.available_budget,
            paymentData.document_no,
            paymentData.utr_imps_no,
            filePath,
            paymentData.remarks,
            req.user.user_id
        ]);

        res.status(201).json({
            message: "Payment created successfully",
            id: result.insertId
        });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update payment (AM only, if pending)
router.put('/payments/:id', verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (req.user.role !== 'AM') {
            return res.status(403).json({ message: "Only AM can update payments" });
        }

        // Check if payment exists and is pending
        const [existing] = await con.query(
            'SELECT * FROM payments WHERE id = ? AND created_by = ?',
            [req.params.id, req.user.user_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Payment not found" });
        }

        if (existing[0].status !== 'pending') {
            return res.status(403).json({ message: "Cannot edit approved/rejected payment" });
        }

        const paymentData = JSON.parse(req.body.data);
        const filePath = req.file ? `/uploads/payments/${req.file.filename}` : existing[0].file_pdf;

        const query = `
            UPDATE payments SET
                date = ?, party_name = ?, transaction_type = ?, amount = ?,
                requested_by = ?, payment_category = ?, payment_center = ?,
                accounting_entry_type = ?, debit_to = ?, credit_to = ?,
                ledger_balance = ?, total_budget = ?, available_budget = ?,
                document_no = ?, utr_imps_no = ?, file_pdf = ?, remarks = ?
            WHERE id = ?
        `;

        await con.query(query, [
            paymentData.date,
            paymentData.party_name,
            paymentData.transaction_type,
            paymentData.amount,
            paymentData.requested_by,
            paymentData.payment_category,
            paymentData.payment_center,
            paymentData.accounting_entry_type,
            paymentData.debit_to,
            paymentData.credit_to,
            paymentData.ledger_balance,
            paymentData.total_budget,
            paymentData.available_budget,
            paymentData.document_no,
            paymentData.utr_imps_no,
            filePath,
            paymentData.remarks,
            req.params.id
        ]);

        res.status(200).json({ message: "Payment updated successfully" });
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Approve payment (MG only)
router.post('/payments/:id/approve', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'MG') {
            return res.status(403).json({ message: "Only MG can approve payments" });
        }

        const { remark } = req.body;

        const query = `
            UPDATE payments 
            SET status = 'approved', approved_by = ?, approved_at = NOW(), mg_remark = ?
            WHERE id = ? AND status = 'pending'
        `;

        const [result] = await con.query(query, [req.user.user_id, remark || '', req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Payment not found or already processed" });
        }

        res.status(200).json({ message: "Payment approved successfully" });
    } catch (error) {
        console.error('Error approving payment:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Reject payment (MG only)
router.post('/payments/:id/reject', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'MG') {
            return res.status(403).json({ message: "Only MG can reject payments" });
        }

        const { remark } = req.body;

        const query = `
            UPDATE payments 
            SET status = 'rejected', approved_by = ?, approved_at = NOW(), mg_remark = ?
            WHERE id = ? AND status = 'pending'
        `;

        const [result] = await con.query(query, [req.user.user_id, remark || '', req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Payment not found or already processed" });
        }

        res.status(200).json({ message: "Payment rejected successfully" });
    } catch (error) {
        console.error('Error rejecting payment:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Resubmit payment (MG only) - Send back for re-edit
router.post('/payments/:id/resubmit', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'MG') {
            return res.status(403).json({ message: "Only MG can send payments for re-edit" });
        }

        const { remark } = req.body;

        const query = `
            UPDATE payments 
            SET status = 'resubmit', approved_by = ?, approved_at = NOW(), mg_remark = ?
            WHERE id = ? AND status = 'pending'
        `;

        const [result] = await con.query(query, [req.user.user_id, remark || '', req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Payment not found or already processed" });
        }

        res.status(200).json({ message: "Payment sent for re-edit successfully" });
    } catch (error) {
        console.error('Error sending payment for re-edit:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get next payment number
router.get('/payments/next-number', verifyToken, async (req, res) => {
    try {
        const [rows] = await con.query(
            'SELECT payment_no FROM payments ORDER BY id DESC LIMIT 1'
        );

        let nextNumber = 1;
        if (rows.length > 0 && rows[0].payment_no) {
            const lastNumber = parseInt(rows[0].payment_no.replace(/\D/g, ''));
            nextNumber = lastNumber + 1;
        }

        const paymentNo = `PAY${String(nextNumber).padStart(6, '0')}`;
        res.status(200).json({ payment_no: paymentNo });
    } catch (error) {
        console.error('Error generating payment number:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
