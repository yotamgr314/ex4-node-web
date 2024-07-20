const { Router } = require('express');
const { vacationPreferencesController } = require('../controllers/vacationPreferencesController');

const vacationPreferenceRouter = Router();

// נתיב חדש להוספת העדפות נופש
vacationPreferenceRouter.post('/addPreference', vacationPreferencesController.addPreference);

// נתיב קיים לקבלת העדפות נופש
vacationPreferenceRouter.get('/', vacationPreferencesController.getPreferences);

module.exports = { vacationPreferenceRouter };


/*
 a router is essensily a way to create another mini instance of our application that has its own logic, routes, and middlewares.
 where we can define all the routes that are related to a specific part of our application and later on we can connect it to our main application.
 THATS WHERE THE LOGIC IMPLEMENTATION OF THE ROUTER API IS GOING TO BE IMPLEMENTED - AKA THE ROUTES OF THE API(GET, POST, PUT, DELETE).
 for example all the routes addresses here will be related to the vacation preferences of the user.
 for example:
  app.get('/vacationPreferences', (req, res) => { app.send here });
  app.post('/vacationPreferences', (req, res) => { func here });
  app.post('/vacationPreferences', (req, res) => { func here });

  Used to define a route for HTTP PUT requests.
app.put('/vacationPreferences', (req, res) => {
  res.send('PUT request to the homepage');
});

Used to define a route for HTTP DELETE requests.
app.delete('/vacationPreferences', (req, res) => {
  res.send('DELETE request to the homepage');
});

Used to define a route for all HTTP methods.
app.all('/vacationPreferences', (req, res) => {
  res.send('Request to the homepage with any HTTP method');
});

Used to mount middleware functions at the specified path.
app.use('/vacationPreferences', (req, res, next) => {
  console.log('Request URL:', req.originalUrl);
  next();
});

Binds and listens for connections on the specified host and port.
app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
*/

/* The paths defined in the router are not meant to be used independently. 
   They are designed to be part of the main application. 
   This means that until we attach the router to a specific path in the main application,
   the paths within the router are not accessible. By using app.use('/somepath', someRouter) in the main app
   we make the paths in the router accessible through the specified path in the main application.
*/

//By using module.exports = { userRouter };, you are making the userRouter object available for other files to import and use.
// thats becuse module.exports is actually the object that's returned as the result of a require call(in the main app we will do - const { userRouter } = require('./routers/userRouter');
// )