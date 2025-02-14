const Notice = require('../models/notice');

// 获取通知列表
async function getNotices(req, res) {
    try {
        const notices = await Notice.findAll();
        res.json({
            code: 200,
            msg: '获取通知列表成功',
            data: notices
        });
    } catch (error) {
        console.error('获取通知列表失败:', error);
        res.status(500).json({
            code: 500,
            msg: '获取通知列表失败',
            error: error.message
        });
    }
}

// 发布通知
async function publishNotice(req, res) {
    try {
        const notice = await Notice.create(req.body);
        res.json({
            code: 200,
            msg: '发布通知成功',
            data: notice
        });
    } catch (error) {
        console.error('发布通知失败:', error);
        res.status(500).json({
            code: 500,
            msg: '发布通知失败',
            error: error.message
        });
    }
}

module.exports = {
    getNotices,
    publishNotice
}; 