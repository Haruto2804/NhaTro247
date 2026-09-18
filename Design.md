# Design (Hướng Dẫn Thiết Kế Giao Diện & Trải Nghiệm UI/UX)
## Dự án: Module Số Hóa Chốt Chỉ Số Điện Nước & Đối Soát Thanh Toán Hai Chiều Cho Khu Nhà Trọ

---

### 1. Triết lý Thiết kế (Design Philosophy)
- **Phong cách chủ đạo:** **Modern & Clean SaaS** (Tối giản, tinh tế, thoáng đãng, sắc nét theo chuẩn ngôn ngữ thiết kế của Shadcn UI và Vercel).
- **Trọng tâm trải nghiệm (UX Focus):**
  - **Minh bạch & Đáng tin cậy:** Số liệu kế toán, tiền tệ và hình ảnh công tơ thực tế được trình bày rõ ràng, phân cấp thị giác mạch lạc, không gây rối mắt.
  - **Mobile-First & Thao tác 1 chạm:** Tối ưu hóa kích thước nút bấm ($\ge 44px$) và trường nhập liệu thuận tiện cho ngón tay cái khi chủ trọ đi chụp ảnh công tơ thực địa hoặc khi người thuê xem hóa đơn và quét mã VietQR.

---

### 2. Hệ thống Màu sắc (Color Palette)

Hệ màu được xây dựng dựa trên sự kết hợp giữa **Xanh dương sâu (Deep Blue)** đại diện cho sự chuẩn mực, tin cậy và **Xanh ngọc lục bảo (Emerald)** đại diện cho tài chính minh bạch, thanh toán hoàn tất.

| Nhóm màu | Mã Hex | Tên biến Tailwind | Mục đích sử dụng |
|---|---|---|---|
| **Primary** | `#2563EB` | `blue-600` | Nút bấm chính, liên kết, trạng thái kích hoạt, thương hiệu |
| **Primary Hover** | `#1D4ED8` | `blue-700` | Hiệu ứng rê chuột / nhấn nút chính |
| **Primary Light** | `#EFF6FF` | `blue-50` | Nền các khối nổi bật, thẻ thông tin hoạt động |
| **Success / Paid** | `#059669` | `emerald-600` | Trạng thái `3 - Đã thanh toán`, biểu tượng duyệt thành công |
| **Success Light** | `#ECFDF5` | `emerald-50` | Huy hiệu (Badge) thanh toán, nền biên lai hoàn tất |
| **Dispute / Warning**| `#DC2626` | `red-600` | Trạng thái `2 - Khách khiếu nại`, nút báo sai lệch, cảnh báo |
| **Dispute Light** | `#FEF2F2` | `red-50` | Huy hiệu khiếu nại, khung thông báo sai lệch chỉ số |
| **Pending / Sent** | `#0284C7` | `sky-600` | Trạng thái `1 - Đã gửi hóa đơn`, chờ khách phản hồi |
| **Pending Light** | `#F0F9FF` | `sky-50` | Huy hiệu chờ đối soát |
| **Draft / Inactive** | `#64748B` | `slate-500` | Trạng thái `0 - Chưa chốt số`, chữ thứ cấp (Muted text) |
| **Background App** | `#F8FAFC` | `slate-50` | Màu nền tổng thể toàn bộ ứng dụng |
| **Card / Surface** | `#FFFFFF` | `white` | Mặt phẳng thẻ nội dung, modal, bảng dữ liệu |
| **Border** | `#E2E8F0` | `slate-200` | Đường viền ngăn cách card, ô nhập liệu, bảng biểu |
| **Foreground Text** | `#0F172A` | `slate-900` | Màu chữ tiêu đề và nội dung quan trọng |

---

### 3. Phông chữ & Typography (Typography System)
- **Font Family:** `Be Vietnam Pro`, `Inter`, system-ui, sans-serif.
  - Đảm bảo hiển thị hoàn hảo dấu tiếng Việt, số đo, bảng biểu và ký hiệu tiền tệ (đ, VNĐ).
- **Phân cấp cỡ chữ (Hierarchy):**
  - **H1 (Page Title):** `text-2xl font-bold text-slate-900` (Mobile: 20px, Desktop: 24px).
  - **H2 (Section Header):** `text-lg font-semibold text-slate-800` (18px).
  - **H3 (Card Title):** `text-base font-semibold text-slate-800` (16px).
  - **Body (Nội dung chính):** `text-sm font-normal text-slate-700` (14px).
  - **Muted (Ghi chú, nhãn phụ):** `text-xs font-medium text-slate-500` (12px).
  - **Total Currency (Số tiền tổng):** `text-2xl sm:text-3xl font-bold text-blue-600` làm nổi bật số tiền cần thanh toán.

---

### 4. Quy cách Thành phần UI (Shadcn UI Component Specifications)

#### 4.1. Huy hiệu Trạng thái (Status Badges)
Chuẩn hóa 4 trạng thái theo mã số với màu sắc định danh rõ nét:
- `0` - **Chưa chốt số:** `<Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">0 · Chưa chốt</Badge>`
- `1` - **Đã gửi hóa đơn:** `<Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">1 · Đã gửi HĐ</Badge>`
- `2` - **Khách khiếu nại:** `<Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 animate-pulse">2 · Khiếu nại</Badge>`
- `3` - **Đã thanh toán:** `<Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">3 · Đã thanh toán</Badge>`

#### 4.2. Nút bấm (Buttons)
- Chiều cao chuẩn chạm cảm ứng: `h-11 px-4 py-2 rounded-lg font-medium text-sm transition-all`.
- **Primary:** Nền xanh Deep Blue (`bg-blue-600 hover:bg-blue-700 text-white shadow-sm`).
- **Success ("Xác nhận đúng"):** Nền xanh Emerald (`bg-emerald-600 hover:bg-emerald-700 text-white`).
- **Dispute ("Báo sai lệch"):** Nền viền đỏ nhạt (`border border-red-200 bg-red-50 hover:bg-red-100 text-red-700`).
- **Secondary / Ghost:** `hover:bg-slate-100 text-slate-700`.

#### 4.3. Thẻ Card & Layout
- Khung Card: Nền trắng, viền mảnh `border border-slate-200`, bo tròn `rounded-xl`, đổ bóng nhẹ `shadow-sm`.
- Khoảng cách lề trong (Padding):
  - Desktop: `p-6`
  - Mobile: `p-4`

#### 4.4. Hộp thoại so sánh ảnh công tơ (Proof Image Viewer)
- Bấm vào ảnh công tơ sẽ mở Modal Lightbox với nền làm mờ `backdrop-blur-sm bg-black/70`.
- Cho phép phóng to tối đa để người thuê soi rõ từng chữ số cơ học hoặc số điện tử trên mặt đồng hồ.
- Trong trạng thái khiếu nại (`2`), hiển thị chia đôi màn hình (Side-by-side) trên máy tính hoặc xếp dọc trước/sau trên điện thoại để so sánh ngay ảnh của chủ trọ và ảnh phản ánh của khách.

#### 4.5. Khung thanh toán VietQR (VietQR Showcase)
- Đặt trong một Card nổi bật với viền xanh nhạt `border-blue-200 bg-gradient-to-b from-white to-blue-50/30`.
- Mã QR kích thước tiêu chuẩn 240x240px sắc nét, có viền bo mềm mại.
- Tích hợp 2 nút sao chép nhanh 1 chạm: **"Sao chép STK"** và **"Sao chép Số tiền"** kèm thông báo Toast phản hồi tức thì.
- Khi hóa đơn đạt trạng thái `3`, đóng dấu watermark hình tròn xoay nhẹ: **`✓ ĐÃ THANH TOÁN`** màu xanh ngọc.
