const express = require('express');
const authenticateToken = require('../middleware/authToken.middleware');
const { userDetails, getUserDetails, contactSupport} = require('../controller/user.controller');
// Import the controllers


// Create a new router
const userRouter = express.Router();

// Define the routes using authRouter, not router

userRouter.get('/user/userDetails', authenticateToken, userDetails);
userRouter.get('/getUserDetails/:id', getUserDetails);
userRouter.post('/contactSupport',contactSupport)

// Export the router
module.exports = userRouter;