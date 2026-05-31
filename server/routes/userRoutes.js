const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// Lấy thông tin profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.role, 
              p.full_name as fullName, p.phone as phoneNumber, p.school, p.bio, p.website, p.avatar, p.class_name
       FROM users u 
       LEFT JOIN user_profile p ON u.id = p.user_id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('GET /users/profile:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

const bcrypt = require('bcrypt');

// Cập nhật profile
router.put('/profile', authMiddleware, async (req, res) => {
  const { fullName, phoneNumber, school, bio, website, currentPassword, newPassword } = req.body;
  try {
    // 1. Nếu có gửi kèm yêu cầu đổi mật khẩu
    if (currentPassword && newPassword) {
      // Lấy thông tin user hiện tại để so sánh mật khẩu cũ
      const [users] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'User không tồn tại' });
      }
      
      const isMatch = await bcrypt.compare(currentPassword, users[0].password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác!' });
      }

      // Đổi mật khẩu mới
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
    }

    // 2. Cập nhật thông tin profile
    await pool.execute(
      `INSERT INTO user_profile (user_id, full_name, phone, school, bio, website) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       full_name = VALUES(full_name), phone = VALUES(phone), 
       school = VALUES(school), bio = VALUES(bio), website = VALUES(website)`,
      [req.user.id, fullName || null, phoneNumber || null, school || null, bio || null, website || null]
    );
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('PUT /users/profile:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Lấy danh sách câu hỏi đã đánh dấu
router.get('/bookmarks', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT q.id, q.title, q.description, q.tags, q.user_id, b.created_at
       FROM bookmarks b
       JOIN questions q ON b.question_id = q.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('GET /users/bookmarks:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
