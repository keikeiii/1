const db = require('../config/database');

class Role {
    static async findRoleList({ roleName = '', pageNum = 1, pageSize = 10 }) {
        const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);
        let sql = `
            SELECT 
                id,
                role_name as roleName,
                role_key as roleKey,
                status,
                create_time as createTime,
                update_time as updateTime
            FROM sys_role
            WHERE 1=1
        `;
        const params = [];

        if (roleName) {
            sql += ' AND role_name LIKE ?';
            params.push(`%${roleName}%`);
        }

        try {
            // 获取总数
            const countSql = `
                SELECT COUNT(*) as total 
                FROM sys_role 
                WHERE 1=1 ${roleName ? 'AND role_name LIKE ?' : ''}
            `;
            const [countRows] = await db.query(countSql, params);
            const total = countRows[0].total;

            // 获取分页数据
            sql += ' ORDER BY id ASC LIMIT ? OFFSET ?';
            params.push(parseInt(pageSize));
            params.push(offset);

            const [rows] = await db.query(sql, params);

            // 格式化日期
            const formattedRows = rows.map(row => ({
                ...row,
                createTime: row.createTime ? new Date(row.createTime).toLocaleString() : null,
                updateTime: row.updateTime ? new Date(row.updateTime).toLocaleString() : null
            }));

            return {
                list: formattedRows,
                total,
                pageNum: parseInt(pageNum),
                pageSize: parseInt(pageSize)
            };
        } catch (error) {
            console.error('查询角色列表失败:', error);
            throw error;
        }
    }

    static async createRole({ roleName, roleKey, status = 1 }) {
        try {
            // 获取当前最大的角色ID
            const [maxIdResult] = await db.query('SELECT MAX(id) as maxId FROM sys_role');
            const nextId = (maxIdResult[0].maxId || 0) + 1;

            const sql = `
                INSERT INTO sys_role (id, role_name, role_key, status)
                VALUES (?, ?, ?, ?)
            `;
            const [result] = await db.execute(sql, [nextId, roleName, roleKey, status]);
            return nextId;
        } catch (error) {
            console.error('创建角色失败:', error);
            throw error;
        }
    }

    static async updateRole({ id, roleName, roleKey, status }) {
        let sql = 'UPDATE sys_role SET ';
        const params = [];
        const updates = [];

        if (roleName !== undefined) {
            updates.push('role_name = ?');
            params.push(roleName);
        }

        if (roleKey !== undefined) {
            updates.push('role_key = ?');
            params.push(roleKey);
        }

        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
        }

        if (updates.length === 0) {
            throw new Error('没有要更新的字段');
        }

        sql += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        await db.execute(sql, params);
    }

    static async deleteRole(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // 先删除角色权限关联
            await connection.execute('DELETE FROM sys_role_menu WHERE role_id = ?', [id]);
            
            // 再删除角色
            await connection.execute('DELETE FROM sys_role WHERE id = ?', [id]);
            
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async updateRoleStatus(id, status) {
        const sql = 'UPDATE sys_role SET status = ? WHERE id = ?';
        await db.execute(sql, [status, id]);
    }

    static async getRolePermissions(roleId) {
        const sql = 'SELECT menu_id FROM sys_role_menu WHERE role_id = ?';
        const [rows] = await db.execute(sql, [roleId]);
        return rows.map(row => row.menu_id);
    }

    static async updateRolePermissions(roleId, menuIds) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // 删除原有权限
            await connection.execute('DELETE FROM sys_role_menu WHERE role_id = ?', [roleId]);
            
            // 添加新权限
            if (menuIds && menuIds.length > 0) {
                const values = menuIds.map(menuId => [roleId, menuId]);
                await connection.query(
                    'INSERT INTO sys_role_menu (role_id, menu_id) VALUES ?',
                    [values]
                );
            }
            
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Role; 