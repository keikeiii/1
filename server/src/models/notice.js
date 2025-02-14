const db = require('../config/database');

class Notice {
    static async findAll() {
        const sql = `
            SELECT n.*, u.username as create_user_name 
            FROM notice n
            LEFT JOIN sys_user u ON n.create_user_id = u.id
            ORDER BY n.create_time DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    }

    static async create(data) {
        const sql = `
            INSERT INTO notice (title, content, create_time, create_user_id)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.query(sql, [
            data.title,
            data.content,
            data.createTime,
            data.createUserId
        ]);
        return { id: result.insertId, ...data };
    }
}

module.exports = Notice; 