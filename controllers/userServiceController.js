// controllers/userServiceController.js
const { dataBaseConnection } = require('../dbInitHandler');
const usersTable = 'tbl_32_users';

exports.userServiceController = {
    async registerUser(req, res) {
        const { username, password } = req.body;
    
        if (!username || !password) {
            return res.status(400).json({ status: 'error', message: 'Username and password are required' });
        }
    
        try {
            const [usersCountResult] = await dataBaseConnection.query(`SELECT COUNT(*) as count FROM ${usersTable}`);
            const usersCount = usersCountResult[0].count;
    
            if (usersCount >= 5) {
                return res.status(400).json({ status: 'error', message: 'Maximum number of users reached' });
            }
    
            const [existingUser] = await dataBaseConnection.query(`SELECT * FROM ${usersTable} WHERE user_name = ?`, [username]);
            if (existingUser.length > 0) {
                return res.status(400).json({ status: 'error', message: 'Username already exists' });
            }
    
            const accessCode = generateUniqueAccessCode();
    
            await dataBaseConnection.query(`INSERT INTO ${usersTable} (user_name, user_password, user_token_code) VALUES (?, ?, ?)`, [username, password, accessCode]);
    
            return res.status(201).json({ status: 'success', message: 'User registered successfully', accessCode: accessCode });
    
        } catch (error) {
            return res.status(500).json({ status: 'error', message: 'An error occurred while registering the user' });
        }
    }
};

function generateUniqueAccessCode() {
    return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16));
}
