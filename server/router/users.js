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

// Get list of AM users (for MG dashboard)
router.get('/users/am-list', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'MG') {
            return res.status(403).json({ message: "Only MG can view AM list" });
        }

        const [rows] = await con.query(
            'SELECT user_id, name, email, last_login FROM users WHERE role = ? AND status = 1',
            ['AM']
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching AM users:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
