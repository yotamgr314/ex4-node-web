const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_USER,
    waitForConnections: true
});

module.exports = pool;
/* exports.dataBaseConnection = {
    async createConnection() {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host     : process.env.DB_HOST,
            user     : process.env.DB_USERNAME,
            password : process.env.DB_PASSWORD,
            database : process.env.DB_NAME
        });

        console.log('Database connection established');

        return connection;
    }
}
 */