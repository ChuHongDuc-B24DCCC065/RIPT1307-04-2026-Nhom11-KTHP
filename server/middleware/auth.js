const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Không tìm thấy token, vui lòng đăng nhập!' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bi_mat_quoc_gia');
    req.user = decoded; // { id, username, email, role }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token đã hết hạn, vui lòng đăng nhập lại!' });
    }
    return res.status(403).json({ success: false, message: 'Token không hợp lệ!' });
  }
};

// Middleware kiểm tra quyền admin
const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền truy cập!' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };