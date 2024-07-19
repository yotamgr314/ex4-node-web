// routers/userServiceRouter.js
const { Router } = require('express');
const { userServiceController } = require('../controllers/userServiceController');

const userServiceRouter = Router();

userServiceRouter.post('/register', userServiceController.registerUser);

module.exports = { userServiceRouter };
