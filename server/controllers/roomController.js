const Room = require('../models/Room');

// Lấy danh sách phòng của chủ trọ
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ landlordId: req.user._id }).sort({ roomCode: 1 });
    return res.status(200).json({ rooms });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách phòng.' });
  }
};

// Lấy chi tiết 1 phòng
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, landlordId: req.user._id });
    if (!room) {
      return res.status(404).json({ message: 'Không tìm thấy phòng trọ.' });
    }
    return res.status(200).json({ room });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ khi lấy thông tin phòng.' });
  }
};

// Tạo phòng mới
exports.createRoom = async (req, res) => {
  try {
    const { roomCode, name, tenantName, tenantPhone, basePrice, pricing, initialReading } = req.body;

    if (!roomCode || !name || !tenantName || !tenantPhone || basePrice === undefined) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin phòng bắt buộc.' });
    }

    // Kiểm tra trùng mã phòng
    const existing = await Room.findOne({ landlordId: req.user._id, roomCode: roomCode.trim() });
    if (existing) {
      return res.status(400).json({ message: `Mã phòng "${roomCode}" đã tồn tại trong khu trọ của bạn.` });
    }

    const room = await Room.create({
      landlordId: req.user._id,
      roomCode: roomCode.trim(),
      name: name.trim(),
      tenantName: tenantName.trim(),
      tenantPhone: tenantPhone.trim(),
      basePrice: Number(basePrice),
      pricing: {
        electricityUnitPrice: Number(pricing?.electricityUnitPrice || 3500),
        waterUnitPrice: Number(pricing?.waterUnitPrice || 25000),
        serviceFee: Number(pricing?.serviceFee || 100000),
      },
      initialReading: {
        electricity: Number(initialReading?.electricity || 0),
        water: Number(initialReading?.water || 0),
      },
      status: 'ACTIVE',
    });

    return res.status(201).json({
      message: 'Thêm phòng mới thành công!',
      room,
    });
  } catch (error) {
    console.error('Lỗi createRoom:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi thêm phòng.' });
  }
};

// Cập nhật thông tin phòng
exports.updateRoom = async (req, res) => {
  try {
    const { roomCode, name, tenantName, tenantPhone, basePrice, pricing, status } = req.body;

    const room = await Room.findOne({ _id: req.params.id, landlordId: req.user._id });
    if (!room) {
      return res.status(404).json({ message: 'Không tìm thấy phòng trọ.' });
    }

    // Kiểm tra trùng mã phòng nếu sửa mã
    if (roomCode && roomCode.trim() !== room.roomCode) {
      const existing = await Room.findOne({ landlordId: req.user._id, roomCode: roomCode.trim() });
      if (existing) {
        return res.status(400).json({ message: `Mã phòng "${roomCode}" đã được sử dụng.` });
      }
      room.roomCode = roomCode.trim();
    }

    if (name) room.name = name.trim();
    if (tenantName) room.tenantName = tenantName.trim();
    if (tenantPhone) room.tenantPhone = tenantPhone.trim();
    if (basePrice !== undefined) room.basePrice = Number(basePrice);
    if (status) room.status = status;

    if (pricing) {
      room.pricing = {
        electricityUnitPrice: Number(pricing.electricityUnitPrice ?? room.pricing.electricityUnitPrice),
        waterUnitPrice: Number(pricing.waterUnitPrice ?? room.pricing.waterUnitPrice),
        serviceFee: Number(pricing.serviceFee ?? room.pricing.serviceFee),
      };
    }

    await room.save();

    return res.status(200).json({
      message: 'Cập nhật phòng thành công!',
      room,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật phòng.' });
  }
};

// Xóa phòng
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({ _id: req.params.id, landlordId: req.user._id });
    if (!room) {
      return res.status(404).json({ message: 'Không tìm thấy phòng để xóa.' });
    }
    return res.status(200).json({ message: 'Xóa phòng thành công!' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ khi xóa phòng.' });
  }
};
