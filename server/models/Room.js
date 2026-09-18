const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  roomCode: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  tenantName: {
    type: String,
    required: true,
    trim: true,
  },
  tenantPhone: {
    type: String,
    required: true,
    trim: true,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  pricing: {
    electricityUnitPrice: { type: Number, required: true, default: 3500 },
    waterUnitPrice: { type: Number, required: true, default: 25000 },
    serviceFee: { type: Number, default: 100000 },
  },
  initialReading: {
    electricity: { type: Number, default: 0 },
    water: { type: Number, default: 0 },
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
  }
}, { timestamps: true });

// Tránh trùng mã phòng trong cùng 1 chủ trọ
roomSchema.index({ landlordId: 1, roomCode: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
