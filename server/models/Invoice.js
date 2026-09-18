const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  monthYear: {
    type: String,
    required: true,
    index: true, // Định dạng "MM-YYYY", ví dụ "09-2026"
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true, // Token UUID v4 bí mật phục vụ xem hóa đơn công khai /bill/:token
  },
  status: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3],
    default: 0,
    index: true,
    // 0: Chưa chốt số (Bản nháp)
    // 1: Đã gửi hóa đơn (Chờ đối soát)
    // 2: Khách khiếu nại (Báo sai lệch chỉ số kèm ảnh đối chứng)
    // 3: Đã thanh toán (Khóa sổ công nợ)
  },
  readings: {
    electricity: {
      oldIndex: { type: Number, default: 0 },
      newIndex: { type: Number, default: 0 },
      consumption: { type: Number, default: 0 },
      unitPrice: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
      meterPhoto: { type: String, default: '' }, // Đường dẫn ảnh chụp công tơ điện
    },
    water: {
      oldIndex: { type: Number, default: 0 },
      newIndex: { type: Number, default: 0 },
      consumption: { type: Number, default: 0 },
      unitPrice: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
      meterPhoto: { type: String, default: '' }, // Đường dẫn ảnh chụp công tơ nước
    },
  },
  roomFee: {
    type: Number,
    required: true,
    default: 0,
  },
  serviceFee: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  payment: {
    qrUrl: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    note: { type: String, default: '' },
  },
  dispute: {
    tenantReason: { type: String, default: '' },
    tenantPhoto: { type: String, default: '' },
    disputedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    landlordResponse: { type: String, default: '' },
  },
  zaloDelivery: {
    status: {
      type: String,
      enum: ['NONE', 'PENDING', 'SENT', 'FAILED'],
      default: 'NONE',
    },
    sentAt: { type: Date, default: null },
    recipientPhone: { type: String, default: '' },
    error: { type: String, default: '' },
  },
}, { timestamps: true });

// Mỗi phòng chỉ có 1 hóa đơn cho 1 kỳ tháng
invoiceSchema.index({ roomId: 1, monthYear: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
