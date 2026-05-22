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
    console.log("Fetching stats...");
    
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
// API Lấy danh sách Users (có phân trang)
// ─────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    console.log("Fetching users list with pagination...");
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    // Lấy tổng số lượng users
    const [countResult] = await pool.query("SELECT COUNT(*) AS total FROM users");
    const total = countResult[0].total;

    // Lấy danh sách users theo phân trang
    const [users] = await pool.query(
      `SELECT id, username, email, role, created_at, status 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT ${limit} OFFSET ${offset}`
    );
    
    console.log(`Found ${users.length} users (total: ${total})`);
    res.json({ users: users, total: total });
  } catch (error) {
    console.error("Error in /users:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// ─────────────────────────────────────────
// API Lấy danh sách Posts (có phân trang)
// ─────────────────────────────────────────
router.get("/posts", async (req, res) => {
  try {
    console.log("Fetching posts list with pagination...");
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    // Lấy tổng số lượng posts (questions)
    const [countResult] = await pool.query("SELECT COUNT(*) AS total FROM questions");
    const total = countResult[0].total;

    // Lấy danh sách posts theo phân trang
    const [posts] = await pool.query(
      `SELECT id, title, author, created_at as createdAt 
       FROM questions 
       ORDER BY created_at DESC 
       LIMIT ${limit} OFFSET ${offset}`
    );
    
    console.log(`Found ${posts.length} posts (total: ${total})`);
    res.json({ posts: posts, total: total });
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