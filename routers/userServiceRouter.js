// routers/userServiceRouter.js
const { Router } = require('express');
const { userServiceController } = require('../controllers/userServiceController');

const userServiceRouter = Router();
// register user request
userServiceRouter.post('/', userServiceController.registerUser);

// get user token request
userServiceRouter.get('/getUserToken', userServiceController.getUserToken);

module.exports = { userServiceRouter };
