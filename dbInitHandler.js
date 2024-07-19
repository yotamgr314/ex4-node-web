// In Node.js, the exports object is part of the module object and is used to export functions, objects, or values from one  file to another
// that so other files can be imported it.

// Use exports when you want to add multiple properties or methods to the module's exports.
// Use module.exports when you want to export a single object, class, or function.
exports.dbConnection = {
    async createConnection() {
        const mysql = require('mysql2/promise');
        /* mysql has a function calld createConnection */
        const connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASS,
            database: process.env.DATABASE_NAME
        });

        return connection;
    }
}



