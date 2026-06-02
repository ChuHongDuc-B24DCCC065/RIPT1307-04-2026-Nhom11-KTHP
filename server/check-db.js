require('dotenv').config();
const pool = require('./config/db');

async function run() {
  try {
    const [rows] = await pool.query("SELECT id, title, status FROM questions ORDER BY id DESC LIMIT 5");
    console.log(rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
