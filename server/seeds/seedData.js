const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// Đọc dữ liệu từ file JSON tĩnh
const usersData = require('../data/users.json');
const questionsData = require('../data/questions.json');
const answersData = require('../data/answers.json');

// Danh sách User mới tự động sinh thêm (STUDENT và TEACHER)
const newGeneratedUsers = [
  { username: 'nguyen_van_a', email: 'vanga@ptit.edu.vn', role: 'student', interests: 'react,javascript,typescript', fullName: 'Nguyễn Văn A', bio: 'Sinh viên CNTT yêu thích React.' },
  { username: 'tran_thi_b', email: 'thib@ptit.edu.vn', role: 'student', interests: 'typescript,vite,webpack', fullName: 'Trần Thị B', bio: 'Sinh viên chuyên ngành An toàn thông tin.' },
  { username: 'pham_van_c', email: 'vanc@ptit.edu.vn', role: 'student', interests: 'antd,css,frontend', fullName: 'Phạm Văn C', bio: 'Designer lấn sân sang lập trình frontend.' },
  { username: 'teacher_dung', email: 'dungnt@ptit.edu.vn', role: 'teacher', interests: 'node.js,database,mysql', fullName: 'Thầy Nguyễn Tiến Dũng', bio: 'Giảng viên khoa Công nghệ thông tin 1.' },
  { username: 'teacher_hang', email: 'hangtt@ptit.edu.vn', role: 'teacher', interests: 'typescript,react,next.js', fullName: 'Cô Trịnh Thanh Hằng', bio: 'Giảng viên chuyên ngành Công nghệ Phần mềm.' },
  { username: 'le_van_d', email: 'vand@ptit.edu.vn', role: 'student', interests: 'next.js,react,tailwind', fullName: 'Lê Văn D', bio: 'Sinh viên đam mê nghiên cứu khoa học.' },
  { username: 'hoang_thi_e', email: 'thie@ptit.edu.vn', role: 'student', interests: 'node.js,express,mongodb', fullName: 'Hoàng Thị E', bio: 'Backend developer tương lai.' }
];

// Mẫu câu hỏi công nghệ dùng để sinh ngẫu nhiên
const questionTemplates = [
  {
    title: 'Làm thế nào để sử dụng React 19 Ref với Server Actions?',
    description: '<p>Xin chào mọi người, mình đang tìm hiểu React 19 Server Actions và muốn kết hợp với React Ref để focus vào ô input sau khi submit form thành công. Ai có ví dụ thực tế không ạ?</p>',
    tags: 'react,frontend,javascript'
  },
  {
    title: 'Tại sao build dự án Vite với TypeScript lại báo lỗi Module Resolution?',
    description: '<p>Dự án của em chạy dev bình thường bằng Vite nhưng khi chạy lệnh <code>npm run build</code> thì compiler TypeScript báo lỗi không tìm thấy các module import tương đối. Cần cấu hình lại file tsconfig.json thế nào ạ?</p>',
    tags: 'typescript,vite,frontend'
  },
  {
    title: 'Ant Design v6: Hướng dẫn cấu hình CSS-in-JS Custom Theme',
    description: '<p>Chào mọi người, Antd v6 sử dụng cơ chế styling mới tối ưu hơn. Mình muốn đổi màu primary thành màu cam đất và tùy chỉnh font-family của toàn bộ Button, Select. Có ai có file config mẫu không?</p>',
    tags: 'antd,css,frontend'
  },
  {
    title: 'So sánh hiệu năng render List lớn giữa Antd Table và Virtual List',
    description: '<p>Em đang phải hiển thị bảng dữ liệu khoảng 10,000 dòng. Khi dùng Table mặc định của Antd thì trang bị giật lag nghiêm trọng khi cuộn. Có giải pháp nào xử lý lag bằng virtual list tốt không?</p>',
    tags: 'antd,react,web-performance'
  },
  {
    title: 'Lỗi Hydration Mismatch khi dùng Date trong Next.js 15?',
    description: '<p>Chào các bác, em hiển thị thời gian hiện tại <code>new Date().toLocaleDateString()</code> trên giao diện SSR của Next.js và liên tục gặp lỗi Hydration mismatch. Làm sao để giải quyết triệt để lỗi này?</p>',
    tags: 'react,next.js,frontend'
  },
  {
    title: 'Cách chia sẻ State giữa các tabs trình duyệt khác nhau bằng React?',
    description: '<p>Mình muốn đồng bộ trạng thái giỏ hàng giữa các tab trình duyệt đang mở cùng một website mà không cần liên tục gửi request lên server. Nên sử dụng BroadcastChannel API hay LocalStorage event?</p>',
    tags: 'javascript,react,frontend'
  },
  {
    title: 'TypeScript: Khi nào nên sử dụng Type và khi nào nên dùng Interface?',
    description: '<p>Em thấy cả hai cách đều dùng để định nghĩa kiểu dữ liệu cho object. Điểm khác biệt cốt lõi về hiệu năng và khả năng mở rộng (extends/merge) của chúng là gì?</p>',
    tags: 'typescript,javascript,beginner'
  },
  {
    title: 'Làm sao để triển khai WebSocket Server chịu tải cao bằng Node.js?',
    description: '<p>Hệ thống của em cần hỗ trợ khoảng 50,000 kết nối WebSocket đồng thời phục vụ tính năng chat trực tuyến. Em nên cấu hình Cluster mode hay sử dụng Redis adapter thế nào?</p>',
    tags: 'node.js,websocket,backend'
  },
  {
    title: 'Lỗi bảo mật CORS khi tích hợp API Express với ứng dụng di động React Native?',
    description: '<p>Server Express của mình đã cấu hình CORS cho phép origin là domain web, nhưng khi React Native app gọi API thì gặp lỗi kết nối. Có cần thiết lập CORS khác biệt cho mobile app không?</p>',
    tags: 'express,cors,security,backend'
  },
  {
    title: 'Làm thế nào để viết Custom Middleware log request trong Express?',
    description: '<p>Em muốn ghi nhận thời gian thực hiện của từng request API, lưu thông tin method, path và status code vào file log. Nhờ mọi người hướng dẫn cách viết và cấu hình middleware này.</p>',
    tags: 'node.js,express,backend'
  },
  {
    title: 'Cách tối ưu kích thước bundle size khi import Icons từ Ant Design?',
    description: '<p>Dự án của em bị phình to dung lượng bundle sau khi import một vài icon từ thư viện <code>@ant-design/icons</code>. Có cách nào để webpack tự động tree-shake các icon không dùng tới không?</p>',
    tags: 'antd,vite,web-performance'
  },
  {
    title: 'Làm thế nào để sử dụng React 19 useActionState thay cho useState?',
    description: '<p>Chào các bạn, mình thấy React 19 ra mắt hook <code>useActionState</code> giúp xử lý trạng thái form submit rất ngắn gọn. Ai có ví dụ chi tiết về cách quản lý error và pending state bằng hook này không?</p>',
    tags: 'react,frontend,javascript'
  }
];

// Các mẫu câu trả lời (Answers) dùng để sinh tự động
const answerTemplates = [
  '<p>Bạn có thể sử dụng hook <code>useEffect</code> kết hợp với <code>useRef</code> để lưu trạng thái trước đó. Ngoài ra, hãy sử dụng <code>React.memo</code> hoặc <code>useMemo</code> để chặn re-render không đáng có cho component con.</p>',
  '<p>Lỗi này thường xảy ra do cấu hình trong <code>tsconfig.json</code>. Hãy kiểm tra trường <code>compilerOptions.moduleResolution</code> và đặt nó thành <code>"bundler"</code> hoặc <code>"node"</code> nhé.</p>',
  '<p>Với Ant Design v6, bạn chỉ cần dùng component <code>&lt;ConfigProvider theme={{ token: { colorPrimary: "#d97706" } }}&gt;</code> bọc ngoài App là xong, siêu tiện luôn!</p>',
  '<p>Bạn nên chuyển sang dùng <code>@tanstack/react-virtual</code> hoặc thư viện virtualized table của Ant Design. Nó chỉ render các dòng hiển thị trên màn hình nên hiệu năng cực kỳ tốt.</p>',
  '<p>Hãy bọc đoạn Date đó trong một state và chỉ hiển thị nó sau khi component đã mounted: <code>const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), []);</code>. Lúc này SSR và CSR sẽ đồng nhất.</p>',
  '<p>Dùng <code>BroadcastChannel</code> là chuẩn nhất nhé bạn. Cách này truyền tin thời gian thực giữa các tab rất mượt mà và không bị delay như LocalStorage event.</p>',
  '<p>Interface có thể merge-declaration (tự gộp khi khai báo trùng tên) còn Type thì không. Thường interface dùng cho Object/Class, còn Type dùng cho Union types hoặc Alias phức tạp.</p>',
  '<p>Nên sử dụng thư viện <code>ws</code> kết hợp với uWebSockets.js cho hiệu năng thô tốt nhất, sau đó dùng Redis pub/sub để kết nối các node lại với nhau.</p>'
];

// Các mẫu bình luận (Comments) dùng để sinh tự động
const commentTemplates = [
  'Bài viết rất hữu ích, cảm ơn câu trả lời của bạn!',
  'Cách này có vẻ tối ưu hơn dùng LocalStorage, mình sẽ thử áp dụng.',
  'Cho mình hỏi nếu dùng cách này thì có hỗ trợ trình duyệt cũ không?',
  'Giải pháp tuyệt vời! Đã test chạy rất mượt.',
  'Cảm ơn bạn nhiều, mình đã fix được lỗi này rồi.',
  'Mình cũng gặp lỗi tương tự và áp dụng theo đã giải quyết được.'
];

async function seed() {
  console.log("🔄 Bắt đầu nạp bổ sung (Append) dữ liệu mẫu và tự động sinh dữ liệu mới...");
  
  let usersInsertedCount = 0;
  let questionsInsertedCount = 0;
  let answersInsertedCount = 0;
  let commentsInsertedCount = 0;

  try {
    const defaultPassword = await bcrypt.hash('123456', 10);
    const userEmailToId = {};
    const userEmailToUsername = {};
    const userEmailToRole = {};

    // ────────────────────────────────────────────────────────────────
    // PHẦN 1: IMPORT DATA TỪ FILE JSON TĨNH (NHƯ LOGIC CŨ)
    // ────────────────────────────────────────────────────────────────
    console.log("\n👤 1. Đang xử lý danh sách người dùng từ JSON...");
    for (const u of usersData) {
      try {
        const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [u.email]);
        let userId;

        if (existingUsers.length > 0) {
          userId = existingUsers[0].id;
          // Cập nhật thông tin profile
          await pool.query(
            `UPDATE user_profile SET interests = ?, full_name = ?, bio = ? WHERE user_id = ?`,
            [u.interests || null, u.fullName || u.username, u.bio || '', userId]
          );
        } else {
          const [result] = await pool.query(
            "INSERT INTO users (username, email, password, role, reputation) VALUES (?, ?, ?, ?, ?)",
            [u.username, u.email, defaultPassword, u.role, u.reputation || 100]
          );
          userId = result.insertId;
          usersInsertedCount++;

          await pool.query(
            `INSERT INTO user_profile (user_id, full_name, bio, interests, avatar) VALUES (?, ?, ?, ?, ?)`,
            [userId, u.fullName || u.username, u.bio || '', u.interests || null, '']
          );
        }
        userEmailToId[u.email] = userId;
        userEmailToUsername[u.email] = u.username;
        userEmailToRole[u.email] = u.role;
      } catch (err) {
        console.error(`❌ Lỗi xử lý user ${u.email}:`, err.message);
      }
    }

    // ────────────────────────────────────────────────────────────────
    // PHẦN 2: TỰ ĐỘNG SINH DANH SÁCH USER MỚI (STUDENT / TEACHER)
    // ────────────────────────────────────────────────────────────────
    console.log("\n👤 2. Đang tự động sinh thêm người dùng mới...");
    for (const u of newGeneratedUsers) {
      try {
        const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [u.email]);
        let userId;

        if (existingUsers.length > 0) {
          userId = existingUsers[0].id;
          await pool.query(
            `UPDATE user_profile SET interests = ?, full_name = ?, bio = ? WHERE user_id = ?`,
            [u.interests || null, u.fullName || u.username, u.bio || '', userId]
          );
        } else {
          const [result] = await pool.query(
            "INSERT INTO users (username, email, password, role, reputation) VALUES (?, ?, ?, ?, ?)",
            [u.username, u.email, defaultPassword, u.role, u.role === 'teacher' ? 500 : 100]
          );
          userId = result.insertId;
          usersInsertedCount++;
          console.log(`  + Đã tự sinh user mới: ${u.username} (${u.email})`);

          await pool.query(
            `INSERT INTO user_profile (user_id, full_name, bio, interests, avatar) VALUES (?, ?, ?, ?, ?)`,
            [userId, u.fullName || u.username, u.bio || '', u.interests || null, '']
          );
        }
        userEmailToId[u.email] = userId;
        userEmailToUsername[u.email] = u.username;
        userEmailToRole[u.email] = u.role;
      } catch (err) {
        console.error(`❌ Lỗi tự sinh user ${u.email}:`, err.message);
      }
    }

    // Gom toàn bộ User ID đang có trong hệ thống để làm tác giả ngẫu nhiên
    const allUserIds = Object.values(userEmailToId);
    const allUserEmails = Object.keys(userEmailToId);
    const teacherUserIds = allUserEmails
      .filter(email => userEmailToRole[email] === 'teacher')
      .map(email => userEmailToId[email]);

    // ────────────────────────────────────────────────────────────────
    // PHẦN 3: IMPORT CÂU HỎI TỪ FILE JSON TĨNH
    // ────────────────────────────────────────────────────────────────
    console.log("\n📝 3. Đang xử lý danh sách câu hỏi từ JSON...");
    const questionTitleToId = {};

    for (const q of questionsData) {
      try {
        const [existingQuestions] = await pool.query("SELECT id FROM questions WHERE title = ?", [q.title]);
        let questionId;

        if (existingQuestions.length > 0) {
          questionId = existingQuestions[0].id;
        } else {
          const userId = userEmailToId[q.authorEmail];
          const author = userEmailToUsername[q.authorEmail] || 'Ẩn danh';

          if (!userId) continue;

          const [result] = await pool.query(
            "INSERT INTO questions (title, description, tags, user_id, author, views, votes, status, post_type) VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?)",
            [q.title, q.description, q.tags, userId, author, q.views || 0, q.votes || 0, q.post_type || 'question']
          );
          questionId = result.insertId;
          questionsInsertedCount++;
        }
        questionTitleToId[q.title] = questionId;
      } catch (err) {
        console.error(`❌ Lỗi xử lý câu hỏi tĩnh "${q.title}":`, err.message);
      }
    }

    // ────────────────────────────────────────────────────────────────
    // PHẦN 4: TỰ ĐỘNG SINH CÂU HỎI NGẪU NHIÊN XOAY QUANH CHỦ ĐỀ CÔNG NGHỆ
    // ────────────────────────────────────────────────────────────────
    console.log("\n📝 4. Đang tự động sinh thêm các câu hỏi ngẫu nhiên...");
    const newQuestionIds = [];

    for (const template of questionTemplates) {
      try {
        // Kiểm tra tránh trùng lặp tiêu đề câu hỏi
        const [existingQuestions] = await pool.query("SELECT id FROM questions WHERE title = ?", [template.title]);
        let questionId;

        if (existingQuestions.length > 0) {
          questionId = existingQuestions[0].id;
        } else {
          // Gán ngẫu nhiên một tác giả từ danh sách User ID
          const randomAuthorEmail = allUserEmails[Math.floor(Math.random() * allUserEmails.length)];
          const userId = userEmailToId[randomAuthorEmail];
          const authorName = userEmailToUsername[randomAuthorEmail];

          const randomViews = Math.floor(Math.random() * 451) + 50; // Lượt xem từ 50 đến 500
          const randomVotes = Math.floor(Math.random() * 31);       // Vote từ 0 đến 30

          const [result] = await pool.query(
            "INSERT INTO questions (title, description, tags, user_id, author, views, votes, status, post_type) VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 'question')",
            [template.title, template.description, template.tags, userId, authorName, randomViews, randomVotes]
          );
          questionId = result.insertId;
          questionsInsertedCount++;
          console.log(`  + Tự sinh câu hỏi mới: "${template.title}" (Tác giả: ${authorName}, Views: ${randomViews})`);
        }
        newQuestionIds.push(questionId);
      } catch (err) {
        console.error(`❌ Lỗi tự sinh câu hỏi "${template.title}":`, err.message);
      }
    }

    // ────────────────────────────────────────────────────────────────
    // PHẦN 5: IMPORT CÂU TRẢ LỜI TỪ FILE JSON TĨNH
    // ────────────────────────────────────────────────────────────────
    console.log("\n💬 5. Đang xử lý câu trả lời từ JSON...");
    for (const a of answersData) {
      try {
        const questionId = questionTitleToId[a.questionTitle];
        const userId = userEmailToId[a.authorEmail];

        if (!questionId || !userId) continue;

        const [existingAnswers] = await pool.query(
          "SELECT id FROM answers WHERE question_id = ? AND user_id = ? AND content = ?",
          [questionId, userId, a.content]
        );

        if (existingAnswers.length === 0) {
          const verifiedByUserId = a.verifiedByTeacherEmail ? userEmailToId[a.verifiedByTeacherEmail] : null;
          await pool.query(
            "INSERT INTO answers (content, question_id, user_id, votes, teacher_verified, verified_by_user_id) VALUES (?, ?, ?, ?, ?, ?)",
            [a.content, questionId, userId, a.votes || 0, a.teacherVerified ? 1 : 0, verifiedByUserId]
          );
          answersInsertedCount++;
        }
      } catch (err) {
        console.error(`❌ Lỗi xử lý câu trả lời JSON:`, err.message);
      }
    }

    // ────────────────────────────────────────────────────────────────
    // PHẦN 6: TỰ ĐỘNG SINH CÂU TRẢ LỜI (ANSWERS) VÀ BÌNH LUẬN (COMMENTS)
    // ────────────────────────────────────────────────────────────────
    console.log("\n💬 6. Đang tự động sinh câu trả lời và bình luận mẫu...");
    for (const qId of newQuestionIds) {
      try {
        // Sinh từ 2 đến 4 câu trả lời cho mỗi câu hỏi mới
        const answersToCreate = Math.floor(Math.random() * 3) + 2; 

        for (let i = 0; i < answersToCreate; i++) {
          // Lấy ngẫu nhiên tác giả câu trả lời
          const randomAuthorEmail = allUserEmails[Math.floor(Math.random() * allUserEmails.length)];
          const userId = userEmailToId[randomAuthorEmail];
          const randomContent = answerTemplates[Math.floor(Math.random() * answerTemplates.length)];

          // Kiểm tra xem đã có câu trả lời trùng chưa
          const [existingAnswers] = await pool.query(
            "SELECT id FROM answers WHERE question_id = ? AND user_id = ? AND content = ?",
            [qId, userId, randomContent]
          );

          let answerId;
          if (existingAnswers.length > 0) {
            answerId = existingAnswers[0].id;
          } else {
            // Thiết lập ngẫu nhiên trạng thái duyệt của giảng viên (nếu có giảng viên tồn tại)
            const shouldVerify = Math.random() > 0.6 && teacherUserIds.length > 0;
            const verifiedByUserId = shouldVerify ? teacherUserIds[Math.floor(Math.random() * teacherUserIds.length)] : null;
            const teacherVerified = shouldVerify ? 1 : 0;
            const randomVotes = Math.floor(Math.random() * 16); // Lượt thích 0 - 15

            const [result] = await pool.query(
              "INSERT INTO answers (content, question_id, user_id, votes, teacher_verified, verified_by_user_id) VALUES (?, ?, ?, ?, ?, ?)",
              [randomContent, qId, userId, randomVotes, teacherVerified, verifiedByUserId]
            );
            answerId = result.insertId;
            answersInsertedCount++;
          }

          // Sinh thêm 1 đến 2 bình luận (Comments) cho câu trả lời này
          const commentsToCreate = Math.floor(Math.random() * 2) + 1;
          for (let j = 0; j < commentsToCreate; j++) {
            const randomCommentUser = allUserIds[Math.floor(Math.random() * allUserIds.length)];
            const randomCommentText = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];

            // Kiểm tra trùng bình luận
            const [existingComments] = await pool.query(
              "SELECT id FROM comments WHERE answer_id = ? AND user_id = ? AND content = ?",
              [answerId, randomCommentUser, randomCommentText]
            );

            if (existingComments.length === 0) {
              await pool.query(
                "INSERT INTO comments (content, answer_id, user_id) VALUES (?, ?, ?)",
                [randomCommentText, answerId, randomCommentUser]
              );
              commentsInsertedCount++;
            }
          }
        }
      } catch (err) {
        console.error(`❌ Lỗi tự sinh câu trả lời cho câu hỏi ID ${qId}:`, err.message);
      }
    }

    // ────────────────────────────────────────────────────────────────
    // PHẦN 7: TẠO PHIẾU BẦU CHO CÂU HỎI MỚI
    // ────────────────────────────────────────────────────────────────
    console.log("\n👍 7. Đang tạo thêm phiếu bầu ngẫu nhiên...");
    let newVoteCount = 0;
    for (const qId of newQuestionIds) {
      const usersToVote = allUserIds.sort(() => 0.5 - Math.random()).slice(0, 3);
      for (const voterId of usersToVote) {
        const [existingVotes] = await pool.query(
          "SELECT 1 FROM question_votes WHERE user_id = ? AND question_id = ?",
          [voterId, qId]
        );
        if (existingVotes.length === 0) {
          try {
            await pool.query(
              "INSERT INTO question_votes (user_id, question_id, vote_type) VALUES (?, ?, 1)",
              [voterId, qId]
            );
            newVoteCount++;
          } catch (e) {}
        }
      }
    }
    console.log(`  + Đã thêm mới ${newVoteCount} phiếu bầu vào question_votes.`);

    console.log(`\n🎉 Đã thêm thành công ${usersInsertedCount} users, ${questionsInsertedCount} câu hỏi, ${answersInsertedCount} câu trả lời và ${commentsInsertedCount} bình luận mới mà không ảnh hưởng dữ liệu cũ.`);

  } catch (err) {
    console.error("\n❌ Lỗi nghiêm trọng xảy ra trong quá trình seed dữ liệu:", err.message);
  } finally {
    await pool.end();
    console.log("🔌 Đã ngắt kết nối an toàn với Database.");
    process.exit(0);
  }
}

seed();
