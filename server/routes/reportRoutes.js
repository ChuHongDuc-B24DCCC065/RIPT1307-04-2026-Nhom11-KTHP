const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'bi_mat_quoc_gia';

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
        const { question_id, ly_do } = req.body;
        const user_id_report = req.user.id;

        const [result] = await pool.query(
            "INSERT INTO reports (user_id_report, question_id, ly_do, trang_thai) VALUES (?, ?, ?, 'pending')",
            [user_id_report, question_id, ly_do]
        );

        res.status(201).json({ 
            success: true, 
            message: "Đã gửi báo cáo thành công!", 
            reportId: result.insertId 
        });
    } catch (error) {
        console.error("Lỗi POST /reports:", error);
        res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
    }
});

module.exports = router;
