const Invoice = require('../models/Invoice');

// Lấy thông tin hóa đơn công khai theo Token bí mật
exports.getPublicInvoice = async (req, res) => {
  try {
    const { token } = req.params;

    const invoice = await Invoice.findOne({ token })
      .populate('roomId', 'roomCode name tenantName tenantPhone basePrice')
      .populate('landlordId', 'name bankingInfo');

    if (!invoice) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn hoặc đường dẫn không hợp lệ.' });
    }

    return res.status(200).json({ invoice });
  } catch (error) {
    console.error('Lỗi getPublicInvoice:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi truy vấn hóa đơn.' });
  }
};

// Người thuê xác nhận đúng số liệu
exports.confirmInvoice = async (req, res) => {
  try {
    const { token } = req.params;
    const invoice = await Invoice.findOne({ token });

    if (!invoice) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
    }

    if (invoice.status === 3) {
      return res.status(200).json({ message: 'Hóa đơn đã được thanh toán hoàn tất.', invoice });
    }

    return res.status(200).json({
      message: 'Cảm ơn bạn đã xác nhận đúng chỉ số điện nước. Vui lòng quét mã VietQR để thanh toán.',
      invoice,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ khi xác nhận hóa đơn.' });
  }
};

// Người thuê báo sai lệch chỉ số
exports.disputeInvoice = async (req, res) => {
  try {
    const { token } = req.params;
    const { reason } = req.body;
    const disputeFile = req.file;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập lý do phát hiện sai lệch chỉ số.' });
    }

    if (!disputeFile) {
      return res.status(400).json({ message: 'Bắt buộc phải tải lên ảnh chụp thực tế đồng hồ của bạn để làm căn cứ đối chứng.' });
    }

    const invoice = await Invoice.findOne({ token });
    if (!invoice) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn tương ứng.' });
    }

    if (invoice.status === 3) {
      return res.status(400).json({ message: 'Hóa đơn đã thanh toán hoàn tất, không thể gửi khiếu nại.' });
    }

    // Cập nhật trạng thái sang 2: Khách khiếu nại
    invoice.status = 2;
    invoice.dispute.tenantReason = reason.trim();
    invoice.dispute.tenantPhoto = `/uploads/${disputeFile.filename}`;
    invoice.dispute.disputedAt = new Date();

    await invoice.save();

    return res.status(200).json({
      message: 'Đã gửi phản ánh sai lệch chỉ số thành công! Chủ trọ sẽ kiểm tra lại và phản hồi sớm nhất.',
      invoice,
    });
  } catch (error) {
    console.error('Lỗi disputeInvoice:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi gửi báo cáo sai lệch.' });
  }
};
