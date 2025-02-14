const Role = require('../models/roleModel');

// 获取角色列表
const getRoleList = async (req, res) => {
    try {
        const { roleName, pageNum = 1, pageSize = 10 } = req.body;
        const data = await Role.findRoleList({ roleName, pageNum, pageSize });
        res.json({
            code: 200,
            msg: '获取成功',
            data
        });
    } catch (error) {
        console.error('获取角色列表失败:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '获取角色列表失败',
            data: null
        });
    }
};

// 新增角色
const addRole = async (req, res) => {
    try {
        const { roleName, roleKey, status } = req.body;
        
        if (!roleName || !roleKey) {
            return res.status(400).json({
                code: 400,
                msg: '角色名称和标识不能为空',
                data: null
            });
        }

        const roleId = await Role.createRole({ roleName, roleKey, status });
        res.json({
            code: 200,
            msg: '新增成功',
            data: { id: roleId }
        });
    } catch (error) {
        console.error('新增角色失败:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '新增角色失败',
            data: null
        });
    }
};

// 更新角色
const updateRole = async (req, res) => {
    try {
        const { id, roleName, roleKey, status } = req.body;
        
        if (!id || !roleName || !roleKey) {
            return res.status(400).json({
                code: 400,
                msg: '参数不完整',
                data: null
            });
        }

        await Role.updateRole({ id, roleName, roleKey, status });
        res.json({
            code: 200,
            msg: '更新成功',
            data: null
        });
    } catch (error) {
        console.error('更新角色失败:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '更新角色失败',
            data: null
        });
    }
};

// 删除角色
const deleteRole = async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({
                code: 400,
                msg: '角色ID不能为空',
                data: null
            });
        }

        await Role.deleteRole(id);
        res.json({
            code: 200,
            msg: '删除成功',
            data: null
        });
    } catch (error) {
        console.error('删除角色失败:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '删除角色失败',
            data: null
        });
    }
};

// 更新角色状态
const updateRoleStatus = async (req, res) => {
    try {
        const { id, status } = req.body;
        
        if (!id || status === undefined) {
            return res.status(400).json({
                code: 400,
                msg: '参数不完整',
                data: null
            });
        }

        await Role.updateRoleStatus(id, status);
        res.json({
            code: 200,
            msg: '状态更新成功',
            data: null
        });
    } catch (error) {
        console.error('更新角色状态失败:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '更新角色状态失败',
            data: null
        });
    }
};

// 获取角色权限
const getRolePermission = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                code: 400,
                msg: '角色ID不能为空',
                data: null
            });
        }

        const menuIds = await Role.getRolePermissions(id);
        res.json({
            code: 200,
            msg: '获取成功',
            data: { menuIds }
        });
    } catch (error) {
        console.error('获取角色权限失败:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '获取角色权限失败',
            data: null
        });
    }
};

// 更新角色权限
const updateRolePermission = async (req, res) => {
    try {
        const { roleId, menuIds } = req.body;
        
        if (!roleId || !Array.isArray(menuIds)) {
            return res.status(400).json({
                code: 400,
                msg: '参数不完整',
                data: null
            });
        }

        await Role.updateRolePermissions(roleId, menuIds);
        res.json({
            code: 200,
            msg: '权限更新成功',
            data: null
        });
    } catch (error) {
        console.error('更新角色权限失败:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '更新角色权限失败',
            data: null
        });
    }
};

module.exports = {
    getRoleList,
    addRole,
    updateRole,
    deleteRole,
    updateRoleStatus,
    getRolePermission,
    updateRolePermission
}; 