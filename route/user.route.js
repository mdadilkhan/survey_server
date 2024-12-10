const express = require('express');
const authenticateToken = require('../middleware/authToken.middleware');
const { userDetails, getUserDetails, contactSupport, bookSlot, createOrder, verifyOrder, createSlots, getAllSlots} = require('../controller/user.controller');
// Import the controllers


// Create a new router
const userRouter = express.Router();

// Define the routes using authRouter, not router

userRouter.get('/user/userDetails', authenticateToken, userDetails);
userRouter.get('/getUserDetails/:id', getUserDetails);
userRouter.get('/bookslot', bookSlot);
userRouter.post('/contactSupport',contactSupport)
userRouter.post('/payment/createOrder', createOrder);
userRouter.post('/payment/verifyOrder', verifyOrder);
userRouter.post('/createSlots', createSlots);
userRouter.get('/getAllSlots', getAllSlots);

// Export the router
module.exports = userRouter;