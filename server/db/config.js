const mysql=require("mysql2/promise");
require("dotenv").config();

const con=mysql.createPool({
    host:process.env.Host,
    user:process.env.User,
    password:process.env.Password,
    database:process.env.Database,
    waitForConnections:true,
    connectionLimit:10,
    queueLimit:0
})


module.exports=con;