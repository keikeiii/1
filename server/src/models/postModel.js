const db = require('../config/database');

class Post {
    static async findAll() {
        const query = `
            SELECT * FROM community_post 
            WHERE status = 1 
            ORDER BY create_time DESC
        `;
        return await db.query(query);
    }

    static async create(postData) {
        const query = `
            INSERT INTO community_post 
            (title, content, user_id, user_name, user_avatar, create_time, images, liked_users) 
            VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
        `;
        const result = await db.query(query, [
            postData.title,
            postData.content,
            postData.userId,
            postData.userName,
            postData.userAvatar,
            JSON.stringify(postData.images || []),
            JSON.stringify([])
        ]);
        return {
            id: result.insertId,
            ...postData,
            likedUsers: [],
            commentList: [],  // Initialize empty commentList
            commentCount: 0,
            likeCount: 0
        };
    }
    static async incrementLike(id, like_id) {
        // First check if user has already liked
        const post = await this.findById(id);
        console.log("post", post)
        console.log("post.liked_users", post[0].liked_users)
        const likedUsers = JSON.parse(post[0].liked_users || '[]');
        const hasLiked = likedUsers.includes(like_id);
        let likedUsersString = JSON.stringify(likedUsers);
        let query;
        if (hasLiked) {
          // Remove like if already liked
          likedUsersString = JSON.stringify(likedUsers.filter(user => user !== like_id));
            query = `
                UPDATE community_post 
                SET like_count = like_count - 1,
                liked_users = ?
                WHERE id = ?
            `;
        } else {
            // Add like if not liked
            likedUsersString = JSON.stringify([...likedUsers, like_id]);
            query = `
                UPDATE community_post 
                SET like_count = like_count + 1,
                liked_users = ?
                WHERE id = ?
            `;
        }
        console.log("likedUsersString", likedUsersString)
        await db.query(query, [likedUsersString, id]);
        return this.findById(id);
    }

    static async findById(id) {
        const query = `SELECT * FROM community_post WHERE id = ?`;
        const [post] = await db.query(query, [id]);
        return post;
    }

    static async delete(id) {
        const query = `UPDATE community_post SET status = 0 WHERE id = ?`;
        return await db.query(query, [id]);
    }
    static async incrementCommentCount(id) {
      const query = `
          UPDATE community_post 
          SET comment_count = comment_count + 1 
          WHERE id = ?
      `;
      await db.query(query, [id]);
      return this.findById(id);
    }
}

module.exports = Post; 