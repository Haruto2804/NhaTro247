# Rules (Quy Tắc Phát Triển & Tiêu Chuẩn Dự Án)
## Dự án: Module Số Hóa Chốt Chỉ Số Điện Nước & Đối Soát Thanh Toán Hai Chiều Cho Khu Nhà Trọ

---

### 1. Nguyên tắc cốt lõi (Core Principles)
1. **Bám sát thỏa thuận (Spec-Driven Development):**
   - Mọi dòng mã nguồn viết ra phải tuân thủ nghiêm ngặt [PRD.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/PRD.md), [TechSpec.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/TechSpec.md), [AppFlow.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/AppFlow.md) và [Schema.md](file:///c:/Users/ngohi/OneDrive/Documents/PhongTro/Schema.md).
   - Tuyệt đối không tự ý thêm bớt tính năng, thư viện hoặc bảng dữ liệu nằm ngoài phạm vi đã thống nhất với người dùng.
2. **Triết lý Senior Dev (Tối giản & Hiệu quả):**
   - Không tạo các tầng trừu tượng (abstraction layers) phức tạp khi không có yêu cầu.
   - Ưu tiên giải pháp ít file nhất, mã nguồn rõ ràng, dễ đọc, tránh over-engineering.
   - Sử dụng chuẩn mở VietQR QuickLink (ảnh tĩnh URL) thay vì cài đặt các SDK trung gian cồng kềnh.

---

### 2. Tiêu chuẩn Mã nguồn (Coding Standards)

#### Backend (Node.js / Express / Mongoose)
- **Cấu trúc thư mục:** Tối giản và phân tách theo trách nhiệm:
  - `controllers/`: Xử lý nghiệp vụ và điều phối request/response.
  - `models/`: Định nghĩa Schema Mongoose và validation quy tắc dữ liệu.
  - `routes/`: Định tuyến các API endpoints.
  - `middlewares/`: Kiểm tra xác thực token (`authMiddleware`) và xử lý upload file (`uploadMiddleware`).
- **Validation tại ranh giới dữ liệu (Trust Boundaries):**
  - Mọi endpoint tạo/sửa chỉ số bắt buộc kiểm tra: $Chỉ\ số\ mới \ge Chỉ\ số\ cũ$.
  - Kiểm tra tính hợp lệ của MIME type file ảnh (`image/jpeg`, `image/png`, `image/webp`) và giới hạn kích thước tối đa 5MB.
- **Xử lý lỗi (Error Handling):**
  - Mọi controller bất đồng bộ (async) phải có `try/catch` hoặc wrapper an toàn; trả về mã lỗi HTTP chuẩn (400, 401, 403, 404, 500) kèm thông điệp JSON nhất quán `{ message: string }`.

#### Frontend (React / Tailwind CSS / Shadcn UI)
- **Cấu trúc thư mục:**
  - `src/components/`: Chứa các UI components dùng chung (Button, Card, Modal, Input, Badge...).
  - `src/pages/`: Chứa các màn hình theo luồng nghiệp vụ (Dashboard, Rooms, Invoices, BillDetail, Settings).
  - `src/services/` hoặc `src/api/`: Quản lý các hàm gọi API axios tập trung.
  - `src/context/`: Quản lý trạng thái xác thực người dùng (AuthContext).
- **Trải nghiệm Mobile-First & Responsive:**
  - Toàn bộ các trang (đặc biệt là trang hóa đơn khách thuê `/bill/:token` và trang chốt số di động của chủ trọ) phải được thiết kế và kiểm thử tối ưu hoàn hảo trên màn hình cảm ứng di động.
- **Biến trạng thái & Định dạng:**
  - Trạng thái hóa đơn luôn tuân theo kiểu số: `0` (Chưa chốt), `1` (Đã gửi), `2` (Khách khiếu nại), `3` (Đã thanh toán).
  - Tiền tệ hiển thị dạng VND chuẩn Việt Nam: `new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)`.
  - Ngày tháng chuẩn `dd/MM/yyyy`.

---

### 3. Quy tắc Nghiệp vụ Bắt buộc (Business Rules)
1. **Tính bất biến khi khóa sổ:**
   - Khi hóa đơn đạt trạng thái `3` (Đã thanh toán), backend từ chối mọi yêu cầu chỉnh sửa (`PUT /adjust`) hoặc xóa hóa đơn đó để bảo vệ tính chính xác của sổ kế toán.
2. **Minh chứng công tơ là bắt buộc:**
   - Chủ trọ khi tạo hóa đơn bắt buộc phải đính kèm ảnh chụp công tơ thực tế.
   - Khách thuê khi báo sai lệch chỉ số bắt buộc phải tải lên ảnh chụp đồng hồ thực tế để đối chứng.
3. **Quyền riêng tư hóa đơn của người thuê:**
   - Người thuê chỉ có thể xem hóa đơn thông qua mã Token bí mật (UUID v4) trong URL. Không để lộ ID tự tăng hoặc tuần tự nhằm tránh việc người thuê phòng này xem trộm hóa đơn của phòng khác.

---

### 4. Quy tắc Quản lý Phiên bản & Commit Git (Git & GitHub Workflow)
1. **Commit từng bước chi tiết (Atomic & Step-by-Step Commits):**
   - Mỗi khi hoàn thành một bước logic (tạo model, viết middleware, hoàn thiện controller, dựng giao diện một màn hình...), bắt buộc phải commit ngay vào Git.
   - Tuyệt đối không dồn code của nhiều tính năng vào một commit duy nhất.
2. **Thông điệp Commit hoàn toàn bằng Tiếng Việt (Vietnamese Commit Messages):**
   - Tiêu đề và mô tả commit phải được viết rõ ràng bằng tiếng Việt, có ý nghĩa và thể hiện chính xác nội dung thay đổi.
   - Áp dụng tiền tố chuẩn:
     - `docs:` Cho các tài liệu thiết kế và đặc tả.
     - `feat:` Cho tính năng mới (models, controllers, pages, components).
     - `fix:` Cho sửa lỗi logic hoặc giao diện.
     - `chore:` Cho cài đặt thư viện, cấu hình môi trường, script.
3. **Đồng bộ liên tục lên GitHub (Push to GitHub):**
   - Sau mỗi bước hoàn tất, thực hiện push mã nguồn lên GitHub (`origin/main`) để đảm bảo lịch sử git minh bạch và không bị mất dữ liệu.
