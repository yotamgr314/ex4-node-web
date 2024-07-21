const { dataBaseConnection } = require('../dbInitHandler');
const preferencesTable = 'tbl_32_preferences';
const usersTable = 'tbl_32_users';
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;

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

// פונקציה להמרת תאריך לפורמט YYYY-MM-DD
function formatDateToYMD(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// פונקציה לקבלת מזג האוויר מ-API חיצוני
async function getWeather(destination) {
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

exports.vacationCalculationController = {
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
