const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.use(authMiddleware);

// Chốt số & tạo hóa đơn (bắt buộc kèm 2 ảnh công tơ)
router.post('/', upload.fields([
  { name: 'electricityPhoto', maxCount: 1 },
  { name: 'waterPhoto', maxCount: 1 },
]), invoiceController.createInvoice);

router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);

// Điều chỉnh chỉ số khi khách khiếu nại
router.put('/:id/adjust', upload.fields([
  { name: 'electricityPhoto', maxCount: 1 },
  { name: 'waterPhoto', maxCount: 1 },
]), invoiceController.adjustInvoice);

// Xác nhận đã nhận tiền & khóa sổ
router.patch('/:id/paid', invoiceController.markAsPaid);

module.exports = router;
