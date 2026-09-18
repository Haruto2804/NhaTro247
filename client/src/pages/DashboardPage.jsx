import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardBody, CardHeader } from '../components/Card';
import { StatusBadge } from '../components/Badge';
import { Button } from '../components/Button';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CircleDashed,
  DollarSign,
  Copy,
  ExternalLink,
  Zap,
  Check,
  Building2,
  Users
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  // Kỳ tháng mặc định dạng MM-YYYY
  const getCurrentMonthYear = () => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${mm}-${yyyy}`;
  };

  const [monthYear, setMonthYear] = useState(getCurrentMonthYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/stats?monthYear=${monthYear}`);
      setData(res.data);
    } catch (err) {
      console.error('Lỗi tải Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [monthYear]);

  // Sao chép liên kết hóa đơn gửi Zalo
  const copyInvoiceLink = (token, id) => {
    const url = `${window.location.origin}/bill/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Duyệt thanh toán nhanh
  const handleQuickPay = async (invoiceId) => {
    if (!window.confirm('Xác nhận bạn đã nhận được tiền chuyển khoản và muốn khóa sổ công nợ phòng này?')) {
      return;
    }
    try {
      setPayingId(invoiceId);
      await api.patch(`/invoices/${invoiceId}/paid`, { note: 'Duyệt nhanh từ Dashboard' });
      await fetchDashboard();
    } catch (err) {
      alert('Lỗi duyệt thanh toán: ' + (err.response?.data?.message || err.message));
    } finally {
      setPayingId(null);
    }
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const filteredRooms = data?.rooms?.filter(room => {
    if (statusFilter === 'ALL') return true;
    return room.status === Number(statusFilter);
  }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Bảng Điều Khiển Công Nợ</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi tiến độ chốt số, giải quyết khiếu nại và thu tiền phòng</p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="text-xs font-semibold text-slate-500 uppercase">Kỳ đối soát:</span>
          <input
            type="month"
            value={monthYear.split('-').reverse().join('-')}
            onChange={(e) => {
              if (e.target.value) {
                const [yyyy, mm] = e.target.value.split('-');
                setMonthYear(`${mm}-${yyyy}`);
              }
            }}
            className="text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Cảnh báo cấu hình ngân hàng */}
      {user && (!user.bankingInfo?.bankCode || !user.bankingInfo?.accountNumber) && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-xs sm:text-sm text-amber-800">
              Bạn chưa cấu hình thông tin tài khoản ngân hàng để tự động gắn vào mã VietQR cho khách chuyển khoản!
            </span>
          </div>
          <Link to="/settings">
            <Button size="sm" variant="outline" className="text-amber-800 border-amber-300 hover:bg-amber-100 shrink-0">
              Cài đặt ngay
            </Button>
          </Link>
        </div>
      )}

      {/* 4 Cards Thống kê trạng thái: 0, 1, 2, 3 */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 0: Chưa chốt số */}
          <Card
            onClick={() => setStatusFilter('0')}
            className={`cursor-pointer transition-all hover:border-slate-400 ${statusFilter === '0' ? 'ring-2 ring-slate-500' : ''}`}
          >
            <CardBody className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <CircleDashed className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">0 · Chưa chốt số</div>
                <div className="text-2xl font-bold text-slate-800">{data.stats.status0_unbilled} phòng</div>
              </div>
            </CardBody>
          </Card>

          {/* Card 1: Đã gửi hóa đơn */}
          <Card
            onClick={() => setStatusFilter('1')}
            className={`cursor-pointer transition-all hover:border-sky-400 ${statusFilter === '1' ? 'ring-2 ring-sky-500' : ''}`}
          >
            <CardBody className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-sky-600">1 · Chờ đối soát</div>
                <div className="text-2xl font-bold text-slate-800">{data.stats.status1_sent} phòng</div>
              </div>
            </CardBody>
          </Card>

          {/* Card 2: Khách khiếu nại (Cảnh báo đỏ) */}
          <Card
            onClick={() => setStatusFilter('2')}
            className={`cursor-pointer transition-all hover:border-red-400 ${statusFilter === '2' ? 'ring-2 ring-red-500' : ''} ${data.stats.status2_disputed > 0 ? 'bg-red-50/40 border-red-200' : ''}`}
          >
            <CardBody className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${data.stats.status2_disputed > 0 ? 'bg-red-100 text-red-600 animate-bounce' : 'bg-red-50 text-red-400'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-red-600">2 · Báo sai lệch!</div>
                <div className="text-2xl font-bold text-red-700">{data.stats.status2_disputed} phòng</div>
              </div>
            </CardBody>
          </Card>

          {/* Card 3: Đã thanh toán */}
          <Card
            onClick={() => setStatusFilter('3')}
            className={`cursor-pointer transition-all hover:border-emerald-400 ${statusFilter === '3' ? 'ring-2 ring-emerald-500' : ''}`}
          >
            <CardBody className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-emerald-600">3 · Đã thanh toán</div>
                <div className="text-2xl font-bold text-emerald-700">{data.stats.status3_paid} phòng</div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Doanh thu & Tiến độ thu */}
      {data && (
        <Card className="bg-gradient-to-br from-white to-blue-50/20">
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doanh thu kỳ {monthYear}</span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-600">{formatVND(data.stats.totalCollectedRevenue)}</span>
                  <span className="text-sm text-slate-500">/ Dự kiến {formatVND(data.stats.totalExpectedRevenue)}</span>
                </div>
              </div>

              <div className="w-full md:w-72 space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>Tiến độ thanh toán:</span>
                  <span className="font-bold text-blue-600">{data.stats.paymentRate}% ({data.stats.status3_paid}/{data.stats.totalRooms} phòng)</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${data.stats.paymentRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Danh sách phòng chi tiết */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-800">Trạng Thái Từng Phòng Kỳ {monthYear}</h2>
          </div>

          {/* Bộ lọc trạng thái */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { label: 'Tất cả', val: 'ALL' },
              { label: '0 · Chưa chốt', val: '0' },
              { label: '1 · Đã gửi', val: '1' },
              { label: '2 · Khiếu nại', val: '2' },
              { label: '3 · Đã nộp', val: '3' },
            ].map(f => (
              <button
                key={f.val}
                onClick={() => setStatusFilter(f.val)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  statusFilter === f.val
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardBody className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Đang tải dữ liệu kỳ đối soát...</div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-slate-500 text-sm">Không tìm thấy phòng nào phù hợp với bộ lọc.</p>
              {data?.rooms?.length === 0 && (
                <Link to="/rooms">
                  <Button size="sm">Thêm phòng trọ đầu tiên</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Phòng</th>
                    <th className="px-5 py-3.5">Người thuê / SĐT</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Tổng tiền</th>
                    <th className="px-5 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRooms.map((r) => (
                    <tr key={r.roomId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{r.roomCode}</div>
                        <div className="text-xs text-slate-500">{r.roomName}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{r.tenantName}</div>
                        <div className="text-xs text-slate-500">{r.tenantPhone}</div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={r.status} />
                        {r.status === 2 && r.disputeReason && (
                          <div className="text-[11px] text-red-600 font-medium mt-1 truncate max-w-[180px]">
                            Lý do: {r.disputeReason}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="font-bold text-slate-900">
                          {r.status === 0 ? formatVND(r.basePrice) + ' (dự kiến)' : formatVND(r.totalAmount)}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Nếu Chưa chốt số (0): Nút Chốt số ngay */}
                          {r.status === 0 && (
                            <Link to={`/invoices/new?roomId=${r.roomId}&monthYear=${monthYear}`}>
                              <Button size="sm" variant="primary" className="text-xs">
                                <Zap className="w-3.5 h-3.5" />
                                Chốt số ngay
                              </Button>
                            </Link>
                          )}

                          {/* Nếu đã lập hóa đơn (1, 2, 3) */}
                          {r.status > 0 && r.invoiceId && (
                            <>
                              {/* Xem chi tiết hóa đơn */}
                              <Link to={`/invoices/${r.invoiceId}`}>
                                <Button size="sm" variant={r.status === 2 ? 'dispute' : 'outline'} className="text-xs">
                                  {r.status === 2 ? 'Xử lý khiếu nại' : 'Xem HĐ'}
                                </Button>
                              </Link>

                              {/* Copy Link Zalo */}
                              {r.invoiceToken && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyInvoiceLink(r.invoiceToken, r.invoiceId)}
                                  title="Sao chép liên kết gửi Zalo"
                                  className="text-xs text-blue-600 hover:bg-blue-50"
                                >
                                  {copiedId === r.invoiceId ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="text-emerald-600">Đã chép link!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Link Zalo</span>
                                    </>
                                  )}
                                </Button>
                              )}

                              {/* Duyệt thanh toán nhanh nếu khách đã chuyển tiền */}
                              {r.status !== 3 && (
                                <Button
                                  size="sm"
                                  variant="success"
                                  loading={payingId === r.invoiceId}
                                  onClick={() => handleQuickPay(r.invoiceId)}
                                  className="text-xs"
                                  title="Xác nhận đã nhận tiền để khóa sổ"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Duyệt thu
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
