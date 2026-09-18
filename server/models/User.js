const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  picture: {
    type: String,
    default: '',
  },
  bankingInfo: {
    bankCode: { type: String, default: '' },       // Mã ngân hàng / BIN (VD: 970436)
    bankName: { type: String, default: '' },       // Tên ngân hàng (VD: Vietcombank)
    accountNumber: { type: String, default: '' },  // Số tài khoản
    accountHolder: { type: String, default: '' },  // Tên chủ tài khoản
  },
  zaloSession: {
    connected: { type: Boolean, default: false },
    zaloName: { type: String, default: '' },
    zaloPhone: { type: String, default: '' },
    zaloAvatar: { type: String, default: '' },
    loginInfo: { type: Object, default: null },   // Lưu cookies, ime, userAgent
    lastConnectedAt: { type: Date, default: null },
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
