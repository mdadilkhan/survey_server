const express = require('express');
const { getUserDetails, contactSupport, bookSlot, createOrder, verifyOrder, createSlots, getAllSlots, getStudentsByUniversity, getStudentStatistics, getUniversityWiseStudentStatistics, getTodayUsers, Usersdetails, getAlluser, deleteUser} = require('../controller/user.controller');
const userRouter = express.Router();
userRouter.get('/getUserDetails/:id', getUserDetails);
userRouter.post('/bookslot', bookSlot);
userRouter.post('/contactSupport',contactSupport)
userRouter.post('/payment/createOrder', createOrder);
userRouter.post('/payment/verifyOrder', verifyOrder);
userRouter.post('/createSlots', createSlots);
userRouter.get('/getAllSlots', getAllSlots);
userRouter.get('/user/getStudentsByUniversity/:universityId', getStudentsByUniversity);
userRouter.get('/user/getStudentStatistics', getStudentStatistics);
userRouter.get('/user/getUniversityWiseStudentStatistics/:universityId', getUniversityWiseStudentStatistics);
userRouter.get('/user/getTodayUsers', getTodayUsers);
userRouter.get('/user/userdetails/:userId', Usersdetails);
userRouter.get('/user/deleteUser/:userId', deleteUser);
module.exports = userRouter;