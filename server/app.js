const express = require("express");
const app = express();
const router = require('./router/routes');
const cors = require("cors");
const con = require("./db/config");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())
require('dotenv').config();


const authRouter = require("./router/auth");



const initdb = async () => {
    try {
        console.log("Connecting to MySQL...");
        const connection = await con.getConnection()


        console.log("Connected to MySQL");
    } catch (error) {
        console.log("Error connecting to MySQL", error);
    }


}


initdb()


app.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Backend is running!",
        time: new Date()
    });
});

app.use('/', router);
app.use('/auth', authRouter);
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})