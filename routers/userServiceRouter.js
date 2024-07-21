const { Router } = require('express');
const { userServiceController } = require('../controllers/userServiceController');

const userServiceRouter = Router();

userServiceRouter.post('/', userServiceController.registerUser);
userServiceRouter.get('/getUserToken', userServiceController.getUserToken);

module.exports = { userServiceRouter };
