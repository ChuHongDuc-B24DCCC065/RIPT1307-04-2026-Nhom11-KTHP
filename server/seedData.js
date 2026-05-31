require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./config/db');

const users = [
    { username: 'Lập Trình Viên JS', email: 'js_dev@gmail.com', role: 'student' },
    { username: 'React Master', email: 'react_master@ptit.edu.vn', role: 'student' },
    { username: 'Backend Guru', email: 'backend_guru@ptit.edu.vn', role: 'teacher' }
];

const dummyQuestions = [
    {
        title: 'Làm thế nào để sử dụng useEffect tối ưu trong React 18?',
        description: '<p>Chào mọi người,</p><p>Mình đang làm một dự án bằng React 18 và gặp vấn đề là component bị render lại rất nhiều lần khi sử dụng <code>useEffect</code>. Mọi người có tip nào để tối ưu hoặc có bài viết nào hay chia sẻ mình với ạ. Mình cảm ơn!</p>',
        tags: 'React,Frontend,JavaScript',
        authorIndex: 0
    },
    {
        title: 'Lỗi CORS policy khi gọi API từ React sang Express',
        description: '<p>Mình có 1 server Express chạy ở cổng 5000 và app React Vite chạy ở cổng 5173. Khi fetch API thì báo lỗi <strong>has been blocked by CORS policy</strong>. Mình đã thử dùng thư viện <code>cors</code> nhưng không được, ai giúp với!</p>',
        tags: 'Node.js,Express,CORS,Backend',
        authorIndex: 1
    },
    {
        title: 'Có nên dùng MySQL cho một ứng dụng mạng xã hội nhỏ không?',
        description: '<p>Mình chuẩn bị làm đồ án một mạng xã hội thu nhỏ (có post, like, comment, message). Mình đang phân vân giữa MongoDB và MySQL. MySQL có gặp vấn đề gì về hiệu năng khi các bảng relation quá nhiều không ạ?</p>',
        tags: 'Database,MySQL,MongoDB',
        authorIndex: 2
    },
    {
        title: 'Sự khác biệt giữa TypeScript và JavaScript là gì?',
        description: '<p>Em mới học lập trình web và thấy dạo này các cty toàn tuyển TypeScript. Mọi người cho em hỏi học TS có khó không và khác JS chỗ nào quan trọng nhất ạ?</p>',
        tags: 'TypeScript,JavaScript,Beginner',
        authorIndex: 0
    },
    {
        title: 'Cách setup JWT Authentication trong Node.js?',
        description: '<p>Mình muốn làm chức năng đăng nhập, cấp token cho user, và verify token ở các request sau. Có package nào chuẩn và dễ xài nhất hiện nay cho Express không?</p>',
        tags: 'Node.js,JWT,Security',
        authorIndex: 1
    }
];

const dummyAnswers = [
    {
        qIndex: 0,
        authorIndex: 1,
        content: '<p>Trong React 18, StrictMode sẽ mount component 2 lần trong chế độ dev. Để tối ưu <code>useEffect</code>, bạn phải đảm bảo có dependency array chính xác (ví dụ <code>[]</code> nếu chỉ chạy 1 lần) và luôn có cleanup function (return một hàm) nếu gọi API hoặc subscribe event nhé!</p>'
    },
    {
        qIndex: 1,
        authorIndex: 2,
        content: '<p>Bạn thêm đoạn này vào server Express nhé: <br><code>const cors = require("cors");<br>app.use(cors({ origin: "http://localhost:5173", credentials: true }));</code><br> Đảm bảo khai báo TRƯỚC các routes nha.</p>'
    },
    {
        qIndex: 2,
        authorIndex: 1,
        content: '<p>Hoàn toàn được nhé! Với mxh nhỏ thì MySQL vẫn cân rất tốt. Hãy chú ý đánh index cho các trường hay query (user_id, post_id). Tuy nhiên MongoDB sẽ linh hoạt hơn nếu schema của bài post thay đổi liên tục.</p>'
    },
    {
        qIndex: 3,
        authorIndex: 2,
        content: '<p>TS thực chất là JS cộng thêm Static Typing (kiểu dữ liệu tĩnh). Khó khăn lúc đầu là phải định nghĩa type cho mọi thứ, nhưng bù lại lúc code IDE sẽ gợi ý rất thông minh, bắt lỗi ngay lúc gõ code thay vì lúc chạy. Rất đáng học nhé em!</p>'
    }
];

async function seed() {
    console.log("🚀 Bắt đầu tạo dữ liệu mẫu...");
    
    try {
        const defaultPassword = await bcrypt.hash('123456', 10);
        const userIds = [];

        // 1. Tạo users
        console.log("👤 Đang tạo người dùng mẫu...");
        for (const u of users) {
            const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [u.email]);
            if (rows.length > 0) {
                userIds.push(rows[0].id);
            } else {
                const [result] = await pool.query(
                    "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                    [u.username, u.email, defaultPassword, u.role]
                );
                userIds.push(result.insertId);
            }
        }

        // 2. Tạo questions
        console.log("📝 Đang tạo câu hỏi mẫu...");
        const questionIds = [];
        for (const q of dummyQuestions) {
            const userId = userIds[q.authorIndex];
            const author = users[q.authorIndex].username;
            const [result] = await pool.query(
                "INSERT INTO questions (title, description, tags, user_id, author) VALUES (?, ?, ?, ?, ?)",
                [q.title, q.description, q.tags, userId, author]
            );
            questionIds.push(result.insertId);
        }

        // 3. Tạo answers
        console.log("💬 Đang tạo câu trả lời mẫu...");
        for (const a of dummyAnswers) {
            const qId = questionIds[a.qIndex];
            const userId = userIds[a.authorIndex];
            await pool.query(
                "INSERT INTO answers (content, question_id, user_id) VALUES (?, ?, ?)",
                [a.content, qId, userId]
            );
        }

        console.log("✅ Tạo dữ liệu mẫu THÀNH CÔNG!");
    } catch (err) {
        console.error("❌ Lỗi:", err.message);
    } finally {
        await pool.end();
        console.log("🔌 Đã đóng kết nối database.");
    }
}

seed();
