const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// Lấy thông tin profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.role, u.reputation, 
              p.full_name as fullName, p.phone as phoneNumber, p.school, p.bio, p.website, p.avatar, p.class_name,
              p.academic_title, p.department, p.major, p.teacher_code, p.is_available, p.office_hours, p.interests,
              (SELECT COUNT(*) FROM answers WHERE verified_by_user_id = u.id) as verified_count,
              (SELECT COUNT(*) FROM questions WHERE user_id = u.id AND post_type = 'announcement') as announcement_count,
              (SELECT COUNT(*) FROM answers WHERE user_id = u.id) as answer_count
       FROM users u 
       LEFT JOIN user_profile p ON u.id = p.user_id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userProfile = rows[0];
    if (userProfile.role === 'teacher') {
      userProfile.expert_score = (userProfile.verified_count * 15) + (userProfile.announcement_count * 10) + (userProfile.answer_count * 5);
    }

    res.json({ success: true, data: userProfile });
  } catch (error) {
    console.error('GET /users/profile:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Lấy thông tin profile của một user bất kỳ theo ID
router.get('/:id/profile', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.role, u.reputation, 
              p.full_name as fullName, p.phone as phoneNumber, p.school, p.bio, p.website, p.avatar, p.class_name,
              p.academic_title, p.department, p.major, p.teacher_code, p.is_available, p.office_hours, p.interests,
              (SELECT COUNT(*) FROM answers WHERE verified_by_user_id = u.id) as verified_count,
              (SELECT COUNT(*) FROM questions WHERE user_id = u.id AND post_type = 'announcement') as announcement_count,
              (SELECT COUNT(*) FROM answers WHERE user_id = u.id) as answer_count
       FROM users u 
       LEFT JOIN user_profile p ON u.id = p.user_id 
       WHERE u.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    const userProfile = rows[0];
    if (userProfile.role === 'teacher') {
      userProfile.expert_score = (userProfile.verified_count * 15) + (userProfile.announcement_count * 10) + (userProfile.answer_count * 5);
    }

    res.json({ success: true, data: userProfile });
  } catch (error) {
    console.error('GET /users/:id/profile error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

const bcrypt = require('bcrypt');

// Cập nhật profile
router.put('/profile', authMiddleware, async (req, res) => {
  const { 
    fullName, phoneNumber, school, bio, website, className, 
    academicTitle, department, major, teacherCode, interests,
    currentPassword, newPassword 
  } = req.body;
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
      `INSERT INTO user_profile (user_id, full_name, phone, school, bio, website, class_name, academic_title, department, major, teacher_code, interests) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       full_name = VALUES(full_name), phone = VALUES(phone), 
       school = VALUES(school), bio = VALUES(bio), website = VALUES(website),
       class_name = VALUES(class_name), academic_title = VALUES(academic_title),
       department = VALUES(department), major = VALUES(major), teacher_code = VALUES(teacher_code),
       interests = VALUES(interests)`,
      [
        req.user.id, 
        fullName || null, phoneNumber || null, school || null, bio || null, website || null, className || null,
        academicTitle || null, department || null, major || null, teacherCode || null, interests || null
      ]
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

// ─── TEACHER ROLE ENDPOINTS ───
const { teacherMiddleware } = require('../middleware/auth');
const { createNotification } = require('../utils/notification');

// Gửi thông báo hàng loạt cho người theo dõi
router.post('/teacher/broadcast', authMiddleware, teacherMiddleware, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !title.trim() || !content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung.' });
  }

  try {
    const [followers] = await pool.execute(
      'SELECT follower_id FROM follows WHERE following_id = ?',
      [req.user.id]
    );

    if (followers.length === 0) {
      return res.status(400).json({ success: false, message: 'Bạn chưa có người theo dõi nào để gửi thông báo.' });
    }

    const notifContent = `[Từ Giảng viên ${req.user.username}] ${title.trim()}: ${content.trim()}`;
    for (const f of followers) {
      await createNotification(
        f.follower_id,
        notifContent,
        `/profile`
      );
    }

    res.json({ success: true, message: `Đã gửi thông báo thành công tới ${followers.length} sinh viên.` });
  } catch (err) {
    console.error('POST /teacher/broadcast:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// Lấy thông số thống kê Dashboard Giảng viên
router.get('/teacher/dashboard-stats', authMiddleware, teacherMiddleware, async (req, res) => {
  try {
    const [[{ followersCount }]] = await pool.execute(
      'SELECT COUNT(*) as followersCount FROM follows WHERE following_id = ?', [req.user.id]
    );
    const [[{ questionsCount }]] = await pool.execute(
      'SELECT COUNT(*) as questionsCount FROM questions WHERE user_id = ?', [req.user.id]
    );
    const [[{ verifiedCount }]] = await pool.execute(
      'SELECT COUNT(*) as verifiedCount FROM answers WHERE verified_by_user_id = ?', [req.user.id]
    );
    const [[{ closedCount }]] = await pool.execute(
      'SELECT COUNT(*) as closedCount FROM questions WHERE user_id = ? AND is_closed = 1', [req.user.id]
    );

    // Danh sách 10 câu hỏi chưa trả lời (chờ hỗ trợ)
    const [unansweredQuestions] = await pool.execute(
      `SELECT q.id, q.title, q.author, q.created_at, q.tags, q.votes, q.views
       FROM questions q
       WHERE q.is_temp_hidden = 0 
         AND (q.status = 'approved' OR q.status = 'public' OR q.status IS NULL)
         AND (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id) = 0
       ORDER BY q.created_at DESC LIMIT 10`
    );

    // Danh sách 10 câu trả lời chờ xác nhận thuộc câu hỏi của giảng viên này
    const [pendingAnswers] = await pool.execute(
      `SELECT a.id, a.content, a.created_at, q.title as question_title, q.id as question_id, u.username as author_name
       FROM answers a
       JOIN questions q ON q.id = a.question_id
       LEFT JOIN users u ON u.id = a.user_id
       WHERE q.user_id = ? AND a.teacher_verified = 0 AND a.user_id != ? AND a.is_hidden = 0
       ORDER BY a.created_at DESC LIMIT 10`,
      [req.user.id, req.user.id]
    );

    res.json({
      success: true,
      data: {
        stats: {
          followersCount: Number(followersCount),
          questionsCount: Number(questionsCount),
          verifiedCount: Number(verifiedCount),
          closedCount: Number(closedCount)
        },
        unansweredQuestions,
        pendingAnswers
      }
    });
  } catch (err) {
    console.error('GET /teacher/dashboard-stats:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// Lấy danh sách hiệu suất sinh viên theo dõi
router.get('/teacher/students-performance', authMiddleware, teacherMiddleware, async (req, res) => {
  try {
    const [students] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.reputation, p.full_name as fullName, p.avatar,
              (SELECT COUNT(*) FROM questions q WHERE q.user_id = u.id) as questionsCount,
              (SELECT COUNT(*) FROM answers a WHERE a.user_id = u.id AND a.is_accepted = 1) as acceptedAnswersCount,
              (SELECT created_at FROM (
                 SELECT created_at, user_id FROM questions
                 UNION ALL
                 SELECT created_at, user_id FROM answers
                 UNION ALL
                 SELECT created_at, user_id FROM comments
               ) activities WHERE activities.user_id = u.id ORDER BY created_at DESC LIMIT 1) as lastActive
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       LEFT JOIN user_profile p ON p.user_id = u.id
       WHERE f.following_id = ?
       ORDER BY u.reputation DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: students });
  } catch (err) {
    console.error('GET /teacher/students-performance:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// Cập nhật trạng thái trực tuyến của Giảng viên
router.put('/teacher/availability', authMiddleware, teacherMiddleware, async (req, res) => {
  const { isAvailable, officeHours } = req.body;

  try {
    await pool.execute(
      `INSERT INTO user_profile (user_id, is_available, office_hours) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       is_available = VALUES(is_available), office_hours = VALUES(office_hours)`,
      [req.user.id, isAvailable ? 1 : 0, officeHours || null]
    );

    if (isAvailable) {
      const [followers] = await pool.execute(
        'SELECT follower_id FROM follows WHERE following_id = ?',
        [req.user.id]
      );
      for (const f of followers) {
        await createNotification(
          f.follower_id,
          `[Từ Giảng viên ${req.user.username}] Giảng viên đang trực tuyến hỗ trợ giải đáp thắc mắc (Office Hours)! 👨‍🏫`,
          `/profile`
        );
      }
    }

    res.json({ success: true, message: 'Cập nhật trạng thái trực tuyến thành công!' });
  } catch (err) {
    console.error('PUT /teacher/availability:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

module.exports = router;
