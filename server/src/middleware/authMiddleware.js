const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        code: 401,
        msg: '未提供认证令牌'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;

    // 检查用户是否有权限访问该路由
    const { permissions } = decoded;
    const path = req.path;

    // 角色管理相关路由需要权限 "12"
    if (path.startsWith('/api/roles') && !permissions.includes('12')) {
      return res.status(403).json({
        code: 403,
        msg: '没有访问权限'
      });
    }

    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    return res.status(401).json({
      code: 401,
      msg: '无效的认证令牌'
    });
  }
};

module.exports = verifyToken; 