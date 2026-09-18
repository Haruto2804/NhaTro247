import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Building2, ShieldCheck, Zap, QrCode, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';

export const LoginPage = () => {
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Nếu đã đăng nhập, tự động chuyển vào dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevDemoLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle('mock-dev-token-' + Date.now());
      navigate('/dashboard');
    } catch (err) {
      setError('Lỗi đăng nhập tài khoản demo: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-inner">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Nhà Trọ 247</h1>
          <p className="text-blue-100 text-xs sm:text-sm">Hệ thống chốt số điện nước & đối soát thanh toán hai chiều minh bạch</p>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Value Props */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-600">
              <div className="p-1 rounded bg-blue-50 text-blue-600 mt-0.5"><Zap className="w-3.5 h-3.5" /></div>
              <span>Chốt chỉ số điện nước kèm ảnh chụp công tơ thực tế</span>
            </div>
            <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-600">
              <div className="p-1 rounded bg-emerald-50 text-emerald-600 mt-0.5"><ShieldCheck className="w-3.5 h-3.5" /></div>
              <span>Đối soát hai chiều chống gian lận & mâu thuẫn chỉ số</span>
            </div>
            <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-600">
              <div className="p-1 rounded bg-indigo-50 text-indigo-600 mt-0.5"><QrCode className="w-3.5 h-3.5" /></div>
              <span>Tự động sinh mã VietQR chuẩn NAPAS đúng từng đồng</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-4">
            <div className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Dành cho Quản trị viên / Chủ trọ
            </div>

            {/* Google Sign In Official Button */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Đăng nhập Google không thành công. Hãy thử lại.')}
                useOneTap
                shape="pill"
                text="signin_with"
                locale="vi"
              />
            </div>

            {/* Dev Demo 1-Click Login Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={handleDevDemoLogin}
                loading={loading}
                className="w-full flex items-center justify-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
              >
                <span>Đăng nhập nhanh trải nghiệm (Demo Account)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <p className="text-[11px] text-slate-400 text-center mt-1.5">
                Dành cho đồ án chuyên ngành / kiểm thử mà không cần cấu hình Google Cloud
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
          Người thuê trọ truy cập trực tiếp qua liên kết hóa đơn Zalo (Không cần đăng nhập)
        </div>
      </div>
    </div>
  );
};
