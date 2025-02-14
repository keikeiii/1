const express = require('express');
const ServiceApplyController = require('../controllers/serviceApplyController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create', verifyToken, ServiceApplyController.createApply);
router.get('/list', verifyToken, ServiceApplyController.getApplies);
router.get('/user/:userId', verifyToken, ServiceApplyController.getUserApplies);
router.put('/:id/status', verifyToken, ServiceApplyController.updateApplyStatus);

module.exports = router; 