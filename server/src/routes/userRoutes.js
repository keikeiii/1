const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// 获取用户列表
router.post('/list', verifyToken, userController.getUserList);

// 添加用户
router.post('/add', verifyToken, userController.addUser);

// 更新用户
router.put('/update', verifyToken, userController.updateUser);

// 删除用户
router.delete('/delete/:id', verifyToken, userController.deleteUser);

// 修改用户状态
router.put('/status', verifyToken, userController.changeUserStatus);

module.exports = router; 