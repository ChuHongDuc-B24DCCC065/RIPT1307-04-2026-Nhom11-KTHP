const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware, teacherMiddleware, teacherOrAdminMiddleware } = require('../middleware/auth');
const { createNotification } = require('../utils/notification');
const jwt = require('jsonwebtoken');

const getUserFromHeader = (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bi_mat_quoc_gia');
    return decoded;
  } catch (e) {
    return null;
  }
};

const getUserIdFromHeader = (req) => {
  const user = getUserFromHeader(req);
  return user ? user.id : null;
};

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
    let where = "WHERE (q.status = 'approved' OR q.status = 'public' OR q.status IS NULL)";
    const params = [];

    // Chỉ hiển thị bài ẩn tạm thời (is_temp_hidden = 1) cho giảng viên và admin
    const currentUser = getUserFromHeader(req);
    const hasModeratorAccess = currentUser && (currentUser.role === 'teacher' || currentUser.role === 'admin');
    if (!hasModeratorAccess) {
      where += ' AND q.is_temp_hidden = 0';
    }

    if (search) {
      where += ' AND (q.title LIKE ? OR q.description LIKE ?)';
      params.push(search, search);
    }
    if (tag) {
      where += ' AND FIND_IN_SET(?, q.tags)';
      params.push(tag);
    }

    // ✅ Dùng pool.query thay vì pool.execute cho total
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM questions q ${where}`,
      params
    );

    const userId = currentUser ? currentUser.id : null;
    const rowParams = userId ? [userId, ...params] : params;

    // ✅ LIMIT và OFFSET nhúng thẳng vào chuỗi SQL
    const [rows] = await pool.query(
      `SELECT q.*, u.role AS author_role, u.reputation AS author_reputation,
              (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id) AS answer_count
              ${userId ? `, qv.vote_type AS user_vote_type` : ''}
       FROM questions q
       LEFT JOIN users u ON u.id = q.user_id
       ${userId ? `LEFT JOIN question_votes qv ON qv.question_id = q.id AND qv.user_id = ?` : ''}
       ${where}
       ORDER BY q.is_announcement DESC, q.post_type = 'announcement' DESC, (q.post_type = 'assignment' AND (q.deadline IS NULL OR q.deadline > NOW())) DESC, q.pinned_order DESC, q.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      rowParams
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
// GET /api/questions/tags/stats
router.get('/tags/stats', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT tags FROM questions WHERE (status = 'approved' OR status = 'public' OR status IS NULL) AND is_temp_hidden = 0"
    );
    const tagCounts = {};
    rows.forEach(row => {
      if (row.tags) {
        const tagsList = row.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        tagsList.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    res.json({ success: true, data: tagCounts });
  } catch (err) {
    console.error('Lỗi GET /tags/stats:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/questions/tags/list - Lấy danh sách tags công khai kèm số lượng câu hỏi
router.get('/tags/list', async (req, res) => {
  try {
    const [tags] = await pool.query("SELECT * FROM tags ORDER BY name ASC");
    const [rows] = await pool.query(
      "SELECT tags FROM questions WHERE (status = 'approved' OR status = 'public' OR status IS NULL) AND is_temp_hidden = 0"
    );
    const tagCounts = {};
    rows.forEach(row => {
      if (row.tags) {
        const tagsList = row.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        tagsList.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    const result = tags.map(t => {
      const tagNameLower = t.name.toLowerCase();
      return {
        id: t.id,
        name: t.name,
        description: t.description || 'Không có mô tả cho thẻ này.',
        created_at: t.created_at,
        question_count: tagCounts[tagNameLower] || 0
      };
    });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('GET /tags/list error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [[question]] = await pool.execute(
      `SELECT q.*, u.username AS author, u.reputation AS author_reputation, u.role AS author_role
       FROM questions q
       LEFT JOIN users u ON u.id = q.user_id
       WHERE q.id = ?`,
      [req.params.id]
    );

    if (!question)
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });

    const userId = getUserIdFromHeader(req);
    
    // Kiểm tra trạng thái phê duyệt
    if (question.status && question.status !== 'approved' && question.status !== 'public') {
      if (!userId) return res.status(403).json({ success: false, message: 'Bài viết đang chờ duyệt hoặc bị ẩn.' });
      
      const [[currentUser]] = await pool.execute('SELECT role FROM users WHERE id = ?', [userId]);
      const isAdmin = currentUser && currentUser.role === 'admin';
      
      if (question.user_id !== userId && !isAdmin) {
         return res.status(403).json({ success: false, message: 'Bài viết đang chờ duyệt hoặc bị ẩn.' });
      }
    }

    await pool.execute('UPDATE questions SET views = views + 1 WHERE id = ?', [req.params.id]);
    question.views += 1;

    let questionUserVoteType = 0;
    if (userId) {
      const [[qv]] = await pool.execute('SELECT vote_type FROM question_votes WHERE user_id = ? AND question_id = ?', [userId, req.params.id]);
      if (qv) questionUserVoteType = qv.vote_type;
    }

    // Lấy role của user đang xem để quyết định có hiển thị câu trả lời bị ẩn không
    let viewerRole = null;
    if (userId) {
      const [[viewer]] = await pool.execute('SELECT role FROM users WHERE id = ?', [userId]);
      if (viewer) viewerRole = viewer.role;
    }

    const [answers] = await pool.execute(
      `SELECT a.*, u.username AS author, u.reputation AS author_reputation, u.role AS author_role
       FROM answers a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.question_id = ?
       ORDER BY a.is_accepted DESC, a.teacher_verified DESC, (u.role = 'teacher') DESC, a.votes DESC, a.created_at ASC`,
      [req.params.id]
    );

    // Lấy comments cho từng answer
    // Lọc bỏ câu trả lời bị ẩn nếu viewer không phải teacher/admin
    let filteredAnswers = answers;
    if (viewerRole !== 'teacher' && viewerRole !== 'admin') {
      filteredAnswers = answers.filter(a => !a.is_hidden);
    }
    let answersWithComments = filteredAnswers.map(a => ({ ...a, comments: [] }));
    if (filteredAnswers.length > 0) {
      const answerIds = filteredAnswers.map(a => a.id);
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
      answersWithComments = filteredAnswers.map(a => ({ ...a, comments: commentsMap[a.id] || [], user_vote_type: 0 }));
      
      if (userId) {
        const [avotes] = await pool.query(`SELECT answer_id, vote_type FROM answer_votes WHERE user_id = ? AND answer_id IN (${placeholders})`, [userId, ...answerIds]);
        const avMap = {};
        avotes.forEach(v => avMap[v.answer_id] = v.vote_type);
        answersWithComments = answersWithComments.map(a => ({ ...a, user_vote_type: avMap[a.id] || 0 }));
      }
    }

    res.json({ success: true, data: { ...question, user_vote_type: questionUserVoteType, answers: answersWithComments } });
  } catch (err) {
    console.error('GET /questions/:id:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi Database: ' + err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, description, tags, post_type, deadline, attachment_url, attachment_name } = req.body;

  if (!title || !title.trim())
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề câu hỏi.' });

  if (!description || !description.trim())
    return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung câu hỏi.' });

  const tagStr = normalizeTags(tags).slice(0, 5).join(',');
  if (!tagStr)
    return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một thẻ.' });

  const finalPostType = post_type || 'question';
  if (['announcement', 'assignment', 'material'].includes(finalPostType) && req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Chỉ giảng viên hoặc admin mới được đăng loại bài viết này.' });
  }

  try {
    let authorName = req.user.username;
    let userReputation = 0;
    
    const [[user]] = await pool.execute('SELECT username, reputation FROM users WHERE id = ?', [req.user.id]);
    if (user) {
      authorName = user.username;
      userReputation = user.reputation || 0;
    } else {
      authorName = 'Unknown';
    }

    const initialStatus = userReputation < 50 ? 'pending' : 'approved';
    const isTeacherAnnouncement = finalPostType === 'announcement' ? 1 : 0;
    const finalStatus = (isTeacherAnnouncement || req.user.role === 'teacher') ? 'approved' : initialStatus;

    const [result] = await pool.execute(
      'INSERT INTO questions (title, description, tags, user_id, author, status, is_announcement, post_type, deadline, attachment_url, attachment_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        title.trim(), 
        description.trim(), 
        tagStr, 
        req.user.id, 
        authorName, 
        finalStatus, 
        isTeacherAnnouncement, 
        finalPostType, 
        deadline ? new Date(deadline) : null,
        attachment_url || null,
        attachment_name || null
      ]
    );

    res.status(201).json({
      success: true,
      message: initialStatus === 'pending' && req.user.role !== 'teacher' ? 'Bài viết của bạn đang chờ phê duyệt vì điểm uy tín chưa đủ (< 50).' : 'Đã đăng bài thành công!',
      data: { id: result.insertId, title, description, tags: tagStr.split(','), status: finalStatus, post_type: finalPostType, attachment_url, attachment_name },
    });
  } catch (err) {
    console.error('POST /questions:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { title, description, tags, post_type, deadline, attachment_url, attachment_name } = req.body;

  try {
    const [[question]] = await pool.execute('SELECT * FROM questions WHERE id = ?', [req.params.id]);

    if (!question)
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });

    if (question.user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa.' });

    const newTitle = (title       || question.title).trim();
    const newDesc  = (description || question.description).trim();
    const newTags  = tags ? normalizeTags(tags).slice(0, 5).join(',') : question.tags;
    
    const newPostType = post_type || question.post_type;
    const newDeadline = deadline !== undefined ? (deadline ? new Date(deadline) : null) : question.deadline;
    const newAttachmentUrl = attachment_url !== undefined ? attachment_url : question.attachment_url;
    const newAttachmentName = attachment_name !== undefined ? attachment_name : question.attachment_name;

    if (['announcement', 'assignment', 'material'].includes(newPostType) && req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chỉ giảng viên hoặc admin mới được chỉnh sửa thành loại bài đăng này.' });
    }

    await pool.execute(
      'UPDATE questions SET title = ?, description = ?, tags = ?, post_type = ?, deadline = ?, attachment_url = ?, attachment_name = ?, updated_at = NOW() WHERE id = ?',
      [newTitle, newDesc, newTags, newPostType, newDeadline, newAttachmentUrl, newAttachmentName, req.params.id]
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
    const [[question]] = await pool.execute('SELECT id, user_id, is_closed FROM questions WHERE id = ?', [req.params.id]);
    if (!question)
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });

    // Chặn trả lời khi luồng bị khóa
    if (question.is_closed) {
      return res.status(403).json({ success: false, message: 'Luồng thảo luận này đã bị khóa bởi Giảng viên.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO answers (content, question_id, user_id) VALUES (?, ?, ?)',
      [content.trim(), req.params.id, req.user.id]
    );

    if (question.user_id && question.user_id !== req.user.id) {
      await createNotification(
        question.user_id,
        `${req.user.username} đã trả lời câu hỏi của bạn.`,
        `/questions/${req.params.id}`
      );
    }

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

    const [[answer]] = await pool.execute('SELECT user_id FROM answers WHERE id = ?', [req.params.answerId]);
    if (answer && answer.user_id && answer.user_id !== req.user.id) {
      await createNotification(
        answer.user_id,
        `${req.user.username} đã chấp nhận câu trả lời của bạn.`,
        `/questions/${req.params.id}`
      );
    }

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
    const [[question]] = await pool.execute('SELECT id, user_id FROM questions WHERE id = ?', [req.params.id]);
    if (!question)
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });

    const [[existingVote]] = await pool.execute(
      'SELECT vote_type FROM question_votes WHERE user_id = ? AND question_id = ?',
      [req.user.id, req.params.id]
    );

    let voteChange = 0;
    if (existingVote) {
      if (existingVote.vote_type === delta) {
        // Bỏ vote
        await pool.execute('DELETE FROM question_votes WHERE user_id = ? AND question_id = ?', [req.user.id, req.params.id]);
        voteChange = -delta;
      } else {
        // Đổi vote
        await pool.execute('UPDATE question_votes SET vote_type = ? WHERE user_id = ? AND question_id = ?', [delta, req.user.id, req.params.id]);
        voteChange = delta * 2;
      }
    } else {
      // Vote mới
      await pool.execute('INSERT INTO question_votes (user_id, question_id, vote_type) VALUES (?, ?, ?)', [req.user.id, req.params.id, delta]);
      voteChange = delta;
    }

    if (voteChange !== 0) {
      await pool.execute('UPDATE questions SET votes = votes + ? WHERE id = ?', [voteChange, req.params.id]);
      
      // Cập nhật điểm uy tín (reputation) cho tác giả câu hỏi
      if (question.user_id) {
        await pool.execute('UPDATE users SET reputation = reputation + ? WHERE id = ?', [voteChange, question.user_id]);
      }
    }
    
    // Gửi thông báo nếu có tương tác mới (không gửi nếu bỏ vote)
    if (voteChange !== -delta && question.user_id && question.user_id !== req.user.id) {
      const action = type === 'up' ? 'upvote' : 'downvote';
      await createNotification(
        question.user_id,
        `${req.user.username} đã ${action} câu hỏi của bạn.`,
        `/questions/${req.params.id}`
      );
    }

    const [[updated]] = await pool.execute('SELECT votes FROM questions WHERE id = ?', [req.params.id]);
    const user_vote_type = existingVote && existingVote.vote_type === delta ? 0 : delta;
    res.json({ success: true, votes: updated.votes, user_vote_type });
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
    const [[answer]] = await pool.execute('SELECT id, user_id FROM answers WHERE id = ? AND question_id = ?', [req.params.answerId, req.params.id]);
    if (!answer) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu trả lời.' });
    }

    const [[existingVote]] = await pool.execute(
      'SELECT vote_type FROM answer_votes WHERE user_id = ? AND answer_id = ?',
      [req.user.id, req.params.answerId]
    );

    let voteChange = 0;
    if (existingVote) {
      if (existingVote.vote_type === delta) {
        // Bỏ vote
        await pool.execute('DELETE FROM answer_votes WHERE user_id = ? AND answer_id = ?', [req.user.id, req.params.answerId]);
        voteChange = -delta;
      } else {
        // Đổi vote
        await pool.execute('UPDATE answer_votes SET vote_type = ? WHERE user_id = ? AND answer_id = ?', [delta, req.user.id, req.params.answerId]);
        voteChange = delta * 2;
      }
    } else {
      // Vote mới
      await pool.execute('INSERT INTO answer_votes (user_id, answer_id, vote_type) VALUES (?, ?, ?)', [req.user.id, req.params.answerId, delta]);
      voteChange = delta;
    }

    if (voteChange !== 0) {
      await pool.execute(
        'UPDATE answers SET votes = votes + ? WHERE id = ? AND question_id = ?',
        [voteChange, req.params.answerId, req.params.id]
      );
      
      // Cập nhật điểm uy tín (reputation) cho tác giả câu trả lời
      if (answer.user_id) {
        await pool.execute('UPDATE users SET reputation = reputation + ? WHERE id = ?', [voteChange, answer.user_id]);
      }
    }

    if (voteChange !== -delta && answer.user_id && answer.user_id !== req.user.id) {
      const action = type === 'up' ? 'upvote' : 'downvote';
      await createNotification(
        answer.user_id,
        `${req.user.username} đã ${action} câu trả lời của bạn.`,
        `/questions/${req.params.id}`
      );
    }

    const [[updated]] = await pool.execute('SELECT votes FROM answers WHERE id = ?', [req.params.answerId]);
    const user_vote_type = existingVote && existingVote.vote_type === delta ? 0 : delta;
    res.json({ success: true, votes: updated.votes, user_vote_type });
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
    // Chặn bình luận khi luồng bị khóa
    const [[question]] = await pool.execute('SELECT is_closed FROM questions WHERE id = ?', [req.params.id]);
    if (question && question.is_closed) {
      return res.status(403).json({ success: false, message: 'Luồng thảo luận này đã bị khóa bởi Giảng viên.' });
    }

    const [[answer]] = await pool.execute('SELECT user_id FROM answers WHERE id = ?', [req.params.answerId]);

    const [result] = await pool.execute(
      'INSERT INTO comments (content, answer_id, user_id) VALUES (?, ?, ?)',
      [content.trim(), req.params.answerId, req.user.id]
    );

    if (answer && answer.user_id && answer.user_id !== req.user.id) {
      await createNotification(
        answer.user_id,
        `${req.user.username} đã bình luận về câu trả lời của bạn.`,
        `/questions/${req.params.id}`
      );
    }

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

// ─── TEACHER ROLE APIs ───

// Giảng viên xác nhận chuyên môn câu trả lời (tick xanh)
router.patch('/:id/answers/:answerId/teacher-verify', authMiddleware, teacherMiddleware, async (req, res) => {
  try {
    const [[answer]] = await pool.execute('SELECT id, teacher_verified, user_id FROM answers WHERE id = ? AND question_id = ?', [req.params.answerId, req.params.id]);
    if (!answer)
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu trả lời.' });

    const newStatus = answer.teacher_verified ? 0 : 1;
    const verifiedBy = newStatus ? req.user.id : null;
    await pool.execute('UPDATE answers SET teacher_verified = ?, verified_by_user_id = ? WHERE id = ?', [newStatus, verifiedBy, req.params.answerId]);

    // Thông báo cho tác giả câu trả lời
    if (newStatus === 1 && answer.user_id && answer.user_id !== req.user.id) {
      await createNotification(
        answer.user_id,
        `Giảng viên ${req.user.username} đã xác nhận chuyên môn câu trả lời của bạn! ✅`,
        `/questions/${req.params.id}`
      );
    }

    res.json({ success: true, teacher_verified: newStatus, message: newStatus ? 'Đã xác nhận chuyên môn!' : 'Đã bỏ xác nhận.' });
  } catch (err) {
    console.error('PATCH teacher-verify:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// Giảng viên/Admin đóng/mở luồng thảo luận
router.patch('/:id/close', authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const [[question]] = await pool.execute('SELECT id, is_closed FROM questions WHERE id = ?', [req.params.id]);
    if (!question)
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });

    const newStatus = question.is_closed ? 0 : 1;
    await pool.execute('UPDATE questions SET is_closed = ? WHERE id = ?', [newStatus, req.params.id]);

    res.json({ success: true, is_closed: newStatus, message: newStatus ? 'Đã khóa luồng thảo luận!' : 'Đã mở khóa luồng thảo luận!' });
  } catch (err) {
    console.error('PATCH close:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// Giảng viên/Admin ẩn câu trả lời sai lệch
router.patch('/:id/answers/:answerId/hide', authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const [[answer]] = await pool.execute('SELECT id, is_hidden FROM answers WHERE id = ? AND question_id = ?', [req.params.answerId, req.params.id]);
    if (!answer)
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu trả lời.' });

    const newStatus = answer.is_hidden ? 0 : 1;
    await pool.execute('UPDATE answers SET is_hidden = ? WHERE id = ?', [newStatus, req.params.answerId]);

    res.json({ success: true, is_hidden: newStatus, message: newStatus ? 'Đã ẩn câu trả lời!' : 'Đã hiện lại câu trả lời!' });
  } catch (err) {
    console.error('PATCH hide:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// Giảng viên thêm nhận xét nhanh vào câu trả lời
router.post('/:id/answers/:answerId/teacher-note', authMiddleware, teacherMiddleware, async (req, res) => {
  const { note } = req.body;
  if (!note || !note.trim())
    return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung nhận xét.' });

  try {
    const [[answer]] = await pool.execute('SELECT id, user_id FROM answers WHERE id = ? AND question_id = ?', [req.params.answerId, req.params.id]);
    if (!answer)
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu trả lời.' });

    await pool.execute('UPDATE answers SET teacher_note = ? WHERE id = ?', [note.trim(), req.params.answerId]);

    // Thông báo cho tác giả câu trả lời
    if (answer.user_id && answer.user_id !== req.user.id) {
      await createNotification(
        answer.user_id,
        `Giảng viên ${req.user.username} đã nhận xét về câu trả lời của bạn.`,
        `/questions/${req.params.id}`
      );
    }

    res.json({ success: true, message: 'Đã lưu nhận xét của giảng viên!', teacher_note: note.trim() });
  } catch (err) {
    console.error('POST teacher-note:', err.message);
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