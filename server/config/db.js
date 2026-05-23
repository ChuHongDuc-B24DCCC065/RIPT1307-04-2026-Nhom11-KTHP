const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'diendanhoidapsinhvien', 
    ssl: {
        rejectUnauthorized: false // Bắt buộc phải có khi dùng Aiven
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection()
    .then(conn => {
        console.log("✅ Đã kết nối MySQL thành công!");
        conn.release();
    })
    .catch(err => {
        console.log("❌ Lỗi kết nối MySQL: ", err);
    });

module.exports = pool;