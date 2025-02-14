const db = require('../config/database');

class Activity {
    // 添加数据库连接测试方法
    static async testConnection() {
        let connection;
        try {
            connection = await db.getConnection();
            const [result] = await connection.query('SELECT 1 as test');
            console.log('数据库连接测试成功:', result);
            return result;
        } catch (error) {
            console.error('数据库连接测试失败:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    static async findAll() {
        let connection;
        try {
            connection = await db.getConnection();
            const [rows] = await connection.query(`
                SELECT * FROM activity 
                ORDER BY create_time DESC
            `);
            return rows;
        } catch (error) {
            console.error('查询活动列表失败:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    static async create(activity) {
        let connection;
        try {
            connection = await db.getConnection();
            
            await connection.beginTransaction();
            
            const sql = `
                INSERT INTO activity (
                    name,
                    description,
                    start_time,
                    end_time,
                    address,
                    max_participants,
                    status,
                    image,
                    create_user_id,
                    create_time
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            
            const params = [
                activity.name,
                activity.description,
                activity.start_time,
                activity.end_time,
                activity.address,
                activity.max_participants,
                activity.status,
                activity.image,
                activity.create_user_id
            ];
            
            console.log('SQL语句:', sql);
            console.log('参数:', params);
            
            const [result] = await connection.query(sql, params);
            await connection.commit();
            
            if (result.insertId) {
                const [rows] = await connection.query(
                    'SELECT * FROM activity WHERE id = ?',
                    [result.insertId]
                );
                return rows[0];
            }
            
            throw new Error('创建活动失败: 未获取到插入ID');
        } catch (error) {
            console.error('创建活动失败:', error);
            if (connection) {
                await connection.rollback();
            }
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    static async findById(id) {
        let connection;
        try {
            connection = await db.getConnection();
            const [rows] = await connection.query(
                'SELECT * FROM activity WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('查询活动详情失败:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    static async update(id, data) {
        console.log('开始更新活动，ID:', id);
        console.log('更新数据:', data);

        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();

            // 检查活动是否存在
            const [checkRows] = await connection.query(
                'SELECT id FROM activity WHERE id = ?',
                [id]
            );

            if (checkRows.length === 0) {
                console.log('活动不存在，ID:', id);
                await connection.commit();
                return null;
            }

            // 构造更新数据
            const updateData = {
                name: data.name,
                description: data.description,
                address: data.address,
                max_participants: parseInt(data.max_participants),
                status: parseInt(data.status),
                image: data.image,
                start_time: data.start_time ? new Date(data.start_time) : null,
                end_time: data.end_time ? new Date(data.end_time) : null
            };
            
            console.log('处理后的更新数据:', updateData);

            // 执行更新
            const [result] = await connection.query(
                'UPDATE activity SET ? WHERE id = ?',
                [updateData, id]
            );
            console.log('SQL更新结果:', result);

            if (result.affectedRows > 0) {
                // 查询更新后的数据
                const [rows] = await connection.query(
                    'SELECT * FROM activity WHERE id = ?',
                    [id]
                );
                const updatedData = rows[0];
                console.log('更新后的数据:', updatedData);
                
                await connection.commit();
                return updatedData;
            }
            
            await connection.commit();
            return null;
        } catch (error) {
            console.error('更新活动失败，详细错误:', error);
            console.error('错误堆栈:', error.stack);
            if (connection) {
                await connection.rollback();
            }
            throw error;
        } finally {
            if (connection) {
                try {
                    await connection.release();
                } catch (releaseError) {
                    console.error('释放数据库连接失败:', releaseError);
                }
            }
        }
    }

    static async deleteActivity(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // First delete activity participants
            await connection.execute('DELETE FROM activity_participant WHERE activity_id = ?', [id]);
            
            // Then delete the activity
            await connection.execute('DELETE FROM activity WHERE id = ?', [id]);
            
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    static async findActivityList({ name = '', status = null, pageNum = 1, pageSize = 10 }) {
        console.log('开始查询活动列表，参数:', { name, status, pageNum, pageSize });
        
        const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);
        let sql = `
            SELECT 
                a.*,
                COUNT(DISTINCT ap.id) as applied_count
            FROM activity a
            LEFT JOIN activity_participant ap ON a.id = ap.activity_id
            WHERE 1=1
        `;
        const params = [];

        if (name) {
            sql += ' AND a.name LIKE ?';
            params.push(`%${name}%`);
        }

        if (status !== null) {
            sql += ' AND a.status = ?';
            params.push(status);
        }

        sql += ' GROUP BY a.id';
        
        console.log('构建的SQL查询:', sql);
        console.log('SQL参数:', params);

        let connection;
        try {
            connection = await db.getConnection();
            
            // 获取总数
            const countSql = `
                SELECT COUNT(DISTINCT a.id) as total 
                FROM activity a
                WHERE 1=1
                ${name ? 'AND a.name LIKE ?' : ''}
                ${status !== null ? 'AND a.status = ?' : ''}
            `;
            
            console.log('计数SQL:', countSql);
            console.log('计数SQL参数:', params);

            const [countRows] = await connection.query(countSql, params);
            console.log('总数查询结果:', countRows);
            const total = countRows[0].total;

            // 获取分页数据
            sql += ' ORDER BY a.create_time DESC LIMIT ? OFFSET ?';
            const pageParams = [...params];
            pageParams.push(parseInt(pageSize));
            pageParams.push(offset);

            console.log('最终SQL:', sql);
            console.log('最终SQL参数:', pageParams);

            const [rows] = await connection.query(sql, pageParams);
            console.log('查询结果行数:', rows.length);

            const result = {
                list: rows,
                total,
                pageNum: parseInt(pageNum),
                pageSize: parseInt(pageSize)
            };
            
            console.log('返回结果:', result);
            return result;
        } catch (error) {
            console.error('查询活动列表失败，详细错误:', error);
            console.error('错误堆栈:', error.stack);
            throw error;
        } finally {
            if (connection) {
                try {
                    await connection.release();
                } catch (releaseError) {
                    console.error('释放数据库连接失败:', releaseError);
                }
            }
      }
    }

    // 查找报名记录
    static async findApplication(activityId, userId) {
        const [rows] = await db.query(
            'SELECT * FROM activity_participant WHERE activity_id = ? AND user_id = ?',
            [activityId, userId]
        );
        return rows[0];
    }

    // 创建报名记录
    static async createApplication(data) {
        const sql = `
            INSERT INTO activity_participant (
                activity_id, user_id, name, phone, 
                remark, status, apply_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(sql, [
            data.activity_id,
            data.user_id,
            data.name,
            data.phone,
            data.remark,
            data.status,
            data.apply_time
        ]);
        
        return result.insertId;
    }

    static async findUserActivities({ userId, name, status, pageNum, pageSize }) {
        const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);
        let sql = `
            SELECT 
                a.*,
                ap.status as apply_status,
                ap.rating_score,
                ap.rating_comment,
                ap.rating_time,
                ap.name as participant_name,
                ap.phone as participant_phone,
                ap.apply_time
            FROM activity a
            INNER JOIN activity_participant ap ON a.id = ap.activity_id
            WHERE ap.user_id = ?
        `;
        const params = [userId];

        if (name) {
            sql += ' AND a.name LIKE ?';
            params.push(`%${name}%`);
        }

        if (status !== null) {
            sql += ' AND a.status = ?';
            params.push(status);
        }

        // 获取总数
        const [countRows] = await db.query(
            `SELECT COUNT(*) as total FROM (${sql}) as t`,
            params
        );
        const total = countRows[0].total;

        // 获取分页数据
        sql += ' ORDER BY a.create_time DESC LIMIT ? OFFSET ?';
        params.push(parseInt(pageSize), offset);

        const [rows] = await db.query(sql, params);

        return {
            list: rows.map(row => ({
                ...row,
                rating: row.rating_score ? {
                    score: row.rating_score,
                    comment: row.rating_comment,
                    rateTime: row.rating_time
                } : null
            })),
            total,
            pageNum: parseInt(pageNum),
            pageSize: parseInt(pageSize)
        };
    }

    static async addRating({ activityId, userId, score, comment, ratingTime }) {
        const sql = `
            UPDATE activity_participant 
            SET rating_score = ?, 
                rating_comment = ?, 
                rating_time = ?
            WHERE activity_id = ? AND user_id = ?
        `;
        
        const [result] = await db.query(sql, [
            score,
            comment,
            ratingTime,
            activityId,
            userId
        ]);
        
        return result.affectedRows > 0;
    }

    static async findRatingsByActivityId(activityId) {
        const sql = `
            SELECT 
                ap.rating_score as score,
                ap.rating_comment as comment,
                ap.rating_time as rateTime,
                ap.name as userName,
                a.name as activityName
            FROM activity_participant ap
            JOIN activity a ON ap.activity_id = a.id
            WHERE ap.activity_id = ? 
            AND ap.rating_score IS NOT NULL
        `;
        
        const [rows] = await db.query(sql, [activityId]);
        return rows;
    }

    static async findDetailById(id) {
        const sql = `
            SELECT 
                a.*,
                COUNT(DISTINCT ap.id) as applied_count
            FROM activity a
            LEFT JOIN activity_participant ap ON a.id = ap.activity_id
            WHERE a.id = ?
            GROUP BY a.id
        `;

        const [rows] = await db.query(sql, [id]);
        if (rows.length === 0) return null;

        return rows[0];
    }

    static async createActivity(activityData) {
        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();

            const sql = `
                INSERT INTO activity (
                    name, 
                    description, 
                    start_time, 
                    end_time, 
                    address, 
                    max_participants, 
                    status,
                    image,
                    create_user_id,
                    create_time
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const params = [
                activityData.name,
                activityData.description,
                activityData.startTime,
                activityData.endTime,
                activityData.address,
                activityData.max_participants,
                activityData.status || 0,
                activityData.image,
                activityData.create_user_id
            ];

            const [result] = await connection.query(sql, params);
            
            if (result.insertId) {
                const [newActivity] = await connection.query(
                    'SELECT * FROM activity WHERE id = ?',
                    [result.insertId]
                );
                await connection.commit();
                return newActivity[0];
            }
            
            throw new Error('创建活动失败：未获取到插入ID');
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    static async getActivityApplications(activityId) {
        const sql = `
            SELECT 
                ap.*,
                u.username as user_name
            FROM activity_participant ap
            LEFT JOIN sys_user u ON ap.user_id = u.id
            WHERE ap.activity_id = ?
            ORDER BY ap.apply_time DESC
        `;
        
        const [rows] = await db.query(sql, [activityId]);
        return rows.map(row => ({
            id: row.id,
            activityId: row.activity_id,
            userId: row.user_id,
            name: row.name || row.user_name,
            phone: row.phone,
            remark: row.remark,
            applyTime: row.apply_time,
            status: row.status,
            rating: row.rating_score ? {
                score: row.rating_score,
                comment: row.rating_comment,
                rateTime: row.rating_time
            } : null
        }));
    }
}

module.exports = Activity; 