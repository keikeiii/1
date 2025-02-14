// feedback controller
const Feedback = require('../models/feedbackModel');

class FeedbackController {
    static async createFeedback(req, res) {
        const feedbackData = req.body;
        const result = await Feedback.create(feedbackData);
        res.json(result);
    }
    static async getFeedbackList(req, res) {
        const feedbackList = await Feedback.findByUserId(req.user.id);
        res.json(feedbackList);
    }
    static async replyFeedback(req, res) {
        const feedbackId = req.params.id;
        const userId = req.user.id;
        const content = req.body.content;
        const result = await Feedback.reply(feedbackId, userId, content);
        res.json(result);
    }
    static async updateFeedbackStatus(req, res) {
        const feedbackId = req.params.id;
        const status = req.body.status;
        const result = await Feedback.updateStatus(feedbackId, status);
        res.json(result);
    }
    static async deleteFeedback(req, res) {
        const feedbackId = req.params.id;
        const result = await Feedback.delete(feedbackId);
        res.json(result);
    }
    static async getFeedbackReplyList(req, res) {
        const feedbackId = req.params.id;
        const feedbackReplyList = await Feedback.getFeedbackReplyList(feedbackId);
        res.json(feedbackReplyList);
    }
    static async getFeedbackList(req, res) {
        const feedbackList = await Feedback.getFeedbackList();
        res.json(feedbackList);
    }
    static async getFeedbackById(req, res) {
        const feedbackId = req.params.id;
        const feedback = await Feedback.getFeedbackById(feedbackId);
        res.json(feedback);
    }
}

module.exports = FeedbackController;