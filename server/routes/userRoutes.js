const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// Lấy thông tin profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.role, u.reputation, 
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
  const { fullName, phoneNumber, school, bio, website, className, currentPassword, newPassword } = req.body;
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
      `INSERT INTO user_profile (user_id, full_name, phone, school, bio, website, class_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       full_name = VALUES(full_name), phone = VALUES(phone), 
       school = VALUES(school), bio = VALUES(bio), website = VALUES(website),
       class_name = VALUES(class_name)`,
      [req.user.id, fullName || null, phoneNumber || null, school || null, bio || null, website || null, className || null]
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

// Toggle follow / unfollow
router.post('/:id/follow', authMiddleware, async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ success: false, message: 'Không thể tự theo dõi chính mình' });
  }

  try {
    // Check if already following
    const [[existing]] = await pool.execute(
      'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, targetId]
    );

    if (existing) {
      // Unfollow
      await pool.execute('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, targetId]);
      res.json({ success: true, followed: false, message: 'Đã hủy theo dõi' });
    } else {
      // Follow
      await pool.execute('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [req.user.id, targetId]);
      res.json({ success: true, followed: true, message: 'Đã theo dõi' });
    }
  } catch (error) {
    console.error('POST /users/:id/follow:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Get followers (người theo dõi user)
router.get('/:id/followers', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.created_at,
              p.full_name, p.bio, p.avatar
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       LEFT JOIN user_profile p ON p.user_id = u.id
       WHERE f.following_id = ?
       ORDER BY f.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    console.error('GET /users/:id/followers:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Get following (user đang theo dõi ai)
router.get('/:id/following', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.created_at,
              p.full_name, p.bio, p.avatar
       FROM follows f
       JOIN users u ON u.id = f.following_id
       LEFT JOIN user_profile p ON p.user_id = u.id
       WHERE f.follower_id = ?
       ORDER BY f.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    console.error('GET /users/:id/following:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Get follow counts
router.get('/:id/follow-counts', async (req, res) => {
  try {
    const [[{ followers }]] = await pool.execute(
      'SELECT COUNT(*) as followers FROM follows WHERE following_id = ?', [req.params.id]
    );
    const [[{ following }]] = await pool.execute(
      'SELECT COUNT(*) as following FROM follows WHERE follower_id = ?', [req.params.id]
    );
    res.json({ success: true, followers: Number(followers), following: Number(following) });
  } catch (error) {
    console.error('GET /users/:id/follow-counts:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
