const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-298eaf4d-phogachduc-535f.f.aivencloud.com',
    port: process.env.DB_PORT || 19632,
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    ssl: {
        rejectUnauthorized: false // Bắt buộc phải có khi dùng Aiven
    },
    timezone: 'Z',
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