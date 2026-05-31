require('dotenv').config();
const pool = require('./config/db');

async function check() {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        for (const row of tables) {
            const tableName = Object.values(row)[0];
            console.log(`Table: ${tableName}`);
            const [cols] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
            console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));
            console.log('---');
        }
    } catch(e) {
        console.error(e);
    }
    process.exit();
}
check();
