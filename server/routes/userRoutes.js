const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// Lấy thông tin profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, email, role, fullName, phoneNumber, school, bio, website FROM users WHERE id = ?',
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
    await pool.execute(
      'UPDATE users SET fullName = ?, phoneNumber = ?, school = ?, bio = ?, website = ? WHERE id = ?',
      [fullName || null, phoneNumber || null, school || null, bio || null, website || null, req.user.id]
    );
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('PUT /users/profile:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
