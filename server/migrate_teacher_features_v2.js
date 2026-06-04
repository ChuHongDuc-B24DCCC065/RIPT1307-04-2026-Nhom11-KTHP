/**
 * Migration: Thêm các cột nâng cao cho vai trò Giảng viên (v2)
 * 
 * Chạy: node migrate_teacher_features_v2.js
 */
require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
  console.log('🔄 Bắt đầu migration nâng cao cho tính năng Giảng viên...\n');

  // Danh sách các cột/chỉ mục mới cần bổ sung
  const alterations = [
    // 1. Bổ sung các cột giảng viên vào bảng user_profile
    { sql: 'ALTER TABLE user_profile ADD COLUMN academic_title VARCHAR(100) DEFAULT NULL', desc: 'user_profile.academic_title' },
    { sql: 'ALTER TABLE user_profile ADD COLUMN department VARCHAR(100) DEFAULT NULL', desc: 'user_profile.department' },
    { sql: 'ALTER TABLE user_profile ADD COLUMN major VARCHAR(100) DEFAULT NULL', desc: 'user_profile.major' },
    { sql: 'ALTER TABLE user_profile ADD COLUMN teacher_code VARCHAR(50) DEFAULT NULL', desc: 'user_profile.teacher_code' },
    { sql: 'ALTER TABLE user_profile ADD COLUMN is_available TINYINT(1) DEFAULT 0', desc: 'user_profile.is_available' },
    { sql: 'ALTER TABLE user_profile ADD COLUMN office_hours VARCHAR(255) DEFAULT NULL', desc: 'user_profile.office_hours' },

    // 2. Bổ sung cột ghi nhận giảng viên nào đã verify câu trả lời
    { sql: 'ALTER TABLE answers ADD COLUMN verified_by_user_id INT DEFAULT NULL', desc: 'answers.verified_by_user_id' },
    
    // 3. Khóa ngoại liên kết verified_by_user_id tới bảng users
    { sql: 'ALTER TABLE answers ADD CONSTRAINT fk_answers_verified_by FOREIGN KEY (verified_by_user_id) REFERENCES users(id) ON DELETE SET NULL', desc: 'answers.fk_answers_verified_by (foreign key)' },

    // 4. Bổ sung phân loại bài đăng, hạn chót và trạng thái ẩn tạm thời vào bảng questions
    { sql: "ALTER TABLE questions ADD COLUMN post_type VARCHAR(50) DEFAULT 'question'", desc: 'questions.post_type' },
    { sql: 'ALTER TABLE questions ADD COLUMN deadline TIMESTAMP DEFAULT NULL', desc: 'questions.deadline' },
    { sql: 'ALTER TABLE questions ADD COLUMN is_temp_hidden TINYINT(1) DEFAULT 0', desc: 'questions.is_temp_hidden' },

    // 5. Bổ sung độ ưu tiên xử lý vào bảng reports
    { sql: "ALTER TABLE reports ADD COLUMN priority VARCHAR(20) DEFAULT 'normal'", desc: 'reports.priority' }
  ];

  for (const { sql, desc } of alterations) {
    try {
      await pool.execute(sql);
      console.log(`  ✅ Đã thực thi/thêm cột: ${desc}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_FK_DUP_NAME' || err.message.includes('Multiple primary key defined') || err.message.includes('already exists')) {
        console.log(`  ⏭️  Cột/khoá ngoại ${desc} đã tồn tại, bỏ qua.`);
      } else {
        console.error(`  ❌ Lỗi khi thực thi ${desc}:`, err.message);
      }
    }
  }

  console.log('\n🎉 Migration v2 hoàn tất!');
  process.exit(0);
}

migrate();
