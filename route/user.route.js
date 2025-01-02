const express = require('express');
const { getUserDetails, contactSupport, bookSlot, createOrder, verifyOrder, createSlots, getAllSlots, getStudentsByUniversity, getStudentStatistics, getUniversityWiseStudentStatistics} = require('../controller/user.controller');
// Import the controllers


// Create a new router
const userRouter = express.Router();

// Define the routes using authRouter, not router

userRouter.get('/getUserDetails/:id', getUserDetails);
userRouter.post('/bookslot', bookSlot);
userRouter.post('/contactSupport',contactSupport)
userRouter.post('/payment/createOrder', createOrder);
userRouter.post('/payment/verifyOrder', verifyOrder);
userRouter.post('/createSlots', createSlots);
userRouter.get('/getAllSlots', getAllSlots);
userRouter.get('/user/getStudentsByUniversity', getStudentsByUniversity);
userRouter.get('/user/getStudentStatistics', getStudentStatistics);
userRouter.get('/user/getUniversityWiseStudentStatistics', getUniversityWiseStudentStatistics);

// Export the router
module.exports = userRouter;