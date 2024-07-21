const { Router } = require('express');
const { vacationCalculationController } = require('../controllers/vacationCalculationController');

const vacationCalculationRouter = Router();

vacationCalculationRouter.get('/vacation_destination', vacationCalculationController.calculateVacation);

module.exports = { vacationCalculationRouter };
