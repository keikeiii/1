const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');
const db = require('../config/database');
// 获取用户列表
router.post('/list', verifyToken, userController.getUserList);


// 新增用户
router.post('/add', verifyToken, userController.addUser);

// 更新用户
router.put('/update', verifyToken, userController.updateUser);

// 删除用户
router.delete('/delete/:id', verifyToken, userController.deleteUser);

// 更新用户状态
router.put('/status', verifyToken, userController.changeUserStatus);

// 更新用户信息：
router.put('/info', verifyToken, userController.updateProfile);

// 用户修改密码：

router.put('/password', verifyToken, userController.updatePassword);

// 获取用户当前角色
router.get('/role/:userId', async (req, res) => {
  try {
    const [role] = await db.query(`
            SELECT role_id as roleId

            FROM sys_user_role
            WHERE user_id = ?
        `, [req.params.userId]);

    res.json({
      code: 200,
      msg: 'success',
      data: role || { roleId: 0 }
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      msg: error.message,
      data: null
    });
  }
});


module.exports = router; 