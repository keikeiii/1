const express = require('express');
const router = express.Router();
const SurveyController = require('../controllers/surveyController');
const verifyToken = require('../middleware/authMiddleware');

// 所有路由都需要验证token
router.use(verifyToken);
// Routes
router.post('/', SurveyController.createSurvey);
router.get('/list', SurveyController.getSurveyList);
// router.get('/:id', SurveyController.getSurveyDetail);
router.post('/:id/submit', SurveyController.submitAnswer);
router.get('/:id/stats', SurveyController.getSurveyStats);
router.get('/:id/user/:userId/answer', SurveyController.getUserAnswer);
router.delete('/:id', SurveyController.deleteSurvey);
router.get('/:id/answers', SurveyController.getSurveyAnswers);
router.get('/questions', SurveyController.getAllQuestions);
router.get('/:id/questions', SurveyController.getSurveyQuestions);
router.get('/answers', SurveyController.getAllAnswers);
router.get('/options', SurveyController.getAllOptions);
module.exports = router;
