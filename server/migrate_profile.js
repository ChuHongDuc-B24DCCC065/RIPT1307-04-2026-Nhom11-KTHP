require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
  try {
    // 1. Create follows table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS follows (
        follower_id INT NOT NULL,
        following_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_id, following_id),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ follows table created');

    // 2. Check and add avatar column
    const [cols] = await pool.query('DESCRIBE user_profile');
    
    const hasAvatar = cols.some(c => c.Field === 'avatar');
    if (!hasAvatar) {
      await pool.query('ALTER TABLE user_profile ADD COLUMN avatar VARCHAR(255) DEFAULT NULL');
      console.log('✅ avatar column added');
    } else {
      console.log('ℹ️ avatar column already exists');
    }

    // 3. Check and add class_name column
    const hasClassName = cols.some(c => c.Field === 'class_name');
    if (!hasClassName) {
      await pool.query('ALTER TABLE user_profile ADD COLUMN class_name VARCHAR(100) DEFAULT NULL');
      console.log('✅ class_name column added');
    } else {
      console.log('ℹ️ class_name column already exists');
    }

    console.log('\\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration error:', e.message);
    process.exit(1);
  }
}

migrate();
