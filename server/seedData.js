require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./config/db');

const users = [
    { username: 'Lập Trình Viên JS', email: 'js_dev@gmail.com', role: 'student', interests: 'react,javascript,typescript' },
    { username: 'React Master', email: 'react_master@ptit.edu.vn', role: 'student', interests: 'react,tailwind,next.js' },
    { username: 'Backend Guru', email: 'backend_guru@ptit.edu.vn', role: 'teacher', interests: 'node.js,express,mysql,database' }
];

const dummyQuestions = [
    {
        title: 'Làm thế nào để sử dụng useEffect tối ưu trong React 18?',
        description: '<p>Chào mọi người,</p><p>Mình đang làm một dự án bằng React 18 và gặp vấn đề là component bị render lại rất nhiều lần khi sử dụng <code>useEffect</code>. Mọi người có tip nào để tối ưu hoặc có bài viết nào hay chia sẻ mình với ạ. Mình cảm ơn!</p>',
        tags: 'react,frontend,javascript',
        authorIndex: 0,
        views: 540,
        votes: 15
    },
    {
        title: 'Lỗi CORS policy khi gọi API từ React sang Express',
        description: '<p>Mình có 1 server Express chạy ở cổng 5000 và app React Vite chạy ở cổng 5173. Khi fetch API thì báo lỗi <strong>has been blocked by CORS policy</strong>. Mình đã thử dùng thư viện <code>cors</code> nhưng không được, ai giúp với!</p>',
        tags: 'node.js,express,cors,backend',
        authorIndex: 1,
        views: 120,
        votes: 8
    },
    {
        title: 'Có nên dùng MySQL cho một ứng dụng mạng xã hội nhỏ không?',
        description: '<p>Mình chuẩn bị làm đồ án một mạng xã hội thu nhỏ (có post, like, comment, message). Mình đang phân vân giữa MongoDB và MySQL. MySQL có gặp vấn đề gì về hiệu năng khi các bảng relation quá nhiều không ạ?</p>',
        tags: 'database,mysql,mongodb',
        authorIndex: 2,
        views: 980,
        votes: 24
    },
    {
        title: 'Sự khác biệt giữa TypeScript và JavaScript là gì?',
        description: '<p>Em mới học lập trình web và thấy dạo này các cty toàn tuyển TypeScript. Mọi người cho em hỏi học TS có khó không và khác JS chỗ nào quan trọng nhất ạ?</p>',
        tags: 'typescript,javascript,beginner',
        authorIndex: 0,
        views: 45,
        votes: 3
    },
    {
        title: 'Cách setup JWT Authentication trong Node.js?',
        description: '<p>Mình muốn làm chức năng đăng nhập, cấp token cho user, và verify token ở các request sau. Có package nào chuẩn và dễ xài nhất hiện nay cho Express không?</p>',
        tags: 'node.js,jwt,security',
        authorIndex: 1,
        views: 502,
        votes: 11
    }
];

const dummyAnswers = [
    {
        qIndex: 0,
        authorIndex: 1,
        content: '<p>Trong React 18, StrictMode sẽ mount component 2 lần trong chế độ dev. Để tối ưu <code>useEffect</code>, bạn phải đảm bảo có dependency array chính xác (ví dụ <code>[]</code> nếu chỉ chạy 1 lần) và luôn có cleanup function (return một hàm) nếu gọi API hoặc subscribe event nhé!</p>',
        votes: 10,
        teacherVerified: 1,
        verifiedByTeacherIndex: 2
    },
    {
        qIndex: 1,
        authorIndex: 2,
        content: '<p>Bạn thêm đoạn này vào server Express nhé: <br><code>const cors = require("cors");<br>app.use(cors({ origin: "http://localhost:5173", credentials: true }));</code><br> Đảm bảo khai báo TRƯỚC các routes nha.</p>',
        votes: 6,
        teacherVerified: 1,
        verifiedByTeacherIndex: 2
    },
    {
        qIndex: 2,
        authorIndex: 1,
        content: '<p>Hoàn toàn được nhé! Với mxh nhỏ thì MySQL vẫn cân rất tốt. Hãy chú ý đánh index cho các trường hay query (user_id, post_id). Tuy nhiên MongoDB sẽ linh hoạt hơn nếu schema của bài post thay đổi liên tục.</p>',
        votes: 18,
        teacherVerified: 0,
        verifiedByTeacherIndex: null
    },
    {
        qIndex: 3,
        authorIndex: 2,
        content: '<p>TS thực chất là JS cộng thêm Static Typing (kiểu dữ liệu tĩnh). Khó khăn lúc đầu là phải định nghĩa type cho mọi thứ, nhưng bù lại lúc code IDE sẽ gợi ý rất thông minh, bắt lỗi ngay lúc gõ code thay vì lúc chạy. Rất đáng học nhé em!</p>',
        votes: 5,
        teacherVerified: 1,
        verifiedByTeacherIndex: 2
    }
];

async function seed() {
    console.log("🧹 Đang dọn dẹp dữ liệu cũ...");
    
    try {
        await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
        await pool.query("TRUNCATE TABLE answer_votes;");
        await pool.query("TRUNCATE TABLE question_votes;");
        await pool.query("TRUNCATE TABLE bookmarks;");
        await pool.query("TRUNCATE TABLE comments;");
        await pool.query("TRUNCATE TABLE answers;");
        await pool.query("TRUNCATE TABLE questions;");
        await pool.query("TRUNCATE TABLE user_profile;");
        await pool.query("TRUNCATE TABLE users;");
        await pool.query("SET FOREIGN_KEY_CHECKS = 1;");
        console.log("✨ Đã dọn dẹp sạch sẽ database.");

        const defaultPassword = await bcrypt.hash('123456', 10);
        const userIds = [];

        // 1. Tạo users và user_profile
        console.log("👤 Đang tạo người dùng và hồ sơ cá nhân mẫu...");
        for (const u of users) {
            const [result] = await pool.query(
                "INSERT INTO users (username, email, password, role, reputation) VALUES (?, ?, ?, ?, ?)",
                [u.username, u.email, defaultPassword, u.role, u.role === 'teacher' ? 500 : 100]
            );
            const userId = result.insertId;
            userIds.push(userId);

            // Tạo profile tương ứng kèm cột interests
            await pool.query(
                `INSERT INTO user_profile (user_id, full_name, bio, interests, avatar) 
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, u.username, `Chào mọi người, tôi là ${u.username}.`, u.interests, '']
            );
        }

        // 2. Tạo questions
        console.log("📝 Đang tạo câu hỏi mẫu...");
        const questionIds = [];
        for (const q of dummyQuestions) {
            const userId = userIds[q.authorIndex];
            const author = users[q.authorIndex].username;
            const [result] = await pool.query(
                "INSERT INTO questions (title, description, tags, user_id, author, views, votes, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')",
                [q.title, q.description, q.tags, userId, author, q.views, q.votes]
            );
            questionIds.push(result.insertId);
        }

        // 3. Tạo answers
        console.log("💬 Đang tạo câu trả lời mẫu...");
        for (const a of dummyAnswers) {
            const qId = questionIds[a.qIndex];
            const userId = userIds[a.authorIndex];
            const verifiedByUserId = a.verifiedByTeacherIndex !== null ? userIds[a.verifiedByTeacherIndex] : null;
            await pool.query(
                "INSERT INTO answers (content, question_id, user_id, votes, teacher_verified, verified_by_user_id) VALUES (?, ?, ?, ?, ?, ?)",
                [a.content, qId, userId, a.votes, a.teacherVerified, verifiedByUserId]
            );
        }

        // 4. Tạo question_votes mẫu
        console.log("👍 Đang tạo phiếu bầu câu hỏi...");
        for (let i = 0; i < questionIds.length; i++) {
            const qId = questionIds[i];
            const q = dummyQuestions[i];
            const votesCount = q.votes || 0;
            // Vote up
            for (let v = 0; v < Math.min(votesCount, userIds.length); v++) {
                await pool.query(
                    "INSERT INTO question_votes (user_id, question_id, vote_type) VALUES (?, ?, 1)",
                    [userIds[v], qId]
                );
            }
        }

        console.log("🎉 Tạo dữ liệu mẫu THÀNH CÔNG!");
        console.log("\n🔑 THÔNG TIN TÀI KHOẢN MẪU ĐỂ TEST:");
        console.log("1. Sinh viên 1: js_dev@gmail.com / 123456 (Sở thích: react, javascript, typescript)");
        console.log("2. Sinh viên 2: react_master@ptit.edu.vn / 123456 (Sở thích: react, tailwind, next.js)");
        console.log("3. Giảng viên: backend_guru@ptit.edu.vn / 123456 (Sở thích: node.js, express, mysql, database)");

    } catch (err) {
        console.error("❌ Lỗi trong quá trình seed:", err.message);
    } finally {
        await pool.end();
        console.log("🔌 Đã đóng kết nối database.");
    }
}

seed();
