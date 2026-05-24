// seedAdmin.js
// Chạy: node seedAdmin.js

require('dotenv').config();
const bcrypt = require("bcrypt");
const pool = require('./config/db');

// ─── Thông tin Admin ─────────────────────────────────
const ADMIN = {
  username: "Administrator",
  email: "admin@ptit.edu.vn",
  password: "admin123456",
  role: "admin",
};

// ─── Main ─────────────────────────────────────────────
async function seedAdmin() {
  console.log("🚀 Bắt đầu seed Admin...\n");

  try {
    // 1. Kiểm tra email đã tồn tại chưa
    const [rows] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [ADMIN.email]
    );

    if (rows.length > 0) {
      console.log(`⚠️  Email "${ADMIN.email}" đã tồn tại trong database.`);
      console.log("   Không cần seed lại. Bỏ qua.\n");
      return;
    }

    // 2. Mã hóa mật khẩu bằng bcrypt (salt rounds = 10)
    console.log("🔐 Đang mã hóa mật khẩu...");
    const hashedPassword = await bcrypt.hash(ADMIN.password, 10);
    console.log("   ✅ Mã hóa thành công.\n");

    // 3. Insert admin vào bảng users
    console.log("📝 Đang tạo tài khoản Admin...");
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [ADMIN.username, ADMIN.email, hashedPassword, ADMIN.role]
    );

    // 4. Thông báo kết quả
    console.log("   ✅ Tạo Admin thành công!\n");
    
  } catch (error) {
    console.error("❌ Lỗi khi seed Admin:");
    console.error("  ", error.message);
    process.exit(1);
  } finally {
    // 5. Đóng kết nối pool dù thành công hay thất bại
    await pool.end();
    console.log("🔌 Đã đóng kết nối database.");
  }
}

seedAdmin();