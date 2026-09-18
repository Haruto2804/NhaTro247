require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const publicInvoiceRoutes = require('./routes/publicInvoiceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const zaloRoutes = require('./routes/zaloRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ tĩnh ảnh công tơ điện nước trong thư mục /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Định tuyến API
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/public/invoices', publicInvoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/zalo', zaloRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Hệ thống Quản lý Nhà trọ & Đối soát điện nước 247 đang hoạt động bình thường.',
    timestamp: new Date().toISOString(),
  });
});

// Xử lý lỗi toàn cục (Global Error Handler)
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Dung lượng ảnh vượt quá giới hạn cho phép (Tối đa 5MB).' });
    }
    return res.status(400).json({ message: 'Lỗi upload ảnh: ' + err.message });
  }
  return res.status(500).json({ message: err.message || 'Lỗi máy chủ nội bộ.' });
});

// Kết nối MongoDB và khởi động Server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/phongtro_db';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✓ Kết nối MongoDB thành công:', MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`✓ Máy chủ Backend đang lắng nghe tại cổng http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('✗ Lỗi kết nối MongoDB:', err.message);
    console.log('! Lưu ý: Hãy đảm bảo dịch vụ MongoDB (mongod) đã được khởi động trên máy tính hoặc sử dụng kết nối MongoDB Atlas.');
    // Vẫn cho phép app listen để phục vụ health check và thông báo rõ ràng cho dev
    app.listen(PORT, () => {
      console.log(`! Máy chủ Backend chạy chế độ chờ kết nối DB tại http://localhost:${PORT}`);
    });
  });

module.exports = app;
