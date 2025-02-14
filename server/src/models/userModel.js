const bcrypt = require('bcryptjs');
const db = require('../config/database');

class User {
    static async findByUsername(username) {
        const [rows] = await db.execute(
            'SELECT * FROM sys_user WHERE username = ?',
            [username]
        );
        return rows[0];
    }

    static async findUserList({ username = '', phone = '', pageNum = 1, pageSize = 10 }) {
        console.log('开始查询用户列表，参数:', { username, phone, pageNum, pageSize });
        
        const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);
        let sql = `
            SELECT DISTINCT
                u.id,
                u.username,
                u.real_name,
                u.phone,
                u.email,
                u.avatar,
                u.status,
                u.create_time,
                u.update_time,
                GROUP_CONCAT(r.role_name) as role_name,
                GROUP_CONCAT(r.role_key) as role_key
            FROM sys_user u
            LEFT JOIN sys_user_role ur ON u.id = ur.user_id
            LEFT JOIN sys_role r ON ur.role_id = r.id
            WHERE 1=1
        `;
        const params = [];

        if (username) {
            sql += ' AND u.username LIKE ?';
            params.push(`%${username}%`);
        }

        if (phone) {
            sql += ' AND u.phone LIKE ?';
            params.push(`%${phone}%`);
        }

        try {
            // 获取总数
            const countSql = `
                SELECT COUNT(DISTINCT u.id) as total 
                FROM sys_user u 
                LEFT JOIN sys_user_role ur ON u.id = ur.user_id
                LEFT JOIN sys_role r ON ur.role_id = r.id
                WHERE 1=1 ${username ? 'AND u.username LIKE ?' : ''} ${phone ? 'AND u.phone LIKE ?' : ''}
            `;
            const [countRows] = await db.query(countSql, params);
            const total = countRows[0].total;

            // 获取分页数据
            sql += ' GROUP BY u.id ORDER BY u.create_time DESC LIMIT ? OFFSET ?';
            const pageParams = [...params];
            pageParams.push(parseInt(pageSize));
            pageParams.push(offset);

            console.log('执行的SQL:', sql);
            console.log('SQL参数:', pageParams);

            const [rows] = await db.query(sql, pageParams);

            // 处理角色名称和角色键
            const processedRows = rows.map(row => ({
                ...row,
                role_name: row.role_name ? row.role_name.split(',')[0] : null,
                role_key: row.role_key ? row.role_key.split(',')[0] : null
            }));

            return {
                list: processedRows,
                total,
                pageNum: parseInt(pageNum),
                pageSize: parseInt(pageSize)
            };
        } catch (error) {
            console.error('查询用户列表失败:', error);
            throw error;
        }
    }

    static async createUser(userData) {
        const { username, password, realName = null, phone = null, email = null } = userData;
        
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // 插入用户基本信息
            const [result] = await connection.execute(
                `INSERT INTO sys_user (username, password, real_name, phone, email, status) 
                 VALUES (?, ?, ?, ?, ?, 1)`,
                [username, hashedPassword, realName, phone, email]
            );
            
            const userId = result.insertId;
            
            // 分配普通用户角色
            await connection.execute(
                'INSERT INTO sys_user_role (user_id, role_id) VALUES (?, ?)',
                [userId, 2]  // 2 是普通用户角色的 ID
            );
            
            await connection.commit();
            return userId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async updateUser(userData) {
        const { id, realName = null, phone = null, email = null, status = null } = userData;
        
        // 构建动态更新SQL
        let sql = 'UPDATE sys_user SET update_time = NOW()';
        const params = [];

        if (realName !== undefined) {
            sql += ', real_name = ?';
            params.push(realName);
        }
        if (phone !== undefined) {
            sql += ', phone = ?';
            params.push(phone);
        }
        if (email !== undefined) {
            sql += ', email = ?';
            params.push(email);
        }
        if (status !== undefined) {
            sql += ', status = ?';
            params.push(status);
        }

        sql += ' WHERE id = ?';
        params.push(id);
        
        await db.execute(sql, params);
    }

    static async deleteUser(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // 先删除用户角色关联
            await connection.execute('DELETE FROM sys_user_role WHERE user_id = ?', [id]);
            
            // 再删除用户
            await connection.execute('DELETE FROM sys_user WHERE id = ?', [id]);
            
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async updateUserStatus(id, status) {
        await db.execute(
            'UPDATE sys_user SET status = ?, update_time = NOW() WHERE id = ?',
            [status, id]
        );
    }

    static async getRolePermissions(userId) {
        // 获取用户的角色ID
        const [userRoles] = await db.execute(`
            SELECT role_id FROM sys_user_role WHERE user_id = ?
        `, [userId]);
        
        if (!userRoles || userRoles.length === 0) {
            return []; 
        }

        const roleId = userRoles[0].role_id;
        
        // 获取角色的菜单权限
        const [menuIds] = await db.execute(`
            SELECT DISTINCT m.id, m.sort_order
            FROM sys_menu m
            JOIN sys_role_menu rm ON m.id = rm.menu_id
            WHERE rm.role_id = ? AND m.status = 1
            ORDER BY m.sort_order
        `, [roleId]);
        
        // 返回菜单ID数组
        return menuIds.map(row => row.id.toString());
    }
  
  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM sys_user WHERE id = ?',
      [id]
    );
    return rows[0];
  }
  
  
  static async updateProfile({
      id,
      username,
      realName,
      phone,
      buildingNo,
      roomNo
  }) {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        
        // 验证用户是否存在
        const [user] = await conn.query(
            'SELECT * FROM sys_user WHERE id = ?',
            [id]
        );
        if (!user || user.length === 0) {
            throw new Error('用户不存在');
        }

        // 验证手机号格式
        if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
            throw new Error('手机号格式不正确');
        }

        const query = `
            UPDATE sys_user
            SET username = ?,
                real_name = ?,
                phone = ?,
                building_no = ?,
                room_no = ?,
                update_time = NOW()
            WHERE id = ?
        `;
        
        await conn.query(query, [
            username || user[0].username,
            realName || user[0].real_name,
            phone || user[0].phone,
            buildingNo || user[0].building_no,
            roomNo || user[0].room_no,
            id
        ]);

        // 获取更新后的用户信息
        const [updatedUser] = await conn.query(
            'SELECT id, username, real_name, phone, building_no, room_no, update_time FROM sys_user WHERE id = ?',
            [id]
        );

        await conn.commit();
        return updatedUser[0];
    } catch (error) {
        await conn.rollback();
        console.error('更新用户信息失败:', error);
        throw error;
    } finally {
        conn.release();
    }
}

static async updatePassword(userId, oldPassword, newPassword) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        
        // 验证用户是否存在
        const [user] = await conn.query(
            'SELECT * FROM sys_user WHERE id = ? AND status = 1',
            [userId]
        );
        
        if (!user || user.length === 0) {
            throw new Error('用户不存在');
        }

        // 验证旧密码
        const isValidPassword = await bcrypt.compare(oldPassword, user[0].password);
        if (!isValidPassword) {
            throw new Error('原密码不正确');
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 更新密码
        await conn.query(
            'UPDATE sys_user SET password = ?, update_time = NOW() WHERE id = ?',
            [hashedPassword, userId]
        );

        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

// 获取用户角色
static async getUserRole(userId) {
    const [rows] = await db.execute(`
        SELECT r.id, r.role_name, r.role_key 
        FROM sys_role r
        JOIN sys_user_role ur ON r.id = ur.role_id
        WHERE ur.user_id = ?
    `, [userId]);
    return rows[0] || null;
}

// 更新用户角色
static async updateUserRole(userId, roleId) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // 删除原有角色
        await connection.execute(
            'DELETE FROM sys_user_role WHERE user_id = ?',
            [userId]
        );
        
        // 分配新角色
        await connection.execute(
            'INSERT INTO sys_user_role (user_id, role_id) VALUES (?, ?)',
            [userId, roleId]
        );
        
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
}

module.exports = User;