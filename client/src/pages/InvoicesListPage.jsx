import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, CardBody, CardHeader } from '../components/Card';
import { StatusBadge } from '../components/Badge';
import { Button } from '../components/Button';
import { Receipt, Calendar, Plus, ExternalLink, Search, Zap } from 'lucide-react';

export const InvoicesListPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthYear, setMonthYear] = useState('');
  const [status, setStatus] = useState('');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let query = [];
      if (monthYear) query.push(`monthYear=${monthYear}`);
      if (status !== '') query.push(`status=${status}`);
      const qs = query.length > 0 ? `?${query.join('&')}` : '';

      const res = await api.get(`/invoices${qs}`);
      setInvoices(res.data.invoices);
    } catch (err) {
      console.error('Lỗi tải danh sách hóa đơn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [monthYear, status]);

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Quản Lý Hóa Đơn</h1>
          <p className="text-slate-500 text-sm mt-1">Lịch sử hóa đơn chốt số điện nước, trạng thái đối soát và thanh toán</p>
        </div>

        <Link to="/invoices/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Chốt số kỳ này
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardBody className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Kỳ tháng:</span>
            <input
              type="month"
              onChange={(e) => {
                if (e.target.value) {
                  const [yyyy, mm] = e.target.value.split('-');
                  setMonthYear(`${mm}-${yyyy}`);
                } else {
                  setMonthYear('');
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Trạng thái:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="1">1 · Đã gửi hóa đơn</option>
              <option value="2">2 · Khách khiếu nại</option>
              <option value="3">3 · Đã thanh toán</option>
            </select>
          </div>

          {(monthYear || status !== '') && (
            <button
              onClick={() => {
                setMonthYear('');
                setStatus('');
              }}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </CardBody>
      </Card>

      {/* Danh sách hóa đơn */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Đang tải hóa đơn...</div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-slate-500 text-sm">Không tìm thấy hóa đơn nào phù hợp.</p>
              <Link to="/invoices/new">
                <Button size="sm">Chốt số phòng ngay</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Phòng / Khách</th>
                    <th className="px-5 py-3.5">Kỳ tháng</th>
                    <th className="px-5 py-3.5">Điện tiêu thụ</th>
                    <th className="px-5 py-3.5">Nước tiêu thụ</th>
                    <th className="px-5 py-3.5 text-right">Tổng tiền</th>
                    <th className="px-5 py-3.5 text-center">Trạng thái</th>
                    <th className="px-5 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{inv.roomId?.roomCode}</div>
                        <div className="text-xs text-slate-500">{inv.roomId?.tenantName}</div>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-700">
                        Tháng {inv.monthYear.replace('-', '/')}
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs font-medium text-slate-800">
                          {inv.readings.electricity.consumption} kWh
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {inv.readings.electricity.oldIndex} &rarr; {inv.readings.electricity.newIndex}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs font-medium text-slate-800">
                          {inv.readings.water.consumption} m³
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {inv.readings.water.oldIndex} &rarr; {inv.readings.water.newIndex}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-blue-600">
                        {formatVND(inv.totalAmount)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={inv.status} />
                      </td>

                      <td className="px-5 py-4 text-center">
                        <Link to={`/invoices/${inv._id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            Chi tiết
                          </Button>
                        </Link>
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
