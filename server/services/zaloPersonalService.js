const { Zalo, ThreadType, LoginQRCallbackEventType } = require('zca-js');
const QRCode = require('qrcode');
const User = require('../models/User');

// Lưu trữ instance Zalo API và phiên quét QR đang hoạt động
const activeApis = new Map(); // landlordId -> API instance
const activeQrSessions = new Map(); // landlordId -> session state

class ZaloPersonalService {
  /**
   * Khởi tạo phiên quét mã QR cho chủ trọ
   */
  async startQrLogin(landlordId) {
    const key = landlordId.toString();

    // Hủy phiên cũ nếu đang chạy
    if (activeQrSessions.has(key)) {
      const oldSession = activeQrSessions.get(key);
      if (oldSession.actions && typeof oldSession.actions.abort === 'function') {
        try { oldSession.actions.abort(); } catch (_) {}
      }
      activeQrSessions.delete(key);
    }

    const session = {
      status: 'INITIALIZING', // INITIALIZING | WAITING_SCAN | SCANNED | SUCCESS | EXPIRED | ERROR
      qrDataUrl: '',
      scannedUser: '',
      error: null,
      actions: null,
      createdAt: Date.now(),
    };
    activeQrSessions.set(key, session);

    const zalo = new Zalo();

    // Chạy loginQR ngầm trong background
    zalo.loginQR(
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
      async (event) => {
        try {
          if (event.type === LoginQRCallbackEventType.QRCodeGenerated) {
            session.status = 'WAITING_SCAN';
            session.actions = event.actions;
            // event.data.image có thể là URL hoặc base64 data
            if (event.data.image && event.data.image.startsWith('data:')) {
              session.qrDataUrl = event.data.image;
            } else if (event.data.code) {
              // Chuyển code thành ảnh QR base64
              session.qrDataUrl = await QRCode.toDataURL(event.data.code, { margin: 2, width: 280 });
            } else if (event.data.image) {
              session.qrDataUrl = event.data.image;
            }
          } else if (event.type === LoginQRCallbackEventType.QRCodeScanned) {
            session.status = 'SCANNED';
            session.scannedUser = event.data.display_name || 'Người dùng Zalo';
          } else if (event.type === LoginQRCallbackEventType.GotLoginInfo) {
            session.status = 'SUCCESS';
            session.loginInfo = event.data;
          } else if (event.type === LoginQRCallbackEventType.QRCodeExpired) {
            session.status = 'EXPIRED';
          } else if (event.type === LoginQRCallbackEventType.QRCodeDeclined) {
            session.status = 'DECLINED';
          }
        } catch (err) {
          console.error('[ZALO QR CALLBACK ERROR]', err);
          session.status = 'ERROR';
          session.error = err.message;
        }
      }
    ).then(async (api) => {
      if (api) {
        activeApis.set(key, api);
        session.status = 'SUCCESS';

        // Lấy thông tin tài khoản Zalo & lưu vào MongoDB
        try {
          let userInfo = null;
          try {
            userInfo = await api.fetchAccountInfo();
          } catch (_) {}

          const zaloName = userInfo?.data?.display_name || session.scannedUser || 'Chủ trọ';
          const zaloAvatar = userInfo?.data?.avatar || '';

          await User.findByIdAndUpdate(landlordId, {
            'zaloSession.connected': true,
            'zaloSession.zaloName': zaloName,
            'zaloSession.zaloAvatar': zaloAvatar,
            'zaloSession.loginInfo': session.loginInfo || null,
            'zaloSession.lastConnectedAt': new Date(),
          });
          console.log(`[ZALO] Đã liên kết thành công Zalo: ${zaloName} cho chủ trọ ${landlordId}`);
        } catch (dbErr) {
          console.error('[ZALO SAVE DB ERROR]', dbErr);
        }
      }
    }).catch((err) => {
      console.error('[ZALO LOGIN_QR FAILED]', err.message);
      session.status = 'ERROR';
      session.error = err.message || 'Lỗi phiên quét mã QR Zalo.';
    });

    return session;
  }

  /**
   * Lấy trạng thái phiên quét mã QR
   */
  getQrStatus(landlordId) {
    const key = landlordId.toString();
    const session = activeQrSessions.get(key);
    if (!session) {
      return { status: 'IDLE', qrDataUrl: '', scannedUser: '', error: null };
    }
    return {
      status: session.status,
      qrDataUrl: session.qrDataUrl,
      scannedUser: session.scannedUser,
      error: session.error,
    };
  }

  /**
   * Lấy client Zalo API sẵn sàng sử dụng
   */
  async getClient(landlordId) {
    const key = landlordId.toString();
    if (activeApis.has(key)) {
      return activeApis.get(key);
    }

    // Nếu chưa có trong RAM, thử phục hồi từ session lưu trong DB
    const user = await User.findById(landlordId);
    if (!user || !user.zaloSession?.connected || !user.zaloSession?.loginInfo) {
      return null;
    }

    try {
      const zalo = new Zalo();
      const api = await zalo.login(user.zaloSession.loginInfo);
      activeApis.set(key, api);
      return api;
    } catch (err) {
      console.warn(`[ZALO RESTORE FAILED] Không thể phục hồi phiên Zalo của chủ trọ ${landlordId}:`, err.message);
      // Đánh dấu cần quét lại
      await User.findByIdAndUpdate(landlordId, { 'zaloSession.connected': false });
      return null;
    }
  }

  /**
   * Ngắt kết nối tài khoản Zalo
   */
  async disconnect(landlordId) {
    const key = landlordId.toString();
    activeApis.delete(key);
    activeQrSessions.delete(key);

    await User.findByIdAndUpdate(landlordId, {
      'zaloSession.connected': false,
      'zaloSession.loginInfo': null,
    });
    return true;
  }

  /**
   * Tự động gửi hóa đơn và mã VietQR qua Zalo cá nhân tới số điện thoại khách thuê
   */
  async sendInvoiceAuto({ landlordId, recipientPhone, invoice, room, clientUrl = 'http://localhost:5173' }) {
    try {
      if (!recipientPhone) {
        return { success: false, reason: 'MISSING_PHONE', message: 'Không có số điện thoại khách thuê.' };
      }

      const api = await this.getClient(landlordId);
      if (!api) {
        return {
          success: false,
          reason: 'NOT_CONNECTED',
          message: 'Chủ trọ chưa liên kết Zalo cá nhân hoặc phiên kết nối đã hết hạn.',
        };
      }

      // Chuẩn hóa số điện thoại: 0987654321 hoặc 84987654321
      const cleanPhone = recipientPhone.replace(/\D/g, '');
      const searchPhones = [
        cleanPhone,
        cleanPhone.startsWith('0') ? '84' + cleanPhone.slice(1) : cleanPhone,
        cleanPhone.startsWith('84') ? '0' + cleanPhone.slice(2) : cleanPhone,
      ];

      let targetUser = null;
      for (const p of searchPhones) {
        try {
          const res = await api.findUser(p);
          if (res && (res.uid || res.userId || res.globalId)) {
            targetUser = res;
            break;
          }
        } catch (_) {}
      }

      if (!targetUser) {
        return {
          success: false,
          reason: 'USER_NOT_FOUND',
          message: `Không tìm thấy tài khoản Zalo đăng ký với số điện thoại ${recipientPhone}. Khách có thể đã chặn tìm kiếm qua số điện thoại.`,
        };
      }

      const targetThreadId = targetUser.uid || targetUser.userId;

      // Soạn nội dung tin nhắn hóa đơn
      const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
      const elec = invoice.readings?.electricity || {};
      const water = invoice.readings?.water || {};
      const billUrl = `${clientUrl}/bill/${invoice.token}`;
      const qrUrl = invoice.payment?.qrUrl || '';

      const messageContent = [
        `🏠 THÔNG BÁO TIỀN TRỌ KỲ ${invoice.monthYear}`,
        `Kính gửi bạn ${room.tenantName} (${room.roomCode} - ${room.name}):`,
        ``,
        `• Tiền phòng: ${formatVND(invoice.roomFee)}`,
        `• Tiền điện: ${elec.oldIndex} ➔ ${elec.newIndex} (${elec.consumption} kWh): ${formatVND(elec.amount)}`,
        `• Tiền nước: ${water.oldIndex} ➔ ${water.newIndex} (${water.consumption} m³): ${formatVND(water.amount)}`,
        invoice.serviceFee ? `• Dịch vụ chung: ${formatVND(invoice.serviceFee)}` : null,
        `👉 TỔNG TIỀN THANH TOÁN: ${formatVND(invoice.totalAmount)}`,
        ``,
        qrUrl ? `💳 Quét mã VietQR chuyển khoản nhanh tại:\n${qrUrl}` : null,
        ``,
        `🔍 Bấm vào liên kết dưới đây để xem ảnh chụp công tơ thực tế và xác nhận đối soát:`,
        `${billUrl}`,
      ].filter(Boolean).join('\n');

      // Gửi tin nhắn qua Zalo Web
      await api.sendMessage(messageContent, targetThreadId, ThreadType.User);

      console.log(`[ZALO AUTO-SEND] Đã tự động gửi hóa đơn kỳ ${invoice.monthYear} tới Zalo khách ${recipientPhone} (UID: ${targetThreadId}) thành công.`);
      return { success: true, targetUser: targetUser.display_name || targetUser.zalo_name };
    } catch (error) {
      console.error('[ZALO AUTO-SEND ERROR]', error);
      return { success: false, reason: 'SEND_FAILED', message: error.message };
    }
  }
}

module.exports = new ZaloPersonalService();
