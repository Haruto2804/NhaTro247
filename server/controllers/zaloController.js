const zaloPersonalService = require('../services/zaloPersonalService');
const User = require('../models/User');

// Lấy trạng thái liên kết Zalo hiện tại của chủ trọ
exports.getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const session = user?.zaloSession || {};
    return res.status(200).json({
      connected: Boolean(session.connected),
      zaloName: session.zaloName || '',
      zaloPhone: session.zaloPhone || '',
      zaloAvatar: session.zaloAvatar || '',
      lastConnectedAt: session.lastConnectedAt || null,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi kiểm tra trạng thái Zalo: ' + error.message });
  }
};

// Khởi tạo phiên quét mã QR kết nối Zalo
exports.startQr = async (req, res) => {
  try {
    const session = await zaloPersonalService.startQrLogin(req.user._id);

    // Chờ tối đa 2.5s để có mã QR trả về ngay cho client
    let attempts = 0;
    while (!session.qrDataUrl && attempts < 10 && session.status !== 'ERROR') {
      await new Promise((resolve) => setTimeout(resolve, 250));
      attempts++;
    }

    return res.status(200).json({
      status: session.status,
      qrDataUrl: session.qrDataUrl,
      scannedUser: session.scannedUser,
      error: session.error,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khởi tạo quét QR Zalo: ' + error.message });
  }
};

// Polling kiểm tra trạng thái quét mã QR
exports.getQrStatus = async (req, res) => {
  try {
    const statusInfo = zaloPersonalService.getQrStatus(req.user._id);
    return res.status(200).json(statusInfo);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi kiểm tra mã QR: ' + error.message });
  }
};

// Hủy liên kết tài khoản Zalo
exports.disconnect = async (req, res) => {
  try {
    await zaloPersonalService.disconnect(req.user._id);
    return res.status(200).json({ message: 'Đã ngắt kết nối tài khoản Zalo thành công.' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi ngắt kết nối Zalo: ' + error.message });
  }
};
