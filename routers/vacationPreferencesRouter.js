const { Router } = require('express');
const { vacationPreferencesController } = require('../controllers/vacationPreferencesController');

const vacationPreferenceRouter = Router();

// Route for adding a new vacation preference to user.
vacationPreferenceRouter.post('/addPreference', vacationPreferencesController.addPreference);

// Route for the entire vacation preferences in the preferences table.
vacationPreferenceRouter.get('/', vacationPreferencesController.getPreferences);

// Route for editing the vacation preferences of the user.
vacationPreferenceRouter.put('/', vacationPreferencesController.editPreference);

// Route for getting the vacation preferences of a specific user.
vacationPreferenceRouter.get('/:username', vacationPreferencesController.getUserPreference);

module.exports = { vacationPreferenceRouter };
