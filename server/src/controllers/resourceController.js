const Resource = require('../models/resourceModel');

class ResourceController {
    static async getResources(req, res) {
        try {
            const resources = await Resource.findAll();
            res.json({
                code: 200,
                msg: '获取成功',
                data: resources
            });
        } catch (error) {
            console.error('获取资源列表失败:', error);
            res.status(500).json({
                code: 500,
                msg: '获取资源列表失败',
                error: error.message
            });
        }
    }

    static async createResource(req, res) {
        try {
            const resourceId = await Resource.create(req.body);
            res.json({
                code: 200,
                msg: '创建成功',
                data: { id: resourceId }
            });
        } catch (error) {
            console.error('创建资源失败:', error);
            res.status(500).json({
                code: 500,
                msg: '创建资源失败',
                error: error.message
            });
        }
    }

    static async deleteResource(req, res) {
        try {
            const { id } = req.params;
            const success = await Resource.delete(id);
            if (success) {
                res.json({
                    code: 200,
                    msg: '删除成功'
                });
            } else {
                res.status(404).json({
                    code: 404,
                    msg: '资源不存在'
                });
            }
        } catch (error) {
            console.error('删除资源失败:', error);
            res.status(500).json({
                code: 500,
                msg: '删除资源失败',
                error: error.message
            });
        }
    }

    static async getResourceBookings(req, res) {
        try {
            const { resourceId } = req.params;
            const bookings = await Resource.findBookings(resourceId);
            res.json({
                code: 200,
                msg: '获取成功',
                data: bookings
            });
        } catch (error) {
            console.error('获取资源预订记录失败:', error);
            res.status(500).json({
                code: 500,
                msg: '获取资源预订记录失败',
                error: error.message
            });
        }
    }

    static async getResourcesByType(req, res) {
        try {
            const { type } = req.params;
            const resources = await Resource.findByType(type);
            res.json({
                code: 200,
                msg: '获取成功',
                data: resources
            });
        } catch (error) {
            console.error('获取资源列表失败:', error);
            res.status(500).json({
                code: 500,
                msg: '获取资源列表失败',
                error: error.message
            });
        }
    }

    static async getResourceSchedule(req, res) {
        try {
            const { resourceId } = req.params;
            const schedule = await Resource.findSchedule(resourceId);
            res.json({
                code: 200,
                msg: '获取成功',
                data: schedule
            });
        } catch (error) {
            console.error('获取资源日程失败:', error);
            res.status(500).json({
                code: 500,
                msg: '获取资源日程失败',
                error: error.message
            });
        }
    }
}

module.exports = ResourceController; 