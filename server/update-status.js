require('dotenv').config();
const pool = require('./config/db');

async function run() {
  try {
    const [result] = await pool.query("UPDATE questions SET status = 'approved' WHERE status IS NULL OR status = ''");
    console.log(`Updated ${result.affectedRows} rows.`);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
