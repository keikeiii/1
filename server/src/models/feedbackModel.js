const db = require('../config/database');

class Feedback {
	static async create(feedbackData) {
		const conn = await db.getConnection();
		try {
			await conn.beginTransaction();
			const query = `INSERT INTO feedback (user_id, title, type, content, create_time) 
                          VALUES (?, ?, ?, ?, NOW())`;
			const [result] = await conn.query(query, [
				feedbackData.userId,
				feedbackData.title,
				feedbackData.type,
				feedbackData.content
			]);
			await conn.commit();
			return result;
		} catch (error) {
			await conn.rollback();
			throw error;
		} finally {
			conn.release();
		}
	}

	static async reply(feedbackId, userId, content) {
		const conn = await db.getConnection();
		try {
			await conn.beginTransaction();
			// 更新反馈状态
			await conn.query(
				'UPDATE feedback SET status = 1 WHERE id = ?',
				[feedbackId]
			);
			// 添加回复
			const query = `INSERT INTO feedback_reply 
                          (feedback_id, user_id, content, create_time) 
                          VALUES (?, ?, ?, NOW())`;
			const [result] = await conn.query(query, [feedbackId, userId, content]);
			await conn.commit();
			return result;
		} catch (error) {
			await conn.rollback();
			throw error;
		} finally {
			conn.release();
		}
	}

	static async getFeedbackList() {
		const query = `
            SELECT f.*, u.username as user_name, 
                   GROUP_CONCAT(fr.content) as replies,
                   GROUP_CONCAT(fr.create_time) as reply_times
            FROM feedback f
            LEFT JOIN sys_user u ON f.user_id = u.id
            LEFT JOIN feedback_reply fr ON f.id = fr.feedback_id
            WHERE f.status != 0
            GROUP BY f.id
            ORDER BY f.create_time DESC
        `;
		return await db.query(query);
	}

	static async getFeedbackById(id) {
		const query = `
        SELECT f.*, u.username as user_name,
               GROUP_CONCAT(fr.content) as replies,
               GROUP_CONCAT(fr.create_time) as reply_times,
               GROUP_CONCAT(ru.username) as reply_user_names
        FROM feedback f
        LEFT JOIN sys_user u ON f.user_id = u.id
        LEFT JOIN feedback_reply fr ON f.id = fr.feedback_id
        LEFT JOIN sys_user ru ON fr.user_id = ru.id
        WHERE f.id = ? AND f.status != 0
        GROUP BY f.id
    `;

		try {
			const [result] = await db.query(query, [id]);

			if (result && result.length > 0) {
				const feedback = result[0];

				// 处理回复数据
				if (feedback.replies) {
					const replies = feedback.replies.split(',');
					const replyTimes = feedback.reply_times.split(',');
					const replyUserNames = feedback.reply_user_names.split(',');

					feedback.replies = replies.map((content, index) => ({
						content,
						createTime: replyTimes[index],
						userName: replyUserNames[index]
					}));

					// 删除原始的拼接字段
					delete feedback.reply_times;
					delete feedback.reply_user_names;
				} else {
					feedback.replies = [];
				}

				return feedback;
			}
			return null;
		} catch (error) {
			console.error('获取反馈详情失败:', error);
			throw error;
		}
	}

}
module.exports = Feedback;