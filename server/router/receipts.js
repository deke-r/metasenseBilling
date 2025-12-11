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

// Get all receipts
router.get('/receipts', verifyToken, async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT r.*, 
                   creator.name as created_by_name,
                   approver.name as approved_by_name
            FROM receipts r
            LEFT JOIN users creator ON r.created_by = creator.user_id
            LEFT JOIN users approver ON r.approved_by = approver.user_id
        `;

        const params = [];
        if (status) {
            query += ' WHERE r.status = ?';
            params.push(status);
        }

        query += ' ORDER BY r.created_at DESC';

        const [rows] = await con.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching receipts:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get single receipt
router.get('/receipts/:id', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT r.*, 
                   creator.name as created_by_name,
                   approver.name as approved_by_name
            FROM receipts r
            LEFT JOIN users creator ON r.created_by = creator.user_id
            LEFT JOIN users approver ON r.approved_by = approver.user_id
            WHERE r.id = ?
        `;

        const [rows] = await con.query(query, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Receipt not found" });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching receipt:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Create receipt (AM only)
router.post('/receipts', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'AM') {
            return res.status(403).json({ message: "Only AM can create receipts" });
        }

        const receiptData = req.body;

        const query = `
            INSERT INTO receipts (
                receipt_no, date, party_name, amount, po_wo_no,
                receipt_center, accounting_entry_type, debit_to, credit_to,
                ledger_balance, document_no, utr_imps_no, remarks,
                created_by, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;

        const [result] = await con.query(query, [
            receiptData.receipt_no,
            receiptData.date,
            receiptData.party_name,
            receiptData.amount,
            receiptData.po_wo_no,
            receiptData.receipt_center,
            receiptData.accounting_entry_type,
            receiptData.debit_to,
            receiptData.credit_to,
            receiptData.ledger_balance,
            receiptData.document_no,
            receiptData.utr_imps_no,
            receiptData.remarks,
            req.user.user_id
        ]);

        res.status(201).json({
            message: "Receipt created successfully",
            id: result.insertId
        });
    } catch (error) {
        console.error('Error creating receipt:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update receipt (AM only, if pending)
router.put('/receipts/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'AM') {
            return res.status(403).json({ message: "Only AM can update receipts" });
        }

        const [existing] = await con.query(
            'SELECT * FROM receipts WHERE id = ? AND created_by = ?',
            [req.params.id, req.user.user_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Receipt not found" });
        }

        // Allow editing only if status is pending or resubmit
        if (existing[0].status !== 'pending' && existing[0].status !== 'resubmit') {
            return res.status(403).json({ message: "Cannot edit approved/rejected receipt" });
        }

        const receiptData = req.body;

        // If status was resubmit, change it back to pending
        const newStatus = existing[0].status === 'resubmit' ? 'pending' : existing[0].status;

        const query = `
            UPDATE receipts SET
                date = ?, party_name = ?, amount = ?, po_wo_no = ?,
                receipt_center = ?, accounting_entry_type = ?, debit_to = ?,
                credit_to = ?, ledger_balance = ?, document_no = ?,
                utr_imps_no = ?, remarks = ?, status = ?
            WHERE id = ?
        `;

        await con.query(query, [
            receiptData.date,
            receiptData.party_name,
            receiptData.amount,
            receiptData.po_wo_no,
            receiptData.receipt_center,
            receiptData.accounting_entry_type,
            receiptData.debit_to,
            receiptData.credit_to,
            receiptData.ledger_balance,
            receiptData.document_no,
            receiptData.utr_imps_no,
            receiptData.remarks,
            newStatus,
            req.params.id
        ]);

        res.status(200).json({ message: "Receipt updated successfully" });
    } catch (error) {
        console.error('Error updating receipt:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Approve receipt (MG only)
router.post('/receipts/:id/approve', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'MG') {
            return res.status(403).json({ message: "Only MG can approve receipts" });
        }

        const { remark } = req.body;

        const query = `
            UPDATE receipts 
            SET status = 'approved', approved_by = ?, approved_at = NOW(), mg_remark = ?
            WHERE id = ? AND status = 'pending'
        `;

        const [result] = await con.query(query, [req.user.user_id, remark || '', req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Receipt not found or already processed" });
        }

        res.status(200).json({ message: "Receipt approved successfully" });
    } catch (error) {
        console.error('Error approving receipt:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Reject receipt (MG only)
router.post('/receipts/:id/reject', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'MG') {
            return res.status(403).json({ message: "Only MG can reject receipts" });
        }

        const { remark } = req.body;

        const query = `
            UPDATE receipts 
            SET status = 'rejected', approved_by = ?, approved_at = NOW(), mg_remark = ?
            WHERE id = ? AND status = 'pending'
        `;

        const [result] = await con.query(query, [req.user.user_id, remark || '', req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Receipt not found or already processed" });
        }

        res.status(200).json({ message: "Receipt rejected successfully" });
    } catch (error) {
        console.error('Error rejecting receipt:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Resubmit receipt (MG only) - Send back for re-edit
router.post('/receipts/:id/resubmit', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'MG') {
            return res.status(403).json({ message: "Only MG can send receipts for re-edit" });
        }

        const { remark } = req.body;

        const query = `
            UPDATE receipts 
            SET status = 'resubmit', approved_by = ?, approved_at = NOW(), mg_remark = ?
            WHERE id = ? AND status = 'pending'
        `;

        const [result] = await con.query(query, [req.user.user_id, remark || '', req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Receipt not found or already processed" });
        }

        res.status(200).json({ message: "Receipt sent for re-edit successfully" });
    } catch (error) {
        console.error('Error sending receipt for re-edit:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get next receipt number
router.get('/receipts/next-number', verifyToken, async (req, res) => {
    try {
        const [rows] = await con.query(
            'SELECT receipt_no FROM receipts ORDER BY id DESC LIMIT 1'
        );

        let nextNumber = 1;
        if (rows.length > 0 && rows[0].receipt_no) {
            const lastNumber = parseInt(rows[0].receipt_no.replace(/\D/g, ''));
            nextNumber = lastNumber + 1;
        }

        const receiptNo = `REC${String(nextNumber).padStart(6, '0')}`;
        res.status(200).json({ receipt_no: receiptNo });
    } catch (error) {
        console.error('Error generating receipt number:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
