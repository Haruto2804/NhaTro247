/**
 * Tiện ích nghiệp vụ xử lý phân phối hóa đơn qua Zalo (Zalo Quick-Send)
 * Hỗ trợ chuẩn hóa SĐT, định dạng tin nhắn chuyên nghiệp và kích hoạt Deep Link zalo.me
 */

/**
 * Chuẩn hóa số điện thoại người thuê về dạng đầu số hợp lệ của Zalo
 * Ví dụ: '+84912345678', '84912345678', '0912 345 678', '091-234-5678' -> '0912345678'
 */
export function normalizeVietnamesePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.toString().trim().replace(/[\s.\-()]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84')) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Định dạng tiền tệ VNĐ
 */
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

/**
 * Soạn thảo tin nhắn Hóa đơn chuẩn hóa theo tài liệu AppFlow & PRD
 */
export function buildZaloInvoiceMessage({
  roomName,
  tenantName,
  monthYear,
  roomFee = 0,
  elecInfo = null, // { oldIndex, newIndex, consumption, amount, unitPrice }
  waterInfo = null, // { oldIndex, newIndex, consumption, amount, unitPrice }
  serviceFee = 0,
  totalAmount = 0,
  billUrl,
}) {
  const parts = [];

  parts.push(`🏠 [NHÀ TRỌ 247] - THÔNG BÁO TIỀN PHÒNG THÁNG ${monthYear}`);
  parts.push(`Kính gửi: Bạn ${tenantName || 'Khách thuê'} - ${roomName}`);
  parts.push('');
  parts.push('Chi tiết các khoản chi phí kỳ này:');
  
  let itemIndex = 1;
  if (roomFee > 0) {
    parts.push(`${itemIndex++}. Tiền phòng: ${formatVND(roomFee)}`);
  }

  if (elecInfo) {
    const kwh = elecInfo.consumption || 0;
    parts.push(`${itemIndex++}. Tiền điện (${elecInfo.oldIndex} -> ${elecInfo.newIndex} = ${kwh} kWh): ${formatVND(elecInfo.amount)}`);
  }

  if (waterInfo) {
    const m3 = waterInfo.consumption || 0;
    parts.push(`${itemIndex++}. Tiền nước (${waterInfo.oldIndex} -> ${waterInfo.newIndex} = ${m3} m³): ${formatVND(waterInfo.amount)}`);
  }

  if (serviceFee > 0) {
    parts.push(`${itemIndex++}. Phí dịch vụ (Wifi, rác, vệ sinh): ${formatVND(serviceFee)}`);
  }

  parts.push(`👉 TỔNG CỘNG CẦN THANH TOÁN: ${formatVND(totalAmount)}`);
  parts.push('');
  parts.push('📸 Quý khách vui lòng bấm vào liên kết bảo mật dưới đây để xem ẢNH CHỤP CÔNG TƠ THỰC TẾ và quét mã VIETQR thanh toán nhanh:');
  parts.push(`🔗 ${billUrl}`);
  parts.push('');
  parts.push('(Vui lòng đối chiếu số đo công tơ và bấm xác nhận hoặc báo sai lệch trên hệ thống trong vòng 24h. Trân trọng cảm ơn!)');

  return parts.join('\n');
}

/**
 * Thực thi quy trình Gửi Hóa đơn 1-Chạm qua Zalo:
 * 1. Tự động copy nội dung vào Clipboard
 * 2. Mở Deep Link https://zalo.me/{cleanPhone}
 */
export async function quickSendZalo({
  phone,
  roomName,
  tenantName,
  monthYear,
  roomFee,
  elecInfo,
  waterInfo,
  serviceFee,
  totalAmount,
  token,
}) {
  const billUrl = `${window.location.origin}/bill/${token}`;
  const message = buildZaloInvoiceMessage({
    roomName,
    tenantName,
    monthYear,
    roomFee,
    elecInfo,
    waterInfo,
    serviceFee,
    totalAmount,
    billUrl,
  });

  // 1. Sao chép vào Clipboard
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(message);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = message;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  } catch (err) {
    console.warn('Lỗi ghi clipboard tự động:', err);
  }

  // 2. Kích hoạt Deep Link Zalo nếu có SĐT
  const cleanPhone = normalizeVietnamesePhone(phone);
  if (cleanPhone) {
    const zaloUrl = `https://zalo.me/${cleanPhone}`;
    window.open(zaloUrl, '_blank');
    return {
      success: true,
      hasPhone: true,
      cleanPhone,
      message: 'Đã sao chép chi tiết hóa đơn vào bộ nhớ đệm! Đang mở cuộc trò chuyện Zalo với khách...',
    };
  } else {
    return {
      success: true,
      hasPhone: false,
      message: 'Phòng chưa cập nhật SĐT khách! Đã sao chép toàn văn hóa đơn và link đối soát vào bộ nhớ đệm để bạn gửi thủ công.',
    };
  }
}
