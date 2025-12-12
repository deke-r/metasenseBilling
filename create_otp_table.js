const con = require('./server/db/config');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS password_reset_otps (
    email VARCHAR(255) PRIMARY KEY,
    otp VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

async function createTable() {
    try {
        await con.query(createTableQuery);
        console.log("Table 'password_reset_otps' created successfully");
        process.exit(0);
    } catch (error) {
        console.error("Error creating table:", error);
        process.exit(1);
    }
}

createTable();
