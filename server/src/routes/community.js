const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const verifyToken = require('../middleware/authMiddleware');

// 所有路由都需要验证token
router.use(verifyToken);

// 获取帖子列表
router.get('/posts', communityController.getPosts);

// 创建帖子
router.post('/posts', communityController.createPost);

// 点赞帖子
router.post('/posts/:id/like', communityController.likePost);

// 评论帖子
router.post('/posts/:id/comments', communityController.addComment);

// 删除帖子(需要admin权限)
router.delete('/posts/:id', communityController.deletePost);
// 获取帖子评论
router.get('/posts/:id/comments', communityController.getPostComments);
module.exports = router; 