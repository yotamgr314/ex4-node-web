// dbInitHandler.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const dataBaseConnection = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE_NAME
});

module.exports = { dataBaseConnection };
