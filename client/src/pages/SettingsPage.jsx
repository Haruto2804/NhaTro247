import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { QrCode, Building, CreditCard, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';

const VIETNAM_BANKS = [
  { code: '970436', name: 'Vietcombank (VCB)', shortName: 'VCB' },
  { code: '970422', name: 'MBBank (Ngân hàng Quân Đội)', shortName: 'MB' },
  { code: '970407', name: 'Techcombank', shortName: 'TCB' },
  { code: '970432', name: 'VPBank', shortName: 'VPB' },
  { code: '970416', name: 'ACB (Á Châu)', shortName: 'ACB' },
  { code: '970418', name: 'BIDV (Đầu tư & Phát triển)', shortName: 'BIDV' },
  { code: '970423', name: 'TPBank (Tiên Phong)', shortName: 'TPB' },
  { code: '970405', name: 'Agribank (Nông Nghiệp)', shortName: 'VBA' },
  { code: '970415', name: 'VietinBank', shortName: 'CTG' },
  { code: '970441', name: 'VIB (Quốc Tế)', shortName: 'VIB' },
  { code: '970448', name: 'OCB (Phương Đông)', shortName: 'OCB' },
  { code: '970429', name: 'SCB (Sài Gòn)', shortName: 'SCB' },
  { code: '970403', name: 'Sacombank', shortName: 'STB' },
];

export const SettingsPage = () => {
  const { user, updateBankingInfo } = useAuth();

  const [formData, setFormData] = useState({
    bankCode: user?.bankingInfo?.bankCode || '970436',
    bankName: user?.bankingInfo?.bankName || 'Vietcombank',
    accountNumber: user?.bankingInfo?.accountNumber || '',
    accountHolder: user?.bankingInfo?.accountHolder || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Trạng thái liên kết Zalo cá nhân
  const [zaloStatus, setZaloStatus] = useState({ connected: false, zaloName: '', lastConnectedAt: null });
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrStep, setQrStep] = useState('WAITING_SCAN');
  const [qrError, setQrError] = useState('');
  const [disconnectingZalo, setDisconnectingZalo] = useState(false);
  const pollIntervalRef = useRef(null);

  // Tải trạng thái Zalo khi vào trang
  const fetchZaloStatus = async () => {
    try {
      const res = await api.get('/zalo/status');
      setZaloStatus(res.data);
    } catch (err) {
      console.error('Lỗi lấy trạng thái Zalo:', err);
    }
  };

  useEffect(() => {
    fetchZaloStatus();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleStartZaloQr = async () => {
    try {
      setIsQrModalOpen(true);
      setQrLoading(true);
      setQrError('');
      setQrStep('WAITING_SCAN');
      setQrCodeData('');

      const res = await api.post('/zalo/qr/start');
      if (res.data.qrDataUrl) {
        setQrCodeData(res.data.qrDataUrl);
      }
      setQrLoading(false);

      // Bắt đầu polling kiểm tra trạng thái quét
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await api.get('/zalo/qr/status');
          if (pollRes.data.qrDataUrl && !qrCodeData) {
            setQrCodeData(pollRes.data.qrDataUrl);
          }
          if (pollRes.data.status === 'SCANNED') {
            setQrStep('SCANNED');
          } else if (pollRes.data.status === 'SUCCESS') {
            clearInterval(pollIntervalRef.current);
            setIsQrModalOpen(false);
            await fetchZaloStatus();
            alert('Liên kết tài khoản Zalo cá nhân thành công!');
          } else if (pollRes.data.status === 'EXPIRED') {
            setQrStep('EXPIRED');
            setQrError('Mã QR đã hết hạn. Vui lòng bấm thử lại.');
          } else if (pollRes.data.status === 'ERROR') {
            setQrError(pollRes.data.error || 'Lỗi kết nối Zalo');
          }
        } catch (_) {}
      }, 1500);
    } catch (err) {
      setQrLoading(false);
      setQrError(err.response?.data?.message || 'Không thể khởi tạo mã QR Zalo');
    }
  };

  const handleDisconnectZalo = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn ngắt kết nối tài khoản Zalo này? Hệ thống sẽ ngừng tự động gửi hóa đơn.')) {
      return;
    }
    try {
      setDisconnectingZalo(true);
      await api.post('/zalo/disconnect');
      await fetchZaloStatus();
      alert('Đã ngắt kết nối Zalo.');
    } catch (err) {
      alert('Lỗi ngắt kết nối: ' + (err.response?.data?.message || err.message));
    } finally {
      setDisconnectingZalo(false);
    }
  };

  const handleBankChange = (e) => {
    const selected = VIETNAM_BANKS.find(b => b.code === e.target.value);
    setFormData({
      ...formData,
      bankCode: e.target.value,
      bankName: selected ? selected.shortName : '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      await updateBankingInfo(formData);
      setMessage('Lưu cấu hình tài khoản ngân hàng thành công! Mọi hóa đơn mới sẽ tự động gắn mã VietQR này.');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin ngân hàng.');
    } finally {
      setSubmitting(false);
    }
  };

  // Xem trước VietQR QuickLink trực tiếp
  const sampleAmount = 2500000;
  const sampleMemo = encodeURIComponent('P101 TIEN NHA THANG 09');
  const previewQrUrl = (formData.bankCode && formData.accountNumber)
    ? `https://img.vietqr.io/image/${formData.bankCode}-${formData.accountNumber}-compact2.png?amount=${sampleAmount}&addInfo=${sampleMemo}&accountName=${encodeURIComponent(formData.accountHolder)}`
    : '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Cài Đặt Thanh Toán VietQR</h1>
        <p className="text-slate-500 text-sm mt-1">
          Thiết lập tài khoản ngân hàng thụ hưởng. Hệ thống sẽ tự động sinh mã VietQR chuẩn NAPAS 247 chính xác số tiền cho người thuê chuyển khoản.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form cấu hình */}
        <div className="md:col-span-7">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-800">Thông Tin Tài Khoản Thụ Hưởng</h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    Ngân hàng thụ hưởng *
                  </label>
                  <select
                    value={formData.bankCode}
                    onChange={handleBankChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {VIETNAM_BANKS.map(b => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    Số tài khoản ngân hàng *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 1012345678"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.trim() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold tracking-wide focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    Tên chủ tài khoản (VIẾT HOA KHÔNG DẤU) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: NGUYEN TRONG NGHIA"
                    value={formData.accountHolder}
                    onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Khớp với tên đăng ký tài khoản tại ngân hàng để VietQR hiển thị chính xác
                  </span>
                </div>

                <div className="pt-3">
                  <Button type="submit" loading={submitting} className="w-full">
                    Lưu cấu hình VietQR
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Live VietQR Preview */}
        <div className="md:col-span-5">
          <Card className="bg-gradient-to-b from-white to-blue-50/40 border-blue-200">
            <CardHeader className="text-center">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Xem trước hiển thị (Live Preview)</span>
            </CardHeader>
            <CardBody className="p-6 flex flex-col items-center text-center space-y-4">
              {previewQrUrl ? (
                <>
                  <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                    <img
                      src={previewQrUrl}
                      alt="VietQR Preview"
                      className="w-48 h-48 object-contain rounded-lg"
                    />
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-slate-800">{formData.accountHolder || 'CHỦ TÀI KHOẢN'}</div>
                    <div className="text-slate-600 font-mono">{formData.accountNumber} ({formData.bankName})</div>
                    <div className="text-[11px] text-emerald-600 font-medium">Mã QR động tự động điền số tiền theo hóa đơn</div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-slate-400 text-xs space-y-2">
                  <QrCode className="w-12 h-12 mx-auto text-slate-300" />
                  <p>Vui lòng nhập Số tài khoản để xem trước mã QR VietQR mẫu</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* KHỐI LIÊN KẾT ZALO CÁ NHÂN (MIỄN PHÍ 100%) */}
      <Card className="border-blue-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50/80 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0068FF]/10 text-[#0068FF] flex items-center justify-center font-bold text-lg shrink-0">
              Z
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Liên Kết Zalo Cá Nhân Tự Động (Miễn Phí 100%)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động gửi hóa đơn và mã VietQR trực tiếp đến Zalo của khách thuê ngay khi chốt số, không tốn phí ZNS.
              </p>
            </div>
          </div>

          <div>
            {zaloStatus.connected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Đang kết nối: {zaloStatus.zaloName || 'Zalo Chủ trọ'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Chưa kết nối
              </span>
            )}
          </div>
        </CardHeader>

        <CardBody className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="space-y-1">
              <div className="font-semibold text-slate-800 text-sm">
                {zaloStatus.connected ? `Tài khoản: ${zaloStatus.zaloName}` : 'Chưa có tài khoản Zalo nào được liên kết'}
              </div>
              <p className="text-xs text-slate-500">
                {zaloStatus.connected
                  ? `Đã liên kết phiên làm việc. Hệ thống sẽ tự động gửi hóa đơn mỗi khi tạo mới kỳ tiền phòng.`
                  : 'Quét mã QR từ ứng dụng Zalo trên điện thoại 1 lần duy nhất để cấp quyền gửi hóa đơn tự động.'}
              </p>
              {zaloStatus.lastConnectedAt && (
                <div className="text-[11px] text-slate-400">
                  Thời điểm kết nối: {new Date(zaloStatus.lastConnectedAt).toLocaleString('vi-VN')}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {zaloStatus.connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  loading={disconnectingZalo}
                  onClick={handleDisconnectZalo}
                  className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                >
                  Ngắt kết nối Zalo
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleStartZaloQr}
                  className="text-xs bg-[#0068FF] hover:bg-[#0052cc] text-white font-semibold"
                >
                  <QrCode className="w-4 h-4" />
                  Kết nối Zalo bằng mã QR
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* MODAL QUÉT MÃ QR ZALO */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 text-center space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0068FF] text-white flex items-center justify-center font-black text-sm">
                  Z
                </div>
                <h3 className="font-bold text-slate-900 text-base">Quét Mã QR Đăng Nhập Zalo</h3>
              </div>
              <button
                onClick={() => { setIsQrModalOpen(false); clearInterval(pollIntervalRef.current); }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {qrLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-4 border-[#0068FF] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-500 font-medium">Đang khởi tạo phiên kết nối Zalo Web...</span>
              </div>
            ) : qrCodeData ? (
              <div className="space-y-4">
                <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 inline-block shadow-inner">
                  <img src={qrCodeData} alt="Mã QR Zalo" className="w-64 h-64 mx-auto object-contain rounded-xl" />
                </div>

                {qrStep === 'SCANNED' ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-semibold animate-pulse">
                    📱 Đã quét thành công! Vui lòng chọn "Đăng nhập" trên màn hình điện thoại của bạn...
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">Hướng dẫn quét mã:</p>
                    <p>1. Mở ứng dụng <b>Zalo</b> trên điện thoại</p>
                    <p>2. Bấm vào biểu tượng <b>Mã QR</b> ở góc trên cùng bên phải</p>
                    <p>3. Hướng camera vào mã QR trên và bấm <b>Đăng nhập</b></p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                <p className="text-xs text-red-600">{qrError || 'Không thể tạo mã QR lúc này.'}</p>
                <Button size="sm" onClick={handleStartZaloQr}>Thử lại</Button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setIsQrModalOpen(false); clearInterval(pollIntervalRef.current); }}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
