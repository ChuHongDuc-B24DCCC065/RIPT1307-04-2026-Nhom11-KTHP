const express = require('express');
const mysql = require('mysql2/promise'); 
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 
const app = express();
app.use(express.json());
app.use(cors());

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: '123456',
    database: 'diendanhoidapsinhvien', 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(conn => {
        console.log("Đã kết nối MySQL thành công!");
        conn.release();
    })
    .catch(err => console.log("Lỗi kết nối MySQL: ", err));

// --- API ĐĂNG KÝ ---
app.post('/api/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Bây giờ pool đã được định nghĩa ở trên nên sẽ không lỗi nữa
        await pool.execute(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role || 'student']
        );
        res.status(201).send("Đăng ký thành công!");
    } catch (err) {
        console.error("LỖI SQL:", err.message); 
        res.status(500).send("Lỗi hệ thống: " + err.message);
    }
});
// --- API ĐĂNG NHẬP ---
app.post('/api/login', async (req, res) => {
    // Frontend gửi 'email' và 'password' trong body
    const { email, password } = req.body; 

    // Kiểm tra xem người dùng có nhập đủ thông tin không
    if (!email || !password) {
        return res.status(400).send("Vui lòng nhập đầy đủ Email và Mật khẩu!");
    }

    try {
        // 1. Kiểm tra xem Email có tồn tại trong Database không
        // Phải đảm bảo tên bảng 'users' khớp với MySQL Workbench
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(404).send("Tài khoản không tồn tại trên hệ thống!");
        }

        const user = rows[0];

        // 2. So sánh mật khẩu người dùng nhập với mật khẩu đã mã hóa trong DB
        // 'user.password' là dãy ký tự loằng ngoằng lấy từ cột password trong MySQL
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).send("Mật khẩu không chính xác, vui lòng thử lại!");
        }

        // 3. Nếu khớp, tạo Token và gửi về cho Frontend
        // 'bi_mat_quoc_gia' là khóa bí mật để ký token, hãy giữ kín
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            'bi_mat_quoc_gia', 
            { expiresIn: '1d' } // Token có hiệu lực trong 1 ngày
        );

        // Trả về Token và thông tin cơ bản của user
        res.json({
            message: "Đăng nhập thành công!",
            token,
            user: {
                username: user.username,
                role: user.role,
                email: user.email
            }
        });

        console.log(`User ${user.username} vừa đăng nhập thành công.`);

    } catch (err) {
        console.error("LỖI LOGIN:", err.message);
        res.status(500).send("Lỗi hệ thống khi xử lý đăng nhập!");
    }
});
app.listen(5000, () => console.log("Server chạy ở cổng 5000"));