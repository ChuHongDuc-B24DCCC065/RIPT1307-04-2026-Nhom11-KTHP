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

// Cập nhật profile
router.put('/profile', authMiddleware, async (req, res) => {
  const { fullName, phoneNumber, school, bio, website } = req.body;
  try {
    // Dùng INSERT ON DUPLICATE KEY UPDATE để tự động thêm mới nếu chưa có, hoặc cập nhật nếu đã có
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

module.exports = router;
