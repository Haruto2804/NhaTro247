const { v4: uuidv4 } = require('uuid');
const Invoice = require('../models/Invoice');
const Room = require('../models/Room');
const User = require('../models/User');
const zaloPersonalService = require('../services/zaloPersonalService');

// Helper sinh link VietQR QuickLink chuẩn NAPAS 247
function generateVietQRUrl(bankingInfo, totalAmount, roomCode, monthYear) {
  if (!bankingInfo || !bankingInfo.bankCode || !bankingInfo.accountNumber) {
    return '';
  }
  const bank = bankingInfo.bankCode;
  const accountNo = bankingInfo.accountNumber;
  const amount = Math.round(totalAmount);
  const addInfo = encodeURIComponent(`${roomCode} TIEN NHA ${monthYear.replace('-', ' ')}`);
  const accountName = encodeURIComponent(bankingInfo.accountHolder || '');
  return `https://img.vietqr.io/image/${bank}-${accountNo}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
}

// Chốt số & Tạo hóa đơn mới
exports.createInvoice = async (req, res) => {
  try {
    const { roomId, monthYear, newElectricityIndex, newWaterIndex } = req.body;

    if (!roomId || !monthYear || newElectricityIndex === undefined || newWaterIndex === undefined) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ: Phòng, Kỳ tháng, và Chỉ số điện/nước mới.' });
    }

    const room = await Room.findOne({ _id: roomId, landlordId: req.user._id });
    if (!room) {
      return res.status(404).json({ message: 'Không tìm thấy phòng trọ tương ứng.' });
    }

    // Kiểm tra hóa đơn kỳ này đã tồn tại chưa
    const existing = await Invoice.findOne({ roomId, monthYear });
    if (existing) {
      return res.status(400).json({ message: `Hóa đơn kỳ ${monthYear} cho phòng ${room.roomCode} đã được lập trước đó.` });
    }

    // Bắt buộc ảnh chụp công tơ
    const electricityFile = req.files?.['electricityPhoto']?.[0];
    const waterFile = req.files?.['waterPhoto']?.[0];

    if (!electricityFile || !waterFile) {
      return res.status(400).json({ message: 'Bắt buộc phải tải lên cả 2 ảnh chụp thực tế: Đồng hồ điện và Đồng hồ nước.' });
    }

    // Tìm hóa đơn kỳ trước để lấy chỉ số cũ
    // Tìm hóa đơn gần nhất trước kỳ này của phòng
    const previousInvoice = await Invoice.findOne({
      roomId,
      monthYear: { $ne: monthYear }
    }).sort({ createdAt: -1 });

    const oldElectricity = previousInvoice
      ? previousInvoice.readings.electricity.newIndex
      : (room.initialReading.electricity || 0);

    const oldWater = previousInvoice
      ? previousInvoice.readings.water.newIndex
      : (room.initialReading.water || 0);

    const newElecNum = Number(newElectricityIndex);
    const newWaterNum = Number(newWaterIndex);

    // Kiểm tra toàn vẹn: Số mới phải >= Số cũ
    if (newElecNum < oldElectricity) {
      return res.status(400).json({
        message: `Chỉ số điện mới (${newElecNum}) không được nhỏ hơn chỉ số cũ (${oldElectricity}).`
      });
    }

    if (newWaterNum < oldWater) {
      return res.status(400).json({
        message: `Chỉ số nước mới (${newWaterNum}) không được nhỏ hơn chỉ số cũ (${oldWater}).`
      });
    }

    // Tính toán tiêu thụ và thành tiền
    const elecConsumption = newElecNum - oldElectricity;
    const waterConsumption = newWaterNum - oldWater;

    const elecPrice = room.pricing.electricityUnitPrice || 3500;
    const waterPrice = room.pricing.waterUnitPrice || 25000;
    const serviceFee = room.pricing.serviceFee || 0;
    const roomFee = room.basePrice || 0;

    const elecAmount = elecConsumption * elecPrice;
    const waterAmount = waterConsumption * waterPrice;
    const totalAmount = roomFee + elecAmount + waterAmount + serviceFee;

    // Lấy thông tin ngân hàng chủ trọ để sinh VietQR
    const landlord = await User.findById(req.user._id);
    const vietQrUrl = generateVietQRUrl(landlord.bankingInfo, totalAmount, room.roomCode, monthYear);

    // Tạo token bảo mật duy nhất cho link tra cứu của người thuê
    const secureToken = uuidv4();

    const invoice = await Invoice.create({
      landlordId: req.user._id,
      roomId: room._id,
      monthYear,
      token: secureToken,
      status: 1, // Đã gửi hóa đơn
      readings: {
        electricity: {
          oldIndex: oldElectricity,
          newIndex: newElecNum,
          consumption: elecConsumption,
          unitPrice: elecPrice,
          amount: elecAmount,
          meterPhoto: `/uploads/${electricityFile.filename}`,
        },
        water: {
          oldIndex: oldWater,
          newIndex: newWaterNum,
          consumption: waterConsumption,
          unitPrice: waterPrice,
          amount: waterAmount,
          meterPhoto: `/uploads/${waterFile.filename}`,
        }
      },
      roomFee,
      serviceFee,
      totalAmount,
      payment: {
        qrUrl: vietQrUrl,
        paidAt: null,
      }
    });

    // Tự động kích hoạt gửi hóa đơn qua Zalo cá nhân nếu chủ trọ đã liên kết
    try {
      const landlord = await User.findById(req.user._id);
      if (landlord?.zaloSession?.connected) {
        zaloPersonalService.sendInvoiceAuto({
          landlordId: landlord._id,
          recipientPhone: room.tenantPhone,
          invoice,
          room,
          clientUrl: req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173',
        }).then(async (result) => {
          if (result.success) {
            await Invoice.findByIdAndUpdate(invoice._id, {
              'zaloDelivery.status': 'SENT',
              'zaloDelivery.sentAt': new Date(),
              'zaloDelivery.recipientPhone': room.tenantPhone,
            });
          } else {
            await Invoice.findByIdAndUpdate(invoice._id, {
              'zaloDelivery.status': 'FAILED',
              'zaloDelivery.error': result.message || result.reason,
              'zaloDelivery.recipientPhone': room.tenantPhone,
            });
          }
        }).catch((err) => {
          console.error('[ZALO AUTO BACKGROUND ERROR]', err);
        });
      }
    } catch (zaloTriggerErr) {
      console.error('[ZALO TRIGGER ERROR]', zaloTriggerErr);
    }

    return res.status(201).json({
      message: 'Chốt số và xuất hóa đơn thành công!',
      invoice,
    });
  } catch (error) {
    console.error('Lỗi createInvoice:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi tạo hóa đơn: ' + error.message });
  }
};

// Lấy danh sách hóa đơn theo bộ lọc
exports.getInvoices = async (req, res) => {
  try {
    const { monthYear, status, roomId } = req.query;
    const query = { landlordId: req.user._id };

    if (monthYear) query.monthYear = monthYear;
    if (status !== undefined && status !== '') query.status = Number(status);
    if (roomId) query.roomId = roomId;

    const invoices = await Invoice.find(query)
      .populate('roomId', 'roomCode name tenantName tenantPhone basePrice')
      .sort({ createdAt: -1 });

    return res.status(200).json({ invoices });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách hóa đơn.' });
  }
};

// Lấy chi tiết 1 hóa đơn
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, landlordId: req.user._id })
      .populate('roomId');

    if (!invoice) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
    }

    return res.status(200).json({ invoice });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết hóa đơn.' });
  }
};

// Điều chỉnh chỉ số khi có khiếu nại từ khách
exports.adjustInvoice = async (req, res) => {
  try {
    const { newElectricityIndex, newWaterIndex, landlordResponse } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params.id, landlordId: req.user._id })
      .populate('roomId');

    if (!invoice) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
    }

    if (invoice.status === 3) {
      return res.status(400).json({ message: 'Hóa đơn đã được thanh toán và khóa sổ, không thể điều chỉnh.' });
    }

    const elecFile = req.files?.['electricityPhoto']?.[0];
    const waterFile = req.files?.['waterPhoto']?.[0];

    const newElecNum = newElectricityIndex !== undefined ? Number(newElectricityIndex) : invoice.readings.electricity.newIndex;
    const newWaterNum = newWaterIndex !== undefined ? Number(newWaterIndex) : invoice.readings.water.newIndex;

    const oldElec = invoice.readings.electricity.oldIndex;
    const oldWater = invoice.readings.water.oldIndex;

    if (newElecNum < oldElec || newWaterNum < oldWater) {
      return res.status(400).json({ message: 'Chỉ số mới không được nhỏ hơn chỉ số cũ.' });
    }

    // Tính lại tiền
    const elecConsumption = newElecNum - oldElec;
    const waterConsumption = newWaterNum - oldWater;
    const elecAmount = elecConsumption * invoice.readings.electricity.unitPrice;
    const waterAmount = waterConsumption * invoice.readings.water.unitPrice;
    const totalAmount = invoice.roomFee + elecAmount + waterAmount + invoice.serviceFee;

    invoice.readings.electricity.newIndex = newElecNum;
    invoice.readings.electricity.consumption = elecConsumption;
    invoice.readings.electricity.amount = elecAmount;
    if (elecFile) invoice.readings.electricity.meterPhoto = `/uploads/${elecFile.filename}`;

    invoice.readings.water.newIndex = newWaterNum;
    invoice.readings.water.consumption = waterConsumption;
    invoice.readings.water.amount = waterAmount;
    if (waterFile) invoice.readings.water.meterPhoto = `/uploads/${waterFile.filename}`;

    invoice.totalAmount = totalAmount;

    // Cập nhật lại VietQR
    const landlord = await User.findById(req.user._id);
    invoice.payment.qrUrl = generateVietQRUrl(landlord.bankingInfo, totalAmount, invoice.roomId.roomCode, invoice.monthYear);

    // Ghi nhận giải quyết khiếu nại và trả về trạng thái 1
    invoice.dispute.resolvedAt = new Date();
    if (landlordResponse) invoice.dispute.landlordResponse = landlordResponse.trim();
    invoice.status = 1; // Đã cập nhật lại và gửi khách

    await invoice.save();

    return res.status(200).json({
      message: 'Điều chỉnh số đo thành công! Hóa đơn đã được cập nhật lại.',
      invoice,
    });
  } catch (error) {
    console.error('Lỗi adjustInvoice:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi điều chỉnh hóa đơn.' });
  }
};

// Duyệt đã thanh toán & Khóa sổ công nợ
exports.markAsPaid = async (req, res) => {
  try {
    const { note } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params.id, landlordId: req.user._id });

    if (!invoice) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
    }

    if (invoice.status === 3) {
      return res.status(400).json({ message: 'Hóa đơn này đã được xác nhận thanh toán trước đó.' });
    }

    invoice.status = 3; // Đã thanh toán / Khóa sổ
    invoice.payment.paidAt = new Date();
    if (note) invoice.payment.note = note.trim();

    await invoice.save();

    return res.status(200).json({
      message: 'Xác nhận thanh toán thành công! Đã đóng công nợ kỳ này.',
      invoice,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ khi xác nhận thanh toán.' });
  }
};

// Gửi lại hóa đơn qua Zalo cá nhân
exports.resendZalo = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, landlordId: req.user._id }).populate('roomId');
    if (!invoice) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
    }

    const room = invoice.roomId;
    if (!room || !room.tenantPhone) {
      return res.status(400).json({ message: 'Phòng này chưa có thông tin số điện thoại người thuê.' });
    }

    const result = await zaloPersonalService.sendInvoiceAuto({
      landlordId: req.user._id,
      recipientPhone: room.tenantPhone,
      invoice,
      room,
      clientUrl: req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173',
    });

    if (result.success) {
      invoice.zaloDelivery = {
        status: 'SENT',
        sentAt: new Date(),
        recipientPhone: room.tenantPhone,
        error: '',
      };
      await invoice.save();
      return res.status(200).json({ message: `Đã gửi hóa đơn qua Zalo cho khách (${result.targetUser || room.tenantName}) thành công!`, invoice });
    } else {
      invoice.zaloDelivery = {
        status: 'FAILED',
        sentAt: null,
        recipientPhone: room.tenantPhone,
        error: result.message || result.reason,
      };
      await invoice.save();
      return res.status(400).json({ message: result.message || 'Gửi Zalo không thành công.', invoice });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi gửi lại Zalo: ' + error.message });
  }
};

