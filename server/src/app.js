const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authController = require('./controllers/authController');
const verifyToken = require('./middleware/authMiddleware');
const User = require('./models/userModel');
const activityRoutes = require('./routes/activity');
const roleRoutes = require('./routes/role');
const userRoutes = require('./routes/user');  // 取消注释
const menuRoutes = require('./routes/menu');
const noticeRoutes = require('./routes/notice');
const surveyRoutes = require('./routes/surveyRoutes');
const communityRoutes = require('./routes/community');
const feedbackRoutes = require('./routes/feedback');

const resourceRoutes = require('./routes/resource');
const serviceApplyRoutes = require('./routes/serviceApply');
const serviceRatingRouter = require('./routes/serviceRating');
const app = express();


// CORS 配置
app.use(cors({
    origin: '*', // Vite 开发服务器地址
    credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
    console.log('收到请求:', {
        method: req.method,
        url: req.url,
        body: req.body,
        headers: req.headers
    });
    next();
});

// 登录路由
app.post('/api/auth/login', authController.login);

// 注册路由
app.post('/api/auth/register', authController.register);

// 管理员注册路由
app.post('/api/auth/register-admin', authController.registerAdmin);

// 测试受保护的路由
app.get('/api/protected', verifyToken, async (req, res) => {
    try {
        // 获取用户的完整信息
        const user = await User.findByUsername(req.user.username);
        // 获取用户权限
        const permissions = await User.getRolePermissions(user.id);

        res.json({
            code: 200,
            msg: "success",
            data: {
                userInfo: {
                    id: user.id,
                    username: user.username,
                    realName: user.real_name,
                    role: user.role_name,
                    roleKey: user.role_key,
                    permissions: permissions
                },
                message: "Protected route accessed successfully"
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 500,
            msg: "服务器错误",
            data: null
        });
    }
});

// 使用路由中间件
app.use('/api/system/activities', activityRoutes);
app.use('/api/system/role', roleRoutes);
app.use('/api/system/user', userRoutes);  // 取消注释
app.use('/api/system/menu', menuRoutes);
app.use('/api/system/notices', noticeRoutes);
// 添加社区路由
app.use('/api/community', communityRoutes);

// feedback 路由
app.use('/api/feedback', feedbackRoutes);

// survey 路由：
app.use('/api/survey', surveyRoutes);

// resource 路由
app.use('/api/resource', resourceRoutes);

// service apply 路由
app.use('/api/service-apply', serviceApplyRoutes);

// service rating 路由
app.use('/api/service-rating', serviceRatingRouter);

// 测试路由
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running' });
});



const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', (error) => {
    if (error) {
        console.error('服务器启动失败:', error);
        return;
    }
    console.log(`服务器成功启动在端口 ${PORT}`);
    console.log(`测试地址: http://localhost:${PORT}/test`);
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    
    // 确保返回有效的 JSON
    res.status(500).json({
        code: 500,
        msg: err.message || "服务器内部错误",
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 处理放在最后
app.use((req, res) => {
    res.status(404).json({
        code: 404,
        msg: "接口不存在",
        path: req.originalUrl
    });
}); 