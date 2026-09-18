# Tracker (Tiến Độ Dự Án & Nhật Ký Thực Hiện)
## Dự án: Module Số Hóa Chốt Chỉ Số Điện Nước & Đối Soát Thanh Toán Hai Chiều Cho Khu Nhà Trọ

> **Nguyên tắc:** File này hoạt động theo cơ chế append-only. Cập nhật trạng thái hoàn thành [x], không xóa bỏ lịch sử công việc.

---

### 1. Tổng quan tiến độ (Progress Overview)
- **Giai đoạn hiện tại:** Hoàn tất Bộ 8 Tài liệu Thiết kế (Planning Phase Complete) - Chuẩn bị bước vào xây dựng (Phase 4 Build).
- **Trạng thái:** 8/8 tài liệu đã hoàn thành.

| Hạng mục | Trạng thái | Ngày cập nhật |
|---|---|---|
| 1. PRD.md | Đã hoàn thành | 18/09/2026 |
| 2. TechSpec.md | Đã hoàn thành | 18/09/2026 |
| 3. AppFlow.md | Đã hoàn thành | 18/09/2026 |
| 4. Schema.md | Đã hoàn thành | 18/09/2026 |
| 5. ImplementationPlan.md | Đã hoàn thành | 18/09/2026 |
| 6. Rules.md | Đã hoàn thành | 18/09/2026 |
| 7. Tracker.md | Đã hoàn thành | 18/09/2026 |
| 8. Design.md | Đã hoàn thành | 18/09/2026 |

---

### 2. Danh mục Công việc Phát triển (Task Checklist)

#### Giai đoạn 1: Khởi tạo Cấu trúc Dự án & Môi trường
- [ ] Khởi tạo thư mục `/server` và `/client`.
- [ ] Cấu hình Backend: `express`, `mongoose`, `google-auth-library`, `jsonwebtoken`, `multer`, `cors`, `dotenv`, `uuid`.
- [ ] Cấu hình Frontend: React (Vite), Tailwind CSS, Lucide React, Axios, React Router, `@react-oauth/google`.
- [ ] Thiết lập file `.env` cho cả Server và Client.

#### Giai đoạn 2: Phát triển Backend API & Database
- [ ] Tạo các Mongoose Models: `User.js`, `Room.js`, `Invoice.js`.
- [ ] Xây dựng `authMiddleware` (Google Auth verify) & `uploadMiddleware` (Multer).
- [ ] Xây dựng API Xác thực & Cài đặt Ngân hàng (`/api/auth`).
- [ ] Xây dựng API Quản lý phòng trọ (`/api/rooms`).
- [ ] Xây dựng API Chốt số, Tính tiền & Hóa đơn (`/api/invoices`).
- [ ] Xây dựng API Đối soát công khai cho Người thuê (`/api/public/invoices`).
- [ ] Xây dựng API Thống kê Dashboard công nợ (`/api/dashboard`).

#### Giai đoạn 3: Phát triển Giao diện Quản trị cho Chủ trọ (Frontend)
- [ ] Xây dựng Layout Responsive & Điều hướng.
- [ ] Xây dựng Màn hình Đăng nhập Google 1 chạm.
- [ ] Xây dựng Bảng điều khiển Công nợ (Dashboard) với 4 trạng thái `0, 1, 2, 3`.
- [ ] Xây dựng Quản lý Danh mục Phòng & Đơn giá.
- [ ] Xây dựng Màn hình Chốt số Điện Nước & Tải ảnh công tơ.
- [ ] Xây dựng Màn hình Chi tiết Hóa đơn & Xử lý Khiếu nại sai lệch.
- [ ] Xây dựng Màn hình Cài đặt VietQR.

#### Giai đoạn 4: Phát triển Giao diện Đối soát cho Người thuê (Frontend)
- [ ] Xây dựng Trang tra cứu hóa đơn bảo mật `/bill/:token` (Mobile-First).
- [ ] Xây dựng Trình xem/phóng to ảnh công tơ đối chiếu thực tế.
- [ ] Xây dựng Hành động Xác nhận đúng & Modal Báo sai lệch kèm upload ảnh đối chứng.
- [ ] Xây dựng Khung thanh toán VietQR động NAPAS & Con dấu "ĐÃ THANH TOÁN".

#### Giai đoạn 5: Tích hợp, Kiểm thử Toàn diện & Tối ưu
- [ ] Kiểm thử luồng khép kín (End-to-end loop).
- [ ] Kiểm tra hiển thị responsive và thao tác chụp ảnh trên smartphone.
- [ ] Viết tài liệu hướng dẫn chạy dự án.

---

### 3. Nhật ký hoạt động (Activity Log)
- **18/09/2026 10:00:** Khởi tạo tài liệu [PRD.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/PRD.md), xác định yêu cầu nghiệp vụ và các tiêu chí cốt lõi của đề tài.
- **18/09/2026 10:06:** Hoàn thiện [TechSpec.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/TechSpec.md), thống nhất kiến trúc React + Vite + Tailwind + Shadcn, Node.js Express, MongoDB và xác thực bằng Google SDK chính thức.
- **18/09/2026 10:10:** Hoàn thiện [AppFlow.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/AppFlow.md) với sơ đồ Mermaid đối soát hai chiều khép kín và chuẩn hóa 4 mã trạng thái: `0` (Chưa chốt), `1` (Đã gửi), `2` (Khách khiếu nại), `3` (Đã thanh toán).
- **18/09/2026 10:12:** Đồng bộ [PRD.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/PRD.md) và [TechSpec.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/TechSpec.md) theo mã trạng thái số `0, 1, 2, 3`.
- **18/09/2026 10:12:** Hoàn thiện [Schema.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/Schema.md) thiết kế chi tiết 3 collections MongoDB: `users`, `rooms`, `invoices`.
- **18/09/2026 10:14:** Hoàn thiện [ImplementationPlan.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/ImplementationPlan.md) lập kế hoạch 5 giai đoạn phát triển.
- **18/09/2026 10:18:** Hoàn thiện [Rules.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/Rules.md) quy định tiêu chuẩn code và các nguyên tắc bất biến khi khóa sổ.
- **18/09/2026 10:20:** Khởi tạo [Tracker.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/Tracker.md) quản lý tiến độ dự án.
- **18/09/2026 10:22:** Hoàn thiện [Design.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/Design.md) phong cách Modern & Clean SaaS, bảng màu Deep Blue & Emerald, phông chữ Be Vietnam Pro/Inter tối ưu mobile-first. Hoàn tất toàn bộ 8/8 tài liệu quy hoạch.
- **18/09/2026 10:25:** Cập nhật [Rules.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/Rules.md) bổ sung quy tắc bắt buộc commit Git từng bước chi tiết bằng tiếng Việt và đồng bộ liên tục lên GitHub.
