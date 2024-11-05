const express = require('express');

const authenticateToken = require('../middleware/authToken.middleware');
const {addQuestion, getAllQuestion, getQuestionById, storeAnswerById, getSurveyResultsByQuestionId, getSurveyStatistics} = require('../controller/question.controller');

const questionRouter = express.Router();


questionRouter.post('/question/createquestion', addQuestion);
questionRouter.get('/question/getQuestionById/:questionId', getQuestionById);
questionRouter.post('/question/storeAnswerById', storeAnswerById);
questionRouter.get('/question/getSurveyResultsByQuestionId/:questionId', getSurveyResultsByQuestionId)
questionRouter.get('/question/getSurveyStatistics', getSurveyStatistics)
questionRouter.get('/question/getallQuestion',getAllQuestion)

module.exports = questionRouter;