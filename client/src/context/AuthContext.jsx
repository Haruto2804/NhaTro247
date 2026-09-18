import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Tải lại thông tin người dùng khi mở ứng dụng
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Không thể lấy thông tin đăng nhập:', err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  // Đăng nhập bằng Google Credential ID Token
  const loginWithGoogle = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    return newUser;
  };

  // Cập nhật thông tin ngân hàng thụ hưởng
  const updateBankingInfo = async (bankingData) => {
    const res = await api.put('/auth/banking', bankingData);
    const updatedUser = { ...user, bankingInfo: res.data.bankingInfo };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return res.data;
  };

  // Đăng xuất
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, updateBankingInfo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
