const express = require("express");
const app = express();
const router = require('./router/routes');
const cors = require("cors");
const con = require("./db/config");
const bodyParser = require("body-parser");
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const authRouter = require("./router/auth");
const paymentsRouter = require("./router/payments");
const receiptsRouter = require("./router/receipts");
const accountInvoicesRouter = require("./router/accountInvoices");
const usersRouter = require("./router/users");

// TEST DB
const initdb = async () => {
    try {
        console.log("Connecting to MySQL...");
        await con.getConnection();
        console.log("Connected to MySQL");
    } catch (error) {
        console.log("Error connecting to MySQL", error);
    }
};
initdb();

// ⭐ TEST API MUST BE UNDER /api
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Backend is running on /api/test",
        time: new Date()
    });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Mount routes
app.use('/api', router);
app.use('/api/auth', authRouter);
app.use('/api', paymentsRouter);
app.use('/api', receiptsRouter);
app.use('/api', accountInvoicesRouter);
app.use('/api', usersRouter);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
