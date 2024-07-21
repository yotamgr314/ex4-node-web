const { dataBaseConnection } = require('../dbInitHandler');
const preferencesTable = 'tbl_32_preferences';
const usersTable = 'tbl_32_users';
const vacationCategories = require('../data/vacationCategories.json').vacationCategories;
const vacationLocation = require('../data/vacationLocation.json').vacationLocation;

function formatDateToYMD(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function validateInput({ access_code, start_date, end_date, destination, vacation_type }) {
    if (!access_code || !start_date || !end_date || !destination || !vacation_type) {
        return 'All fields are required: access_code, start_date, end_date, destination, vacation_type';
    }

    if (!vacationCategories.includes(vacation_type)) {
        return `Invalid vacation type. Valid types are: ${vacationCategories.join(', ')}`;
    }

    if (!vacationLocation.includes(destination)) {
        return `Invalid destination. Valid destinations are: ${vacationLocation.join(', ')}`;
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (isNaN(startDate) || isNaN(endDate)) {
        return 'Invalid dates format. Use YYYY-MM-DD format.';
    }
    if (startDate >= endDate) {
        return 'Invalid dates. End date must be after start date.';
    }
    const dayDifference = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (dayDifference >= 7) {
        return 'Vacation cannot be longer than 7 days.';
    }

    return null;
}

async function checkUserAndPreferences(access_code) {
    const dbConnection = await dataBaseConnection.createConnection();

    const [user] = await dbConnection.query(`SELECT user_id FROM ${usersTable} WHERE user_token_code = ?`, [access_code]);
    if (user.length === 0) {
        throw new Error('User not found with the provided access code.');
    }

    const userId = user[0].user_id;

    const [existingPreferences] = await dbConnection.query(`SELECT COUNT(*) as count FROM ${preferencesTable} WHERE user_id = ?`, [userId]);
    if (existingPreferences[0].count >= 1) {
        throw new Error('User already has an existing preference. Each user can only have one preference.');
    }

    return userId;
}

exports.vacationPreferencesController = {
    async addPreference(req, res) {
        const { access_code, start_date, end_date, destination, vacation_type } = req.body;

        const validationError = validateInput({ access_code, start_date, end_date, destination, vacation_type });
        if (validationError) {
            return res.status(400).json({ status: 'error', message: validationError });
        }

        try {
            const userId = await checkUserAndPreferences(access_code);

            const dbConnection = await dataBaseConnection.createConnection();
            await dbConnection.query(`INSERT INTO ${preferencesTable} (vacation_destination, vacation_type, start_date, end_date, user_id) VALUES (?, ?, ?, ?, ?)`, 
                                      [destination, vacation_type, start_date, end_date, userId]);

            return res.status(201).json({ status: 'success', message: 'Preferences inserted successfully' });
    
        } catch (error) {
            console.error('Error adding preference:', error);
            return res.status(500).json({ status: 'error', message: 'An error occurred while adding the preference', details: error.message });
        }
    },

    async getPreferences(req, res) {
        try {
            const dbConnection = await dataBaseConnection.createConnection();
            const [preferences] = await dbConnection.query(`SELECT * FROM ${preferencesTable}`);

            const formattedPreferences = preferences.map(pref => {
                const startDate = new Date(pref.start_date);
                const endDate = new Date(pref.end_date);

                return {
                    ...pref,
                    start_date: formatDateToYMD(startDate),
                    end_date: formatDateToYMD(endDate)
                };
            });

            return res.status(200).json(formattedPreferences);
        } catch (error) {
            console.error('Error fetching preferences:', error);
            return res.status(500).json({ status: 'error', message: 'An error occurred while fetching preferences', details: error.message });
        }
    },

    async editPreference(req, res) {
        const { accessCode, startDate, endDate, destination, vacationType } = req.body;

        const validationError = validateInput({ access_code: accessCode, start_date: startDate, end_date: endDate, destination, vacation_type: vacationType });
        if (validationError) {
            return res.status(400).json({ status: 'error', message: validationError });
        }

        try {
            const dbConnection = await dataBaseConnection.createConnection();

            const [user] = await dbConnection.query(`SELECT user_id FROM ${usersTable} WHERE user_token_code = ?`, [accessCode]);
            if (user.length === 0) {
                return res.status(404).json({ status: 'error', message: 'User not found with the provided access code.' });
            }

            const userId = user[0].user_id;

            const [updateResult] = await dbConnection.query(`UPDATE ${preferencesTable} SET vacation_destination = ?, vacation_type = ?, start_date = ?, end_date = ? WHERE user_id = ? AND start_date = ?`, 
                                                            [destination, vacationType, startDate, endDate, userId, startDate]);
            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ status: 'error', message: 'No preference found for the given user and start date.' });
            }

            return res.status(200).json({ status: 'success', message: 'Preference updated successfully' });
    
        } catch (error) {
            console.error('Error editing preference:', error);
            return res.status(500).json({ status: 'error', message: 'An error occurred while editing the preference', details: error.message });
        }
    },

    async getUserPreference(req, res) {
        const { username } = req.params;

        if (!username) {
            return res.status(400).json({ status: 'error', message: 'Username is required' });
        }

        try {
            const dbConnection = await dataBaseConnection.createConnection();

            const [user] = await dbConnection.query(`SELECT user_id FROM ${usersTable} WHERE user_name = ?`, [username]);
            if (user.length === 0) {
                return res.status(404).json({ status: 'error', message: 'User not found with the provided username.' });
            }

            const userId = user[0].user_id;

            const [preferences] = await dbConnection.query(`SELECT * FROM ${preferencesTable} WHERE user_id = ?`, [userId]);
            if (preferences.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No preferences found for the given user.' });
            }

            const formattedPreferences = preferences.map(pref => ({
                id: pref.vacation_pref_id,
                start_date: pref.start_date,
                end_date: pref.end_date,
                destination: pref.vacation_destination,
                vacation_type: pref.vacation_type
            }));

            return res.status(200).json(formattedPreferences);

        } catch (error) {
            console.error('Error fetching user preference:', error);
            return res.status(500).json({ status: 'error', message: 'An error occurred while fetching the user preference', details: error.message });
        }
    }
};
