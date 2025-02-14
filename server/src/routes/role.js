const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../config/database');
// 获取角色列表
router.post('/list', authMiddleware, roleController.getRoleList);

// 新增角色
router.post('/add', authMiddleware, roleController.addRole);

// 更新角色
router.post('/update', authMiddleware, roleController.updateRole);

// 删除角色
router.post('/delete', authMiddleware, roleController.deleteRole);

// 更新角色状态
router.post('/status', authMiddleware, roleController.updateRoleStatus);

// 获取角色权限
router.get('/permission/:id', authMiddleware, roleController.getRolePermission);

// 更新角色权限
router.post('/permission', authMiddleware, roleController.updateRolePermission);
// 获取角色选项列表
router.get('/options', authMiddleware, async (req, res) => {
  try {
    const [roles] = await db.query(`
            SELECT id, role_name as roleName, role_key as roleKey 

            FROM sys_role 
            WHERE status = 1
        `);

    res.json({
      code: 200,
      msg: 'success',
      data: roles
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