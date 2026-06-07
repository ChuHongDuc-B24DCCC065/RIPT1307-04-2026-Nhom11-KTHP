Dưới đây là file `README.md` được thiết kế chuẩn chỉnh, gọn gàng và chuyên nghiệp cho dự án **Q&A Platform tích hợp Chatbot thông minh** của nhóm bạn. Bạn chỉ cần sao chép toàn bộ nội dung trong ô mã nguồn bên dưới và tạo một file tên là `README.md` ở thư mục gốc của dự án trên GitHub nhé.

```markdown
# Q&A Platform - Diễn đàn Hỏi đáp trực tuyến tích hợp Chatbot thông minh

Một nền tảng mạng xã hội hỏi đáp chuyên sâu dành cho cộng đồng sinh viên công nghệ, kết hợp giữa mô hình diễn đàn truyền thống và trợ lý ảo AI hỗ trợ tự động 24/7. Dự án được phát triển dựa trên bộ công nghệ Fullstack JavaScript (React, Node.js, MySQL).

## 🚀 Tính năng cốt lõi

### 1. Phân hệ Người dùng (Client)
* **Xác thực an toàn:** Đăng ký, Đăng nhập và duy trì phiên bằng cơ chế bảo mật JWT (JSON Web Token), mã hóa mật khẩu một chiều bằng Bcrypt.
* **Quản lý bài đăng:** Tạo câu hỏi mới bằng trình soạn thảo văn bản giàu (Rich Text Editor), hỗ trợ định dạng code block và chèn ảnh. Tác giả có quyền chỉnh sửa hoặc xóa bài viết cá nhân.
* **Tương tác cộng đồng:** Gửi câu trả lời cho bài viết, viết bình luận ngắn thảo luận, tương tác Upvote/Downvote và cơ chế đánh dấu "Câu trả lời đúng nhất".
* **Hệ thống thông báo:** Tự động bắn thông báo thời gian thực khi có người trả lời hoặc bình luận vào bài viết của bạn.
* **Hỗ trợ từ AI:** Tích hợp cửa sổ Chatbot thông minh ở góc màn hình, tự động giải đáp các khái niệm cơ bản 24/7 mà không cần đăng nhập.
* **Tìm kiếm & Bộ lọc:** Tìm kiếm câu hỏi bằng từ khóa sử dụng truy vấn SQL LIKE kết hợp lọc nội dung theo hệ thống Thẻ (Tags).
* **Báo cáo vi phạm:** Cho phép người dùng "cắm cờ" báo cáo nội dung rác hoặc vi phạm tiêu chuẩn cộng đồng.

### 2. Phân hệ Quản trị viên (Admin Dashboard)
* **Thống kê tổng quan:** Biểu đồ theo dõi lượng người dùng mới, tổng số bài đăng và dữ liệu tương tác hệ thống.
* **Quản lý thành viên:** Danh sách người dùng, phân quyền hệ thống và tính năng khóa/mở khóa tài khoản vi phạm.
* **Kiểm duyệt nội dung:** Phê duyệt bài đăng (đối với thành viên có điểm uy tín < 50) hoặc ẩn/xóa các nội dung vi phạm quy định.
* **Xử lý báo cáo:** Hàng đợi tiếp nhận và giải quyết các báo cáo vi phạm (Reports) gửi lên từ cộng đồng.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Tầng kiến trúc | Công nghệ / Thư viện |
| :--- | :--- |
| **Frontend (Client)** | React.js, TypeScript, Vite, Ant Design (antd), Axios, React Router DOM, React Quill |
| **Backend (Server)** | Node.js, Express.js, JSON Web Token (jsonwebtoken), Bcrypt, Multer |
| **Database** | MySQL Server, mysql2 (hỗ trợ Promise/Async-Await) |
| **Cloud Hosting** | Vercel (Frontend), Render.com (Backend), Aiven (MySQL Cloud) |

---

## 📁 Cấu trúc thư mục dự án

```text
D:\BTL_THLTW\
│
├── client/                     # Tầng Frontend (React + Vite)
│   ├── public/                 # Tài nguyên tĩnh (logo, icon)
│   └── src/                    # Mã nguồn chính của giao diện
│       ├── components/         # UI Components tái sử dụng (Header, Footer, Button)
│       ├── pages/              # Các trang chính (Home, Login, QuestionDetail)
│       └── App.jsx             # Cấu hình định tuyến (react-router-dom)
│
└── server/                     # Tầng Backend (Node.js + Express)
    ├── config/                 # Cấu hình kết nối cơ sở dữ liệu (db.js)
    ├── middleware/             # Bộ lọc chặn request và xác thực (auth.js)
    ├── routes/                 # Định nghĩa các endpoints RESTful API
    ├── uploads/                # Thư mục lưu trữ hình ảnh người dùng upload
    └── index.js                # Tệp khởi chạy gốc của máy chủ Express

```

---

## 💻 Hướng dẫn cài đặt cục bộ (Local Setup)

### Tiền điều kiện

* Đã cài đặt **Node.js** (Khuyến nghị phiên bản v18.x hoặc v20.x LTS)
* Đã cài đặt và khởi chạy máy chủ **MySQL Server** (v8.0 trở lên)

### Bước 1: Khởi tạo Cơ sở dữ liệu

1. Mở MySQL Workbench hoặc CLI, tạo một database mới:
```sql
CREATE DATABASE qna_platform;

```


2. Import cấu trúc các bảng (`users`, `questions`, `answers`, `comments`, `tags`) từ file script SQL đi kèm của dự án.

### Bước 2: Cài đặt và cấu hình Server (Backend)

1. Di chuyển vào thư mục server:
```bash
cd server

```


2. Cài đặt các gói thư viện phụ thuộc:
```bash
npm install

```


3. Tạo file `.env` tại thư mục gốc của `server/` và cấu hình các biến môi trường sau:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=qna_platform
JWT_SECRET=your_jwt_secret_key

```


4. Khởi chạy máy chủ Backend:
```bash
npm start

```


*Server sẽ chạy tại địa chỉ: `http://localhost:5000*`

### Bước 3: Cài đặt và cấu hình Client (Frontend)

1. Mở một terminal mới và di chuyển vào thư mục client:
```bash
cd client

```


2. Cài đặt các gói thư viện phụ thuộc:
```bash
npm install

```


3. Tạo file `.env` tại thư mục gốc của `client/` để trỏ API về Server:
```env
VITE_API_URL=http://localhost:5000

```


4. Khởi chạy ứng dụng Frontend ở chế độ phát triển:
```bash
npm run dev

```


*Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173*`

---

## 👥 Thành viên thực hiện (Nhóm 11)

* **Chu Hồng Đức** - B24DCCC065
* **Phạm Bình An** – B24DCCC005
* **Nguyễn Lâm Anh** – B24DCCC019
* **Nguyễn Văn Toàn** – B24DCCC263

**Giảng viên hướng dẫn:** Thầy Phan Quang Thành - Học phần: Thực hành Lập trình Web - Học viện Công nghệ Bưu chính Viễn thông (PTIT).

```

```
