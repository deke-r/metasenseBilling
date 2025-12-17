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

// Mount routes
app.use('/api', router);
app.use('/api/auth', authRouter);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
