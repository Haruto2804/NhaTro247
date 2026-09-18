import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import {
  Zap,
  Droplet,
  Camera,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  FileCheck,
  Building2,
  ArrowLeft
} from 'lucide-react';

export const RecordInvoicePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const getCurrentMonthYear = () => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${mm}-${yyyy}`;
  };

  const initialRoomId = searchParams.get('roomId') || '';
  const initialMonthYear = searchParams.get('monthYear') || getCurrentMonthYear();

  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);
  const [monthYear, setMonthYear] = useState(initialMonthYear);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Dữ liệu chỉ số cũ
  const [oldReadings, setOldReadings] = useState({ electricity: 0, water: 0 });
  const [fetchingOld, setFetchingOld] = useState(false);

  // Form input
  const [newElectricity, setNewElectricity] = useState('');
  const [newWater, setNewWater] = useState('');
  const [electricityPhoto, setElectricityPhoto] = useState(null);
  const [waterPhoto, setWaterPhoto] = useState(null);
  const [electricityPreview, setElectricityPreview] = useState('');
  const [waterPreview, setWaterPreview] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Tải danh sách phòng
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        const res = await api.get('/rooms');
        setRooms(res.data.rooms);
        if (!selectedRoomId && res.data.rooms.length > 0) {
          setSelectedRoomId(res.data.rooms[0]._id);
        }
      } catch (err) {
        console.error('Lỗi tải phòng:', err);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  // Lấy chỉ số cũ của phòng được chọn
  useEffect(() => {
    const fetchPreviousReading = async () => {
      if (!selectedRoomId) return;
      try {
        setFetchingOld(true);
        // Lấy hóa đơn mới nhất của phòng này
        const res = await api.get(`/invoices?roomId=${selectedRoomId}`);
        const invoices = res.data.invoices || [];

        const selectedRoom = rooms.find(r => r._id === selectedRoomId);

        if (invoices.length > 0) {
          const latest = invoices[0];
          setOldReadings({
            electricity: latest.readings.electricity.newIndex,
            water: latest.readings.water.newIndex,
          });
        } else if (selectedRoom) {
          setOldReadings({
            electricity: selectedRoom.initialReading?.electricity || 0,
            water: selectedRoom.initialReading?.water || 0,
          });
        }
      } catch (err) {
        console.error('Lỗi lấy chỉ số cũ:', err);
      } finally {
        setFetchingOld(false);
      }
    };

    fetchPreviousReading();
  }, [selectedRoomId, rooms]);

  const selectedRoom = rooms.find(r => r._id === selectedRoomId);

  // Xử lý chọn ảnh & xem trước thumbnail
  const handleElectricityPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setElectricityPhoto(file);
      setElectricityPreview(URL.createObjectURL(file));
    }
  };

  const handleWaterPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWaterPhoto(file);
      setWaterPreview(URL.createObjectURL(file));
    }
  };

  // Tính toán trực tiếp
  const newElecNum = newElectricity === '' ? 0 : Number(newElectricity);
  const newWaterNum = newWater === '' ? 0 : Number(newWater);

  const elecConsumption = Math.max(0, newElecNum - oldReadings.electricity);
  const waterConsumption = Math.max(0, newWaterNum - oldReadings.water);

  const elecPrice = selectedRoom?.pricing?.electricityUnitPrice || 3500;
  const waterPrice = selectedRoom?.pricing?.waterUnitPrice || 25000;
  const serviceFee = selectedRoom?.pricing?.serviceFee || 0;
  const roomFee = selectedRoom?.basePrice || 0;

  const elecAmount = (newElectricity !== '' && newElecNum >= oldReadings.electricity) ? elecConsumption * elecPrice : 0;
  const waterAmount = (newWater !== '' && newWaterNum >= oldReadings.water) ? waterConsumption * waterPrice : 0;
  const totalAmount = roomFee + elecAmount + waterAmount + serviceFee;

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedRoomId) {
      setError('Vui lòng chọn phòng cần chốt số.');
      return;
    }

    if (newElectricity === '' || newWater === '') {
      setError('Vui lòng nhập đầy đủ chỉ số điện và nước mới.');
      return;
    }

    if (newElecNum < oldReadings.electricity) {
      setError(`Số điện mới (${newElecNum}) không được nhỏ hơn số cũ (${oldReadings.electricity}).`);
      return;
    }

    if (newWaterNum < oldReadings.water) {
      setError(`Số nước mới (${newWaterNum}) không được nhỏ hơn số cũ (${oldReadings.water}).`);
      return;
    }

    if (!electricityPhoto || !waterPhoto) {
      setError('Bắt buộc phải tải lên/chụp ảnh thực tế của cả đồng hồ điện và đồng hồ nước để làm căn cứ đối soát.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('roomId', selectedRoomId);
      formData.append('monthYear', monthYear);
      formData.append('newElectricityIndex', newElecNum);
      formData.append('newWaterIndex', newWaterNum);
      formData.append('electricityPhoto', electricityPhoto);
      formData.append('waterPhoto', waterPhoto);

      const res = await api.post('/invoices', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Chốt số thành công! Đã lập hóa đơn kỳ ' + monthYear);
      navigate(`/invoices/${res.data.invoice._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo hóa đơn.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại Bảng điều khiển
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Chốt Số Điện Nước Kỳ Mới</h1>
        <p className="text-slate-500 text-sm mt-1">Ghi nhận chỉ số, tải ảnh công tơ thực tế và tự động xuất hóa đơn có mã VietQR</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Chọn phòng & Kỳ tháng */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-800">1. Thông Tin Phòng & Kỳ Đối Soát</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Chọn phòng trọ *</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {loadingRooms ? (
                  <option>Đang tải danh sách phòng...</option>
                ) : (
                  rooms.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.roomCode} - {r.name} ({r.tenantName})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kỳ tháng chốt số *</label>
              <input
                type="month"
                value={monthYear.split('-').reverse().join('-')}
                onChange={(e) => {
                  if (e.target.value) {
                    const [yyyy, mm] = e.target.value.split('-');
                    setMonthYear(`${mm}-${yyyy}`);
                  }
                }}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </CardBody>
        </Card>

        {/* Chốt số điện & Chụp ảnh */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">2. Chỉ Số Điện & Ảnh Công Tơ</h2>
            </div>
            <span className="text-xs text-blue-600 font-semibold">{elecPrice.toLocaleString()}đ / kWh</span>
          </CardHeader>

          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Chỉ số điện cũ (kỳ trước)</label>
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-700">
                  {fetchingOld ? '...' : oldReadings.electricity} kWh
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chỉ số điện mới (trên đồng hồ) *</label>
                <input
                  type="number"
                  placeholder={`≥ ${oldReadings.electricity}`}
                  min={oldReadings.electricity}
                  required
                  value={newElectricity}
                  onChange={(e) => setNewElectricity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Upload ảnh công tơ điện */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ảnh chụp thực tế mặt đồng hồ điện * (Bắt buộc)
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 text-xs font-medium cursor-pointer transition-colors">
                  <Camera className="w-4 h-4" />
                  <span>Chụp / Tải ảnh đồng hồ điện</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleElectricityPhotoChange}
                    className="hidden"
                  />
                </label>

                {electricityPreview && (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300 shadow-sm shrink-0">
                    <img src={electricityPreview} alt="Xem trước điện" className="w-full h-full object-cover" />
                  </div>
                )}
                {electricityPhoto && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Đã chọn ảnh
                  </span>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Chốt số nước & Chụp ảnh */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center">
                <Droplet className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">3. Chỉ Số Nước & Ảnh Công Tơ</h2>
            </div>
            <span className="text-xs text-cyan-600 font-semibold">{waterPrice.toLocaleString()}đ / m³</span>
          </CardHeader>

          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Chỉ số nước cũ (kỳ trước)</label>
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-700">
                  {fetchingOld ? '...' : oldReadings.water} m³
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chỉ số nước mới (trên đồng hồ) *</label>
                <input
                  type="number"
                  placeholder={`≥ ${oldReadings.water}`}
                  min={oldReadings.water}
                  required
                  value={newWater}
                  onChange={(e) => setNewWater(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Upload ảnh công tơ nước */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ảnh chụp thực tế mặt đồng hồ nước * (Bắt buộc)
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-cyan-400 bg-cyan-50/50 hover:bg-cyan-100/50 text-cyan-700 text-xs font-medium cursor-pointer transition-colors">
                  <Camera className="w-4 h-4" />
                  <span>Chụp / Tải ảnh đồng hồ nước</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleWaterPhotoChange}
                    className="hidden"
                  />
                </label>

                {waterPreview && (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300 shadow-sm shrink-0">
                    <img src={waterPreview} alt="Xem trước nước" className="w-full h-full object-cover" />
                  </div>
                )}
                {waterPhoto && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Đã chọn ảnh
                  </span>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tự động tính tiền chi tiết */}
        <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-800">4. Bảng Tính Tiền Tự Động</h2>
          </CardHeader>
          <CardBody className="p-6 space-y-3">
            <div className="flex justify-between text-sm py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Tiền thuê phòng:</span>
              <span className="font-bold text-slate-800">{formatVND(roomFee)}</span>
            </div>

            <div className="flex justify-between text-sm py-1.5 border-b border-slate-100">
              <span className="text-slate-600">
                Tiền điện ({elecConsumption} kWh &times; {elecPrice.toLocaleString()}đ):
              </span>
              <span className="font-bold text-blue-600">{formatVND(elecAmount)}</span>
            </div>

            <div className="flex justify-between text-sm py-1.5 border-b border-slate-100">
              <span className="text-slate-600">
                Tiền nước ({waterConsumption} m³ &times; {waterPrice.toLocaleString()}đ):
              </span>
              <span className="font-bold text-cyan-600">{formatVND(waterAmount)}</span>
            </div>

            <div className="flex justify-between text-sm py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Phí dịch vụ chung (Wifi, rác...):</span>
              <span className="font-bold text-slate-800">{formatVND(serviceFee)}</span>
            </div>

            <div className="flex justify-between items-baseline pt-2">
              <span className="text-base font-bold text-slate-900">TỔNG CỘNG PHẢI THU:</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                {formatVND(totalAmount)}
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Ghi chú tự động gửi Zalo */}
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            <span>
              ⚡ <b>Tự động gửi Zalo:</b> Ngay khi bấm xuất hóa đơn, hệ thống sẽ tự động gửi bảng kê chi tiết và mã <b>VietQR</b> đến số điện thoại khách thuê <b>{selectedRoom?.tenantPhone || '...'}</b> (nếu đã kết nối Zalo trong Cài đặt).
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={() => navigate('/dashboard')}>
            Hủy
          </Button>
          <Button type="submit" loading={submitting} className="min-w-[180px]">
            <FileCheck className="w-4 h-4" />
            Lưu & Xuất Hóa Đơn
          </Button>
        </div>
      </form>
    </div>
  );
};
