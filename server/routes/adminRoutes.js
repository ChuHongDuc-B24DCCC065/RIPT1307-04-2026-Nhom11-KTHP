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
    console.log("Fetching users list...");
    
    const [users] = await pool.query("SELECT * FROM users");
    
    const formattedUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        created_at: u.created_at || u.createdAt || null,
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
    console.log("Fetching posts list...");
    
    const [posts] = await pool.query("SELECT * FROM questions");
    
    const formattedPosts = posts.map(p => ({
        id: p.id,
        title: p.title,
        author: p.author || 'Unknown',
        createdAt: p.created_at || p.createdAt || null
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

module.exports = router;