const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const normalizeTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(t => t.trim().toLowerCase()).filter(Boolean);
  return tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
};

// questionRoutes.js - Sửa route GET /
router.get('/', async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(50, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const search = req.query.search ? `%${req.query.search}%` : null;
  const tag    = req.query.tag ? req.query.tag.toLowerCase() : null;

  try {
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (q.title LIKE ? OR q.description LIKE ?)';
      params.push(search, search);
    }
    if (tag) {
      where += ' AND FIND_IN_SET(?, q.tags)';
      params.push(tag);
    }

    // ✅ Dùng pool.query thay vì pool.execute
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM questions q ${where}`,
      params
    );

    // ✅ LIMIT và OFFSET nhúng thẳng vào chuỗi SQL, KHÔNG truyền qua params
    const [rows] = await pool.query(
      `SELECT q.*, 
              (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id) AS answer_count
       FROM questions q
       LEFT JOIN users u ON u.id = q.user_id
       ${where}
       ORDER BY q.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total: Number(total), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('GET /questions:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/questions/my-questions
// GET /my-questions - Lấy câu hỏi của user hiện tại
router.get('/user/questions', authMiddleware, async (req, res) => {  try {
    const [rows] = await pool.execute(
      `SELECT q.*, 
              (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id) AS answer_count
       FROM questions q
       WHERE q.user_id = ?
       ORDER BY q.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: rows
    }); 
  } catch (err) {
    console.error('GET /my-questions:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [[question]] = await pool.execute(
      `SELECT q.*, u.username AS author
       FROM questions q
       LEFT JOIN users u ON u.id = q.user_id
       WHERE q.id = ?`,
      [req.params.id]
    );

    if (!question)
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });

    await pool.execute('UPDATE questions SET views = views + 1 WHERE id = ?', [req.params.id]);
    question.views += 1;

    const [answers] = await pool.execute(
      `SELECT a.*, u.username AS author
       FROM answers a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.question_id = ?
       ORDER BY a.is_accepted DESC, a.votes DESC, a.created_at ASC`,
      [req.params.id]
    );

    // Lấy comments cho từng answer
    let answersWithComments = answers.map(a => ({ ...a, comments: [] }));
    if (answers.length > 0) {
      const answerIds = answers.map(a => a.id);
      const placeholders = answerIds.map(() => '?').join(',');
      const [comments] = await pool.query(
        `SELECT c.*, u.username AS author
         FROM comments c
         LEFT JOIN users u ON u.id = c.user_id
         WHERE c.answer_id IN (${placeholders})
         ORDER BY c.created_at ASC`,
        answerIds
      );
      const commentsMap = {};
      comments.forEach(c => {
        if (!commentsMap[c.answer_id]) commentsMap[c.answer_id] = [];
        commentsMap[c.answer_id].push(c);
      });
      answersWithComments = answers.map(a => ({ ...a, comments: commentsMap[a.id] || [] }));
    }

    res.json({ success: true, data: { ...question, answers: answersWithComments } });
  } catch (err) {
    console.error('GET /questions/:id:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, description, tags } = req.body;

  if (!title || !title.trim())
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề câu hỏi.' });

  if (!description || !description.trim())
    return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung câu hỏi.' });

  const tagStr = normalizeTags(tags).slice(0, 5).join(',');
  if (!tagStr)
    return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một thẻ.' });

  try {
    const [result] = await pool.execute(
      'INSERT INTO questions (title, description, tags, user_id, author) VALUES (?, ?, ?, ?, ?)',
      [title.trim(), description.trim(), tagStr, req.user.id, req.user.username]
    );

    res.status(201).json({
      success: true,
      message: 'Đã đăng câu hỏi thành công!',
      data: { id: result.insertId, title, description, tags: tagStr.split(',') },
    });
  } catch (err) {
    console.error('POST /questions:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { title, description, tags } = req.body;

  try {
    const [[question]] = await pool.execute('SELECT * FROM questions WHERE id = ?', [req.params.id]);

    if (!question)
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });

    if (question.user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa.' });

    const newTitle = (title       || question.title).trim();
    const newDesc  = (description || question.description).trim();
    const newTags  = tags ? normalizeTags(tags).slice(0, 5).join(',') : question.tags;

    await pool.execute(
      'UPDATE questions SET title = ?, description = ?, tags = ?, updated_at = NOW() WHERE id = ?',
      [newTitle, newDesc, newTags, req.params.id]
    );

    res.json({ success: true, message: 'Cập nhật thành công.' });
  } catch (err) {
    console.error('PUT /questions/:id:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [[question]] = await pool.execute('SELECT * FROM questions WHERE id = ?', [req.params.id]);

    if (!question)
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });

    if (question.user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Không có quyền xoá.' });

    await pool.execute('DELETE FROM answers WHERE question_id = ?', [req.params.id]);
    await pool.execute('DELETE FROM questions WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Đã xoá câu hỏi.' });
  } catch (err) {
    console.error('DELETE /questions/:id:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

router.post('/:id/answers', authMiddleware, async (req, res) => {
  const { content } = req.body;

  if (!content || !content.trim())
    return res.status(400).json({ success: false, message: 'Vui lòng nhập câu trả lời.' });

  try {
    const [[question]] = await pool.execute('SELECT id FROM questions WHERE id = ?', [req.params.id]);
    if (!question)
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });

    const [result] = await pool.execute(
      'INSERT INTO answers (content, question_id, user_id) VALUES (?, ?, ?)',
      [content.trim(), req.params.id, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Đã đăng câu trả lời!',
      data: { id: result.insertId, content, question_id: req.params.id },
    });
  } catch (err) {
    console.error('POST /questions/:id/answers:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

router.patch('/:id/answers/:answerId/accept', authMiddleware, async (req, res) => {
  try {
    const [[question]] = await pool.execute('SELECT * FROM questions WHERE id = ?', [req.params.id]);
    if (!question)
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });

    if (question.user_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Chỉ tác giả mới được chấp nhận câu trả lời.' });

    await pool.execute('UPDATE answers SET is_accepted = 0 WHERE question_id = ?', [req.params.id]);
    await pool.execute('UPDATE answers SET is_accepted = 1 WHERE id = ? AND question_id = ?',
      [req.params.answerId, req.params.id]);

    res.json({ success: true, message: 'Đã chấp nhận câu trả lời.' });
  } catch (err) {
    console.error('PATCH accept answer:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

router.post('/:id/vote', authMiddleware, async (req, res) => {
  const { type } = req.body;
  if (!['up', 'down'].includes(type))
    return res.status(400).json({ success: false, message: 'type phải là "up" hoặc "down".' });

  const delta = type === 'up' ? 1 : -1;

  try {
    const [[question]] = await pool.execute('SELECT id FROM questions WHERE id = ?', [req.params.id]);
    if (!question)
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });

    await pool.execute('UPDATE questions SET votes = votes + ? WHERE id = ?', [delta, req.params.id]);
    const [[updated]] = await pool.execute('SELECT votes FROM questions WHERE id = ?', [req.params.id]);
    res.json({ success: true, votes: updated.votes });
  } catch (err) {
    console.error('POST /questions/:id/vote:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

router.post('/:id/answers/:answerId/vote', authMiddleware, async (req, res) => {
  const { type } = req.body;
  if (!['up', 'down'].includes(type))
    return res.status(400).json({ success: false, message: 'type phải là "up" hoặc "down".' });

  const delta = type === 'up' ? 1 : -1;

  try {
    await pool.execute(
      'UPDATE answers SET votes = votes + ? WHERE id = ? AND question_id = ?',
      [delta, req.params.answerId, req.params.id]
    );

    const [[updated]] = await pool.execute('SELECT votes FROM answers WHERE id = ?', [req.params.answerId]);
    if (!updated)
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu trả lời.' });

    res.json({ success: true, votes: updated.votes });
  } catch (err) {
    console.error('POST /answers/:answerId/vote:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// POST bình luận vào câu trả lời
router.post('/:id/answers/:answerId/comments', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim())
    return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung bình luận.' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO comments (content, answer_id, user_id) VALUES (?, ?, ?)',
      [content.trim(), req.params.answerId, req.user.id]
    );
    res.status(201).json({
      success: true,
      message: 'Đã đăng bình luận!',
      data: { id: result.insertId, content: content.trim(), author: req.user.username, created_at: new Date() }
    });
  } catch (err) {
    console.error('POST comment:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// API kiểm tra trạng thái đánh dấu (bookmark)
router.get('/:id/bookmark-status', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM bookmarks WHERE user_id = ? AND question_id = ?',
      [req.user.id, req.params.id]
    );
    res.json({ success: true, isBookmarked: rows.length > 0 });
  } catch (err) {
    console.error('GET /bookmark-status:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// API Bật/Tắt đánh dấu (Toggle bookmark)
router.post('/:id/bookmark', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM bookmarks WHERE user_id = ? AND question_id = ?',
      [req.user.id, req.params.id]
    );

    if (rows.length > 0) {
      // Đã đánh dấu -> Bỏ đánh dấu
      await pool.execute(
        'DELETE FROM bookmarks WHERE user_id = ? AND question_id = ?',
        [req.user.id, req.params.id]
      );
      res.json({ success: true, isBookmarked: false, message: 'Đã bỏ đánh dấu câu hỏi.' });
    } else {
      // Chưa đánh dấu -> Thêm đánh dấu
      await pool.execute(
        'INSERT INTO bookmarks (user_id, question_id) VALUES (?, ?)',
        [req.user.id, req.params.id]
      );
      res.json({ success: true, isBookmarked: true, message: 'Đã đánh dấu câu hỏi.' });
    }
  } catch (err) {
    console.error('POST /bookmark:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

module.exports = router;