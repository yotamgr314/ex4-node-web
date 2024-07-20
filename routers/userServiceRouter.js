// routers/userServiceRouter.js
const { Router } = require('express');
const { userServiceController } = require('../controllers/userServiceController');

const userServiceRouter = Router();

userServiceRouter.post('/', userServiceController.registerUser);

module.exports = { userServiceRouter };
