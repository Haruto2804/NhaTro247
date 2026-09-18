# ĐỒ ÁN CHUYÊN NGÀNH
## ĐỀ TÀI: XÂY DỰNG MODULE SỐ HÓA QUY TRÌNH CHỐT CHỈ SỐ ĐIỆN NƯỚC CÔNG TƠ PHỤ, TỔNG HỢP HÓA ĐƠN VÀ ĐỐI SOÁT THANH TOÁN HAI CHIỀU TẠI KHU NHÀ TRỌ

- **Giảng viên hướng dẫn:** Thầy Nguyễn Trọng Nghĩa
- **Nhóm sinh viên thực hiện:** Đồ án Chuyên Ngành
- **Repository GitHub:** [https://github.com/Haruto2804/NhaTro247.git](https://github.com/Haruto2804/NhaTro247.git)

---

### 1. Giới thiệu Đề tài (Introduction)
Dự án tập trung giải quyết triệt để và chuyên sâu quy trình nghiệp vụ cốt lõi, nhạy cảm và nhức nhối nhất trong quản lý nhà trọ: **Chu trình chốt chỉ số công tơ phụ, tính toán chi phí và đối soát thu tiền cuối tháng**.

Thay vì làm dàn trải các tính năng CRUD quản lý chung, hệ thống tập trung tạo ra cơ chế:
1. **Minh bạch có bằng chứng:** Bắt buộc chụp ảnh mặt đồng hồ điện, nước thực tế tại thời điểm chốt số.
2. **Đối soát hai chiều khép kín:** Người thuê trọ nhận hóa đơn kèm ảnh công tơ qua link tra cứu riêng (không cần cài app rườm rà), có quyền **"Xác nhận đúng"** hoặc **"Báo sai lệch chỉ số"** (kèm ảnh đối chứng từ khách).
3. **Thanh toán nhanh & Khóa sổ công nợ:** Tự động sinh mã **VietQR** chuẩn NAPAS 247 đúng từng đồng; Chủ trọ duyệt khớp giao dịch để khóa sổ công nợ (Bất biến).
4. **Bảng điều khiển công nợ (Debt Dashboard):** Quản lý trực quan theo 4 mã số chuẩn hóa:
   - `0` - **Chưa chốt số**
   - `1` - **Đã gửi hóa đơn** (Chờ khách đối soát)
   - `2` - **Khách khiếu nại** (Cảnh báo bất đồng chỉ số)
   - `3` - **Đã thanh toán** (Khóa sổ hoàn tất kỳ)
5. **Phân phối hóa đơn 1-chạm qua Zalo theo SĐT:** Tự động định dạng số điện thoại người thuê, soạn thảo bản tin tổng hợp chi tiết, tự động nạp vào bộ nhớ tạm (Clipboard) và kích hoạt mở Deep Link `https://zalo.me/{phone}` tức thời, không tốn phí SMS/ZNS.


---

### 2. Công nghệ sử dụng (Technology Stack)
- **Frontend:** React 18, Vite, Tailwind CSS, Shadcn UI (Radix UI), Lucide Icons, `@react-oauth/google`.
- **Backend:** Node.js, Express.js, Mongoose ODM, Multer, `google-auth-library` (Google Identity Services SDK).
- **Cơ sở dữ liệu:** MongoDB (hỗ trợ MongoDB Community Local hoặc MongoDB Atlas).
- **Thanh toán:** Chuẩn VietQR NAPAS 247 mở (chuyển khoản trực tiếp P2P về tài khoản chủ trọ).

---

### 3. Cấu trúc Thư mục (Project Architecture)
```
PhongTro/
├── PRD.md                  # Tài liệu yêu cầu sản phẩm & phạm vi
├── TechSpec.md             # Đặc tả kỹ thuật, kiến trúc & danh mục API
├── AppFlow.md              # Sơ đồ luồng đối soát hai chiều
├── Schema.md               # Thiết kế 3 collections MongoDB (users, rooms, invoices)
├── ImplementationPlan.md   # Lộ trình 5 giai đoạn phát triển
├── Rules.md                # Quy tắc mã nguồn & cam kết commit Git tiếng Việt
├── Tracker.md              # Bảng theo dõi tiến độ append-only
├── Design.md               # Quy chuẩn UI/UX, bảng màu Deep Blue & Emerald
├── server/                 # Phân hệ Backend Express & MongoDB
│   ├── models/             # User.js, Room.js, Invoice.js
│   ├── controllers/        # auth, room, invoice, publicInvoice, dashboard
│   ├── middlewares/        # auth (JWT/Google), upload (Multer ảnh công tơ)
│   ├── routes/             # Định tuyến API
│   ├── uploads/            # Thư mục lưu trữ ảnh công tơ thực tế
│   └── index.js            # Entry point máy chủ Express (Port 5000)
└── client/                 # Phân hệ Frontend React + Vite (Port 5173)
    ├── src/
    │   ├── components/     # Badge, Button, Card, Modal, Navbar, ProofViewer
    │   ├── context/        # AuthContext (Google OAuth & Session)
    │   ├── pages/          # Login, Dashboard, Rooms, RecordInvoice, Details, Settings, TenantBill
    │   └── services/       # api.js cấu hình Axios tập trung
    └── tailwind.config.js  # Hệ màu và font chữ Be Vietnam Pro
```

---

### 4. Hướng dẫn Cài đặt & Chạy Thử Nghiệm (Quick Start Guide)

#### Yêu cầu môi trường:
- Node.js version 18+ (khuyến nghị v20+ hoặc v24).
- Dịch vụ MongoDB đang hoạt động (Local: `mongodb://127.0.0.1:27017` hoặc Atlas URI).

#### Bước 1: Khởi động Backend Server
```bash
cd server
npm install
node index.js
```
*Máy chủ backend sẽ chạy tại: `http://localhost:5000`*

#### Bước 2: Khởi động Frontend Client
Mở một cửa sổ Terminal mới:
```bash
cd client
npm install
npm run dev
```
*Ứng dụng giao diện sẽ chạy tại: `http://localhost:5173`*

---

### 5. Kịch bản Thử Nghiệm Chu trình Nghiệp vụ (Walkthrough Demo)

1. **Đăng nhập Chủ trọ:**
   - Mở trình duyệt vào `http://localhost:5173/login`.
   - Bấm nút **"Đăng nhập nhanh trải nghiệm (Demo Account)"** (hệ thống tự động cấp quyền chủ trọ thử nghiệm mà không cần cấu hình tài khoản Google Cloud).
2. **Cài đặt tài khoản nhận tiền VietQR:**
   - Vào menu **"Cài đặt VietQR"**, chọn ngân hàng (Ví dụ: MBBank, VCB...), điền STK và Tên chủ thẻ.
   - Quan sát mã VietQR mẫu hiển thị trực tiếp.
3. **Thêm phòng trọ:**
   - Vào mục **"Phòng trọ"**, bấm **"Thêm phòng mới"** (Ví dụ: `P.101`, tiền phòng 2.500.000đ, giá điện 3.500đ, nước 25.000đ).
4. **Chốt số điện nước & Tải ảnh thực tế:**
   - Bấm **"Chốt số kỳ này"**, nhập số điện mới (lớn hơn số cũ) và tải ảnh đồng hồ điện/nước.
   - Bấm **"Lưu & Xuất Hóa Đơn"**.
5. **Trải nghiệm góc nhìn Người thuê (Tenant View):**
   - Bấm **"Sao chép link Zalo"** hoặc bấm nút **"Xem trang khách"**.
   - Khách mở link `/bill/:token`: Chạm vào ảnh công tơ để phóng to soi số đo.
   - Thử nghiệm bấm **"Báo sai lệch chỉ số"** và tải ảnh đối chứng; sau đó chuyển sang màn hình chủ trọ để bấm **"Điều chỉnh số đo ngay"**.
   - Bấm **"Xác nhận đúng"** và quét mã VietQR tự sinh chuẩn NAPAS chuyển khoản.
6. **Khóa sổ công nợ:**
   - Chủ trọ bấm **"Xác nhận đã nhận tiền (Khóa sổ)"**, hóa đơn chuyển sang trạng thái **`3 · Đã thanh toán`** và đóng băng dữ liệu.
   - Bảng điều khiển Dashboard tự động cập nhật doanh thu thực thu 100%.
