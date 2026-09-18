import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
    </div>
  );
};
