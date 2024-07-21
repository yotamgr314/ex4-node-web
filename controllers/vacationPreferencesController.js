const { dataBaseConnection } = require('../dbInitHandler');
// לא נשתמש ב- require כדי לייבא את node-fetch
const preferencesTable = 'tbl_32_preferences';
const usersTable = 'tbl_32_users';
const vacationCategories = require('../data/vacationCategories.json').vacationCategories;
const vacationLocation = require('../data/vacationLocation.json').vacationLocation;
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;

// פונקציה להמרת תאריך לפורמט YYYY-MM-DD
function formatDateToYMD(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// פונקציה למציאת רוב מתוך מערך
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

// פונקציה למציאת חפיפה בין תאריכים
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

// פונקציה לקבלת מזג האוויר מ-API חיצוני
async function getWeather(destination) {
    // ייבוא דינמי של node-fetch
    const fetch = (await import('node-fetch')).default;
    try {
        const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${destination}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

// פונקציה לבדיקת קלט
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
    },

    async calculateVacation(req, res) {
        try {
            const dbConnection = await dataBaseConnection.createConnection();

            const [users] = await dbConnection.query(`SELECT user_id FROM ${usersTable}`);
            if (users.length < 5) {
                return res.status(400).json({ status: 'error', message: 'Not all preferences are submitted. Please wait for all users to submit their preferences.' });
            }

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

            const weatherData = await getWeather(majorityDestination);

            return res.status(200).json({ 
                message: 'Vacation destination calculated successfully',
                destination: majorityDestination,
                vacationType: majorityVacationType,
                startDate: formatDateToYMD(overlappingDates.start_date),
                endDate: formatDateToYMD(overlappingDates.end_date),
                weather: weatherData ? {
                    temperature: `${weatherData.main.temp} °C`,
                    description: weatherData.weather[0].description,
                    humidity: `${weatherData.main.humidity} %`,
                    windSpeed: `${weatherData.wind.speed} m/s`
                } : 'Weather data not available'
            });

        } catch (error) {
            console.error('Error calculating vacation:', error);
            return res.status(500).json({ status: 'error', message: 'An error occurred while calculating the vacation', details: error.message });
        }
    }
};
