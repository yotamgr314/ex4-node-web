// THE ACTUAL IMPLEMENTATION OF ROUTERS REQUEST WILL BE IMPLEMENTED HERE (GET, POST, PUT, DELETE VIA MYSQL QUERIES)

const { dataBaseConnection } = require("../db_connection");
const usersTable = "tbl_32_users";

exports.userServiceController = {

    async registerUser(req, res) {
        const { username, password } = req.body;
    
        // Check if username and password are provided
        if (!username || !password) {
          return res.status(400).json({ status: "error", message: "Username and password are required" });
        }
    
        try {
          // Check if the maximum number of users is reached
          const usersCountResult = await dataBaseConnection.query(`SELECT COUNT(*) as count FROM ${usersTable}`);
          const usersCount = usersCountResult[0].count;
    
          if (usersCount >= 5) {
            return res.status(400).json({ status: "error", message: "Maximum number of users reached" });
          }
    
          // Check if the username is unique
          const existingUser = await dataBaseConnection.query(`SELECT * FROM ${usersTable} WHERE username = ?`, [username]);
          if (existingUser.length > 0) {
            return res.status(400).json({ status: "error", message: "Username already exists" });
          }
    
          // Generate a unique access code
          const accessCode = generateUniqueAccessCode();
    
          // Insert the new user into the database
          await dataBaseConnection.query(`INSERT INTO ${usersTable} (username, password, access_code) VALUES (?, ?, ?)`, [username, password, accessCode]);
    
          return res.status(201).json({ status: "success", message: "User registered successfully", accessCode: accessCode });
    
        } catch (error) {
          return res.status(500).json({ status: "error", message: "An error occurred while registering the user" });
        }
      }
    };
    
    function generateUniqueAccessCode() {
      return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, function() {
        return (Math.random() * 16 | 0).toString(16);
      });
    
};