require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

const { userServiceRouter } = require('./routers/userServiceRouter');
const { vacationPreferenceRouter } = require('./routers/vacationPreferencesRouter');
const { vacationCalculationRouter } = require('./routers/vacationCalculationRouter');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.set('Content-Type', 'application/json');
    next();
});

app.use('/appApi/userService', userServiceRouter);
app.use('/appApi/preferences', vacationPreferenceRouter);
app.use('/appApi/calculation', vacationCalculationRouter);

app.get('/', (req, res) => {
    res.send('Welcome to the vacation app!');
});

app.use((req, res) => {
    res.json({error: "No API found"});
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
