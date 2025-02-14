const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('开始处理登录请求:', { username });

    // 验证必要参数
    if (!username || !password) {
      console.log('登录失败: 用户名和密码不能为空');
      return res.status(400).json({
        code: 400,
        msg: "用户名和密码不能为空",
        data: null
      });
    }

    const user = await User.findByUsername(username);
    console.log('查询到的用户:', user);
    
    if (!user) {
      console.log('登录失败: 用户不存在');
      return res.status(401).json({ 
        code: 401,
        msg: "用户名或密码错误",
        data: null
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('密码验证结果:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('登录失败: 密码错误');
      return res.status(401).json({ 
        code: 401,
        msg: "用户名或密码错误",
        data: null
      });
    }

    // 获取用户权限，确保传入的是数字类型的 ID
    console.log('开始获取用户权限, 用户ID:', user.id);
    const permissions = await User.getRolePermissions(Number(user.id));
    console.log('获取到的用户权限:', permissions);

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role_name,
        permissions
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    console.log('生成的token:', token);

    console.log('登录成功，返回用户信息', user);
    res.json({
      code: 200,
      msg: "登录成功",
      data: {
        token,
        userInfo: {
          id: user.id,
          username: user.username,
          real_name: user.real_name || null,
          roles: [user.role_key || 'user'],
          permissions,
          phone: user.phone || null,
          building_no: user.building_no || null,
          room_no: user.room_no || null,
        }
      }
    });
  } catch (error) {
    console.error('登录过程中发生错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ 
      code: 500,
      msg: error.message || "服务器错误",
      data: null
    });
  }
};

const register = async (req, res) => {
  try {
    const { username, password, realName, phone, email } = req.body;

    // 验证必要参数
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        msg: "用户名和密码不能为空",
        data: null
      });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        msg: "用户名已存在",
        data: null
      });
    }

    // 创建新用户
    const userId = await User.createUser({
      username,
      password,
      realName: realName || null,
      phone: phone || null,
      email: email || null
    });

    // 获取新创建的用户信息
    const newUser = await User.findByUsername(username);
    const permissions = await User.getRolePermissions(2); // 默认普通用户角色

    // 生成 JWT token
    const token = jwt.sign(
      { 
        id: newUser.id, 
        username: newUser.username,
        role: newUser.role_name,
        permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      code: 200,
      msg: "注册成功",
      data: {
        token,
        userInfo: {
          id: newUser.id,
          username: newUser.username,
          realName: newUser.real_name,
          roles: [newUser.role_key],
          permissions
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      msg: error.message || "服务器错误",
      data: null
    });
  }
};

const registerAdmin = async (req, res) => {
  try {
    const { username, password, realName, phone, email, secretKey } = req.body;

    // 验证管理员注册密钥
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({
        code: 403,
        msg: "无权限创建管理员账户",
        data: null
      });
    }

    // 验证必要参数
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        msg: "用户名和密码不能为空",
        data: null
      });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        msg: "用户名已存在",
        data: null
      });
    }

    // 创建管理员用户
    const userId = await User.createAdminUser({
      username,
      password,
      realName: realName || null,
      phone: phone || null,
      email: email || null
    });

    // 获取新创建的用户信息
    const newUser = await User.findByUsername(username);
    const permissions = await User.getRolePermissions(1); // 管理员角色 ID 为 1

    // 生成 JWT token
    const token = jwt.sign(
      { 
        id: newUser.id, 
        username: newUser.username,
        role: newUser.role_name,
        permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      code: 200,
      msg: "管理员注册成功",
      data: {
        token,
        userInfo: {
          id: newUser.id,
          username: newUser.username,
          realName: newUser.real_name,
          roles: [newUser.role_key],
          permissions,
          phone: newUser.phone || null,
          building_no: newUser.building_no || null,
          room_no: newUser.room_no || null,
          email: newUser.email || null
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      msg: error.message || "服务器错误",
      data: null
    });
  }
};

module.exports = {
  login,
  register,
  registerAdmin
}; 