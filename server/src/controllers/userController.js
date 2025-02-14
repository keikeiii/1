const User = require('../models/userModel');

// 获取用户列表
const getUserList = async (req, res) => {
    try {
        console.log('收到获取用户列表请求，参数:', req.body);
        
        const { username = '', phone = '', pageNum = 1, pageSize = 10 } = req.body;
        
        // 验证参数
        if (pageNum < 1 || pageSize < 1) {
            return res.status(400).json({
                code: 400,
                msg: '分页参数无效',
                data: null
            });
        }
        
        const result = await User.findUserList({
            username,
            phone,
            pageNum: parseInt(pageNum),
            pageSize: parseInt(pageSize)
        });

        console.log('查询结果:', result);

        res.json({
            code: 200,
            msg: 'success',
            data: result
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        console.error('错误堆栈:', error.stack);
        res.status(500).json({
            code: 500,
            msg: error.message || '获取用户列表失败',
            data: null
        });
    }
};

// 添加用户
const addUser = async (req, res) => {
    try {
        const { username, password, realName, phone, email } = req.body;

        // 检查用户名是否已存在
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({
                code: 400,
                msg: '用户名已存在',
                data: null
            });
        }

        const userId = await User.createUser({
            username,
            password,
            realName,
            phone,
            email
        });

        res.json({
            code: 200,
            msg: '添加用户成功',
            data: { userId }
        });
    } catch (error) {
        console.error('Add user error:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '添加用户失败',
            data: null
        });
    }
};

// 更新用户
const updateUser = async (req, res) => {
    try {
        const { id, realName, phone, email, status, roleId } = req.body;
        await User.updateUser({
            id,
            realName,
            phone,
            email,
            status,
            roleId

        });

        res.json({
            code: 200,
            msg: '更新用户成功',
            data: null
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '更新用户失败',
            data: null
        });
    }
};

// 删除用户
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.deleteUser(id);

        res.json({
            code: 200,
            msg: '删除用户成功',
            data: null
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '删除用户失败',
            data: null
        });
    }
};

// 修改用户状态
const changeUserStatus = async (req, res) => {
    try {
        const { id, status } = req.body;
        await User.updateUserStatus(id, status);

        res.json({
            code: 200,
            msg: '修改状态成功',
            data: null
        });
    } catch (error) {
        console.error('Change user status error:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '修改用户状态失败',
            data: null
        });
    }
};

// 更新个人资料
const updateProfile = async (req, res) => {
    try {
        const { id, nickname, realName, phone, buildingNo, roomNo } = req.body;
        
        // 验证用户是否存在
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                code: 404,
                msg: '用户不存在',
                data: null
            });
        }

        // 更新用户信息
        await User.updateProfile({
            id,
            username: nickname,
            realName,
            phone,
            buildingNo,
            roomNo
        });

        res.json({
            code: 200,
            msg: '更新个人资料成功',
            data: null
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '更新个人资料失败',
            data: null
        });
    }
};

// 修改密码
const updatePassword = async (req, res) => {
    try {
        const { id, oldPassword, newPassword } = req.body;
      const userId = id;  // 从 token 中获取用户 ID
        
        // 参数验证
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                code: 400,
                msg: '请输入原密码和新密码',
                data: null
            });
        }

        // 验证新密码格式
        if (newPassword.length < 6) {
            return res.status(400).json({
                code: 400,
                msg: '新密码长度不能小于6位',
                data: null
            });
        }

        // 调用 Model 层方法修改密码
        await User.updatePassword(userId, oldPassword, newPassword);

        res.json({
            code: 200,
            msg: '密码修改成功',
            data: null
        });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '修改密码失败',
            data: null
        });
    }
};

module.exports = {
    getUserList,
    addUser,
    updateUser,
    deleteUser,
    changeUserStatus,
    updateProfile,
    updatePassword
}; 