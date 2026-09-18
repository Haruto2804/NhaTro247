const Room = require('../models/Room');
const Invoice = require('../models/Invoice');

exports.getDashboardStats = async (req, res) => {
  try {
    const landlordId = req.user._id;
    const { monthYear } = req.query;

    if (!monthYear) {
      return res.status(400).json({ message: 'Vui lòng cung cấp tham số kỳ tháng monthYear (MM-YYYY).' });
    }

    // 1. Lấy tất cả các phòng của chủ trọ
    const allRooms = await Room.find({ landlordId, status: 'ACTIVE' }).sort({ roomCode: 1 });
    const totalRooms = allRooms.length;

    // 2. Lấy tất cả hóa đơn của kỳ này
    const invoices = await Invoice.find({ landlordId, monthYear }).populate('roomId');

    // Tạo bản đồ tra cứu hóa đơn theo roomId
    const invoiceMap = {};
    let countStatus1 = 0; // Đã gửi
    let countStatus2 = 0; // Khách khiếu nại
    let countStatus3 = 0; // Đã thanh toán
    let totalExpectedRevenue = 0;
    let totalCollectedRevenue = 0;

    invoices.forEach(inv => {
      if (inv.roomId) {
        invoiceMap[inv.roomId._id.toString()] = inv;
      }
      totalExpectedRevenue += inv.totalAmount || 0;

      if (inv.status === 1) countStatus1++;
      else if (inv.status === 2) countStatus2++;
      else if (inv.status === 3) {
        countStatus3++;
        totalCollectedRevenue += inv.totalAmount || 0;
      }
    });

    // Phòng chưa chốt số kỳ này (Status 0)
    const countStatus0 = totalRooms - invoices.length;

    // Danh sách chi tiết từng phòng kèm trạng thái trong kỳ
    const roomOverview = allRooms.map(room => {
      const inv = invoiceMap[room._id.toString()];
      return {
        roomId: room._id,
        roomCode: room.roomCode,
        roomName: room.name,
        tenantName: room.tenantName,
        tenantPhone: room.tenantPhone,
        basePrice: room.basePrice,
        status: inv ? inv.status : 0, // 0 nếu chưa tạo hóa đơn
        invoiceId: inv ? inv._id : null,
        invoiceToken: inv ? inv.token : null,
        totalAmount: inv ? inv.totalAmount : 0,
        paidAt: inv?.payment?.paidAt || null,
        disputeReason: inv?.dispute?.tenantReason || null,
      };
    });

    return res.status(200).json({
      monthYear,
      stats: {
        totalRooms,
        status0_unbilled: Math.max(0, countStatus0),
        status1_sent: countStatus1,
        status2_disputed: countStatus2,
        status3_paid: countStatus3,
        totalExpectedRevenue,
        totalCollectedRevenue,
        paymentRate: totalRooms > 0 ? Math.round((countStatus3 / totalRooms) * 100) : 0,
      },
      rooms: roomOverview,
    });
  } catch (error) {
    console.error('Lỗi getDashboardStats:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi lấy thống kê Dashboard.' });
  }
};
