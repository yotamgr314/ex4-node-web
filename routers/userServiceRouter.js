// exporting the Router object to be used in the main app.
const { Router }  = require('express');

const { userController } = require('../controllers/userServiceController');

// creating a user router express instance.
const userServiceRouter = Router();

// LOGIC IMPLEMENTATION OF THE ROUTER API IS GOING TO BE IMPLEMENTED - AKA THE ROUTES OF THE API(GET, POST, PUT, DELETE).


// making the router object accessible to the main app via app.use('/pathName', routerName)
module.exports = { userServiceRouter };












/*
 a router is essensily a way to create another mini instance of our application that has its own logic, routes, and middlewares.
 where we can define all the routes that are related to a specific part of our application and later on we can connect it to our main application.
THATS WHERE THE LOGIC IMPLEMENTATION OF THE ROUTER API IS GOING TO BE IMPLEMENTED - AKA THE ROUTES OF THE API(GET, POST, PUT, DELETE)
  */