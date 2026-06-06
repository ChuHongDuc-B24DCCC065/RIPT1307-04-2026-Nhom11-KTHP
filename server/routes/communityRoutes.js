const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/community/activities - Lấy danh sách 5 - 7 hoạt động mới nhất
router.get('/activities', async (req, res) => {
  try {
    // 1. Lấy danh sách câu trả lời gần đây
    const [answers] = await pool.query(`
      SELECT a.id, u.username, u.role, q.title AS question_title, q.id AS question_id, a.created_at
      FROM answers a
      JOIN users u ON a.user_id = u.id
      JOIN questions q ON a.question_id = q.id
      WHERE q.is_temp_hidden = 0
      ORDER BY a.created_at DESC LIMIT 10
    `);

    // 2. Lấy danh sách câu trả lời được giảng viên duyệt/ghim gần đây
    const [verifications] = await pool.query(`
      SELECT a.id, u.username AS teacher_name, q.title AS question_title, q.id AS question_id, a.created_at
      FROM answers a
      JOIN users u ON a.verified_by_user_id = u.id
      JOIN questions q ON a.question_id = q.id
      WHERE a.teacher_verified = 1 AND q.is_temp_hidden = 0
      ORDER BY a.created_at DESC LIMIT 10
    `);

    // 3. Lấy danh sách câu hỏi đạt mốc xem gần đây
    const [views] = await pool.query(`
      SELECT q.id, q.title AS question_title, q.views, q.created_at
      FROM questions q
      WHERE q.views >= 5 AND q.is_temp_hidden = 0
      ORDER BY q.created_at DESC LIMIT 10
    `);

    const activities = [];

    // Map câu trả lời
    answers.forEach(a => {
      const userType = a.role === 'teacher' ? 'Giảng viên' : 'Sinh viên';
      activities.push({
        id: `answer-${a.id}`,
        type: 'answer',
        content: `${userType} ${a.username} vừa trả lời câu hỏi`,
        questionTitle: a.question_title,
        questionId: a.question_id,
        created_at: a.created_at
      });
    });

    // Map xác minh của giảng viên
    verifications.forEach(v => {
      activities.push({
        id: `verify-${v.id}`,
        type: 'verify',
        content: `Giảng viên ${v.teacher_name} vừa ghim một đáp án đúng cho câu hỏi`,
        questionTitle: v.question_title,
        questionId: v.question_id,
        created_at: v.created_at
      });
    });

    // Map mốc lượt xem câu hỏi
    views.forEach(v => {
      let milestone = 5;
      if (v.views >= 1000) milestone = 1000;
      else if (v.views >= 500) milestone = 500;
      else if (v.views >= 100) milestone = 100;
      else if (v.views >= 50) milestone = 50;
      else if (v.views >= 20) milestone = 20;
      else if (v.views >= 10) milestone = 10;

      activities.push({
        id: `view-${v.id}`,
        type: 'view',
        content: `vừa đạt mốc ${milestone} lượt xem`,
        questionTitle: v.question_title,
        questionId: v.id,
        created_at: v.created_at
      });
    });

    // Sắp xếp các hoạt động theo thời gian diễn ra mới nhất
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Trả về tối đa 5 - 7 hoạt động
    const result = activities.slice(0, 7);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Lỗi GET /api/community/activities:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
  }
});

module.exports = router;
