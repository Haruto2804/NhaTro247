import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

test('=== QA TEST SUITE: HỆ THỐNG NHÀ TRỌ 247 ===', async (t) => {
  let authToken = '';
  let landlordUser = null;
  let createdRoomId = '';
  let invoiceId = '';
  let publicInvoiceToken = '';
  const testMonthYear = `11-${Date.now() % 10000}`; // Đảm bảo kỳ tháng không trùng

  // =========================================================================
  // GIAI ĐOẠN 1: KIỂM TRA SERVER HEALTH & KẾT NỐI HỆ THỐNG
  // =========================================================================
  await t.test('1.1 Health check API phản hồi 200 OK và đúng định dạng', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.equal(res.status, 200, 'Server health check phải trả về mã 200');
    const data = await res.json();
    assert.equal(data.status, 'OK');
    assert.ok(data.timestamp, 'Phải có trường timestamp');
  });

  // =========================================================================
  // GIAI ĐOẠN 2: XÁC THỰC & BẢO MẬT (AUTH & PERMISSION)
  // =========================================================================
  await t.test('2.1 Truy cập API nội bộ không có Token phải trả về 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/rooms`);
    assert.equal(res.status, 401, 'Không có Bearer token phải bị chặn với mã 401');
  });

  await t.test('2.2 Đăng nhập Chủ trọ (Dev Mock Authentication) sinh Token JWT hợp lệ', async () => {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'mock-qa-tester-landlord' })
    });
    assert.equal(res.status, 200, 'Đăng nhập dev mock phải thành công');
    const data = await res.json();
    assert.ok(data.token, 'Phải có token JWT trả về');
    assert.ok(data.user, 'Phải có thông tin user trả về');
    authToken = data.token;
    landlordUser = data.user;
  });

  await t.test('2.3 Lấy thông tin tài khoản hiện tại qua GET /auth/me', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.email, landlordUser.email);
  });

  await t.test('2.4 Thiết lập thông tin tài khoản Ngân hàng (VietQR)', async () => {
    const res = await fetch(`${BASE_URL}/auth/banking`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        bankCode: 'ICB', // VietinBank
        bankName: 'VietinBank',
        accountNumber: '10123456789',
        accountHolder: 'NGUYEN VAN QA'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.bankingInfo.bankCode, 'ICB');
    assert.equal(data.bankingInfo.accountNumber, '10123456789');
  });

  // =========================================================================
  // GIAI ĐOẠN 3: QUẢN LÝ PHÒNG TRỌ (ROOM MANAGEMENT)
  // =========================================================================
  await t.test('3.1 Báo lỗi 400 nếu tạo phòng trọ thiếu thông tin bắt buộc', async () => {
    const res = await fetch(`${BASE_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ roomCode: 'P.INVALID' })
    });
    assert.equal(res.status, 400);
  });

  await t.test('3.2 Tạo phòng trọ mới thành công với đơn giá và chỉ số đầu kỳ', async () => {
    const uniqueRoomCode = `QA-${Date.now() % 10000}`;
    const res = await fetch(`${BASE_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        roomCode: uniqueRoomCode,
        name: `Phòng Test QA ${uniqueRoomCode}`,
        tenantName: 'Lê Văn Khách Thuê',
        tenantPhone: '0987654321',
        basePrice: 3000000,
        pricing: {
          electricityUnitPrice: 3500,
          waterUnitPrice: 25000,
          serviceFee: 100000
        },
        initialReading: {
          electricity: 100,
          water: 20
        }
      })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.room._id);
    assert.equal(data.room.basePrice, 3000000);
    assert.equal(data.room.initialReading.electricity, 100);
    assert.equal(data.room.initialReading.water, 20);
    createdRoomId = data.room._id;
  });

  // =========================================================================
  // GIAI ĐOẠN 4: CHỐT SỐ ĐIỆN NƯỚC & TÍNH TOÁN HÓA ĐƠN
  // =========================================================================
  await t.test('4.1 Chặn số mới nhỏ hơn số cũ (Logic Validation)', async () => {
    const formData = new FormData();
    formData.append('roomId', createdRoomId);
    formData.append('monthYear', testMonthYear);
    formData.append('newElectricityIndex', '90'); // Nhỏ hơn 100
    formData.append('newWaterIndex', '25');
    formData.append('electricityPhoto', new Blob(['fake_elec'], { type: 'image/jpeg' }), 'elec.jpg');
    formData.append('waterPhoto', new Blob(['fake_water'], { type: 'image/jpeg' }), 'water.jpg');

    const res = await fetch(`${BASE_URL}/invoices`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /không được nhỏ hơn chỉ số cũ/i);
  });

  await t.test('4.2 Bắt buộc phải đính kèm ảnh công tơ điện nước thực tế', async () => {
    const formData = new FormData();
    formData.append('roomId', createdRoomId);
    formData.append('monthYear', testMonthYear);
    formData.append('newElectricityIndex', '150');
    formData.append('newWaterIndex', '25');
    // Không đính kèm ảnh

    const res = await fetch(`${BASE_URL}/invoices`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /ảnh chụp thực tế/i);
  });

  await t.test('4.3 Chốt số hợp lệ: Tự động tính đúng thành tiền & sinh VietQR + Token', async () => {
    const formData = new FormData();
    formData.append('roomId', createdRoomId);
    formData.append('monthYear', testMonthYear);
    formData.append('newElectricityIndex', '150'); // 150 - 100 = 50 kWh * 3,500 = 175,000 đ
    formData.append('newWaterIndex', '25');        // 25 - 20 = 5 m3 * 25,000 = 125,000 đ
    formData.append('electricityPhoto', new Blob(['fake_elec_img_bytes'], { type: 'image/jpeg' }), 'elec.jpg');
    formData.append('waterPhoto', new Blob(['fake_water_img_bytes'], { type: 'image/jpeg' }), 'water.jpg');

    const res = await fetch(`${BASE_URL}/invoices`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    const inv = data.invoice;

    // Kiểm tra tính toán
    assert.equal(inv.readings.electricity.consumption, 50, 'Tiêu thụ điện phải là 50');
    assert.equal(inv.readings.electricity.amount, 175000, 'Tiền điện = 50 * 3500 = 175,000đ');
    assert.equal(inv.readings.water.consumption, 5, 'Tiêu thụ nước phải là 5');
    assert.equal(inv.readings.water.amount, 125000, 'Tiền nước = 5 * 25000 = 125,000đ');

    // Tổng tiền = Tiền phòng (3,000,000) + Dịch vụ (100,000) + Điện (175,000) + Nước (125,000) = 3,400,000đ
    const expectedTotal = 3000000 + 100000 + 175000 + 125000;
    assert.equal(inv.totalAmount, expectedTotal, 'Tổng tiền tính toán phải chính xác 3,400,000đ');

    // Kiểm tra sinh token và link VietQR
    assert.ok(inv.token, 'Hóa đơn phải có public token');
    assert.equal(inv.status, 1, 'Trạng thái ban đầu phải là 1 (Đã gửi / Chờ đối soát)');
    assert.ok(inv.payment.qrUrl.includes('img.vietqr.io'), 'Phải sinh đúng URL VietQR');

    invoiceId = inv._id;
    publicInvoiceToken = inv.token;
  });

  // =========================================================================
  // GIAI ĐOẠN 5: CỔNG TRA CỨU CỦA NGƯỜI THUÊ (PUBLIC TENANT PORTAL)
  // =========================================================================
  await t.test('5.1 Khách tra cứu hóa đơn không cần đăng nhập bằng Token công khai', async () => {
    const res = await fetch(`${BASE_URL}/public/invoices/${publicInvoiceToken}`);
    assert.equal(res.status, 200, 'Khách thuê truy cập qua token phải thành công 200');
    const data = await res.json();
    assert.equal(data.invoice.totalAmount, 3400000);
    assert.ok(data.invoice.roomId.roomCode, 'Thông tin phòng phải được populate');
    assert.ok(data.invoice.landlordId.bankingInfo, 'Thông tin STK chủ trọ phải hiển thị');
  });

  await t.test('5.2 Token giả mạo hoặc không tồn tại phải trả về 404', async () => {
    const res = await fetch(`${BASE_URL}/public/invoices/token-khong-ton-tai-12345`);
    assert.equal(res.status, 404);
  });

  // =========================================================================
  // GIAI ĐOẠN 6: ĐỐI SOÁT HAI CHIỀU (XÁC NHẬN VÀ KHIẾU NẠI)
  // =========================================================================
  await t.test('6.1 Khách thuê gửi khiếu nại sai lệch chỉ số kèm ảnh chụp đối chứng', async () => {
    const formData = new FormData();
    formData.append('reason', 'Đồng hồ điện ghi nhận sai, thực tế chỉ là 145');
    formData.append('disputePhoto', new Blob(['dispute_photo_bytes'], { type: 'image/jpeg' }), 'dispute.jpg');

    const res = await fetch(`${BASE_URL}/public/invoices/${publicInvoiceToken}/dispute`, {
      method: 'POST',
      body: formData
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.invoice.status, 2, 'Trạng thái hóa đơn chuyển sang 2 (Khách khiếu nại)');
    assert.equal(data.invoice.dispute.tenantReason, 'Đồng hồ điện ghi nhận sai, thực tế chỉ là 145');
  });

  await t.test('6.2 Chủ trọ xem chi tiết và giải quyết khiếu nại (Điều chỉnh chỉ số)', async () => {
    const formData = new FormData();
    formData.append('newElectricityIndex', '145'); // Điều chỉnh lại đúng thực tế
    formData.append('newWaterIndex', '25');
    formData.append('note', 'Chủ trọ đã kiểm tra lại công tơ và đồng ý điều chỉnh chỉ số điện về 145');
    formData.append('electricityPhoto', new Blob(['adjusted_elec'], { type: 'image/jpeg' }), 'adjusted.jpg');
    formData.append('waterPhoto', new Blob(['adjusted_water'], { type: 'image/jpeg' }), 'adjusted.jpg');

    const res = await fetch(`${BASE_URL}/invoices/${invoiceId}/adjust`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    const inv = data.invoice;

    // Tiêu thụ điện mới: 145 - 100 = 45 kWh * 3,500 = 157,500 đ
    assert.equal(inv.readings.electricity.consumption, 45);
    assert.equal(inv.readings.electricity.amount, 157500);

    // Tổng tiền mới = 3,000,000 + 100,000 + 157,500 + 125,000 = 3,382,500 đ
    assert.equal(inv.totalAmount, 3382500);
    assert.equal(inv.status, 1, 'Sau khi điều chỉnh, trạng thái quay về 1 (Đã gửi / Chờ đối soát)');
  });

  await t.test('6.3 Khách thuê xác nhận số liệu đã chuẩn xác', async () => {
    const res = await fetch(`${BASE_URL}/public/invoices/${publicInvoiceToken}/confirm`, {
      method: 'POST'
    });
    assert.equal(res.status, 200);
  });

  // =========================================================================
  // GIAI ĐOẠN 7: KHÓA SỔ THANH TOÁN (PAYMENT LOCK)
  // =========================================================================
  await t.test('7.1 Chủ trọ xác nhận đã nhận tiền và Khóa sổ công nợ (Status 3)', async () => {
    const res = await fetch(`${BASE_URL}/invoices/${invoiceId}/paid`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ note: 'Đã nhận chuyển khoản qua VietQR' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.invoice.status, 3, 'Trạng thái phải là 3 (Đã thanh toán)');
    assert.ok(data.invoice.payment.paidAt, 'Phải ghi nhận thời điểm thanh toán');
  });

  await t.test('7.2 Hóa đơn đã khóa sổ (Status 3) không cho phép khiếu nại tiếp', async () => {
    const formData = new FormData();
    formData.append('reason', 'Khiếu nại sau khi đã trả tiền');
    formData.append('disputePhoto', new Blob(['photo'], { type: 'image/jpeg' }), 'dispute2.jpg');

    const res = await fetch(`${BASE_URL}/public/invoices/${publicInvoiceToken}/dispute`, {
      method: 'POST',
      body: formData
    });
    assert.equal(res.status, 400, 'Phải chặn khiếu nại khi hóa đơn đã thanh toán');
  });

  // =========================================================================
  // GIAI ĐOẠN 8: BÁO CÁO THỐNG KÊ DASHBOARD
  // =========================================================================
  await t.test('8.1 Chặn thiếu tham số kỳ tháng monthYear (Validation)', async () => {
    const res = await fetch(`${BASE_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 400, 'Thiếu monthYear phải trả về lỗi 400');
  });

  await t.test('8.2 Báo cáo thống kê Dashboard phản hồi số liệu chính xác theo kỳ', async () => {
    const res = await fetch(`${BASE_URL}/dashboard/stats?monthYear=${testMonthYear}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.stats, 'Phải trả về đối tượng stats');
    assert.ok(data.stats.totalRooms >= 1, 'Số phòng phải >= 1');
    assert.equal(data.stats.status3_paid, 1, 'Hóa đơn đã chốt thanh toán phải ghi nhận ở status3_paid = 1');
    assert.equal(data.stats.totalCollectedRevenue, 3382500, 'Doanh thu thực thu phải khớp với hóa đơn đã thanh toán (3,382,500đ)');
  });
});
