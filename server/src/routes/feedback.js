    // Start of Selection
    const express = require('express');
    const router = express.Router();
    const feedbackController = require('../controllers/feedbackController');
    const verifyToken = require('../middleware/authMiddleware');
    
    // 所有路由都需要验证token
    router.use(verifyToken);
    
    // 创建反馈
    router.post('/', feedbackController.createFeedback);
    
    // 获取反馈列表
    router.get('/', feedbackController.getFeedbackList);
    
    // 回复反馈
    router.post('/:id/reply', feedbackController.replyFeedback);
    
    // 更新反馈状态
    router.put('/:id/status', feedbackController.updateFeedbackStatus);
    
    // 删除反馈
    router.delete('/:id', feedbackController.deleteFeedback);
    
    // 获取反馈回复列表
    router.get('/:id/replies', feedbackController.getFeedbackReplyList);
    
    // 获取指定反馈
    router.get('/:id', feedbackController.getFeedbackById);
    
    module.exports = router; 