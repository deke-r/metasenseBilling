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


        const token = jwt.sign(
            { name: rows[0].name, email: rows[0].email, role: rows[0].role },
            process.env.SECRET_KEY,
            { expiresIn: 60 * 60 }
        );



        res.status(200).json({ message: "Login successful", token })
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

module.exports = router;