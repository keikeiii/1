const Activity = require('../models/activity');
const db = require('../config/database');

// 获取活动列表
async function getActivityList(req, res) {
    try {
        const { name, status, pageNum = 1, pageSize = 10 } = req.query;
        
        const result = await Activity.findActivityList({
            name,
            status: status !== undefined ? Number(status) : null,
            pageNum,
            pageSize
        });

        res.json({
            code: 200,
            msg: '获取活动列表成功',
            data: result
        });
    } catch (error) {
        console.error('获取活动列表失败:', error);
        res.status(500).json({
            code: 500,
            msg: '获取活动列表失败',
            error: error.message
        });
    }
}

// 创建活动
async function createActivity(req, res) {
    try {
        const activityData = {
            ...req.body,
            create_user_id: req.user.id // 从JWT中获取用户ID
        };
        const id = await Activity.createActivity(activityData);
        res.json({
            code: 200,
            msg: '创建活动成功',
            data: { id }
        });
    } catch (error) {
        console.error('创建活动失败:', error);
        res.status(500).json({
            code: 500,
            msg: '创建活动失败',
            error: error.message
        });
    }
}

// 更新活动
async function updateActivity(req, res) {
    try {
        const { id } = req.params;
        console.log('更新活动，ID:', id);
        console.log('更新数据:', req.body);

        // 构造更新数据
        const updateData = {
            name: req.body.name,
            description: req.body.description,
            address: req.body.address,
            max_participants: req.body.max_participants,
            status: req.body.status,
            image: req.body.image,
            start_time: req.body.startTime || req.body.start_time,
            end_time: req.body.endTime || req.body.end_time
        };

        console.log('处理后的更新数据:', updateData);

        const result = await Activity.update(id, updateData);
        
        if (!result) {
            throw new Error('活动不存在或更新失败');
        }

        // 格式化返回数据
        const formattedResult = {
            id: result.id,
            name: result.name,
            description: result.description,
            startTime: result.start_time,
            endTime: result.end_time,
            address: result.address,
            maxParticipants: result.max_participants,
            status: result.status,
            image: result.image,
            createTime: result.create_time,
            createUserId: result.create_user_id
        };

        res.json({
            code: 200,
            msg: '更新活动成功',
            data: formattedResult
        });
    } catch (error) {
        console.error('更新活动失败:', error);
        res.status(500).json({
            code: 500,
            msg: '更新活动失败: ' + error.message,
            error: error.message
        });
    }
}

// 删除活动
async function deleteActivity(req, res) {
    try {
        const { id } = req.params;
        await Activity.deleteActivity(id);
        res.json({
            code: 200,
            msg: '删除活动成功'
        });
    } catch (error) {
        console.error('删除活动失败:', error);
        res.status(500).json({
            code: 500,
            msg: '删除活动失败',
            error: error.message
        });
    }
}

// 活动报名
async function applyActivity(req, res) {
    try {
        const { activityId, userId, name, phone, remark } = req.body;
        
        // 验证必要字段
        if (!activityId || !userId || !name || !phone) {
            return res.status(400).json({
                code: 400,
                msg: '缺少必要参数'
            });
        }

        // 检查活动是否存在且可以报名
        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({
                code: 404,
                msg: '活动不存在'
            });
        }

        if (activity.status !== 1) {
            return res.status(400).json({
                code: 400,
                msg: '活动不在报名阶段'
            });
        }

        // 检查是否已报名
        const existingApplication = await Activity.findApplication(activityId, userId);
        if (existingApplication) {
            return res.status(400).json({
                code: 400,
                msg: '您已经报名过此活动'
            });
        }

        // 创建报名记录
        await Activity.createApplication({
            activity_id: activityId,
            user_id: userId,
            name,
            phone,
            remark,
            status: 1,
            apply_time: new Date()
        });

        res.json({
            code: 200,
            msg: '报名成功'
        });
    } catch (error) {
        console.error('活动报名失败:', error);
        res.status(500).json({
            code: 500,
            msg: '报名失败: ' + error.message
        });
    }
}

// 获取用户的活动记录
async function getUserActivities(req, res) {
    try {
        const { userId, name, status, pageNum = 1, pageSize = 10 } = req.query;
        
        const result = await Activity.findUserActivities({
            userId,
            name,
            status: status !== undefined ? Number(status) : null,
            pageNum,
            pageSize
        });

        res.json({
            code: 200,
            msg: '获取用户活动列表成功',
            data: result
        });
    } catch (error) {
        console.error('获取用户活动列表失败:', error);
        res.status(500).json({
            code: 500,
            msg: '获取用户活动列表失败',
            error: error.message
        });
    }
}

// 添加评价
const rateActivity = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const { score, comment } = req.body;

        const result = await Activity.addRating({
            activityId: id,
            userId,
            score,
            comment,
            ratingTime: new Date()
        });

        res.json({
            code: 200,
            msg: '评价成功',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            msg: '评价失败',
            error: error.message
        });
    }
};

// 获取活动评价
const getActivityRatings = async (req, res) => {
    try {
        const { id } = req.params;
        const ratings = await Activity.findRatingsByActivityId(id);
        
        res.json({
            code: 200,
            msg: '获取评价成功',
            data: ratings
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            msg: '获取评价失败',
            error: error.message
        });
    }
};

// 获取活动详情
const getActivityDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const activity = await Activity.findDetailById(id);
        
        if (!activity) {
            return res.status(404).json({
                code: 404,
                msg: '活动不存在',
                data: null
            });
        }

        res.json({
            code: 200,
            msg: '获取活动详情成功',
            data: activity
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            msg: '获取活动详情失败',
            error: error.message
        });
    }
};

// 获取活动报名记录
async function getActivityApplications(req, res) {
    try {
        const { id } = req.params;
        const applications = await Activity.getActivityApplications(id);
        
        res.json({
            code: 200,
            msg: '获取报名记录成功',
            data: applications
        });
    } catch (error) {
        console.error('获取活动报名记录失败:', error);
        res.status(500).json({
            code: 500,
            msg: '获取报名记录失败',
            error: error.message
        });
    }
}

// 导出所有控制器函数
module.exports = {
    getActivityList,
    createActivity,
    updateActivity,
    deleteActivity,
    applyActivity,
    getUserActivities,
    rateActivity,
    getActivityRatings,
    getActivityDetail,
    getActivityApplications
}; 