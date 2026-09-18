# PRD (Product Requirements Document)
## Dự án: Module Số Hóa Chốt Chỉ Số Điện Nước & Đối Soát Thanh Toán Hai Chiều Cho Khu Nhà Trọ

---

### 1. Tổng quan & Lý do phát triển (Problem Statement & Context)
- **Bối cảnh:** Quy trình chốt tiền phòng, điện, nước cuối tháng tại các khu nhà trọ truyền thống hiện nay phần lớn vẫn thực hiện thủ công (ghi chép sổ sách, nhắn tin Zalo từng khoản). 
- **Vấn đề nhức nhối:**
  - Thiếu minh bạch trong ghi nhận chỉ số công tơ phụ dẫn đến tranh cãi, mất lòng tin giữa khách thuê và chủ trọ.
  - Dễ xảy ra sai sót khi tính toán lũy tiến, chia tiền hoặc cộng gộp nhiều loại phí dịch vụ rời rạc.
  - Khó khăn trong việc theo dõi công nợ, nhắc nợ và đối soát giao dịch chuyển khoản ngân hàng.
- **Mục tiêu dự án:** Số hóa trọn vẹn chu trình chốt chi phí định kỳ cuối tháng, tập trung vào tính **minh bạch có bằng chứng hình ảnh**, **đối soát hai chiều** và **thanh toán nhanh qua VietQR**, loại bỏ triệt để các xung đột tài chính nội bộ.

---

### 2. Đối tượng sử dụng (Target Users)

1. **Chủ trọ / Người quản lý (Landlord):**
   - Đăng nhập bảo mật vào hệ thống quản trị bằng **Google Auth SDK (Google Identity Services)** — đăng nhập 1 chạm bằng tài khoản Google để quản lý danh sách phòng, cấu hình bảng giá điện/nước/dịch vụ.
   - Hàng tháng đi ghi số điện/nước, bắt buộc tải ảnh chụp thực tế công tơ làm căn cứ.
   - Theo dõi trạng thái đối soát của từng phòng, xử lý khiếu nại sai lệch nếu có.
   - Xác nhận thanh toán khớp lệnh để khóa sổ công nợ.

2. **Người thuê trọ (Tenant):**
   - Không cần tải app hoặc tạo tài khoản mật khẩu phức tạp.
   - Nhận đường dẫn tra cứu bảo mật (Secure Token Link / Mã QR) qua Zalo/tin nhắn.
   - Xem hóa đơn chi tiết, mở ảnh chụp công tơ thực tế để đối chiếu với đồng hồ trước cửa phòng.
   - Thực hiện thao tác: **"Xác nhận đúng"** hoặc **"Báo sai lệch chỉ số"** (kèm ảnh chụp bằng chứng phản hồi).
   - Quét mã VietQR sinh tự động (đúng số tiền, đúng nội dung) để chuyển khoản trực tiếp cho chủ trọ.

---

### 3. Phạm vi tính năng cốt lõi (Core Features)

#### Phân hệ 1: Quản lý danh mục phòng & Cấu hình giá
- Quản lý danh sách phòng trọ (Mã phòng, Tên phòng, Người đại diện thuê, SĐT, Số lượng người ở).
- Cấu hình đơn giá cố định:
  - Tiền thuê phòng (VNĐ/tháng).
  - Đơn giá điện (VNĐ/kWh) — áp dụng số điện thực tế.
  - Đơn giá nước (VNĐ/m³ hoặc VNĐ/người/tháng).
  - Các phí dịch vụ cố định (Phí Wifi, Phí vệ sinh/rác, Tiền gửi xe).

#### Phân hệ 2: Chốt chỉ số định kỳ & Minh chứng hình ảnh
- Nhập chỉ số công tơ điện và nước kỳ mới theo từng phòng.
- Hệ thống tự động hiển thị chỉ số cũ của kỳ liền trước để đối chiếu và ngăn chặn lỗi nhập số mới nhỏ hơn số cũ.
- **Bắt buộc tải ảnh chụp thực tế** mặt đồng hồ đo điện và nước tại thời điểm chốt số.
- Tự động tính toán lượng tiêu thụ: $Tiêu\ thụ = Chỉ\ số\ mới - Chỉ\ số\ cũ$.

#### Phân hệ 3: Tự động tính toán & Tổng hợp Hóa đơn duy nhất
- Tự động nhân đơn giá, cộng gộp:
  - $Tổng\ tiền = Tiền\ phòng + (Lượng\ điện \times Đơn\ giá) + (Lượng\ nước \times Đơn\ giá) + Các\ loại\ phí\ dịch\ vụ$.
- Sinh bản ghi hóa đơn hàng tháng với các mã trạng thái số chuẩn hóa:
  - `0`: Chưa chốt số (Phòng chưa nhập chỉ số kỳ này / Bản nháp)
  - `1`: Đã gửi hóa đơn (Đã chốt số & gửi link cho khách đối soát)
  - `2`: Khách khiếu nại (Khách báo sai lệch chỉ số kèm ảnh đối chứng)
  - `3`: Đã thanh toán (Chủ trọ đã nhận tiền & khóa sổ công nợ)

#### Phân hệ 4: Đối soát hai chiều (Two-way Verification & Dispute Resolution)
- Cơ chế sinh liên kết tra cứu hóa đơn kèm token định danh duy nhất cho từng phòng.
- Giao diện người thuê hiển thị chi tiết: Chỉ số cũ, chỉ số mới, mức tiêu thụ, đơn giá, ảnh chụp công tơ gốc của chủ trọ.
- **2 hành động của người thuê:**
  1. **"Xác nhận đúng":** Chuyển trạng thái hóa đơn sang sẵn sàng thanh toán.
  2. **"Báo sai lệch chỉ số":** Nhập ghi chú lý do sai lệch và bắt buộc tải ảnh chụp công tơ thực tế của khách đối chứng.
- Khi có khiếu nại (`DISPUTED`):
  - Chủ trọ nhận thông báo cảnh báo phòng có sai lệch.
  - Chủ trọ vào xem ảnh đối chứng của khách, kiểm tra lại đồng hồ vật lý.
  - Cho phép chủ trọ cập nhật lại chỉ số chuẩn và hệ thống tự động tái lập hóa đơn.

#### Phân hệ 5: Thanh toán nhanh qua VietQR & Khóa sổ công nợ
- Tích hợp chuẩn mã VietQR mở (NAPAS 247):
  - Tự động gắn STK chủ trọ, Ngân hàng thụ hưởng.
  - Điền chính xác số tiền cần thanh toán theo hóa đơn.
  - Tự động điền nội dung chuyển khoản chuẩn hóa (Ví dụ: `P101 TIEN NHA THANG 09`).
- Người thuê quét mã thanh toán trực tiếp từ ứng dụng ngân hàng/ví điện tử.
- Chủ trọ kiểm tra biến động số dư và ấn nút **"Xác nhận đã thanh toán"** để khóa sổ, cập nhật trạng thái `PAID`.

#### Phân hệ 6: Bảng điều khiển công nợ (Debt Dashboard)
- Thống kê tổng quan chu kỳ tháng:
  - Tổng số phòng trong khu trọ.
  - Số phòng đã hoàn tất thanh toán (`PAID`).
  - Số phòng chưa thanh toán / Còn nợ.
  - Số phòng đang khiếu nại chỉ số (`DISPUTED`).
  - Tổng doanh thu dự kiến vs Doanh thu thực thu trong kỳ.
- Bảng lọc danh sách nhanh theo trạng thái để hỗ trợ chủ trọ nhắc nợ và đối soát kịp thời.

---

### 4. Phạm vi ngoài dự án (Out of Scope)
- Không xây dựng sàn giao dịch tìm kiếm, đăng tin cho thuê phòng trọ.
- Không tích hợp cổng thanh toán trung gian thu phí (Payment Gateway API) hoặc Webhook ngân hàng tự động (vì yêu cầu tài khoản định danh doanh nghiệp/phí dịch vụ; sử dụng VietQR chuyển khoản P2P trực tiếp là tối ưu và thực tế nhất).
- Không làm hệ thống ký hợp đồng điện tử bằng chữ ký số pháp lý.

---

### 5. Yêu cầu phi chức năng (Non-Functional Requirements)
- **Responsive & Mobile-First:** Tối ưu hóa giao diện hoàn hảo trên màn hình điện thoại cho cả Chủ trọ (khi đi chụp công tơ thực địa) và Người thuê (khi nhận link và quét QR).
- **Tốc độ & Nén ảnh:** Xử lý nén ảnh công tơ trước khi lưu trữ để tiết kiệm băng thông và đảm bảo tốc độ tải nhanh trên mạng 3G/4G.
- **Bảo mật truy cập:** Link tra cứu của người thuê sử dụng UUID v4 / Cryptographic token, ngăn chặn việc dò mã hóa đơn của phòng khác.

---

### 6. Tiêu chí thành công (Success Metrics)
- Chủ trọ hoàn thành toàn bộ chu trình chốt số 1 phòng (nhập số + chụp ảnh) trong dưới 30 giây.
- 100% hóa đơn xuất ra có đầy đủ ảnh chụp công tơ làm căn cứ.
- Giảm thiểu 100% các cuộc tranh cãi do sai lệch số điện nước nhờ quy trình xác nhận 2 bên trước khi thanh toán.
- Chủ trọ nắm bắt tức thời 100% tình trạng công nợ các phòng trong 1 màn hình Dashboard.
