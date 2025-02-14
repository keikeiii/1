const db = require('../config/database');

class Activity {
    // 获取活动列表
    static async findActivityList({ name = '', status = '', pageNum = 1, pageSize = 10 }) {
        const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);
        let sql = `
            SELECT 
                a.*,
                u.username as create_user_name,
                COUNT(ap.id) as applied_count
            FROM activity a
            LEFT JOIN sys_user u ON a.create_user_id = u.id
            LEFT JOIN activity_participant ap ON a.id = ap.activity_id AND ap.status = 1
            WHERE 1=1
        `;
        const params = [];

        if (name) {
            sql += ' AND a.name LIKE ?';
            params.push(`%${name}%`);
        }

        if (status !== '') {
            sql += ' AND a.status = ?';
            params.push(status);
        }

        sql += ' GROUP BY a.id';

        try {
            // 获取总数
            const countSql = `
                SELECT COUNT(*) as total 
                FROM activity 
                WHERE 1=1 
                ${name ? 'AND name LIKE ?' : ''}
                ${status !== '' ? 'AND status = ?' : ''}
            `;
            const [countRows] = await db.query(countSql, params.slice(0, params.length - 2));
            const total = countRows[0].total;

            // 获取分页数据
            sql += ' ORDER BY a.create_time DESC LIMIT ? OFFSET ?';
            params.push(parseInt(pageSize));
            params.push(offset);

            const [rows] = await db.query(sql, params);

            // 格式化日期
            const formattedRows = rows.map(row => ({
                ...row,
                create_time: row.create_time ? new Date(row.create_time).toLocaleString() : null,
                update_time: row.update_time ? new Date(row.update_time).toLocaleString() : null,
                start_time: row.start_time ? new Date(row.start_time).toLocaleString() : null,
                end_time: row.end_time ? new Date(row.end_time).toLocaleString() : null
            }));

            return {
                list: formattedRows,
                total,
                pageNum: parseInt(pageNum),
                pageSize: parseInt(pageSize)
            };
        } catch (error) {
            console.error('查询活动列表失败:', error);
            throw error;
        }
    }

    // 创建活动
    static async createActivity(activityData) {
        const sql = `
            INSERT INTO activity (
                name, description, start_time, end_time, 
                address, max_participants, status, create_user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(sql, [
            activityData.name,
            activityData.description,
            activityData.start_time,
            activityData.end_time,
            activityData.address,
            activityData.max_participants,
            activityData.status || 0,
            activityData.create_user_id
        ]);
        return result.insertId;
    }

    // 更新活动
    static async updateActivity(id, activityData) {
        const sql = `
            UPDATE activity 
            SET name = ?, description = ?, start_time = ?, 
                end_time = ?, address = ?, max_participants = ?, 
                status = ?
            WHERE id = ?
        `;
        await db.execute(sql, [
            activityData.name,
            activityData.description,
            activityData.start_time,
            activityData.end_time,
            activityData.address,
            activityData.max_participants,
            activityData.status,
            id
        ]);
    }

    // 删除活动
    static async deleteActivity(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // 先删除活动参与记录
            await connection.execute('DELETE FROM activity_participant WHERE activity_id = ?', [id]);
            
            // 再删除活动
            await connection.execute('DELETE FROM activity WHERE id = ?', [id]);
            
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // 报名活动
    static async applyActivity(activityId, userId) {
        // 检查是否已报名
        const [existingRows] = await db.query(
            'SELECT * FROM activity_participant WHERE activity_id = ? AND user_id = ?',
            [activityId, userId]
        );

        if (existingRows.length > 0) {
            throw new Error('您已经报名过此活动');
        }

        // 检查活动是否已满
        const [activityRows] = await db.query(
            `SELECT a.*, COUNT(ap.id) as current_participants 
             FROM activity a 
             LEFT JOIN activity_participant ap ON a.id = ap.activity_id AND ap.status = 1
             WHERE a.id = ?
             GROUP BY a.id`,
            [activityId]
        );

        if (activityRows.length === 0) {
            throw new Error('活动不存在');
        }

        const activity = activityRows[0];
        if (activity.current_participants >= activity.max_participants) {
            throw new Error('活动名额已满');
        }

        // 添加报名记录
        const sql = `
            INSERT INTO activity_participant (activity_id, user_id, status)
            VALUES (?, ?, 1)
        `;
        await db.execute(sql, [activityId, userId]);
    }

    // 获取用户的活动记录
    static async getUserActivities(userId) {
        const sql = `
            SELECT 
                a.*,
                ap.status as apply_status,
                ap.create_time as apply_time
            FROM activity a
            INNER JOIN activity_participant ap ON a.id = ap.activity_id
            WHERE ap.user_id = ?
            ORDER BY ap.create_time DESC
        `;
        const [rows] = await db.query(sql, [userId]);

        // 格式化日期
        return rows.map(row => ({
            ...row,
            create_time: row.create_time ? new Date(row.create_time).toLocaleString() : null,
            update_time: row.update_time ? new Date(row.update_time).toLocaleString() : null,
            start_time: row.start_time ? new Date(row.start_time).toLocaleString() : null,
            end_time: row.end_time ? new Date(row.end_time).toLocaleString() : null,
            apply_time: row.apply_time ? new Date(row.apply_time).toLocaleString() : null
        }));
    }
}

module.exports = Activity; 