const ServiceApply = require('../models/serviceApplyModel');

class ServiceApplyController {
    static async createApply(req, res) {
        try {
            const applyId = await ServiceApply.create(req.body);
            res.json({
                code: 200,
                msg: '申请提交成功',
                data: { id: applyId }
            });
        } catch (error) {
            console.error('提交申请失败:', error);
            res.status(500).json({
                code: 500,
                msg: '提交申请失败',
                error: error.message
            });
        }
    }

    static async getApplies(req, res) {
        try {
            const applies = await ServiceApply.findAll();
            res.json({
                code: 200,
                msg: '获取成功',
                data: applies
            });
        } catch (error) {
            console.error('获取申请列表失败:', error);
            res.status(500).json({
                code: 500,
                msg: '获取申请列表失败',
                error: error.message
            });
        }
    }

    static async getUserApplies(req, res) {
        try {
            const { userId } = req.params;
            const applies = await ServiceApply.findByUserId(userId);
            res.json({
                code: 200,
                msg: '获取成功',
                data: applies
            });
        } catch (error) {
            console.error('获取用户申请列表失败:', error);
            res.status(500).json({
                code: 500,
                msg: '获取用户申请列表失败',
                error: error.message
            });
        }
    }

    static async updateApplyStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            await ServiceApply.updateStatus(id, status);
            res.json({
                code: 200,
                msg: '状态更新成功'
            });
        } catch (error) {
            console.error('更新申请状态失败:', error);
            res.status(500).json({
                code: 500,
                msg: '更新申请状态失败',
                error: error.message
            });
        }
    }
}

module.exports = ServiceApplyController; 