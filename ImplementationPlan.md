# ImplementationPlan (Kế Hoạch Triển Khai)
## Dự án: Module Số Hóa Chốt Chỉ Số Điện Nước & Đối Soát Thanh Toán Hai Chiều Cho Khu Nhà Trọ

---

### Giai đoạn 1: Khởi tạo Cấu trúc Dự án & Môi trường Phát triển
- [ ] **Bước 1.1:** Khởi tạo thư mục gốc và cấu trúc 2 phân hệ:
  - `/server`: Node.js Express Backend.
  - `/client`: React Vite Frontend.
- [ ] **Bước 1.2:** Cấu hình Backend:
  - Cài đặt các gói phụ thuộc: `express`, `mongoose`, `google-auth-library`, `jsonwebtoken`, `multer`, `cors`, `dotenv`, `uuid`.
  - Thiết lập cấu hình môi trường `.env` mẫu (`PORT`, `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `JWT_SECRET`).
  - Thiết lập cấu trúc thư mục `/server`: `models/`, `controllers/`, `routes/`, `middlewares/`, `uploads/`.
- [ ] **Bước 1.3:** Cấu hình Frontend:
  - Khởi tạo React bằng Vite.
  - Cài đặt & cấu hình Tailwind CSS, Lucide React, Axios, React Router Dom, `@react-oauth/google`.
  - Tích hợp các thành phần Shadcn UI cơ bản (Button, Card, Dialog/Modal, Input, Badge, Table, Tabs).

---

### Giai đoạn 2: Xây dựng Backend API & Kết nối Cơ sở dữ liệu
- [ ] **Bước 2.1: Kết nối MongoDB & Xây dựng Mongoose Models:**
  - `User.js`: Schema chủ trọ, Google ID, thông tin ngân hàng VietQR.
  - `Room.js`: Schema phòng trọ, đơn giá điện/nước/dịch vụ, chỉ số ban đầu.
  - `Invoice.js`: Schema hóa đơn, các chỉ số cũ/mới, link ảnh công tơ, token URL, trạng thái `0, 1, 2, 3`, dữ liệu khiếu nại và thanh toán.
- [ ] **Bước 2.2: Xây dựng Middlewares:**
  - `authMiddleware.js`: Xác thực JWT Session / Google ID Token cho các route quản trị của chủ trọ.
  - `uploadMiddleware.js`: Cấu hình Multer lưu ảnh công tơ vào thư mục `/server/uploads` và phục vụ tĩnh qua Express.
- [ ] **Bước 2.3: Xây dựng Module Xác thực & Cài đặt Ngân hàng (`/api/auth`):**
  - `POST /api/auth/google`: Xác thực Google ID Token qua `google-auth-library`, đồng bộ vào MongoDB, trả về Session Token.
  - `GET /api/auth/me`: Lấy thông tin tài khoản và cấu hình ngân hàng hiện tại.
  - `PUT /api/auth/banking`: Lưu thông tin ngân hàng thụ hưởng (Mã ngân hàng, STK, Tên chủ tài khoản) để sinh mã VietQR.
- [ ] **Bước 2.4: Xây dựng Module Quản lý Phòng (`/api/rooms`):**
  - CRUD danh mục phòng: `GET`, `POST`, `PUT`, `DELETE /api/rooms`.
  - Tự động kiểm tra trùng lặp mã phòng trong cùng một chủ trọ.
- [ ] **Bước 2.5: Xây dựng Module Chốt số & Hóa đơn (`/api/invoices`):**
  - `POST /api/invoices`: Nhận chỉ số mới, kiểm tra $Số\ mới \ge Số\ cũ$, nhận 2 ảnh công tơ điện/nước tải lên, tự động tính tổng tiền, tạo UUID token và lưu hóa đơn trạng thái `1` (Đã gửi).
  - `GET /api/invoices`: Lấy danh sách hóa đơn theo kỳ tháng và trạng thái.
  - `PUT /api/invoices/:id/adjust`: Cho phép chủ trọ sửa lại số đo khi có khiếu nại, tự động tính lại tiền và chuyển trạng thái về `1`.
  - `PATCH /api/invoices/:id/paid`: Chủ trọ duyệt đã nhận tiền, chuyển trạng thái sang `3` (Đã thanh toán) và khóa chỉnh sửa.
- [ ] **Bước 2.6: Xây dựng Module Đối soát Công khai cho Người thuê (`/api/public/invoices`):**
  - `GET /api/public/invoices/:token`: Khách mở xem hóa đơn, thông tin chi tiết, ảnh công tơ gốc và link mã VietQR.
  - `POST /api/public/invoices/:token/confirm`: Khách xác nhận đúng số liệu.
  - `POST /api/public/invoices/:token/dispute`: Khách gửi phản hồi sai lệch (lý do + upload ảnh công tơ đối chứng), cập nhật trạng thái hóa đơn sang `2` (Khách khiếu nại).
- [ ] **Bước 2.7: Xây dựng Module Thống kê Bảng điều khiển (`/api/dashboard`):**
  - `GET /api/dashboard/stats`: Tổng hợp số liệu theo kỳ: Tổng phòng, Số phòng ở trạng thái `0, 1, 2, 3`, Doanh thu dự kiến vs Doanh thu thực thu.

---

### Giai đoạn 3: Xây dựng Giao diện Quản trị cho Chủ trọ (Frontend - Landlord Portal)
- [ ] **Bước 3.1: Hệ thống Định tuyến & Khung giao diện (Layout):**
  - Cấu hình React Router: Private Routes (yêu cầu đăng nhập Google) & Public Route (`/bill/:token`).
  - Topbar & Sidebar điều hướng mượt mà, tối ưu Responsive trên smartphone.
- [ ] **Bước 3.2: Màn hình Đăng nhập (Google Login Page):**
  - Tích hợp `@react-oauth/google` GoogleLogin component.
  - Xử lý đăng nhập 1 chạm, lưu token và tự động điều hướng vào Dashboard.
- [ ] **Bước 3.3: Màn hình Bảng điều khiển Công nợ (Dashboard):**
  - Hiển thị 4 thẻ trạng thái chính: `0 - Chưa chốt`, `1 - Đã gửi`, `2 - Khiếu nại`, `3 - Đã thanh toán`.
  - Hiển thị tiến độ thu tiền và doanh thu thực tế.
  - Bảng danh sách phòng kèm thao tác nhanh (Copy link hóa đơn Zalo, Duyệt thanh toán).
- [ ] **Bước 3.4: Màn hình Quản lý Phòng (Room Management):**
  - Bảng/Lưới danh sách phòng trọ.
  - Form Modal Thêm/Sửa phòng (Tên phòng, người đại diện, số điện thoại, giá phòng, giá điện, giá nước, phí dịch vụ).
- [ ] **Bước 3.5: Màn hình Chốt số Điện Nước & Upload Ảnh:**
  - Chọn kỳ tháng và phòng cần chốt.
  - Hiển thị chỉ số cũ kỳ trước.
  - Ô nhập chỉ số mới (có validate trực tiếp).
  - Nút chụp/tải ảnh công tơ điện và nước (có preview ảnh ngay lập tức).
  - Xem trước bảng tính tiền tự động trước khi bấm "Lưu & Xuất hóa đơn".
- [ ] **Bước 3.6: Màn hình Chi tiết Hóa đơn & Xử lý Khiếu nại:**
  - Xem hóa đơn chi tiết.
  - Nếu hóa đơn có trạng thái `2` (Khách khiếu nại): Hiển thị khung so sánh ảnh gốc chủ trọ vs ảnh đối chứng của khách; nút bấm "Điều chỉnh lại chỉ số".
  - Nút bấm "Xác nhận đã nhận tiền" để khóa sổ.
- [ ] **Bước 3.7: Màn hình Cài đặt Thanh toán (VietQR Settings):**
  - Form chọn ngân hàng (danh sách ngân hàng VN), nhập STK, Tên tài khoản.
  - Xem trước (Live Preview) mã VietQR sinh ra để kiểm tra tính chính xác.

---

### Giai đoạn 4: Xây dựng Giao diện Đối soát Người thuê (Frontend - Tenant View)
- [ ] **Bước 4.1: Trang tra cứu hóa đơn công khai (`/bill/:token`):**
  - Thiết kế Mobile-first chuẩn xác, hiển thị sắc nét trên điện thoại.
  - Bảng kê chi tiết từng mục chi phí minh bạch.
- [ ] **Bước 4.2: Khu vực đối chứng ảnh công tơ:**
  - Trình xem ảnh công tơ điện và nước của chủ trọ (hỗ trợ phóng to xem chi tiết vòng số).
- [ ] **Bước 4.3: Tương tác Đối soát Hai chiều:**
  - Nút bấm **"Xác nhận đúng chỉ số"** (kích hoạt cuộn xuống phần thanh toán).
  - Nút bấm **"Báo sai lệch chỉ số"**: Mở modal nhập lý do và tải ảnh chụp đồng hồ thực tế gửi lên backend.
- [ ] **Bước 4.4: Khu vực Thanh toán VietQR & Biên lai:**
  - Hiển thị mã VietQR động NAPAS 247 chính xác số tiền và cú pháp phòng.
  - Nút bấm "Sao chép số tài khoản" và "Sao chép số tiền" tiện lợi.
  - Hiển thị huy hiệu/con dấu **"ĐÃ THANH TOÁN"** khi chủ trọ đã khóa sổ kỳ này.

---

### Giai đoạn 5: Kiểm thử Toàn diện & Tối ưu hóa (Verification & Polish)
- [ ] **Bước 5.1:** Kiểm thử chu trình đối soát khép kín (End-to-End Walkthrough):
  - Chủ trọ chốt số + up ảnh $\rightarrow$ Người thuê nhận link tra cứu $\rightarrow$ Thử luồng khiếu nại $\rightarrow$ Chủ trọ điều chỉnh $\rightarrow$ Khách quét QR $\rightarrow$ Chủ trọ duyệt thanh toán $\rightarrow$ Khóa sổ thành công.
- [ ] **Bước 5.2:** Kiểm tra tính responsive trên thiết bị di động (cả camera upload và hiển thị hóa đơn).
- [ ] **Bước 5.3:** Viết tài liệu hướng dẫn chạy thử nghiệm local (README/Walkthrough).
