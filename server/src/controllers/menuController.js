const Menu = require('../models/menuModel');

class MenuController {
    // 获取菜单树
    static async getMenuTree(req, res) {
        try {
            const menuTree = await Menu.getMenuTree();
            res.json({
                code: 200,
                msg: "获取成功",
                data: menuTree
            });
        } catch (err) {
            console.error('获取菜单树失败:', err);
            res.status(500).json({
                code: 500,
                msg: "获取菜单树失败",
                data: null
            });
        }
    }

    // 获取角色的菜单ID列表
    static async getRoleMenus(req, res) {
        try {
            const { roleId } = req.params;
            const menuIds = await Menu.getRoleMenuIds(roleId);
            res.json({
                code: 200,
                msg: "获取成功",
                data: menuIds
            });
        } catch (err) {
            console.error('获取角色菜单失败:', err);
            res.status(500).json({
                code: 500,
                msg: "获取角色菜单失败",
                data: null
            });
        }
    }

    // 更新角色的菜单权限
    static async updateRoleMenus(req, res) {
        try {
            const { roleId, menuIds } = req.body;
            await Menu.updateRoleMenus(roleId, menuIds);
            res.json({
                code: 200,
                msg: "更新成功",
                data: null
            });
        } catch (err) {
            console.error('更新角色菜单失败:', err);
            res.status(500).json({
                code: 500,
                msg: "更新角色菜单失败",
                data: null
            });
        }
    }
}

module.exports = MenuController; 