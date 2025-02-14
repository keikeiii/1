const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const verifyToken = require('../middleware/authMiddleware');

// 获取活动列表
router.get('/', activityController.getActivityList);

// 创建活动
router.post('/', verifyToken, activityController.createActivity);

// 更新活动
router.put('/:id', verifyToken, activityController.updateActivity);

// 删除活动
router.delete('/:id', verifyToken, activityController.deleteActivity);

// 报名活动
router.post('/:id/apply', verifyToken, activityController.applyActivity);

// 获取用户的活动记录
router.get('/user/records', verifyToken, activityController.getUserActivities);

// 活动报名
router.post('/apply', verifyToken, activityController.applyActivity);

// 添加获取用户活动列表路由
router.get('/user', activityController.getUserActivities);

// 添加评价活动路由
router.post('/:id/rate/:userId', activityController.rateActivity);
router.get('/:id/ratings', activityController.getActivityRatings);

// 添加查看活动详情路由
router.get('/:id/detail', activityController.getActivityDetail);
router.get('/:id/applications', activityController.getActivityApplications);
module.exports = router; 