const { Router } = require('express');
const { vacationPreferencesController } = require('../controllers/vacationPreferencesController');

const vacationPreferenceRouter = Router();

vacationPreferenceRouter.post('/addPreference', vacationPreferencesController.addPreference);
vacationPreferenceRouter.get('/', vacationPreferencesController.getPreferences);
vacationPreferenceRouter.put('/', vacationPreferencesController.editPreference);
vacationPreferenceRouter.get('/:username', vacationPreferencesController.getUserPreference);

module.exports = { vacationPreferenceRouter };
