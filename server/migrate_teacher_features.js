/**
 * Migration: Thêm các cột hỗ trợ tính năng Giảng viên (Teacher Role)
 * 
 * Chạy: node migrate_teacher_features.js
 */
require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
  console.log('🔄 Bắt đầu migration tính năng Giảng viên...\n');

  const alterations = [
    // Bảng answers: xác nhận chuyên môn bởi giảng viên
    { sql: 'ALTER TABLE answers ADD COLUMN teacher_verified TINYINT(1) DEFAULT 0', desc: 'answers.teacher_verified' },
    // Bảng answers: ẩn câu trả lời sai lệch
    { sql: 'ALTER TABLE answers ADD COLUMN is_hidden TINYINT(1) DEFAULT 0', desc: 'answers.is_hidden' },
    // Bảng answers: nhận xét nhanh từ giảng viên
    { sql: 'ALTER TABLE answers ADD COLUMN teacher_note TEXT DEFAULT NULL', desc: 'answers.teacher_note' },
    // Bảng questions: đóng/khóa luồng thảo luận
    { sql: 'ALTER TABLE questions ADD COLUMN is_closed TINYINT(1) DEFAULT 0', desc: 'questions.is_closed' },
    // Bảng questions: đánh dấu bài thông báo giảng viên
    { sql: 'ALTER TABLE questions ADD COLUMN is_announcement TINYINT(1) DEFAULT 0', desc: 'questions.is_announcement' },
    // Bảng questions: thứ tự ghim bài thông báo
    { sql: 'ALTER TABLE questions ADD COLUMN pinned_order INT DEFAULT 0', desc: 'questions.pinned_order' },
  ];

  for (const { sql, desc } of alterations) {
    try {
      await pool.execute(sql);
      console.log(`  ✅ Đã thêm cột: ${desc}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log(`  ⏭️  Cột ${desc} đã tồn tại, bỏ qua.`);
      } else {
        console.error(`  ❌ Lỗi khi thêm ${desc}:`, err.message);
      }
    }
  }

  console.log('\n✅ Migration hoàn tất!');
  process.exit(0);
}

migrate();
