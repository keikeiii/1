const express = require('express');
const router = express.Router();
const MenuController = require('../controllers/menuController');

// 获取菜单树
router.get('/tree', MenuController.getMenuTree);

// 获取角色的菜单权限
router.get('/role/menus/:roleId', MenuController.getRoleMenus);

// 更新角色的菜单权限
router.post('/role/menus', MenuController.updateRoleMenus);

module.exports = router; 