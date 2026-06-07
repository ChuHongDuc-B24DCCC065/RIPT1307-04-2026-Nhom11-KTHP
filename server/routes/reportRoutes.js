const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}

// Middleware verifyToken
function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Chưa đăng nhập!" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
        req.user = decoded;
        next();
    });
}

// POST /api/reports - Lưu báo cáo vào DB
router.post('/', verifyToken, async (req, res) => {
    try {
        // Lấy thông tin từ request body
        const { question_id, ly_do, temp_hide } = req.body;
        const user_id_report = req.user.id;
        const isTeacher = req.user.role === 'teacher';
        const priority = isTeacher ? 'high' : 'normal';

        // Nếu là giảng viên và có yêu cầu ẩn tạm thời
        if (temp_hide && isTeacher) {
            await pool.execute(
                "UPDATE questions SET is_temp_hidden = 1 WHERE id = ?",
                [question_id]
            );
        }

        const [result] = await pool.query(
            "INSERT INTO reports (user_id_report, question_id, ly_do, trang_thai, priority) VALUES (?, ?, ?, 'pending', ?)",
            [user_id_report, question_id, ly_do, priority]
        );

        res.status(201).json({ 
            success: true, 
            message: temp_hide && isTeacher 
                ? "Đã gửi báo cáo và ẩn tạm thời câu hỏi thành công!" 
                : "Đã gửi báo cáo thành công!", 
            reportId: result.insertId 
        });
    } catch (error) {
        console.error("Lỗi POST /reports:", error);
        res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
    }
});

module.exports = router;
