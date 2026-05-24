require('dotenv').config();
const pool = require('./config/db');

async function check() {
    try {
        const [usersCols] = await pool.query('SHOW COLUMNS FROM users');
        console.log('Users columns:', usersCols);
    } catch(e) {
        console.error(e);
    }
    process.exit();
}
check();
