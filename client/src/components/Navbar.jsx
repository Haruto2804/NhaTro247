import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  DoorOpen,
  Zap,
  Receipt,
  QrCode,
  LogOut,
  Menu,
  X,
  Building2
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Phòng trọ', path: '/rooms', icon: DoorOpen },
    { label: 'Chốt số kỳ này', path: '/invoices/new', icon: Zap },
    { label: 'Hóa đơn', path: '/invoices', icon: Receipt },
    { label: 'Cài đặt VietQR', path: '/settings', icon: QrCode },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">NhàTrọ<span className="text-blue-600">247</span></span>
              <span className="hidden sm:block text-[11px] text-slate-500 leading-none">Đối soát điện nước hai chiều</span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right User actions */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">{user.name}</div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1.5 animate-in slide-in-from-top-2 duration-200 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}

          {user && (
            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                Thoát
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
