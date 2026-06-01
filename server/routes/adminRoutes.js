const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// ✅ SỬA ĐƯỜNG DẪN - Quay lên 2 cấp để vào config/db.js
const pool = require("../config/db");

// Hoặc nếu config/db.js nằm cùng cấp với index.js thì dùng:
// const pool = require("../config/db");

const JWT_SECRET = 'bi_mat_quoc_gia';

// ─────────────────────────────────────────
// Middleware xác thực Token
// ─────────────────────────────────────────
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  
  console.log('Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Chưa đăng nhập!" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT Verify Error:", err.message);
      return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
    req.user = decoded;
    next();
  });
}

// ─────────────────────────────────────────
// Middleware kiểm tra quyền Admin
// ─────────────────────────────────────────
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Chỉ Admin mới có quyền truy cập!" });
  }
  next();
}

// ─────────────────────────────────────────
// Debug middleware
// ─────────────────────────────────────────
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Áp dụng middleware auth cho tất cả route
router.use(verifyToken);
router.use(isAdmin);

// ─────────────────────────────────────────
// API Thống kê
// ─────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [usersResult] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users");
    const [postsResult] = await pool.query("SELECT COUNT(*) AS totalQuestions FROM questions");
    
    res.json({
      totalUsers: usersResult[0].totalUsers,
      totalPosts: postsResult[0].totalQuestions,
      reports: 0
    });
  } catch (error) {
    console.error("Error in /stats:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// ─────────────────────────────────────────
// API Detailed Stats
// ─────────────────────────────────────────
router.get("/detailed-stats", async (req, res) => {
  try {
    const [usersResult] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users");
    const [postsResult] = await pool.query("SELECT COUNT(*) AS totalQuestions FROM questions");
    
    res.json({
      totalUsers: usersResult[0].totalUsers,
      totalQuestions: postsResult[0].totalQuestions,
      totalAnswers: 1800,
      totalVotes: 3200,
      reportedQuestions: [
        { key: '1', title: 'Tại sao React lại khó học?', reports: 12, author: 'nguyenvana' },
        { key: '2', title: 'Lỗi khi cài đặt Node.js trên Windows 11', reports: 8, author: 'tranb' }
      ],
      activities: [
        { id: '1', content: 'Admin A vừa xóa bài viết vi phạm', time: '10 phút trước', color: 'red' },
        { id: '2', content: 'Người dùng B vừa đăng ký tài khoản', time: '1 giờ trước', color: 'green' }
      ],
      acceptedAnswerRate: 68,
      teacherStudentRatio: { teacher: 15, student: 85 }
    });
  } catch (error) {
    console.error("Error in /detailed-stats:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// ─────────────────────────────────────────
// API Lấy danh sách Users
// ─────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const { search, role, status } = req.query;
    console.log("Fetching users list with filters:", { search, role, status });
    
    let query = "SELECT * FROM users";
    const queryParams = [];
    const whereClauses = [];
    
    if (search) {
      whereClauses.push("(username LIKE ? OR email LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (role && role !== 'all') {
      whereClauses.push("role = ?");
      queryParams.push(role);
    }
    
    if (status && status !== 'all') {
      whereClauses.push("status = ?");
      queryParams.push(status);
    }
    
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(" AND ")}`;
    }
    
    query += " ORDER BY id DESC";
    
    const [users] = await pool.query(query, queryParams);
    
    const formattedUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        createdAt: u.created_at || u.createdAt || null,
        status: u.status || 'active'
    }));
    
    console.log(`Found ${formattedUsers.length} users`);
    res.json({ users: formattedUsers });
  } catch (error) {
    console.error("Error in /users:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// ─────────────────────────────────────────
// API Lấy danh sách Posts
// ─────────────────────────────────────────
router.get("/posts", async (req, res) => {
  try {
    const { search, status, startDate, endDate } = req.query;
    console.log("Fetching posts list with filters:", { search, status, startDate, endDate });
    
    let query = `
      SELECT q.*, COUNT(r.id) AS reportCount
      FROM questions q
      LEFT JOIN reports r ON q.id = r.question_id
    `;
    
    const queryParams = [];
    const whereClauses = [];
    
    if (search) {
      whereClauses.push("(q.title LIKE ? OR q.author LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (status && status !== 'all') {
      whereClauses.push("q.status = ?");
      queryParams.push(status);
    }
    
    if (startDate && endDate) {
      whereClauses.push("q.created_at >= ? AND q.created_at <= ?");
      queryParams.push(new Date(startDate), new Date(endDate));
    }
    
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(" AND ")}`;
    }
    
    query += `
      GROUP BY q.id
      ORDER BY q.id DESC
    `;
    
    const [posts] = await pool.query(query, queryParams);
    
    const formattedPosts = posts.map(p => ({
        id: p.id,
        title: p.title,
        author: p.author || 'Unknown',
        createdAt: p.created_at || p.createdAt || null,
        views: p.views || 0,
        votes: p.votes || 0,
        reports: p.reportCount || 0,
        status: p.status || 'public'
    }));
    
    console.log(`Found ${formattedPosts.length} posts`);
    res.json({ posts: formattedPosts });
  } catch (error) {
    console.error("Error in /posts:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// ─────────────────────────────────────────
// Cập nhật trạng thái (Ban/Unban) User
// ─────────────────────────────────────────
router.put("/users/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' hoặc 'banned'

  try {
    // Note: If 'status' column doesn't exist, this will throw 500 error. 
    // Ideally we'd ensure the table has a 'status' column via migrations.
    const [result] = await pool.query("UPDATE users SET status = ? WHERE id = ?", [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `Không tìm thấy user với id = ${id}.` });
    }

    const action = status === 'banned' ? 'Khóa' : 'Mở khóa';
    res.json({ message: `Đã ${action.toLowerCase()} user id = ${id} thành công.` });
  } catch (error) {
    console.error("Lỗi PUT /users/:id/status:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// ─────────────────────────────────────────
// Cập nhật trạng thái (Public/Hidden) Post
// ─────────────────────────────────────────
router.put("/posts/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'public' hoặc 'hidden' or 'violation'

  try {
    const [result] = await pool.query("UPDATE questions SET status = ? WHERE id = ?", [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `Không tìm thấy bài viết với id = ${id}.` });
    }

    const action = status === 'hidden' ? 'Ẩn' : 'Hiện';
    res.json({ message: `Đã ${action.toLowerCase()} bài viết id = ${id} thành công.` });
  } catch (error) {
    console.error("Lỗi PUT /posts/:id/status:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// ─────────────────────────────────────────
// DELETE Post
// ─────────────────────────────────────────
router.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM questions WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `Không tìm thấy bài viết với id = ${id}.` });
    }

    res.json({ message: `Đã xóa bài viết id = ${id} thành công.` });
  } catch (error) {
    console.error("Lỗi DELETE /posts/:id:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// ─────────────────────────────────────────
// Lấy danh sách Reports
// ─────────────────────────────────────────
router.get("/reports", async (req, res) => {
  try {
    console.log("Fetching reports list...");
    
    const query = `
      SELECT r.*, q.title as question_title, u.username as reporter_name
      FROM reports r
      LEFT JOIN questions q ON r.question_id = q.id
      LEFT JOIN users u ON r.user_id_report = u.id
      ORDER BY r.id DESC
    `;
    
    const [reports] = await pool.query(query);
    
    res.json({ reports });
  } catch (error) {
    console.error("Error in /reports:", error.message);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// ─────────────────────────────────────────
// DELETE Report & Bài vi phạm
// ─────────────────────────────────────────
router.delete("/reports/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Lấy thông tin report để biết question_id (bài viết bị report)
    const [reportRows] = await pool.query("SELECT * FROM reports WHERE id = ?", [id]);
    
    if (reportRows.length === 0) {
      return res.status(404).json({ message: `Không tìm thấy báo cáo với id = ${id}.` });
    }

    const report = reportRows[0];
    const questionId = report.question_id;

    // 2. Xóa bài viết (bài vi phạm)
    if (questionId) {
      await pool.query("DELETE FROM questions WHERE id = ?", [questionId]);
      
      // Xóa các câu trả lời liên quan (nếu cần thiết, dựa trên bảng answers)
      // await pool.query("DELETE FROM answers WHERE question_id = ?", [questionId]);
      
      // 3. Xóa tất cả report liên quan đến bài viết này
      await pool.query("DELETE FROM reports WHERE question_id = ?", [questionId]);
    } else {
      // Nếu không xác định được bài vi phạm, chỉ xóa report hiện tại
      await pool.query("DELETE FROM reports WHERE id = ?", [id]);
    }

    res.json({ message: `Đã xóa bài vi phạm và các báo cáo liên quan thành công.` });
  } catch (error) {
    console.error("Lỗi DELETE /reports/:id:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// ─────────────────────────────────────────
// API Lấy danh sách Comments
// ─────────────────────────────────────────
router.get("/comments", async (req, res) => {
  try {
    console.log("Fetching comments list...");
    // Tạm thời trả về mảng rỗng hoặc query từ bảng nếu có
    // const [comments] = await pool.query("SELECT * FROM comments");
    res.json({ comments: [] });
  } catch (error) {
    console.error("Error in /comments:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

module.exports = router;