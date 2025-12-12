const express = require("express");
const router = express.Router();
const con = require("../db/config");
const bcrypt = require("bcryptjs");
var jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
    try {

        console.log(req.body)

        const { email, password } = req.body;



        const qry = 'SELECT * FROM users WHERE email=? and status =?';
        const [rows] = await con.query(qry, [email, 1])
        console.log(rows)
        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" })
        }

        const validPassword = await bcrypt.compare(password, rows[0].pass);
        console.log(validPassword)
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid email or password" })
        }

        // Update last_login timestamp
        const updateLoginQry = 'UPDATE users SET last_login = NOW() WHERE user_id = ?';
        await con.query(updateLoginQry, [rows[0].user_id]);

        const token = jwt.sign(
            { user_id: rows[0].user_id, name: rows[0].name, email: rows[0].email, role: rows[0].role },
            process.env.SECRET_KEY,
            { expiresIn: 60 * 60 }
        );



        res.status(200).json({
            message: "Login successful",
            token,
            role: rows[0].role,
            name: rows[0].name,
            last_login: rows[0].last_login
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" })
    }
})

// Change Password endpoint
router.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY);
        } catch (err) {
            return res.status(401).json({ message: "Unauthorized - Invalid token" });
        }

        // Get user from database
        const qry = 'SELECT * FROM users WHERE email=? and status=?';
        const [rows] = await con.query(qry, [decoded.email, 1]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = rows[0];

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.pass);
        if (!validPassword) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password in database
        const updateQry = 'UPDATE users SET pass=? WHERE email=?';
        await con.query(updateQry, [hashedPassword, decoded.email]);

        res.status(200).json({ message: "Password changed successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Request OTP endpoint
router.post('/request-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        // Check if user exists
        const [users] = await con.query('SELECT * FROM users WHERE email = ? AND status = 1', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        // Generate 6-digit OTP using crypto
        const otp = require('crypto').randomInt(100000, 999999).toString();

        // Set expiry (10 minutes from now)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Save/Update OTP in database
        // Using ON DUPLICATE KEY UPDATE to handle existing entries for same email
        const qry = `INSERT INTO password_reset_otps (email, otp, expires_at) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at)`;

        await con.query(qry, [email, otp, expiresAt]);

        // Send email
        const { sendEmail, getNotificationTemplate } = require('../utils/emailService');
        const htmlContent = getNotificationTemplate(
            'Password Reset OTP',
            `Your OTP for password reset is: <strong>${otp}</strong>.<br>This OTP is valid for 10 minutes.`
        );

        await sendEmail(email, 'Password Reset OTP', htmlContent);

        res.status(200).json({ message: "OTP sent successfully to your email" });

    } catch (error) {
        console.error('Error requesting OTP:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const [rows] = await con.query('SELECT * FROM password_reset_otps WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(400).json({ message: "No OTP request found for this email" });
        }

        const record = rows[0];

        // Check expiry
        if (new Date() > new Date(record.expires_at)) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        // Check OTP match
        if (record.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Generate a temporary reset token (valid for 15 mins)
        const resetToken = jwt.sign(
            { email: email, purpose: 'reset-password' },
            process.env.SECRET_KEY,
            { expiresIn: '15m' }
        );

        res.status(200).json({
            message: "OTP verified successfully",
            resetToken
        });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Reset Password endpoint
router.post('/reset-password', async (req, res) => {
    const { newPassword } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        if (decoded.purpose !== 'reset-password') {
            return res.status(403).json({ message: "Invalid token purpose" });
        }

        const email = decoded.email;

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await con.query('UPDATE users SET pass = ? WHERE email = ?', [hashedPassword, email]);

        // Delete used OTP
        await con.query('DELETE FROM password_reset_otps WHERE email = ?', [email]);

        res.status(200).json({ message: "Password reset successfully. Please login with new password." });

    } catch (error) {
        console.error('Error resetting password:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Reset session expired. Please start over." });
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

// Request OTP endpoint
router.post('/request-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        // Check if user exists
        const [users] = await con.query('SELECT * FROM users WHERE email = ? AND status = 1', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        // Generate 6-digit OTP using crypto
        const otp = require('crypto').randomInt(100000, 999999).toString();

        // Set expiry (10 minutes from now)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Save/Update OTP in database
        // Using ON DUPLICATE KEY UPDATE to handle existing entries for same email
        const qry = `INSERT INTO password_reset_otps (email, otp, expires_at) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at)`;

        await con.query(qry, [email, otp, expiresAt]);

        // Send email
        const { sendEmail, getNotificationTemplate } = require('../utils/emailService');
        const htmlContent = getNotificationTemplate(
            'Password Reset OTP',
            `Your OTP for password reset is: <strong>${otp}</strong>.<br>This OTP is valid for 10 minutes.`
        );

        await sendEmail(email, 'Password Reset OTP', htmlContent);

        res.status(200).json({ message: "OTP sent successfully to your email" });

    } catch (error) {
        console.error('Error requesting OTP:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const [rows] = await con.query('SELECT * FROM password_reset_otps WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(400).json({ message: "No OTP request found for this email" });
        }

        const record = rows[0];

        // Check expiry
        if (new Date() > new Date(record.expires_at)) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        // Check OTP match
        if (record.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Generate a temporary reset token (valid for 15 mins)
        const resetToken = jwt.sign(
            { email: email, purpose: 'reset-password' },
            process.env.SECRET_KEY,
            { expiresIn: '15m' }
        );

        res.status(200).json({
            message: "OTP verified successfully",
            resetToken
        });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Reset Password endpoint
router.post('/reset-password', async (req, res) => {
    const { newPassword } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        if (decoded.purpose !== 'reset-password') {
            return res.status(403).json({ message: "Invalid token purpose" });
        }

        const email = decoded.email;

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await con.query('UPDATE users SET pass = ? WHERE email = ?', [hashedPassword, email]);

        // Delete used OTP
        await con.query('DELETE FROM password_reset_otps WHERE email = ?', [email]);

        res.status(200).json({ message: "Password reset successfully. Please login with new password." });

    } catch (error) {
        console.error('Error resetting password:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Reset session expired. Please start over." });
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

// Request OTP endpoint
router.post('/request-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        // Check if user exists
        const [users] = await con.query('SELECT * FROM users WHERE email = ? AND status = 1', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        // Generate 6-digit OTP using crypto
        const otp = require('crypto').randomInt(100000, 999999).toString();

        // Set expiry (10 minutes from now)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Save/Update OTP in database
        // Using ON DUPLICATE KEY UPDATE to handle existing entries for same email
        const qry = `INSERT INTO password_reset_otps (email, otp, expires_at) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at)`;

        await con.query(qry, [email, otp, expiresAt]);

        // Send email
        const { sendEmail, getNotificationTemplate } = require('../utils/emailService');
        const htmlContent = getNotificationTemplate(
            'Password Reset OTP',
            `Your OTP for password reset is: <strong>${otp}</strong>.<br>This OTP is valid for 10 minutes.`
        );

        await sendEmail(email, 'Password Reset OTP', htmlContent);

        res.status(200).json({ message: "OTP sent successfully to your email" });

    } catch (error) {
        console.error('Error requesting OTP:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const [rows] = await con.query('SELECT * FROM password_reset_otps WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(400).json({ message: "No OTP request found for this email" });
        }

        const record = rows[0];

        // Check expiry
        if (new Date() > new Date(record.expires_at)) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        // Check OTP match
        if (record.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Generate a temporary reset token (valid for 15 mins)
        // We can reuse the same JWT structure but maybe with a special flag or just use it immediately
        // Here we'll return a token that is authorized ONLY for password reset? 
        // For simplicity, we can return a signed token with a specific purpose or just use the email in the next step safely if client holds state.
        // Better implementation: Return a specifically signed JWT for 'reset-password' scope.

        const resetToken = jwt.sign(
            { email: email, purpose: 'reset-password' },
            process.env.SECRET_KEY,
            { expiresIn: '15m' }
        );

        res.status(200).json({
            message: "OTP verified successfully",
            resetToken
        });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Reset Password endpoint
router.post('/reset-password', async (req, res) => {
    const { newPassword } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        if (decoded.purpose !== 'reset-password') {
            return res.status(403).json({ message: "Invalid token purpose" });
        }

        const email = decoded.email;

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await con.query('UPDATE users SET pass = ? WHERE email = ?', [hashedPassword, email]);

        // Delete used OTP
        await con.query('DELETE FROM password_reset_otps WHERE email = ?', [email]);

        res.status(200).json({ message: "Password reset successfully. Please login with new password." });

    } catch (error) {
        console.error('Error resetting password:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Reset session expired. Please start over." });
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;