const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: '@N1810158141',
    database: 'diendanhoidapsinhvien', 
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