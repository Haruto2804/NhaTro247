const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Không tìm thấy mã xác thực (Token). Vui lòng đăng nhập lại.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_phongtro');

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại trong hệ thống.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Lỗi xác thực Token:', error.message);
    return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.' });
  }
};

module.exports = authMiddleware;
