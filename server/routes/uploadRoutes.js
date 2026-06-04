const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình Multer để lưu file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép tải lên file ảnh!'));
    }
  }
});

// API upload avatar
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh!' });
    }

    // URL file ảnh sẽ được truy cập qua đường dẫn tĩnh (static)
    const avatarUrl = `/uploads/${req.file.filename}`;

    // Lưu vào bảng user_profile
    await pool.execute(
      `INSERT INTO user_profile (user_id, avatar) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE avatar = VALUES(avatar)`,
      [req.user.id, avatarUrl]
    );

    res.status(200).json({ 
      success: true, 
      message: 'Tải ảnh lên thành công!',
      avatar: avatarUrl 
    });
  } catch (error) {
    console.error('Lỗi upload ảnh:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi upload ảnh' });
  }
});

// Cấu hình Multer để lưu tài liệu bài tập/thông báo
const docStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'document-' + uniqueSuffix + ext);
  }
});

const uploadDoc = multer({
  storage: docStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Giới hạn 20MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Định dạng file tài liệu không được hỗ trợ! Chỉ chấp nhận .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .zip, .rar, .txt, .png, .jpg, .jpeg'));
    }
  }
});

// API upload tài liệu cho GV
router.post('/document', authMiddleware, (req, res, next) => {
  uploadDoc.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Lỗi tải file: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file tài liệu!' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ 
      success: true, 
      message: 'Tải tài liệu lên thành công!',
      fileUrl: fileUrl,
      fileName: req.file.originalname 
    });
  } catch (error) {
    console.error('Lỗi upload tài liệu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi upload tài liệu' });
  }
});

module.exports = router;
