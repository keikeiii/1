const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'community_services',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('数据库连接成功');
        
        // 测试查询
        const [rows] = await connection.query('SELECT 1 as test');
        console.log('数据库查询测试:', rows);
        
        connection.release();
    } catch (error) {
        console.error('数据库连接测试失败:', error);
        throw error;
    }
}

// 在应用启动时测试连接
testConnection();

module.exports = pool;