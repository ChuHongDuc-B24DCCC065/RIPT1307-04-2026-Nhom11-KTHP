const pool = require('../config/db');

const createNotification = async (user_id_nhan, content, link) => {
    if (!user_id_nhan) return;
    try {
        await pool.execute(
            'INSERT INTO notifications (user_id_nhan, content, link) VALUES (?, ?, ?)',
            [user_id_nhan, content, link || null]
        );
    } catch (err) {
        console.error("Error creating notification:", err.message);
    }
};

module.exports = { createNotification };
