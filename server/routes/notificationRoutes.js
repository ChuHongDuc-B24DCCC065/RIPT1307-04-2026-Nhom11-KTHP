const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// GET /notifications - Lấy danh sách thông báo của user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM notifications WHERE user_id_nhan = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('GET /notifications:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
});

// PUT /notifications/read-all - Đánh dấu tất cả là đã đọc
router.put('/read-all', authMiddleware, async (req, res) => {
    try {
        await pool.execute(
            'UPDATE notifications SET is_read = 1 WHERE user_id_nhan = ? AND is_read = 0',
            [req.user.id]
        );
        res.json({ success: true, message: 'Đã đánh dấu đọc tất cả.' });
    } catch (err) {
        console.error('PUT /notifications/read-all:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
});

// PUT /notifications/:id/read - Đánh dấu đã đọc
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        // Kiểm tra quyền
        const [[notification]] = await pool.execute(
            'SELECT * FROM notifications WHERE id = ?',
            [req.params.id]
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo.' });
        }

        if (notification.user_id_nhan !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
        }

        await pool.execute(
            'UPDATE notifications SET is_read = 1 WHERE id = ?',
            [req.params.id]
        );

        res.json({ success: true, message: 'Đã đánh dấu đọc.' });
    } catch (err) {
        console.error('PUT /notifications/:id/read:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
});

module.exports = router;
