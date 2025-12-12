const express = require('express');
const router = express.Router();
const con = require('../db/config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendEmail, getNotificationTemplate, getManagerEmails, getUserEmail } = require('../utils/emailService');

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

        // Notify Managers
        const managerEmails = await getManagerEmails();
        const emailSubject = `New Payment Request: ${paymentData.payment_no}`;
        const emailBody = `
            A new payment request <strong>${paymentData.payment_no}</strong> for <strong>${paymentData.party_name}</strong> (Amount: ₹${paymentData.amount}) has been submitted by ${req.user.name}.
            <br><br>
            Please login to the dashboard to review and approve/reject this request.
        `;
        const emailHtml = getNotificationTemplate('New Payment Request', emailBody);
        sendEmail(managerEmails, emailSubject, emailHtml);
    } catch (error) {
        console.error('Error creating payment:', error);
        if (error && error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                message: "This Payment Number already exists. Please use a unique Payment Number."
            });
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update payment (AM only, if pending)
router.put('/payments/:id', verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (req.user.role !== 'AM') {
            return res.status(403).json({ message: "Only AM can update payments" });
        }

        // Check if payment exists and is pending or resubmit
        const [existing] = await con.query(
            'SELECT * FROM payments WHERE id = ? AND created_by = ?',
            [req.params.id, req.user.user_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Payment not found" });
        }

        // Allow editing only if status is pending or resubmit
        if (existing[0].status !== 'pending' && existing[0].status !== 'resubmit') {
            return res.status(403).json({ message: "Cannot edit approved/rejected payment" });
        }

        const paymentData = JSON.parse(req.body.data);
        const filePath = req.file ? `/uploads/payments/${req.file.filename}` : existing[0].file_pdf;

        // If status was resubmit, change it back to pending
        const newStatus = existing[0].status === 'resubmit' ? 'pending' : existing[0].status;

        const query = `
            UPDATE payments SET
                date = ?, party_name = ?, transaction_type = ?, amount = ?,
                requested_by = ?, payment_category = ?, payment_center = ?,
                accounting_entry_type = ?, debit_to = ?, credit_to = ?,
                ledger_balance = ?, total_budget = ?, available_budget = ?,
                document_no = ?, utr_imps_no = ?, file_pdf = ?, remarks = ?, status = ?
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
            newStatus,
            req.params.id
        ]);

        res.status(200).json({ message: "Payment updated successfully" });

        // Notify Managers if it was a re-submission (status changed from resubmit to pending)
        if (existing[0].status === 'resubmit' && newStatus === 'pending') {
            const managerEmails = await getManagerEmails();
            const emailSubject = `Payment Resubmitted: ${paymentData.payment_no}`;
            const emailBody = `
                The payment request <strong>${paymentData.payment_no}</strong> for <strong>${paymentData.party_name}</strong> (Amount: ₹${paymentData.amount}) has been updated and resubmitted by ${req.user.name}.
                <br><br>
                Please login to the dashboard to review and approve/reject this request.
            `;
            const emailHtml = getNotificationTemplate('Payment Request Resubmitted', emailBody);
            sendEmail(managerEmails, emailSubject, emailHtml);
        }
    } catch (error) {
        console.error('Error updating payment:', error);
        if (error && error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                message: "This Payment Number already exists. Please use a unique Payment Number."
            });
        }
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

        // Notify Creator
        const [paymentRows] = await con.query('SELECT created_by, payment_no FROM payments WHERE id = ?', [req.params.id]);
        if (paymentRows.length > 0) {
            const creatorEmail = await getUserEmail(paymentRows[0].created_by);
            if (creatorEmail) {
                const subject = `Payment Approved: ${paymentRows[0].payment_no}`;
                const body = `
                    Your payment request <strong>${paymentRows[0].payment_no}</strong> has been <strong>APPROVED</strong> by ${req.user.name}.
                    <br><br>
                    <strong>Remarks:</strong> ${remark || 'None'}
                `;
                const html = getNotificationTemplate('Payment Request Approved', body);
                sendEmail(creatorEmail, subject, html);
            }
        }
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

        // Notify Creator
        const [paymentRows] = await con.query('SELECT created_by, payment_no FROM payments WHERE id = ?', [req.params.id]);
        if (paymentRows.length > 0) {
            const creatorEmail = await getUserEmail(paymentRows[0].created_by);
            if (creatorEmail) {
                const subject = `Payment Rejected: ${paymentRows[0].payment_no}`;
                const body = `
                    Your payment request <strong>${paymentRows[0].payment_no}</strong> has been <strong>REJECTED</strong> by ${req.user.name}.
                    <br><br>
                    <strong>Reason:</strong> ${remark}
                `;
                const html = getNotificationTemplate('Payment Request Rejected', body);
                sendEmail(creatorEmail, subject, html);
            }
        }
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

        // Notify Creator
        const [paymentRows] = await con.query('SELECT created_by, payment_no FROM payments WHERE id = ?', [req.params.id]);
        if (paymentRows.length > 0) {
            const creatorEmail = await getUserEmail(paymentRows[0].created_by);
            if (creatorEmail) {
                const subject = `Action Required: Payment ${paymentRows[0].payment_no}`;
                const body = `
                    Your payment request <strong>${paymentRows[0].payment_no}</strong> has been sent back for <strong>RE-EDIT</strong> by ${req.user.name}.
                    <br><br>
                    <strong>Comments:</strong> ${remark}
                    <br><br>
                    Please update the details and resubmit.
                `;
                const html = getNotificationTemplate('Payment Request Returned', body);
                sendEmail(creatorEmail, subject, html);
            }
        }
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
