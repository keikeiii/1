const Survey = require('../models/surveyModel');

class SurveyController {
  // 创建问卷
  static async createSurvey(req, res) {
    try {
      const { title, type, description, startTime, endTime, questions } = req.body;
      const surveyId = await Survey.createSurvey(
        {
          title,
          type,
          description,
          startTime,
          endTime,
          createUserId: req.user.id
        },
        questions
      );

      res.json({
        code: 200,
        msg: '创建成功',
        data: { surveyId }
      });
    } catch (error) {
      console.error('创建问卷失败:', error);
      res.status(500).json({
        code: 500,
        msg: '创建问卷失败',
        error: error.message
      });
    }
  }

  // 获取问卷列表
  static async getSurveyList(req, res) {
    try {
      const { status, type, pageSize, pageNum } = req.query;
      const surveys = await Survey.getSurveyList({
        status: status !== undefined ? parseInt(status) : undefined,
        type: type !== undefined ? parseInt(type) : undefined,
        pageSize,
        pageNum
      });

      res.json({
        code: 200,
        msg: '获取成功',
        data: surveys
      });
    } catch (error) {
      console.error('获取问卷列表失败:', error);
      res.status(500).json({
        code: 500,
        msg: '获取问卷列表失败',
        error: error.message
      });
    }
  }

  // 获取问卷详情
  static async getSurveyDetail(req, res) {
    try {
      const { id } = req.params;
      const survey = await Survey.getSurveyDetail(id);

      if (!survey) {
        return res.status(404).json({
          code: 404,
          msg: '问卷不存在'
        });
      }

      res.json({
        code: 200,
        msg: '获取成功',
        data: survey
      });
    } catch (error) {
      console.error('获取问卷详情失败:', error);
      res.status(500).json({
        code: 500,
        msg: '获取问卷详情失败',
        error: error.message
      });
    }
  }

  // 提交问卷答案
  static async submitAnswer(req, res) {
    try {
      const { answer } = req.body;
      await Survey.submitAnswer(answer);

      res.json({
        code: 200,
        msg: '提交成功',
        data: answer
      });
    } catch (error) {
      console.error('提交问卷答案失败:', error);
      res.status(500).json({
        code: 500,
        msg: '提交问卷答案失败',
        error: error.message
      });
    }
  }

  // 获取问卷统计
  static async getSurveyStats(req, res) {
    try {
      const { id } = req.params;
      const stats = await Survey.getSurveyStats(id);

      res.json({
        code: 200,
        msg: '获取成功',
        data: stats
      });
    } catch (error) {
      console.error('获取问卷统计失败:', error);
      res.status(500).json({
        code: 500,
        msg: '获取问卷统计失败',
        error: error.message
      });
    }
  }

  // get user answer:
  static async getUserAnswer(req, res) {
    try {
      const { id, userId } = req.params;
      const answer = await Survey.getUserAnswer(id, userId);
      res.json({
        code: 200,
        msg: '获取成功',
        data: answer
      });
    } catch (error) {
      console.error('获取用户答案失败:', error);
      res.status(500).json({
        code: 500,
        msg: '获取用户答案失败',
        error: error.message
      });
    }
  }

  static async getSurveyAnswers(req, res) {
    try {
      const { id } = req.params;
      const answers = await Survey.getSurveyAnswers(id);
      res.json({
        code: 200,
        msg: '获取成功',
        data: answers
      });
    } catch (error) {
      console.error('获取问卷答案失败:', error);
      res.status(500).json({
        code: 500,
        msg: '获取问卷答案失败',
        error: error.message
      });
    }
  }

  static async deleteSurvey(req, res) {
    try {
      const { id } = req.params;
      await Survey.deleteSurvey(id);
      res.json({
        code: 200,
        msg: '删除成功'
      });
    } catch (error) {
      console.error('删除问卷失败:', error);
      res.status(500).json({
        code: 500,
        msg: '删除问卷失败',
        error: error.message
      });
    }
  }

  // get survey questions;
  static async getSurveyQuestions(req, res) {
    const { id } = req.params;
    const questions = await Survey.getSurveyQuestions(id);
    res.json({
      code: 200,
      msg: '获取成功',
      data: questions
    });
  }

  static async getAllQuestions(req, res) {
    try {
      const questions = await Survey.getAllQuestions();
      console.log("questions", questions)
      res.json({
        code: 200,
        msg: '获取成功',
        data: questions
      });
    } catch (error) {
      console.error('获取所有问题失败:', error);
      res.status(500).json({
        code: 500,
        msg: '获取所有问题失败',
        error: error.message
      });
    }
  }

  static async getAllAnswers(req, res) {


    // surveyId: item.survey_id,
    //   userId: item.user_id,
    //     userName: item.user_name,
    //       answers: item.answers.map((answer: any) => ({
    //         questionIndex: answer.question_index,
    //         value: answer.value,
    //       })),
    //         submitTime: item.submit_time,
    try {
      const answers = await Survey.getAllAnswers();
      res.json({
        code: 200,
        msg: '获取成功',
        data: answers
      });
    } catch (error) {
      console.error('获取所有答案失败:', error);
      res.status(500).json({
        code: 500,
        msg: '获取所有答案失败',
        error: error.message
      });
    }
  }

  static async getAllOptions(req, res) {
    try {
      const options = await Survey.getAllOptions();
      res.json({
        code: 200,
        msg: '获取成功',
        data: options
      });
    } catch (error) {
      console.error('获取所有选项失败:', error);
      res.status(500).json({
        code: 500,
        msg: '获取所有选项失败',
        error: error.message
      });
    }
  }
}

module.exports = SurveyController;