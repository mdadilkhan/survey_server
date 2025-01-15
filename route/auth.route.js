const express = require('express');

// Import the controllers
const { userSignup } = require('../controller/auth.controller');
const {sendOtpWithSms,sendOtpWithEmail,validateOTP,insertEmail,register, login, addUniversity, getAllUniversities, editUniversity, deleteUniversity} = require('../controller/apiHandlers.controller')

// Create a new router
const authRouter = express.Router();

// Define the routes using authRouter, not router
authRouter.post('/auth/userSignup', userSignup);
authRouter.post('/auth/sendOtpWithSms',sendOtpWithSms)
authRouter.post('/auth/sendOtpWithEmail',sendOtpWithEmail)
authRouter.post('/auth/validateOTP',validateOTP)
authRouter.post('/auth/register',register)
authRouter.post('/auth/login',login)
authRouter.post('/auth/insertEmail',insertEmail)
authRouter.post('/university/addUniversity',addUniversity)
authRouter.get('/university/getAllUniversity',getAllUniversities)
authRouter.post('/university/editUniversity',editUniversity)
authRouter.get('/university/deleteUniversity/:id',deleteUniversity)

// Export the router
module.exports = authRouter;