const { dataBaseConnection } = require('../dbInitHandler');
const preferencesTable = 'tbl_32_preferences';
const usersTable = 'tbl_32_users';
const vacationCategories = require('../data/vacationCategories.json').vacationCategories;
const vacationLocation = require('../data/vacationLocation.json').vacationLocation;

exports.vacationPreferencesController = {
    async addPreference(req, res) { 
        const { access_code, start_date, end_date, destination, vacation_type } = req.body;

        // בדיקת קלט חסר
        if (!access_code || !start_date || !end_date || !destination || !vacation_type) {
            return res.status(400).json({ status: 'error', message: 'All fields are required: access_code, start_date, end_date, destination, vacation_type' });
        }

        // בדיקת סוג נופש חוקי
        if (!vacationCategories.includes(vacation_type)) {
            return res.status(400).json({ status: 'error', message: 'Invalid vacation type. Valid types are: ' + vacationCategories.join(', ') });
        }

        // בדיקת יעד חוקי
        if (!vacationLocation.includes(destination)) {
            return res.status(400).json({ status: 'error', message: 'Invalid destination. Valid destinations are: ' + vacationLocation.join(', ') });
        }

        // בדיקת תאריכים חוקיים
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (isNaN(startDate) || isNaN(endDate)) {
            return res.status(400).json({ status: 'error', message: 'Invalid dates format. Use YYYY-MM-DD format.' });
        }
        if (startDate >= endDate) {
            return res.status(400).json({ status: 'error', message: 'Invalid dates. End date must be after start date.' });
        }

        try {
            const dbConnection = await dataBaseConnection.createConnection();

            // בדיקת קוד גישה
            const [user] = await dbConnection.query(`SELECT user_id FROM ${usersTable} WHERE user_token_code = ?`, [access_code]);
            if (user.length === 0) {
                return res.status(404).json({ status: 'error', message: 'User not found with the provided access code.' });
            }

            const userId = user[0].user_id;

            // הוספת העדפות נופש
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

            // המרת פורמט התאריכים
            const formattedPreferences = preferences.map(pref => ({
                ...pref,
                start_date: pref.start_date.toISOString().split('T')[0],
                end_date: pref.end_date.toISOString().split('T')[0]
            }));

            return res.status(200).json(formattedPreferences);
        } catch (error) {
            console.error('Error fetching preferences:', error);
            return res.status(500).json({ status: 'error', message: 'An error occurred while fetching preferences', details: error.message });
        }
    }
};
