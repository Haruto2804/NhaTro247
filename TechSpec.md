# TechSpec (Technical Specification)
## Dự án: Module Số Hóa Chốt Chỉ Số Điện Nước & Đối Soát Thanh Toán Hai Chiều Cho Khu Nhà Trọ

---

### 1. Kiến trúc tổng thể (Architecture Overview)
- **Mô hình:** Client - Server tách biệt (RESTful API), xác thực danh tính Chủ trọ trực tiếp bằng **Google SDK (Google Identity Services & Google Auth Library)**.
- **Cấu trúc mã nguồn đề xuất:**
  - `/client`: Ứng dụng Frontend (React + Vite + Tailwind CSS + Shadcn UI + `@react-oauth/google`).
  - `/server`: Dịch vụ Backend (Node.js + Express.js + Mongoose + `google-auth-library`).
  - `/server/uploads`: Thư mục lưu trữ hình ảnh công tơ điện nước phục vụ tĩnh (Static Serving).

```
                    ┌────────────────────────┐
                    │  React Client (Vite)   │◄──── Google Identity Services
                    │   Tailwind + Shadcn    │      (@react-oauth/google)
                    └───────────┬────────────┘
                                │ HTTP / JSON (REST API)
                                │ Authorization: Bearer <App_Session_Token / Google_Credential>
                                ▼
                    ┌────────────────────────┐
                    │  Node.js / Express     │◄──── Google Auth Library
                    │   REST Controllers     │      (google-auth-library verifyIdToken)
                    └───────┬────────┬───────┘
                            │        │
               Mongoose ODM │        │ Multer (File Upload)
                            ▼        ▼
                   ┌──────────┐   ┌───────────────┐
                   │ MongoDB  │   │ Local Uploads │
                   │ Database │   │ (/uploads)    │
                   └──────────┘   └───────────────┘
```

---

### 2. Công nghệ chi tiết (Technology Stack)

#### Frontend
- **Core:** React 18+ (khởi tạo bằng Vite để tối ưu tốc độ và kích thước bundle nhẹ).
- **Authentication:** **Google Identity Services SDK (`@react-oauth/google`)** — hỗ trợ nút đăng nhập Google chuẩn của Google, hiển thị popup đăng nhập 1 chạm mượt mà.
- **Styling & UI Library:** 
  - Tailwind CSS v3+.
  - Shadcn UI (xây dựng trên nền Radix UI headless components: Dialog, Dropdown, Tabs, Button, Card, Badge, Table, Input).
  - Lucide React (bộ icon hiện đại, tối giản).
- **Routing:** `react-router-dom` v6+.
- **Gọi API:** `axios` tích hợp interceptor tự động đính kèm Token đăng nhập vào Header `Authorization`.
- **Tiện ích hiển thị:** `date-fns` (xử lý ngày tháng), `clsx` & `tailwind-merge` (quản lý class CSS).

#### Backend
- **Runtime:** Node.js (v18+ LTS).
- **Framework:** Express.js (v4+).
- **Xác thực Bảo mật:** **Google Auth Library (`google-auth-library`)** — thư viện chính thức của Google để xác thực chữ ký số của `credential` (ID Token) gửi từ client bằng phương thức `OAuth2Client.verifyIdToken()`.
- **Database ODM:** Mongoose (kết nối và quản lý schema MongoDB).
- **Xử lý Upload ảnh:** `multer` (nhận ảnh chụp công tơ từ camera điện thoại, lưu vào `/uploads`, giới hạn dung lượng & định dạng ảnh).
- **Tiện ích & Bảo mật khác:**
  - `jsonwebtoken` (JWT): Tạo session token nội bộ cho ứng dụng sau khi verify Google ID token thành công (đảm bảo nhanh gọn, không cần gọi lại Google API ở mọi request nội bộ).
  - `cors`: Cấu hình nguồn truy cập an toàn.
  - `uuid` (v4): Tạo chuỗi token ngẫu nhiên, bí mật cho từng liên kết hóa đơn của Người thuê.

#### Cơ sở dữ liệu (Database)
- **Hệ quản trị:** MongoDB (cài đặt cục bộ MongoDB Community Server hoặc MongoDB Atlas).
- **Mô hình đối tượng:**
  - `Users` (Chủ trọ): Lưu `googleId`, `email`, `name`, `picture`, `bankingInfo` (Ngân hàng, STK, Chủ TK).
  - `Rooms` (Phòng trọ): Mã phòng, Tên phòng, Người đại diện, SĐT, Tiền phòng, Đơn giá điện, Đơn giá nước, Phí dịch vụ.
  - `Invoices` (Hóa đơn kỳ): Kỳ tháng (`monthYear`), Chỉ số điện cũ/mới, Chỉ số nước cũ/mới, Ảnh công tơ điện/nước, Các khoản phí, Tổng tiền, `status` (kiểu Number: `0` - Chưa chốt, `1` - Đã gửi, `2` - Khiếu nại, `3` - Đã thanh toán), `token` bí mật tra cứu, Thông tin phản hồi/khiếu nại của khách.

#### Tích hợp thanh toán VietQR
- **Phương thức:** Chuẩn sinh mã VietQR mở theo quy chuẩn NAPAS 247.
- **Cơ chế:** Sử dụng trực tiếp chuẩn link ảnh QuickLink VietQR:
  `https://img.vietqr.io/image/{bankCode}-{accountNumber}-compact2.png?amount={amount}&addInfo={description}`
  - Hoàn toàn miễn phí, không cần đăng ký cổng thanh toán doanh nghiệp, chuyển khoản P2P trực tiếp về tài khoản chủ trọ.

---

### 3. Thiết kế luồng dữ liệu & Bảo mật (Security & Data Flow)

1. **Xác thực Chủ trọ qua Google SDK:**
   - Client hiển thị nút Google Sign-In từ `@react-oauth/google`.
   - Người dùng đăng nhập thành công, Google trả về `credential` (Google ID Token).
   - Client gửi `credential` lên backend qua `POST /api/auth/google`.
   - Backend dùng `OAuth2Client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID })`:
     - Trích xuất thông tin định danh: `sub` (Google ID), `email`, `name`, `picture`.
     - Tìm hoặc tạo mới bản ghi `User` trong MongoDB.
     - Ký cấp phát một `sessionToken` (JWT nội bộ) trả về cho Client.
   - Các request quản trị sau đó gửi kèm `Authorization: Bearer <sessionToken>`.

2. **Phân quyền Người thuê trọ (Public Secure Access):**
   - Không yêu cầu tài khoản Google.
   - Người thuê mở link hóa đơn: `https://.../bill/:token`.
   - Backend xác thực tính hợp lệ của `:token` (UUID v4) trong collection `Invoices`.
   - Khách có quyền xem chi tiết, đối chiếu ảnh công tơ gốc, bấm "Xác nhận đúng" hoặc "Báo sai lệch" (kèm tải ảnh đối chứng).

3. **Cơ chế tải và tối ưu ảnh công tơ:**
   - Hỗ trợ chụp trực tiếp từ camera smartphone `<input type="file" accept="image/*" capture="environment" />`.
   - Backend kiểm duyệt định dạng file (`image/jpeg`, `image/png`, `image/webp`), giới hạn kích thước tối đa (5MB/ảnh).

---

### 4. Danh sách các API Endpoints cốt lõi

#### Phân hệ Xác thực & Cài đặt (Auth & Profile - Google SDK)
- `POST /api/auth/google` — Nhận Google ID Token từ frontend, xác thực qua Google Auth Library, đồng bộ người dùng và trả về phiên đăng nhập.
- `GET /api/auth/me` — Lấy thông tin chủ trọ & tài khoản ngân hàng nhận tiền VietQR.
- `PUT /api/auth/banking` — Cập nhật thông tin ngân hàng thụ hưởng (Ngân hàng, STK, Tên tài khoản).

#### Phân hệ Quản lý phòng (Rooms - Chủ trọ)
- `GET /api/rooms` — Lấy danh sách phòng thuộc quản lý của chủ trọ.
- `POST /api/rooms` — Thêm phòng trọ mới.
- `GET /api/rooms/:id` — Chi tiết 1 phòng.
- `PUT /api/rooms/:id` — Cập nhật thông tin phòng / người đại diện / đơn giá.
- `DELETE /api/rooms/:id` — Xóa phòng.

#### Phân hệ Chốt số & Hóa đơn (Invoices & Readings - Chủ trọ)
- `POST /api/invoices` — Chốt chỉ số điện nước mới, upload ảnh công tơ thực tế, tính toán tự động và tạo hóa đơn tháng.
- `GET /api/invoices` — Danh sách hóa đơn (filter theo `monthYear`, theo `status`, theo `roomId`).
- `GET /api/invoices/:id` — Chi tiết hóa đơn.
- `PUT /api/invoices/:id/adjust` — Chủ trọ cập nhật lại chỉ số khi có khiếu nại sai lệch từ khách.
- `PATCH /api/invoices/:id/paid` — Chủ trọ bấm xác nhận đã nhận tiền (khóa sổ công nợ phòng).

#### Phân hệ Đối soát công khai cho Người thuê (Public Tenant API)
- `GET /api/public/invoices/:token` — Lấy chi tiết hóa đơn, ảnh công tơ đối chiếu và mã VietQR thanh toán.
- `POST /api/public/invoices/:token/confirm` — Khách ấn nút "Xác nhận đúng chỉ số".
- `POST /api/public/invoices/:token/dispute` — Khách gửi phản hồi báo sai lệch (lý do + upload ảnh công tơ đối chứng).

#### Phân hệ Bảng điều khiển (Dashboard Analytics - Chủ trọ)
- `GET /api/dashboard/stats?monthYear=MM-YYYY` — Lấy số liệu tổng hợp: Tổng phòng, Đã nộp (`PAID`), Còn nợ (`SENT`/`CONFIRMED`), Đang khiếu nại (`DISPUTED`), Tổng doanh thu thực thu vs dự kiến.

---

### 5. Cấu hình biến môi trường (Environment Variables)

```env
# Server (.env)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/phongtro_db
JWT_SECRET=super_secret_jwt_key_phongtro
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# Client (.env)
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```
