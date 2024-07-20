const { dataBaseConnection } = require('../dbInitHandler');
const preferencesTable = 'tbl_32_preferences';
const usersTable = 'tbl_32_users';
const vacationCategories = require('../data/vacationCategories.json').vacationCategories;
const vacationLocation = require('../data/vacationLocation.json').vacationLocation;

// a function to convert into YYY-MM-DD
function formatDateToYMD(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}


function findMajority(arr) {
    const freq = {};
    let maxFreq = 0;
    let majorityElement = arr[0];

    for (const item of arr) {
        if (!freq[item]) {
            freq[item] = 0;
        }
        freq[item]++;
        if (freq[item] > maxFreq) {
            maxFreq = freq[item];
            majorityElement = item;
        }
    }

    return majorityElement;
}

function findDateOverlap(dates) {
    let latestStart = new Date(Math.max(...dates.map(d => new Date(d.start_date))));
    let earliestEnd = new Date(Math.min(...dates.map(d => new Date(d.end_date))));

    if (latestStart <= earliestEnd) {
        return {
            start_date: latestStart,
            end_date: earliestEnd
        };
    }

    // חפיפה חלקית
    const sortedDates = dates.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    for (let i = 0; i < sortedDates.length - 1; i++) {
        for (let j = i + 1; j < sortedDates.length; j++) {
            const overlapStart = new Date(Math.max(new Date(sortedDates[i].start_date), new Date(sortedDates[j].start_date)));
            const overlapEnd = new Date(Math.min(new Date(sortedDates[i].end_date), new Date(sortedDates[j].end_date)));
            if (overlapStart <= overlapEnd) {
                return {
                    start_date: overlapStart,
                    end_date: overlapEnd
                };
            }
        }
    }

    return null;
}





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
        const dayDifference = (endDate - startDate) / (1000 * 60 * 60 * 24); // חישוב ההפרש בימים
        if (dayDifference >= 7) { // בדיקה אם ההפרש עולה על 7 ימים
        return res.status(400).json({ status: 'error', message: 'Vacation cannot be longer than 7 days.' });
        }

        

        try {
            const dbConnection = await dataBaseConnection.createConnection();

            // בדיקת קוד גישה
            const [user] = await dbConnection.query(`SELECT user_id FROM ${usersTable} WHERE user_token_code = ?`, [access_code]);
            if (user.length === 0) {
                return res.status(404).json({ status: 'error', message: 'User not found with the provided access code.' });
            }

            const userId = user[0].user_id;
             // בדיקת כמות העדפות קיימות
            const [existingPreferences] = await dbConnection.query(`SELECT COUNT(*) as count FROM ${preferencesTable} WHERE user_id = ?`, [userId]);
            if (existingPreferences[0].count >= 1) {
                return res.status(400).json({ status: 'error', message: 'User already has an existing preference. Each user can only have one preference.' });
            }


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

        // בדיקת קלט חסר
        if (!accessCode || !startDate || !endDate || !destination || !vacationType) {
            return res.status(400).json({ status: 'error', message: 'All fields are required: accessCode, startDate, endDate, destination, vacationType' });
        }

        // בדיקת סוג נופש חוקי
        if (!vacationCategories.includes(vacationType)) {
            return res.status(400).json({ status: 'error', message: 'Invalid vacation type. Valid types are: ' + vacationCategories.join(', ') });
        }

        // בדיקת יעד חוקי
        if (!vacationLocation.includes(destination)) {
            return res.status(400).json({ status: 'error', message: 'Invalid destination. Valid destinations are: ' + vacationLocation.join(', ') });
        }

        // בדיקת תאריכים חוקיים
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        if (isNaN(startDateObj) || isNaN(endDateObj)) {
            return res.status(400).json({ status: 'error', message: 'Invalid dates format. Use YYYY-MM-DD format.' });
        }
        if (startDateObj >= endDateObj) {
            return res.status(400).json({ status: 'error', message: 'Invalid dates. End date must be after start date.' });
        }
        const dayDifference = (endDateObj - startDateObj) / (1000 * 60 * 60 * 24); // חישוב ההפרש בימים
        if (dayDifference >= 7) { // בדיקה אם ההפרש עולה על 7 ימים
            return res.status(400).json({ status: 'error', message: 'Vacation cannot be longer than 7 days.' });
        }
        
        

        try {
            const dbConnection = await dataBaseConnection.createConnection();

            // בדיקת קוד גישה
            const [user] = await dbConnection.query(`SELECT user_id FROM ${usersTable} WHERE user_token_code = ?`, [accessCode]);
            if (user.length === 0) {
                return res.status(404).json({ status: 'error', message: 'User not found with the provided access code.' });
            }

            const userId = user[0].user_id;

            // עדכון העדפת נופש
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

            // בדיקת קיום משתמש
            const [user] = await dbConnection.query(`SELECT user_id FROM ${usersTable} WHERE user_name = ?`, [username]);
            if (user.length === 0) {
                return res.status(404).json({ status: 'error', message: 'User not found with the provided username.' });
            }

            const userId = user[0].user_id;

            // שליפת העדפת המשתמש
            const [preferences] = await dbConnection.query(`SELECT * FROM ${preferencesTable} WHERE user_id = ?`, [userId]);
            if (preferences.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No preferences found for the given user.' });
            }

            // המרת פורמט התאריכים
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
    },


    async calculateVacation(req, res) {
        try {
            const dbConnection = await dataBaseConnection.createConnection();

            // בדיקת כמות המשתמשים
            const [users] = await dbConnection.query(`SELECT user_id FROM ${usersTable}`);
            if (users.length < 5) {
                return res.status(400).json({ status: 'error', message: 'Not all preferences are submitted. Please wait for all users to submit their preferences.' });
            }

            // שליפת העדפות כל המשתמשים
            const [preferences] = await dbConnection.query(`SELECT * FROM ${preferencesTable}`);
            if (preferences.length < 5) {
                return res.status(400).json({ status: 'error', message: 'Not all preferences are submitted. Please wait for all users to submit their preferences.' });
            }

            const destinations = preferences.map(p => p.vacation_destination);
            const vacationTypes = preferences.map(p => p.vacation_type);
            const dates = preferences.map(p => ({ start_date: p.start_date, end_date: p.end_date }));

            const majorityDestination = findMajority(destinations);
            const majorityVacationType = findMajority(vacationTypes);
            const overlappingDates = findDateOverlap(dates);

            if (!overlappingDates) {
                return res.status(400).json({ status: 'error', message: 'No overlapping dates found. Please adjust your preferences.' });
            }

            return res.status(200).json({ 
                message: 'Vacation destination calculated successfully',
                destination: majorityDestination,
                vacationType: majorityVacationType,
                startDate: formatDateToYMD(overlappingDates.start_date),
                endDate: formatDateToYMD(overlappingDates.end_date)
            });

        } catch (error) {
            console.error('Error calculating vacation:', error);
            return res.status(500).json({ status: 'error', message: 'An error occurred while calculating the vacation', details: error.message });
        }
    }


};
