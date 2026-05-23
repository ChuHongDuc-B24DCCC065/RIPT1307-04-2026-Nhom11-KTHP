require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); 
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', 
  credentials: true
}));

// Import pool từ config
const pool = require('./config/db');

// Test connection (đã có trong config/db.js)
pool.getConnection()
    .then(conn => {
        console.log("✅ Main DB: Đã kết nối MySQL thành công!");
        conn.release();
    })
    .catch(err => console.log("❌ Main DB: Lỗi kết nối MySQL: ", err));

// --- API ĐĂNG KÝ ---
app.post('/api/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.execute(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role || 'student']
        );
        res.status(201).json({ message: "Đăng ký thành công!" });
    } catch (err) {
        console.error("LỖI SQL:", err.message); 
        res.status(500).json({ message: "Lỗi hệ thống: " + err.message });
    }
});

// --- API ĐĂNG NHẬP ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body; 

    if (!email || !password) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ Email và Mật khẩu!" });
    }

    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: "Tài khoản không tồn tại trên hệ thống!" });
        }

        const user = rows[0];
        
        if (user.status === 'banned') {
            return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu không chính xác, vui lòng thử lại!" });
        }

        // Tạo token với đầy đủ thông tin
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                email: user.email,
                role: user.role
            }, 
            'bi_mat_quoc_gia', 
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            message: "Đăng nhập thành công!",
            token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email
            }
        });

        console.log(`✅ User ${user.username} (${user.role}) đăng nhập thành công.`);

    } catch (err) {
        console.error("LỖI LOGIN:", err.message);
        res.status(500).json({ message: "Lỗi hệ thống khi xử lý đăng nhập!" });
    }
});

// Import admin routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);
const questionRoutes = require('./routes/questionRoutes');
app.use('/api/questions', questionRoutes);
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server chạy ở cổng ${PORT}`));