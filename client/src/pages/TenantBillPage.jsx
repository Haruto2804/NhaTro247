import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Card, CardBody, CardHeader } from '../components/Card';
import { StatusBadge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ProofViewerModal } from '../components/ProofViewerModal';
import {
  Building2,
  Zap,
  Droplet,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Copy,
  Check,
  ZoomIn,
  QrCode,
  ShieldCheck,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';

export const TenantBillPage = () => {
  const { token } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Zoom lightbox
  const [zoomPhoto, setZoomPhoto] = useState(null);
  const [zoomTitle, setZoomTitle] = useState('');

  // Dispute modal
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputePhoto, setDisputePhoto] = useState(null);
  const [disputePreview, setDisputePreview] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeError, setDisputeError] = useState('');

  // Copy buttons
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/public/invoices/${token}`);
      setInvoice(res.data.invoice);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tìm thấy hóa đơn hoặc đường dẫn đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBill();
  }, [token]);

  // Hành động: Khách bấm Xác nhận đúng chỉ số
  const handleConfirm = async () => {
    try {
      await api.post(`/public/invoices/${token}/confirm`);
      setConfirmSuccess(true);
      // Cuộn xuống khu vực thanh toán
      const qrSection = document.getElementById('payment-section');
      if (qrSection) {
        qrSection.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      alert('Có lỗi khi xác nhận: ' + (err.response?.data?.message || err.message));
    }
  };

  // Hành động: Khách gửi Báo sai lệch chỉ số
  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    setDisputeError('');

    if (!disputeReason.trim()) {
      setDisputeError('Vui lòng nhập lý do phát hiện sai lệch.');
      return;
    }

    if (!disputePhoto) {
      setDisputeError('Bắt buộc phải tải lên ảnh chụp thực tế đồng hồ để làm căn cứ.');
      return;
    }

    try {
      setDisputeSubmitting(true);
      const formData = new FormData();
      formData.append('reason', disputeReason);
      formData.append('disputePhoto', disputePhoto);

      const res = await api.post(`/public/invoices/${token}/dispute`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setInvoice(res.data.invoice);
      setIsDisputeModalOpen(false);
      alert('Gửi báo cáo sai lệch thành công! Chủ trọ sẽ đối chiếu và xử lý sớm nhất.');
    } catch (err) {
      setDisputeError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi khiếu nại.');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'acc') {
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  const getFullImg = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:5000';
    return `${base}${url}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 text-sm font-medium">Đang tải hóa đơn đối soát...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Không Thể Mở Hóa Đơn</h2>
          <p className="text-slate-500 text-sm">{error || 'Đường dẫn hóa đơn không tồn tại hoặc đã bị gỡ.'}</p>
        </Card>
      </div>
    );
  }

  const { readings, roomId: room, landlordId: landlord } = invoice;
  const isPaid = invoice.status === 3;
  const isDisputed = invoice.status === 2;

  return (
    <div className="min-h-screen bg-slate-100/60 pb-16">
      {/* Top Mobile Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              247
            </div>
            <span className="font-bold text-slate-800 text-sm">Hóa Đơn Đối Soát Hai Chiều</span>
          </div>
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* BANNER NẾU ĐÃ THANH TOÁN (STATUS 3) */}
        {isPaid && (
          <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">ĐÃ HOÀN TẤT THANH TOÁN</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Chủ trọ đã xác nhận khớp giao dịch vào lúc {new Date(invoice.payment?.paidAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        )}

        {/* BANNER NẾU ĐANG KHIẾU NẠI (STATUS 2) */}
        {isDisputed && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-red-900">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Đang khiếu nại sai lệch chỉ số</span>
            </div>
            <p className="text-xs text-red-700">
              Lý do bạn gửi: <b className="text-red-900">"{invoice.dispute?.tenantReason}"</b>
            </p>
            <p className="text-[11px] text-red-500">
              Chủ trọ đang đối chiếu với đồng hồ vật lý để cập nhật lại hóa đơn cho bạn.
            </p>
          </div>
        )}

        {/* THÔNG BÁO XÁC NHẬN ĐÚNG */}
        {confirmSuccess && !isPaid && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Bạn đã xác nhận đúng chỉ số! Vui lòng quét mã VietQR bên dưới để thanh toán nhé.</span>
          </div>
        )}

        {/* THÔNG TIN PHÒNG & KỲ */}
        <Card className="border-slate-200">
          <CardBody className="p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Kỳ thanh toán</span>
                <h2 className="text-xl font-bold text-slate-900">Tháng {invoice.monthYear.replace('-', '/')}</h2>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Phòng</span>
                <div className="text-xl font-extrabold text-blue-600">{room?.roomCode}</div>
              </div>
            </div>

            <div className="pt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>Người thuê: <b className="text-slate-800">{room?.tenantName}</b></div>
              <div>Chủ trọ: <b className="text-slate-800">{landlord?.name}</b></div>
            </div>
          </CardBody>
        </Card>

        {/* CHI TIẾT SỐ ĐIỆN KÈM ẢNH ĐỐI CHỨNG */}
        <Card className="border-slate-200">
          <CardHeader className="py-3 px-4 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800 text-sm">Điện Sinh Hoạt</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Đơn giá: {readings.electricity.unitPrice?.toLocaleString()}đ</span>
          </CardHeader>
          <CardBody className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-400 text-[11px]">Số cũ</div>
                <div className="font-bold text-slate-700 text-sm mt-0.5">{readings.electricity.oldIndex}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-400 text-[11px]">Số mới chốt</div>
                <div className="font-bold text-blue-600 text-sm mt-0.5">{readings.electricity.newIndex}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                <div className="text-blue-500 text-[11px]">Tiêu thụ</div>
                <div className="font-bold text-blue-700 text-sm mt-0.5">{readings.electricity.consumption} kWh</div>
              </div>
            </div>

            {/* Ảnh chụp công tơ điện */}
            {readings.electricity.meterPhoto && (
              <div
                onClick={() => {
                  setZoomPhoto(readings.electricity.meterPhoto);
                  setZoomTitle('Ảnh đồng hồ điện chủ trọ chụp');
                }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={getFullImg(readings.electricity.meterPhoto)}
                    alt="Đồng hồ điện"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-300 shadow-xs"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Xem ảnh chụp công tơ điện</span>
                    <span className="text-[11px] text-blue-600">Chạm để phóng to đối chiếu số đo</span>
                  </div>
                </div>
                <ZoomIn className="w-4 h-4 text-slate-400" />
              </div>
            )}

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-slate-500">Thành tiền điện:</span>
              <span className="font-bold text-slate-800 text-sm">{formatVND(readings.electricity.amount)}</span>
            </div>
          </CardBody>
        </Card>

        {/* CHI TIẾT SỐ NƯỚC KÈM ẢNH ĐỐI CHỨNG */}
        <Card className="border-slate-200">
          <CardHeader className="py-3 px-4 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-cyan-600" />
              <span className="font-bold text-slate-800 text-sm">Nước Sinh Hoạt</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Đơn giá: {readings.water.unitPrice?.toLocaleString()}đ</span>
          </CardHeader>
          <CardBody className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-400 text-[11px]">Số cũ</div>
                <div className="font-bold text-slate-700 text-sm mt-0.5">{readings.water.oldIndex}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-400 text-[11px]">Số mới chốt</div>
                <div className="font-bold text-cyan-600 text-sm mt-0.5">{readings.water.newIndex}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100">
                <div className="text-cyan-600 text-[11px]">Tiêu thụ</div>
                <div className="font-bold text-cyan-800 text-sm mt-0.5">{readings.water.consumption} m³</div>
              </div>
            </div>

            {/* Ảnh chụp công tơ nước */}
            {readings.water.meterPhoto && (
              <div
                onClick={() => {
                  setZoomPhoto(readings.water.meterPhoto);
                  setZoomTitle('Ảnh đồng hồ nước chủ trọ chụp');
                }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={getFullImg(readings.water.meterPhoto)}
                    alt="Đồng hồ nước"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-300 shadow-xs"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Xem ảnh chụp công tơ nước</span>
                    <span className="text-[11px] text-cyan-600">Chạm để phóng to đối chiếu số đo</span>
                  </div>
                </div>
                <ZoomIn className="w-4 h-4 text-slate-400" />
              </div>
            )}

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-slate-500">Thành tiền nước:</span>
              <span className="font-bold text-slate-800 text-sm">{formatVND(readings.water.amount)}</span>
            </div>
          </CardBody>
        </Card>

        {/* CÁC KHOẢN PHÍ CỐ ĐỊNH & TỔNG TIỀN */}
        <Card className="border-blue-200 bg-gradient-to-b from-white to-blue-50/20">
          <CardBody className="p-5 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Tiền thuê phòng:</span>
              <span className="font-semibold text-slate-800">{formatVND(invoice.roomFee)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Phí dịch vụ chung (Wifi, rác...):</span>
              <span className="font-semibold text-slate-800">{formatVND(invoice.serviceFee)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2.5 flex justify-between items-baseline">
              <span className="font-bold text-slate-900 text-sm">TỔNG CỘNG PHẢI NỘP:</span>
              <span className="text-2xl font-extrabold text-blue-600">{formatVND(invoice.totalAmount)}</span>
            </div>
          </CardBody>
        </Card>

        {/* NÚT ĐỐI SOÁT HAI CHIỀU: XÁC NHẬN ĐÚNG HOẶC BÁO SAI */}
        {!isPaid && !isDisputed && (
          <div className="space-y-2.5 pt-1">
            <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Vui lòng kiểm tra đồng hồ trước cửa phòng và chọn xác nhận:</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="dispute"
                onClick={() => {
                  setDisputeReason('');
                  setDisputePhoto(null);
                  setDisputePreview('');
                  setIsDisputeModalOpen(true);
                }}
                className="w-full text-xs font-semibold"
              >
                Báo sai lệch chỉ số
              </Button>

              <Button
                variant="success"
                onClick={handleConfirm}
                className="w-full text-xs font-semibold"
              >
                <Check className="w-4 h-4" />
                Xác nhận đúng
              </Button>
            </div>
          </div>
        )}

        {/* KHUNG THANH TOÁN VIETQR */}
        <div id="payment-section">
          <Card className="border-blue-200 overflow-hidden shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-3.5">
              <div className="flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5" />
                <h3 className="font-bold text-sm tracking-wide">Quét Mã VietQR Chuyển Khoản Trực Tiếp</h3>
              </div>
            </CardHeader>

            <CardBody className="p-6 flex flex-col items-center space-y-4">
              {invoice.payment?.qrUrl ? (
                <>
                  <div className="p-3 bg-white rounded-2xl border-2 border-blue-100 shadow-sm relative">
                    <img
                      src={invoice.payment.qrUrl}
                      alt="VietQR NAPAS 247"
                      className="w-56 h-56 object-contain rounded-lg"
                    />

                    {/* Con dấu ĐÃ THANH TOÁN */}
                    {isPaid && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="border-4 border-emerald-600 text-emerald-600 font-extrabold text-lg px-4 py-2 rounded-xl -rotate-12 uppercase tracking-widest shadow-lg">
                          ✓ ĐÃ THANH TOÁN
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 text-center max-w-xs">
                    Mã QR đã được tích hợp đúng số tiền <b>{formatVND(invoice.totalAmount)}</b> và nội dung chuyển khoản tự động.
                  </p>

                  {/* Chi tiết tài khoản & Copy */}
                  {landlord?.bankingInfo && (
                    <div className="w-full bg-slate-50 rounded-xl p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Ngân hàng:</span>
                        <span className="font-bold text-slate-800">{landlord.bankingInfo.bankName || 'Ngân hàng thụ hưởng'}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Số tài khoản:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{landlord.bankingInfo.accountNumber}</span>
                          <button
                            onClick={() => copyToClipboard(landlord.bankingInfo.accountNumber, 'acc')}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                            title="Sao chép số tài khoản"
                          >
                            {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Chủ tài khoản:</span>
                        <span className="font-bold text-slate-800 uppercase">{landlord.bankingInfo.accountHolder}</span>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Số tiền:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-600">{formatVND(invoice.totalAmount)}</span>
                          <button
                            onClick={() => copyToClipboard(invoice.totalAmount, 'amount')}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                            title="Sao chép số tiền"
                          >
                            {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Chủ trọ chưa cập nhật thông tin ngân hàng. Vui lòng liên hệ trực tiếp chủ trọ để thanh toán.
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 pt-2">
          Hệ thống Nhà Trọ 247 · Minh bạch chỉ số · Khép kín đối soát
        </div>
      </div>

      {/* MODAL BÁO SAI LỆCH CHỈ SỐ */}
      <Modal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        title="Báo sai lệch chỉ số điện nước"
      >
        <form onSubmit={handleDisputeSubmit} className="space-y-4 text-sm">
          {disputeError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {disputeError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mô tả chi tiết sai lệch bạn phát hiện *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ví dụ: Đồng hồ điện phòng em hiện tại chỉ là 1.250 chứ không phải 1.350 như hóa đơn ạ..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chụp ảnh đồng hồ thực tế của bạn * (Bắt buộc)
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-red-300 bg-red-50/50 hover:bg-red-100/50 text-red-700 text-xs font-semibold cursor-pointer transition-colors">
                <Camera className="w-5 h-5" />
                <span>Chụp / Tải ảnh đồng hồ làm bằng chứng</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  required
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (f) {
                      setDisputePhoto(f);
                      setDisputePreview(URL.createObjectURL(f));
                    }
                  }}
                  className="hidden"
                />
              </label>

              {disputePreview && (
                <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <img src={disputePreview} alt="Bằng chứng" className="w-16 h-16 object-cover rounded-md" />
                  <span className="text-xs text-slate-600 font-medium truncate">Đã chọn ảnh làm bằng chứng</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsDisputeModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="dispute" type="submit" loading={disputeSubmitting}>
              Gửi phản ánh cho chủ trọ
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lightbox zoom */}
      <ProofViewerModal
        isOpen={Boolean(zoomPhoto)}
        onClose={() => setZoomPhoto(null)}
        photoUrl={zoomPhoto}
        title={zoomTitle}
      />
    </div>
  );
};
