const db = require('../config/database');

class Comment {
    static async create(commentData) {
        const query = `
            INSERT INTO post_comment 
            (post_id, parent_id, content, user_id, user_name, create_time) 
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        const result = await db.query(query, [
            commentData.postId,
            commentData.parentId || null,
            commentData.content,
            commentData.userId,
            commentData.userName,
            commentData.createTime
        ]);
      return {
          ...result,
          ...commentData
        }
    }

    static async findByPostId(postId) {
        const query = `
            SELECT * FROM post_comment 
            WHERE post_id = ? AND status = 1 
            ORDER BY create_time ASC
        `;
        return await db.query(query, [postId]);
    }
}

module.exports = Comment; 