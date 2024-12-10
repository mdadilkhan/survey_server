const express = require('express');

const authenticateToken = require('../middleware/authToken.middleware');
const {addQuestion, getAllQuestion, getQuestionById, storeAnswerById, getSurveyResultsByQuestionId, getSurveyStatistics, getLimitedUnderstandingJobOpportunities, getLackOfSkillsAndPreparedness, getConfusionAboutBranchesAndAlignment, getInternshipSelectionForJobReadiness} = require('../controller/question.controller');

const questionRouter = express.Router();


questionRouter.post('/question/createquestion', addQuestion);
questionRouter.get('/question/getQuestionById/:questionId', getQuestionById);
questionRouter.post('/question/storeAnswerById', storeAnswerById);
questionRouter.get('/question/getSurveyResultsByQuestionId/:questionId', getSurveyResultsByQuestionId)
questionRouter.get('/question/getSurveyStatistics', getSurveyStatistics)
questionRouter.get('/question/getallQuestion',getAllQuestion)
questionRouter.get('/question/limited-job/:userId',getLimitedUnderstandingJobOpportunities)
questionRouter.get('/question/lack-skill/:userId',getLackOfSkillsAndPreparedness)
questionRouter.get('/question/confusion-branches/:userId',getConfusionAboutBranchesAndAlignment)
questionRouter.get('/question/internship-selection/:userId',getInternshipSelectionForJobReadiness)

module.exports = questionRouter;