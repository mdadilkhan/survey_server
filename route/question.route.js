const express = require('express');

const authenticateToken = require('../middleware/authToken.middleware');
const {addQuestion, getAllQuestion, getQuestionById, storeAnswerById, getSurveyResultsByQuestionId, getSurveyStatistics, getLimitedUnderstandingJobOpportunities, getLackOfSkillsAndPreparedness, getConfusionAboutBranchesAndAlignment, getInternshipSelectionForJobReadiness, getCombinedOutcomePoints, getUniversityLimitedUnderstandingJobOpportunities, getUniversityLackOfSkillsAndPreparedness, getUniversityConfusionAboutBranchesAndAlignment, getUniversityInternshipSelectionForJobReadiness, getAllLimitedUnderstandingJobOpportunities, getAllLackOfSkillsAndPreparedness, getAllConfusionAboutBranchesAndAlignment, getAllInternshipSelectionForJobReadiness, getMismatchSalaryExpectations, getAllMismatchSalaryExpectations, getUniversityMismatchSalaryExpectations, getInterestCareerSupportServices, getAllInterestCareerSupportServices, getUniversityInterestCareerSupportServices} = require('../controller/question.controller');

const questionRouter = express.Router();


questionRouter.post('/question/createquestion', addQuestion);
questionRouter.get('/question/getQuestionById/:questionId', getQuestionById);
questionRouter.post('/question/storeAnswerById', storeAnswerById);
questionRouter.get('/question/getSurveyResultsByQuestionId/:questionId', getSurveyResultsByQuestionId)
questionRouter.get('/question/getSurveyStatistics', getSurveyStatistics)
questionRouter.get('/question/getallQuestion',getAllQuestion)
questionRouter.get('/question/limited-job/:userId',getLimitedUnderstandingJobOpportunities)
questionRouter.get('/question/all-limited-job',getAllLimitedUnderstandingJobOpportunities)
questionRouter.post('/question/limited-job-university',getUniversityLimitedUnderstandingJobOpportunities)
questionRouter.get('/question/lack-skill/:userId',getLackOfSkillsAndPreparedness)
questionRouter.get('/question/all-lack-skill',getAllLackOfSkillsAndPreparedness)
questionRouter.post('/question/lack-skill-university',getUniversityLackOfSkillsAndPreparedness)
questionRouter.get('/question/confusion-branches/:userId',getConfusionAboutBranchesAndAlignment)
questionRouter.get('/question/all-confusion-branches',getAllConfusionAboutBranchesAndAlignment)
questionRouter.post('/question/confusion-branches-university',getUniversityConfusionAboutBranchesAndAlignment)
questionRouter.get('/question/internship-selection/:userId',getInternshipSelectionForJobReadiness)
questionRouter.get('/question/all-internship-selection',getAllInternshipSelectionForJobReadiness)
questionRouter.post('/question/internship-selection-university',getUniversityInternshipSelectionForJobReadiness)
questionRouter.get('/question/mismatch-salary',getMismatchSalaryExpectations)
questionRouter.get('/question/all-mismatch-salary',getAllMismatchSalaryExpectations)
questionRouter.post('/question/mismatch-salary-university',getUniversityMismatchSalaryExpectations)
questionRouter.get('/question/intrest-career',getInterestCareerSupportServices)
questionRouter.get('/question/all-intrest-career',getAllInterestCareerSupportServices)
questionRouter.post('/question/intrest-career-university',getUniversityInterestCareerSupportServices)
questionRouter.get('/question/outcome/:userId',getCombinedOutcomePoints)

module.exports = questionRouter;