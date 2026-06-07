const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// ✅ SỬA ĐƯỜNG DẪN - Quay lên 2 cấp để vào config/db.js
const pool = require("../config/db");

// Hoặc nếu config/db.js nằm cùng cấp với index.js thì dùng:
// const pool = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_12345!';

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
    const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users");
    const [[{ totalQuestions }]] = await pool.query("SELECT COUNT(*) AS totalQuestions FROM questions");
    const [[{ totalComments }]] = await pool.query("SELECT (SELECT COUNT(*) FROM answers) + (SELECT COUNT(*) FROM comments) AS totalComments");
    const [[{ totalVotes }]] = await pool.query("SELECT (SELECT COUNT(*) FROM question_votes) + (SELECT COUNT(*) FROM answer_votes) AS totalVotes");

    // Lấy số lượng báo cáo chưa xử lý (pending reports)
    const [[{ pendingReportsCount }]] = await pool.query("SELECT COUNT(*) AS pendingReportsCount FROM reports WHERE trang_thai = 'pending' OR trang_thai IS NULL");

    // Lấy 5 bài viết mới nhất
    const [latestPostsRows] = await pool.query(`
      SELECT id, title, author, status, created_at
      FROM questions
      ORDER BY created_at DESC
      LIMIT 5
    `);
    const latestPosts = latestPostsRows.map(p => {
      let statusLabel = 'Nháp';
      if (p.status === 'approved' || p.status === 'public') {
        statusLabel = 'Công khai';
      } else if (p.status === 'hidden') {
        statusLabel = 'Bị ẩn';
      }
      return {
        key: p.id.toString(),
        title: p.title,
        author: p.author || 'Ẩn danh',
        status: statusLabel,
        date: p.created_at ? new Date(p.created_at).toLocaleDateString('vi-VN') : 'Vừa xong'
      };
    });

    // Lấy phân bố các thẻ (tags)
    const [tagDistributionRows] = await pool.query(`
      SELECT t.name, COUNT(q.id) AS count
      FROM tags t
      LEFT JOIN questions q ON FIND_IN_SET(t.name, q.tags) > 0 OR q.tags LIKE CONCAT('%', t.name, '%')
      GROUP BY t.id
      ORDER BY count DESC
      LIMIT 5
    `);
    const totalTagUsage = tagDistributionRows.reduce((acc, row) => acc + row.count, 0) || 1;
    const tagDistribution = tagDistributionRows.map(row => ({
      name: row.name,
      count: row.count,
      value: Math.round((row.count / totalTagUsage) * 1000) / 10
    }));

    // Lấy danh sách báo cáo chưa xử lý (reports)
    const [pendingReportsRows] = await pool.query(`
      SELECT r.id, u.username AS reportedUser, q.title AS content, r.ly_do AS reason
      FROM reports r
      LEFT JOIN questions q ON r.question_id = q.id
      LEFT JOIN users u ON q.user_id = u.id
      WHERE r.trang_thai = 'pending' OR r.trang_thai IS NULL
      ORDER BY r.created_at DESC
      LIMIT 5
    `);
    const pendingReports = pendingReportsRows.map(r => ({
      key: r.id.toString(),
      reportedUser: r.reportedUser || 'Ẩn danh',
      content: r.content || 'Nội dung không khả dụng',
      reason: r.reason || 'Báo cáo vi phạm',
      reportCount: 1
    }));

    // Dữ liệu tăng trưởng giả lập 7 ngày
    const growthData = [
      { date: '01/06', newUsers: 12, newPosts: 5 },
      { date: '02/06', newUsers: 15, newPosts: 6 },
      { date: '03/06', newUsers: 11, newPosts: 3 },
      { date: '04/06', newUsers: 18, newPosts: 8 },
      { date: '05/06', newUsers: 21, newPosts: 9 },
      { date: '06/06', newUsers: 16, newPosts: 5 },
      { date: '07/06', newUsers: 24, newPosts: 11 },
    ];

    res.json({
      totalUsers,
      totalPosts: totalQuestions,
      totalComments,
      totalVotes,
      pendingReportsCount,
      latestPosts,
      tagDistribution: tagDistribution.length > 0 ? tagDistribution : [
        { name: 'React', value: 40, count: 4 },
        { name: 'Node.js', value: 30, count: 3 },
        { name: 'MySQL', value: 20, count: 2 },
        { name: 'Vite', value: 10, count: 1 }
      ],
      pendingReports,
      growthData,
      usersGrowth: 5.2,
      postsGrowth: 3.1,
      commentsGrowth: 12.5,
      votesGrowth: 8.4,
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
      status: p.status || 'approved'
    }));

    console.log(`Found ${formattedPosts.length} posts`);
    res.json({ posts: formattedPosts });
  } catch (error) {
    console.error("Error in /posts:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// ─────────────────────────────────────────
// Cập nhật trạng thái (Duyệt/Ẩn) Post
// ─────────────────────────────────────────
router.put("/posts/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved', 'pending', 'hidden', 'rejected'

  try {
    const [result] = await pool.query("UPDATE questions SET status = ? WHERE id = ?", [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `Không tìm thấy bài viết với id = ${id}.` });
    }

    res.json({ message: `Đã cập nhật trạng thái bài viết thành ${status}.` });
  } catch (error) {
    console.error("Lỗi PUT /posts/:id/status:", error);
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

// ─────────────────────────────────────────
// API Tags Management
// ─────────────────────────────────────────
router.get("/tags", async (req, res) => {
  try {
    const [tags] = await pool.query("SELECT * FROM tags ORDER BY id DESC");
    res.json({ tags });
  } catch (error) {
    console.error("Error GET /tags:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

router.post("/tags", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Tên thẻ không được bỏ trống" });
    const [result] = await pool.query("INSERT INTO tags (name, description) VALUES (?, ?)", [name, description || '']);
    res.json({ message: "Thêm thẻ thành công", id: result.insertId });
  } catch (error) {
    console.error("Error POST /tags:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

router.put("/tags/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Tên thẻ không được bỏ trống" });
    await pool.query("UPDATE tags SET name = ?, description = ? WHERE id = ?", [name, description || '', id]);
    res.json({ message: "Cập nhật thẻ thành công" });
  } catch (error) {
    console.error("Error PUT /tags:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

router.delete("/tags/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM tags WHERE id = ?", [id]);
    res.json({ message: "Xóa thẻ thành công" });
  } catch (error) {
    console.error("Error DELETE /tags:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

module.exports = router;