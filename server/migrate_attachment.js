/**
 * Migration: Thêm cột đính kèm tài liệu cho câu hỏi/thông báo của Giảng viên
 * 
 * Chạy: node migrate_attachment.js
 */
require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
  console.log('🔄 Bắt đầu migration bổ sung trường đính kèm cho bài viết...\n');

  const alterations = [
    { sql: 'ALTER TABLE questions ADD COLUMN attachment_url VARCHAR(255) DEFAULT NULL', desc: 'questions.attachment_url' },
    { sql: 'ALTER TABLE questions ADD COLUMN attachment_name VARCHAR(255) DEFAULT NULL', desc: 'questions.attachment_name' }
  ];

  for (const { sql, desc } of alterations) {
    try {
      await pool.execute(sql);
      console.log(`  ✅ Đã thực thi/thêm cột: ${desc}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME' || err.message.includes('already exists')) {
        console.log(`  ⏭️  Cột ${desc} đã tồn tại, bỏ qua.`);
      } else {
        console.error(`  ❌ Lỗi khi thực thi ${desc}:`, err.message);
      }
    }
  }

  console.log('\n🎉 Migration hoàn tất!');
  process.exit(0);
}

migrate();
