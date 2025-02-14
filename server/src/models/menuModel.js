const db = require('../config/database');

class Menu {
    // 获取菜单树
    static async getMenuTree() {
        try {
            // 获取所有菜单
            const [rows] = await db.query(
                'SELECT id, parent_id as parentId, menu_name as label, path, component, permission, menu_type as menuType, icon, sort_order as sortOrder, status FROM sys_menu WHERE status = 1 ORDER BY sort_order'
            );

            // 构建菜单树
            const buildTree = (parentId) => {
                const children = rows.filter(item => item.parentId === parentId);
                if (children.length === 0) return null;

                return children.map(child => {
                    const node = { ...child };
                    const childrenNodes = buildTree(child.id);
                    if (childrenNodes) {
                        node.children = childrenNodes;
                    }
                    return node;
                });
            };

            // 返回根节点开始的树
            return buildTree(0) || [];
        } catch (error) {
            console.error('获取菜单树失败:', error);
            throw error;
        }
    }

    // 获取角色的菜单ID列表
    static async getRoleMenuIds(roleId) {
        try {
            // 获取角色的所有菜单ID，包括父菜单
            const [rows] = await db.query(`
                WITH RECURSIVE menu_tree AS (
                    -- 获取直接分配给角色的菜单
                    SELECT m.id, m.parent_id
                    FROM sys_menu m
                    JOIN sys_role_menu rm ON m.id = rm.menu_id
                    WHERE rm.role_id = ?
                    
                    UNION
                    
                    -- 获取这些菜单的父菜单
                    SELECT m.id, m.parent_id
                    FROM sys_menu m
                    JOIN menu_tree mt ON m.id = mt.parent_id
                )
                SELECT DISTINCT id FROM menu_tree
            `, [roleId]);
            
            return rows.map(row => row.id);
        } catch (error) {
            console.error('获取角色菜单ID列表失败:', error);
            throw error;
        }
    }

    // 更新角色的菜单权限
    static async updateRoleMenus(roleId, menuIds) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // 删除原有的角色菜单关联
            await conn.query('DELETE FROM sys_role_menu WHERE role_id = ?', [roleId]);

            // 插入新的角色菜单关联
            if (menuIds && menuIds.length > 0) {
                const values = menuIds.map(menuId => [roleId, menuId]);
                await conn.query(
                    'INSERT INTO sys_role_menu (role_id, menu_id) VALUES ?',
                    [values]
                );
            }

            await conn.commit();
        } catch (error) {
            await conn.rollback();
            console.error('更新角色菜单失败:', error);
            throw error;
        } finally {
            conn.release();
        }
    }
}

module.exports = Menu; 