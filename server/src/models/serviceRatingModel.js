const db = require('../config/database');

class ServiceRating {
    static async create(ratingData) {
        const [result] = await db.query(
            `INSERT INTO service_rating 
            (apply_id, user_id, score, comment) 
            VALUES (?, ?, ?, ?)`,
            [
                ratingData.applyId,
                ratingData.userId,
                ratingData.score,
                ratingData.comment
            ]
        );
        return result.insertId;
    }

    static async getByApplyId(applyId) {
        const [rows] = await db.query(
            `SELECT sr.*, u.real_name as userName 
             FROM service_rating sr
             LEFT JOIN sys_user u ON sr.user_id = u.id
             WHERE sr.apply_id = ?`,
            [applyId]
        );
        return rows[0];
    }
}

module.exports = ServiceRating; 