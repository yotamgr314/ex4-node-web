// index.js
const express = require('express');
const dotenv = require('dotenv');
const { userServiceRouter } = require('./routers/userServiceRouter');

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use('/appApi/userService', userServiceRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
