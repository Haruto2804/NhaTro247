import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import {
  DoorOpen,
  Plus,
  Edit2,
  Trash2,
  Phone,
  User,
  Zap,
  Droplet,
  Shield,
  Search
} from 'lucide-react';

export const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    roomCode: '',
    name: '',
    tenantName: '',
    tenantPhone: '',
    basePrice: 2500000,
    pricing: {
      electricityUnitPrice: 3500,
      waterUnitPrice: 25000,
      serviceFee: 100000,
    },
    initialReading: {
      electricity: 0,
      water: 0,
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rooms');
      setRooms(res.data.rooms);
    } catch (err) {
      console.error('Lỗi tải danh sách phòng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRoom(null);
    setFormData({
      roomCode: '',
      name: '',
      tenantName: '',
      tenantPhone: '',
      basePrice: 2500000,
      pricing: {
        electricityUnitPrice: 3500,
        waterUnitPrice: 25000,
        serviceFee: 100000,
      },
      initialReading: {
        electricity: 0,
        water: 0,
      }
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      roomCode: room.roomCode,
      name: room.name,
      tenantName: room.tenantName,
      tenantPhone: room.tenantPhone,
      basePrice: room.basePrice,
      pricing: {
        electricityUnitPrice: room.pricing?.electricityUnitPrice || 3500,
        waterUnitPrice: room.pricing?.waterUnitPrice || 25000,
        serviceFee: room.pricing?.serviceFee || 100000,
      },
      initialReading: {
        electricity: room.initialReading?.electricity || 0,
        water: room.initialReading?.water || 0,
      }
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, formData);
      } else {
        await api.post('/rooms', formData);
      }
      setIsModalOpen(false);
      await fetchRooms();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin phòng.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (roomId, roomCode) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phòng "${roomCode}" khỏi hệ thống không?`)) {
      return;
    }
    try {
      await api.delete(`/rooms/${roomId}`);
      await fetchRooms();
    } catch (err) {
      alert('Không thể xóa phòng: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  const filtered = rooms.filter(r =>
    r.roomCode.toLowerCase().includes(search.toLowerCase()) ||
    r.tenantName.toLowerCase().includes(search.toLowerCase()) ||
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Danh Mục Phòng Trọ</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý danh sách phòng, người thuê và cấu hình đơn giá điện nước riêng biệt</p>
        </div>
        <Button onClick={handleOpenCreateModal} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Thêm phòng mới
        </Button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Tìm theo mã phòng, tên phòng hoặc người thuê..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* Room Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Đang tải danh sách phòng...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody className="p-12 text-center space-y-3">
            <DoorOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-500 text-sm">Chưa có phòng nào được tạo hoặc không tìm thấy kết quả phù hợp.</p>
            <Button size="sm" onClick={handleOpenCreateModal}>Thêm phòng đầu tiên</Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(room => (
            <Card key={room._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {room.roomCode}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{room.name}</h3>
                    <span className="text-xs text-emerald-600 font-bold">{formatVND(room.basePrice)}/tháng</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(room)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(room._id, room.roomCode)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Xóa phòng"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>

              <CardBody className="p-5 space-y-4">
                {/* Tenant info */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{room.tenantName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{room.tenantPhone}</span>
                  </div>
                </div>

                {/* Price structure */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                    <div className="text-[10px] text-blue-600 font-medium">Điện / kWh</div>
                    <div className="font-bold text-slate-800 mt-0.5">{room.pricing?.electricityUnitPrice?.toLocaleString()}đ</div>
                  </div>
                  <div className="p-2 rounded-lg bg-cyan-50/50 border border-cyan-100">
                    <div className="text-[10px] text-cyan-600 font-medium">Nước / m³</div>
                    <div className="font-bold text-slate-800 mt-0.5">{room.pricing?.waterUnitPrice?.toLocaleString()}đ</div>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-50/50 border border-purple-100">
                    <div className="text-[10px] text-purple-600 font-medium">Phí DV gộp</div>
                    <div className="font-bold text-slate-800 mt-0.5">{room.pricing?.serviceFee?.toLocaleString()}đ</div>
                  </div>
                </div>

                {/* Initial Readings */}
                <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
                  <span>Số điện ban đầu: <b className="text-slate-600">{room.initialReading?.electricity || 0}</b></span>
                  <span>Số nước ban đầu: <b className="text-slate-600">{room.initialReading?.water || 0}</b></span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Thêm / Sửa phòng */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? `Chỉnh sửa phòng: ${editingRoom.roomCode}` : 'Thêm phòng trọ mới'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã phòng *</label>
              <input
                type="text"
                placeholder="P.101"
                required
                value={formData.roomCode}
                onChange={(e) => setFormData({ ...formData, roomCode: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên phòng *</label>
              <input
                type="text"
                placeholder="Phòng 101 - Tầng 1"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Người thuê đại diện *</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                required
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại *</label>
              <input
                type="tel"
                placeholder="0912345678"
                required
                value={formData.tenantPhone}
                onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tiền thuê phòng cố định (VNĐ/tháng) *</label>
            <input
              type="number"
              min="0"
              step="10000"
              required
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Cấu hình đơn giá */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-700 block mb-2">Cấu hình đơn giá dịch vụ:</span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Điện (VNĐ/kWh)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.pricing.electricityUnitPrice}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, electricityUnitPrice: Number(e.target.value) }
                  })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Nước (VNĐ/m³)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.pricing.waterUnitPrice}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, waterUnitPrice: Number(e.target.value) }
                  })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Phí DV gộp (Wifi, rác...)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.pricing.serviceFee}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, serviceFee: Number(e.target.value) }
                  })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Chỉ số ban đầu */}
          {!editingRoom && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700 block mb-2">Chỉ số công tơ lúc bắt đầu nhận phòng:</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Số điện ban đầu (kWh)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.initialReading.electricity}
                    onChange={(e) => setFormData({
                      ...formData,
                      initialReading: { ...formData.initialReading, electricity: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Số nước ban đầu (m³)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.initialReading.water}
                    onChange={(e) => setFormData({
                      ...formData,
                      initialReading: { ...formData.initialReading, water: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" loading={submitting}>
              {editingRoom ? 'Cập nhật phòng' : 'Tạo phòng'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
