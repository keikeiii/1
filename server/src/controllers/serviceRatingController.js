const ServiceRating = require('../models/serviceRatingModel');

class ServiceRatingController {
    static async addRating(req, res) {
        try {
            const { applyId } = req.params;
            const ratingData = {
                applyId,
                userId: req.user.id,
                score: req.body.score,
                comment: req.body.comment
            };
            
            const ratingId = await ServiceRating.create(ratingData);
            res.json({
                code: 200,
                msg: '评价提交成功',
                data: { id: ratingId }
            });
        } catch (error) {
            console.error('提交评价失败:', error);
            res.status(500).json({
                code: 500,
                msg: '提交评价失败',
                error: error.message
            });
        }
    }

    static async getRating(req, res) {
        try {
            const { applyId } = req.params;
            const rating = await ServiceRating.getByApplyId(applyId);
            res.json({
                code: 200,
                data: rating
            });
        } catch (error) {
            console.error('获取评价失败:', error);
            res.status(500).json({
                code: 500,
                msg: '获取评价失败',
                error: error.message
            });
        }
    }
}

module.exports = ServiceRatingController; 