/* building an express based main app */
const express = require('express');

// creating an instance of our main express ap
const app = express();

const port = process.env.PORT || 8080;



// importing the app routers
const { userServiceRouter } = require('./routers/userServiceRouter');
const { vacationPreferenceRouter } = require('./routers/vacationPreferenceRouter');

// linking the routers to the main app.
app.use('/appApi/userService', userServiceRouter);
app.use('/appApi/vacationPreferences', vacationPreferenceRouter);


/* fires up the app */
app.listen(port, () => {
    /* This callback will only run if the server starts without any issues. If there is an error starting the server (e.g., the port is already in use), the callback will not be executed. */
    console.log(`Server is running on port ${port}`);
});