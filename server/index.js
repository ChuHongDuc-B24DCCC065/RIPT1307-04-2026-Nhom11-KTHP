require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); 
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 

const app = express();
app.use(express.json());
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true); // Cho phép mọi domain kết nối (Fix triệt để lỗi CORS)
  },
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
    const { username, email, password, confirmPassword, role } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Mật khẩu xác nhận không khớp!" });
    }

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

// --- API QUÊN MẬT KHẨU ---
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Vui lòng nhập email!" });

    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy tài khoản với email này!" });
        }

        const user = rows[0];
        const secret = process.env.JWT_SECRET || 'bi_mat_quoc_gia';
        // Tạo token, dùng thêm user.password để đảm bảo token vô hiệu khi password bị đổi
        const token = jwt.sign({ id: user.id, email: user.email }, secret + user.password, { expiresIn: '15m' });

        // Tạm thời trả về token hoặc in ra console
        console.log(`🔑 Reset Token cho ${email}: ${token}`);
        res.json({ success: true, message: "Yêu cầu lấy lại mật khẩu đã được xử lý.", token: token });
    } catch (err) {
        console.error("LỖI QUÊN MẬT KHẨU:", err.message);
        res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// --- API ĐẶT LẠI MẬT KHẨU ---
app.post('/api/reset-password', async (req, res) => {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
         return res.status(400).json({ message: "Thiếu thông tin yêu cầu!" });
    }

    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy tài khoản!" });

        const user = rows[0];
        const secret = process.env.JWT_SECRET || 'bi_mat_quoc_gia';

        try {
            // Verify token
            const decoded = jwt.verify(token, secret + user.password);
            if (decoded.id !== user.id) throw new Error("Token không hợp lệ!");
            
            // Đổi mật khẩu
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
            
            res.json({ success: true, message: "Mật khẩu đã được thay đổi thành công!" });
        } catch (jwtErr) {
            return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
        }
    } catch (err) {
        console.error("LỖI ĐẶT LẠI MẬT KHẨU:", err.message);
        res.status(500).json({ message: "Lỗi hệ thống!" });
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