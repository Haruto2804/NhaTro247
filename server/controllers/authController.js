const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Đăng nhập hoặc đồng bộ qua Google SDK
exports.loginWithGoogle = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Thiếu Google Credential ID Token.' });
    }

    let googleId, email, name, picture;

    // Xác thực chữ ký số của Google ID Token
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture || '';
    } catch (verifyErr) {
      // Hỗ trợ môi trường phát triển (Dev fallback nếu chưa cấu hình GOOGLE_CLIENT_ID thật)
      if (process.env.NODE_ENV !== 'production' && credential.startsWith('mock-')) {
        googleId = 'mock_google_id_' + Date.now();
        email = 'chutro.demo@gmail.com';
        name = 'Chủ Trọ Demo';
        picture = 'https://api.dicebear.com/7.x/bottts/svg?seed=chutro';
      } else {
        console.error('Google Verify Token Error:', verifyErr.message);
        return res.status(401).json({ message: 'Xác thực Google ID Token không thành công. ' + verifyErr.message });
      }
    }

    // Tìm hoặc tạo mới tài khoản trong MongoDB
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        user.name = name || user.name;
        user.picture = picture || user.picture;
        await user.save();
      } else {
        user = await User.create({
          googleId,
          email,
          name,
          picture,
        });
      }
    }

    // Sinh Session Token JWT cho ứng dụng
    const sessionToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret_phongtro',
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      message: 'Đăng nhập thành công!',
      token: sessionToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        bankingInfo: user.bankingInfo,
      }
    });
  } catch (error) {
    console.error('Lỗi loginWithGoogle:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập Google.' });
  }
};

// Lấy thông tin tài khoản hiện tại
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng.' });
  }
};

// Cập nhật thông tin ngân hàng nhận tiền VietQR
exports.updateBanking = async (req, res) => {
  try {
    const { bankCode, bankName, accountNumber, accountHolder } = req.body;

    if (!bankCode || !accountNumber || !accountHolder) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ Mã ngân hàng, Số tài khoản và Tên chủ tài khoản.' });
    }

    const user = await User.findById(req.user._id);
    user.bankingInfo = {
      bankCode: bankCode.trim(),
      bankName: (bankName || '').trim(),
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim().toUpperCase(),
    };

    await user.save();

    return res.status(200).json({
      message: 'Cập nhật thông tin ngân hàng thành công!',
      bankingInfo: user.bankingInfo,
    });
  } catch (error) {
    console.error('Lỗi updateBanking:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật thông tin ngân hàng.' });
  }
};
