import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Card, CardBody, CardHeader } from '../components/Card';
import { StatusBadge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ProofViewerModal } from '../components/ProofViewerModal';
import {
  ArrowLeft,
  Calendar,
  Zap,
  Droplet,
  ShieldAlert,
  CheckCircle2,
  Copy,
  ExternalLink,
  ZoomIn,
  Edit3,
  Check,
  Building2,
  Phone,
  User,
  QrCode,
  MessageCircle
} from 'lucide-react';
import { quickSendZalo } from '../utils/zalo';

export const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal xem ảnh phóng to
  const [zoomPhoto, setZoomPhoto] = useState(null);
  const [zoomTitle, setZoomTitle] = useState('');

  // Modal điều chỉnh khiếu nại
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({
    newElectricityIndex: '',
    newWaterIndex: '',
    landlordResponse: '',
  });
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Trạng thái copy & Zalo
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState(false);
  const [zaloStatus, setZaloStatus] = useState('');

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data.invoice);
      setAdjustData({
        newElectricityIndex: res.data.invoice.readings?.electricity?.newIndex ?? '',
        newWaterIndex: res.data.invoice.readings?.water?.newIndex ?? '',
        landlordResponse: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Không tìm thấy hóa đơn hoặc phiên đăng nhập đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const copyTenantLink = () => {
    if (!invoice?.token) return;
    const url = `${window.location.origin}/bill/${invoice.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Gửi Zalo 1-chạm theo số điện thoại khách thuê
  const handleZaloSend = async () => {
    if (!invoice?.token) return;
    const roomData = invoice.roomId || invoice.room || {};
    const res = await quickSendZalo({
      phone: roomData.tenantPhone,
      roomName: `${roomData.roomCode || ''} - ${roomData.name || ''}`,
      tenantName: roomData.tenantName,
      monthYear: invoice.monthYear,
      roomFee: invoice.roomFee,
      elecInfo: {
        oldIndex: invoice.readings?.electricity?.oldIndex,
        newIndex: invoice.readings?.electricity?.newIndex,
        consumption: invoice.readings?.electricity?.consumption,
        amount: invoice.readings?.electricity?.amount,
        unitPrice: invoice.readings?.electricity?.unitPrice,
      },
      waterInfo: {
        oldIndex: invoice.readings?.water?.oldIndex,
        newIndex: invoice.readings?.water?.newIndex,
        consumption: invoice.readings?.water?.consumption,
        amount: invoice.readings?.water?.amount,
        unitPrice: invoice.readings?.water?.unitPrice,
      },
      serviceFee: invoice.serviceFee,
      totalAmount: invoice.totalAmount,
      token: invoice.token,
    });
    setZaloStatus(res.message);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setZaloStatus('');
    }, 5000);
  };

  // Duyệt thanh toán & khóa sổ
  const handleMarkAsPaid = async () => {
    if (!window.confirm('Xác nhận bạn đã nhận được tiền và muốn đóng công nợ kỳ này? Thao tác này sẽ khóa hóa đơn chống chỉnh sửa.')) {
      return;
    }
    try {
      setPaying(true);
      await api.patch(`/invoices/${id}/paid`, { note: 'Chủ trọ xác nhận chuyển khoản' });
      await fetchInvoice();
      alert('Đã khóa sổ công nợ thành công!');
    } catch (err) {
      alert('Lỗi xác nhận: ' + (err.response?.data?.message || err.message));
    } finally {
      setPaying(false);
    }
  };

  // Gửi điều chỉnh chỉ số
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      setAdjustSubmitting(true);
      await api.put(`/invoices/${id}/adjust`, {
        newElectricityIndex: Number(adjustData.newElectricityIndex),
        newWaterIndex: Number(adjustData.newWaterIndex),
        landlordResponse: adjustData.landlordResponse,
      });
      setIsAdjustModalOpen(false);
      await fetchInvoice();
      alert('Đã điều chỉnh chỉ số thành công!');
    } catch (err) {
      alert('Lỗi điều chỉnh: ' + (err.response?.data?.message || err.message));
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  const getFullImg = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:5000';
    return `${base}${path}`;
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Đang tải chi tiết hóa đơn...</div>;
  }

  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-red-600 font-medium">{error || 'Không tìm thấy hóa đơn.'}</p>
        <Button onClick={() => navigate('/dashboard')}>Về Bảng điều khiển</Button>
      </div>
    );
  }

  const room = invoice.roomId || invoice.room || {};
  const readings = invoice.readings || {};
  const elec = readings.electricity || {};
  const water = readings.water || {};

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Bảng điều khiển
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Gửi Zalo 1-chạm theo SĐT */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleZaloSend}
            className="text-xs bg-[#0068FF]/10 text-[#0068FF] border-[#0068FF]/30 hover:bg-[#0068FF]/20 font-semibold"
            title="Tự động copy hóa đơn và mở Zalo với khách"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <MessageCircle className="w-3.5 h-3.5 text-[#0068FF]" />}
            <span>{copied ? 'Đã copy & Mở Zalo!' : 'Gửi Zalo (SĐT)'}</span>
          </Button>

          {/* Nút Copy link */}
          <Button variant="outline" size="sm" onClick={copyTenantLink} className="text-xs">
            <Copy className="w-3.5 h-3.5" />
            <span>Sao chép link</span>
          </Button>

          {/* Mở xem với tư cách người thuê */}
          <a
            href={`/bill/${invoice.token}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Xem trang khách
          </a>
        </div>
      </div>

      {/* Thông báo trạng thái gửi Zalo */}
      {zaloStatus && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#0068FF] shrink-0" />
          <span>{zaloStatus}</span>
        </div>
      )}

      {/* CẢNH BÁO KHIẾU NẠI (STATUS 2) */}
      {invoice.status === 2 && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-100 text-red-600 shrink-0 mt-0.5">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-red-900 text-base">Khách Thuê Đã Báo Sai Lệch Chỉ Số!</h3>
                <p className="text-red-700 text-xs sm:text-sm mt-0.5">
                  Lý do phản ánh: <span className="font-semibold text-red-900">"{invoice.dispute?.tenantReason || 'Không có lý do chi tiết'}"</span>
                </p>
                <span className="text-[11px] text-red-500 mt-1 block">
                  Thời điểm báo: {invoice.dispute?.disputedAt ? new Date(invoice.dispute.disputedAt).toLocaleString('vi-VN') : 'Mới đây'}
                </span>
              </div>
            </div>

            <Button
              variant="dispute"
              size="sm"
              onClick={() => setIsAdjustModalOpen(true)}
              className="shrink-0 text-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Điều chỉnh số đo ngay
            </Button>
          </div>

          {/* Ảnh đối chứng do khách gửi */}
          {invoice.dispute?.tenantPhoto && (
            <div className="pt-3 border-t border-red-100 flex items-center gap-4">
              <span className="text-xs font-semibold text-red-800">Ảnh đối chứng từ khách:</span>
              <div
                onClick={() => {
                  setZoomPhoto(invoice.dispute.tenantPhoto);
                  setZoomTitle('Ảnh chụp đối chứng của khách thuê');
                }}
                className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-red-300 cursor-pointer shadow-sm"
              >
                <img src={getFullImg(invoice.dispute.tenantPhoto)} alt="Ảnh đối chứng" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <ZoomIn className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs text-red-600 italic">Bấm vào ảnh để phóng to đối chiếu với đồng hồ vật lý</span>
            </div>
          )}
        </div>
      )}

      {/* Thông tin hóa đơn tổng quát */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">Hóa Đơn Kỳ {invoice.monthYear}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Mã phòng: <b className="text-slate-800">{room?.roomCode}</b> - {room?.name}</p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-semibold">Tổng tiền thanh toán</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">
              {formatVND(invoice.totalAmount)}
            </div>
          </div>
        </CardHeader>

        <CardBody className="p-6 space-y-6">
          {/* Thông tin người thuê */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block">Đại diện thuê:</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{room?.tenantName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Số điện thoại:</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{room?.tenantPhone}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Tiền thuê phòng cố định:</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{formatVND(invoice.roomFee)}</span>
            </div>
          </div>

          {/* Chi tiết Số điện & Ảnh */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600"><Zap className="w-4 h-4" /></div>
                <h3 className="font-bold text-slate-800 text-sm">Điện Sinh Hoạt</h3>
              </div>
              <span className="text-xs text-slate-500">Đơn giá: <b>{elec.unitPrice ? Number(elec.unitPrice).toLocaleString() : '3.500'}đ</b> / kWh</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-400">Số cũ</div>
                <div className="font-bold text-slate-700 text-sm mt-1">{elec.oldIndex ?? 0}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-400">Số mới</div>
                <div className="font-bold text-blue-600 text-sm mt-1">{elec.newIndex ?? 0}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-blue-500">Tiêu thụ</div>
                <div className="font-bold text-blue-700 text-sm mt-1">{elec.consumption ?? 0} kWh</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-400">Thành tiền điện</div>
                <div className="font-bold text-slate-800 text-sm mt-1">{formatVND(elec.amount)}</div>
              </div>
            </div>

            {/* Ảnh công tơ điện */}
            {elec.meterPhoto && (
              <div className="flex items-center gap-3 pt-1">
                <div
                  onClick={() => {
                    setZoomPhoto(elec.meterPhoto);
                    setZoomTitle('Ảnh chụp công tơ điện gốc của chủ trọ');
                  }}
                  className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-300 cursor-pointer shadow-sm"
                >
                  <img src={getFullImg(elec.meterPhoto)} alt="Ảnh đồng hồ điện" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700 block">Ảnh minh chứng đồng hồ điện</span>
                  Chạm để phóng to soi rõ chữ số
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100"></div>

          {/* Chi tiết Số nước & Ảnh */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-600"><Droplet className="w-4 h-4" /></div>
                <h3 className="font-bold text-slate-800 text-sm">Nước Sinh Hoạt</h3>
              </div>
              <span className="text-xs text-slate-500">Đơn giá: <b>{water.unitPrice ? Number(water.unitPrice).toLocaleString() : '25.000'}đ</b> / m³</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-400">Số cũ</div>
                <div className="font-bold text-slate-700 text-sm mt-1">{water.oldIndex ?? 0}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-400">Số mới</div>
                <div className="font-bold text-cyan-600 text-sm mt-1">{water.newIndex ?? 0}</div>
              </div>
              <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                <div className="text-cyan-600">Tiêu thụ</div>
                <div className="font-bold text-cyan-800 text-sm mt-1">{water.consumption ?? 0} m³</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-400">Thành tiền nước</div>
                <div className="font-bold text-slate-800 text-sm mt-1">{formatVND(water.amount)}</div>
              </div>
            </div>

            {/* Ảnh công tơ nước */}
            {water.meterPhoto && (
              <div className="flex items-center gap-3 pt-1">
                <div
                  onClick={() => {
                    setZoomPhoto(water.meterPhoto);
                    setZoomTitle('Ảnh chụp công tơ nước gốc của chủ trọ');
                  }}
                  className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-300 cursor-pointer shadow-sm"
                >
                  <img src={getFullImg(water.meterPhoto)} alt="Ảnh đồng hồ nước" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700 block">Ảnh minh chứng đồng hồ nước</span>
                  Chạm để phóng to soi rõ chữ số
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100"></div>

          {/* Phí dịch vụ */}
          <div className="flex justify-between items-center text-sm py-2">
            <span className="text-slate-600">Phí dịch vụ chung (Wifi, vệ sinh, rác):</span>
            <span className="font-bold text-slate-800">{formatVND(invoice.serviceFee)}</span>
          </div>

          {/* Thanh toán & Khóa sổ */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {invoice.status === 3 ? (
                <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Đã nhận thanh toán & Khóa sổ{invoice.payment?.paidAt ? ` vào: ${new Date(invoice.payment.paidAt).toLocaleString('vi-VN')}` : ''}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500">
                  Sau khi kiểm tra tài khoản ngân hàng thấy khách đã chuyển khoản, hãy bấm nút duyệt để đóng công nợ.
                </span>
              )}
            </div>

            {invoice.status !== 3 && (
              <Button
                variant="success"
                loading={paying}
                onClick={handleMarkAsPaid}
                className="text-sm font-semibold"
              >
                <Check className="w-4 h-4" />
                Xác nhận đã nhận tiền (Khóa sổ)
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Modal Điều chỉnh chỉ số */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Điều chỉnh lại chỉ số do khách khiếu nại"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4 text-sm">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            Khách phản ánh: "{invoice.dispute?.tenantReason || 'Không có mô tả'}"
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện mới chuẩn</label>
              <input
                type="number"
                required
                min={elec.oldIndex ?? 0}
                value={adjustData.newElectricityIndex}
                onChange={(e) => setAdjustData({ ...adjustData, newElectricityIndex: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số nước mới chuẩn</label>
              <input
                type="number"
                required
                min={water.oldIndex ?? 0}
                value={adjustData.newWaterIndex}
                onChange={(e) => setAdjustData({ ...adjustData, newWaterIndex: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú giải thích cho khách (nếu có)</label>
            <input
              type="text"
              placeholder="Chủ trọ đã kiểm tra lại đồng hồ và cập nhật số đúng nhé"
              value={adjustData.landlordResponse}
              onChange={(e) => setAdjustData({ ...adjustData, landlordResponse: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsAdjustModalOpen(false)}>Hủy</Button>
            <Button type="submit" loading={adjustSubmitting}>Cập nhật lại hóa đơn</Button>
          </div>
        </form>
      </Modal>

      {/* Lightbox Zoom */}
      <ProofViewerModal
        isOpen={Boolean(zoomPhoto)}
        onClose={() => setZoomPhoto(null)}
        photoUrl={zoomPhoto}
        title={zoomTitle}
      />
    </div>
  );
};
