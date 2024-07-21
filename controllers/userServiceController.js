const { dataBaseConnection } = require('../dbInitHandler');
const usersTable = 'tbl_32_users';

exports.userServiceController = {

    async registerUser(req, res) { 
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ status: 'error', message: 'Username and password are required' });
        }

        try {
            const dbConnection = await dataBaseConnection.createConnection();
            
            const [usersCountResult] = await dbConnection.query(`SELECT COUNT(*) as count FROM ${usersTable}`);
            const usersCount = usersCountResult[0].count;
    
            if (usersCount >= 5) {
                return res.status(400).json({ status: 'error', message: 'Maximum number of users reached' });
            }
    
            const [existingUser] = await dbConnection.query(`SELECT * FROM ${usersTable} WHERE user_name = ?`, [username]);
            if (existingUser.length > 0) {
                return res.status(400).json({ status: 'error', message: 'Username already exists' });
            }
    
            const accessCode = generateUniqueAccessCode();
    
            await dbConnection.query(`INSERT INTO ${usersTable} (user_name, user_password, user_token_code) VALUES (?, ?, ?)`, [username, password, accessCode]);
    
            return res.status(201).json({ status: 'success', message: 'User registered successfully', accessCode: accessCode });
    
        } catch (error) {
            console.error('Error registering user:', error);
            return res.status(500).json({ status: 'error', message: 'An error occurred while registering the user', details: error.message });
        }
    },

    async getUserToken(req, res) {
        const { username } = req.query; 

        if (!username) {
            return res.status(400).json({ status: 'error', message: 'Username is required' });
        }

        try {
            const dbConnection = await dataBaseConnection.createConnection();
            
            console.log('Received username:', username); 

            const [existingUser] = await dbConnection.query(`SELECT user_token_code FROM ${usersTable} WHERE user_name = ?`, [username]);
            
            console.log('Query Result:', existingUser); 

            if (existingUser.length === 0) {
                return res.status(404).json({ status: 'error', message: 'Username not found' });
            }

            const userToken = existingUser[0].user_token_code;
            return res.status(200).json({ status: 'success', user_token_code: userToken });

        } catch (error) {
            console.error('Error fetching user token:', error);
            return res.status(500).json({ status: 'error', message: 'An error occurred while fetching the user token', details: error.message });
        }
    }
};

function generateUniqueAccessCode() {
    return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16));
}
