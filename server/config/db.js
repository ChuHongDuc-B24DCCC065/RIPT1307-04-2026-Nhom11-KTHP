const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'lamanhlc123456@',
    database: process.env.DB_NAME || 'diendanhoidapsinhvien', 
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