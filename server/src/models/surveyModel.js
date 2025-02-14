const db = require('../config/database');

class Survey {
  // 创建问卷
  static async createSurvey(surveyData, questions) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 插入问卷基本信息
      const [surveyResult] = await conn.query(
        `INSERT INTO survey (title, type, description, start_time, end_time, create_user_id) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
        [surveyData.title, surveyData.type, surveyData.description,
        surveyData.startTime, surveyData.endTime, surveyData.createUserId]
      );

      const surveyId = surveyResult.insertId;

      // 插入问题和选项
      for (const question of questions) {
        const [questionResult] = await conn.query(
          `INSERT INTO survey_question 
                     (survey_id, title, question_type, required, sort_order, max_choices)
                     VALUES (?, ?, ?, ?, ?, ?)`,
          [surveyId, question.title, question.type,
            question.required ? 1 : 0, question.sortOrder, question.maxChoices]
        );

        // 如果是选择题，插入选项
        if (question.options && question.options.length > 0) {
          const questionId = questionResult.insertId;
          for (let i = 0; i < question.options.length; i++) {
            await conn.query(
              `INSERT INTO survey_option 
                             (question_id, option_content, sort_order)
                             VALUES (?, ?, ?)`,
              [questionId, question.options[i], i]
            );
          }
        }
      }

      await conn.commit();
      return surveyId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  // 获取问卷列表
  static async getSurveyList(params = {}) {
    const { status, type, pageSize = 10, pageNum = 1 } = params;
    let query = `SELECT s.*, u.username as creator_name 
                    FROM survey s 
                    LEFT JOIN sys_user u ON s.create_user_id = u.id 
                    WHERE 1=1`;
    const values = [];

    if (status !== undefined) {
      query += ` AND s.status = ?`;
      values.push(status);
    }
    if (type !== undefined) {
      query += ` AND s.type = ?`;
      values.push(type);
    }

    query += ` ORDER BY s.create_time DESC 
                  LIMIT ? OFFSET ?`;
    values.push(parseInt(pageSize), (pageNum - 1) * pageSize);

    const [rows] = await db.query(query, values);
    return rows;
  }

  // 获取问卷详情
  static async getSurveyDetail(surveyId) {
    const conn = await db.getConnection();
    try {
      // 获取问卷基本信息
      const [surveyRows] = await conn.query(
        `SELECT s.*, u.username as creator_name 
                 FROM survey s 
                 LEFT JOIN sys_user u ON s.create_user_id = u.id 
                 WHERE s.id = ?`,
        [surveyId]
      );

      if (surveyRows.length === 0) {
        return null;
      }

      const survey = surveyRows[0];

      // 获取问题列表
      const [questions] = await conn.query(
        `SELECT * FROM survey_question 
                 WHERE survey_id = ? 
                 ORDER BY sort_order`,
        [surveyId]
      );

      // 获取选项
      for (const question of questions) {
        if (['radio', 'checkbox'].includes(question.question_type)) {
          const [options] = await conn.query(
            `SELECT * FROM survey_option 
                         WHERE question_id = ? 
                         ORDER BY sort_order`,
            [question.id]
          );
          question.options = options;
        }
      }

      survey.questions = questions;
      return survey;
    } finally {
      conn.release();
    }
  }

  // 提交问卷答案
  static async submitAnswer(answer) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

        await conn.query(
          `INSERT INTO survey_answer 
                     (survey_id, user_id, answer_content, user_name)
                     VALUES (?, ?, ?, ?)`,
        [answer.surveyId, answer.userId,
        answer.answerContent, answer.userName]
      );

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  // 获取问卷统计数据
  static async getSurveyStats(surveyId) {
    const [answers] = await db.query(
        `SELECT 
            sa.user_id,
            sa.user_name,
            sa.answer_content,
            sa.submit_time
         FROM 
            survey_answer sa
         WHERE 
            sa.survey_id = ?`,
        [surveyId]
    );
    return answers;
  }

  // get user answer;
  static async getUserAnswer(surveyId, userId) {
    const [answers] = await db.query(
      `SELECT * FROM survey_answer WHERE survey_id = ? AND user_id = ?`,
      [surveyId, userId]
    );
    return answers;
  }

  // get survey answers;
  static async getSurveyAnswers(surveyId) {
    const [answers] = await db.query(
      `SELECT * FROM survey_answer WHERE survey_id = ?`,
      [surveyId]
    );
    return answers;
  }

  // delete survey;
  static async deleteSurvey(surveyId) {
    await db.query(
      `DELETE FROM survey WHERE id = ?`,
      [surveyId]
    );
  }

  // get survey questions;
  static async getSurveyQuestions(surveyId) {
    const [questions] = await db.query(
      `SELECT * FROM survey_question WHERE survey_id = ?`,
      [surveyId]
    );
    return questions;
  }

  static async getAllQuestions() {
    const [questions] = await db.query(
      `SELECT * FROM survey_question`
    );
    return questions;
  }

  // get all answers;
  static async getAllAnswers() {
    const [answers] = await db.query(
      `SELECT * FROM survey_answer`
    );
    return answers;
  }

  static async getAllOptions() {
    const [options] = await db.query(
      `SELECT * FROM survey_option`
    );
    return options;
  }
}

module.exports = Survey;