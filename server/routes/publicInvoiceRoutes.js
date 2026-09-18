const express = require('express');
const router = express.Router();
const publicInvoiceController = require('../controllers/publicInvoiceController');
const upload = require('../middlewares/upload');

// Xem chi tiết hóa đơn qua Token bí mật (không cần đăng nhập)
router.get('/:token', publicInvoiceController.getPublicInvoice);

// Khách xác nhận đúng chỉ số
router.post('/:token/confirm', publicInvoiceController.confirmInvoice);

// Khách báo sai lệch (kèm lý do và ảnh đối chứng)
router.post('/:token/dispute', upload.single('disputePhoto'), publicInvoiceController.disputeInvoice);

module.exports = router;
