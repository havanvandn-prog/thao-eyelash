const NOTIFY_EMAILS = [
  'thanhthao221094@gmail.com',
  'havanvanpod@gmail.com'
];

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0 || String(sheet.getRange(1, 1).getValue()).trim() === '') {
    sheet.getRange(1, 1, 1, 5).setValues([[
      'Timestamp',
      'Name',
      'Phone',
      'Services',
      'Booking DateTime'
    ]]);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
}

function buildBookingEmail_(name, phone, service, bookingDateTime, formattedTime) {
  const subject = '[Quick Booking] Lịch hẹn mới từ khách hàng: ' + name;
  const body = [
    'Chào Admin,',
    '',
    'Hệ thống vừa ghi nhận một lượt đăng ký đặt lịch mới từ Landing Page. Dưới đây là thông tin chi tiết để liên hệ xử lý:',
    '',
    '📌 Thông Tin Đăng Ký',
    'Họ và tên khách hàng: ' + name,
    '',
    'Số điện thoại / Tài khoản liên hệ (WhatsApp/KakaoTalk/Line): ' + phone,
    '',
    'Dịch vụ lựa chọn: ' + service + ' (Eyelash Extensions / Lash Lift / Brow Lamination)',
    '',
    'Thời gian hẹn khách chọn: ' + bookingDateTime
  ].join('\n');

  return { subject: subject, body: body };
}

function sendBookingNotifications_(subject, body) {
  const recipients = NOTIFY_EMAILS.filter(function (email) {
    return String(email || '').trim().length > 0;
  });

  if (recipients.length === 0) {
    throw new Error('Không có email nhận thông báo.');
  }

  // Gửi 1 email tới tất cả người nhận (đảm bảo cả 2 inbox đều nhận).
  try {
    GmailApp.sendEmail(recipients.join(','), subject, body, {
      name: 'Thao Eyelash Booking'
    });
    return;
  } catch (gmailErr) {
    // Fallback nếu Gmail API bị giới hạn.
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: subject,
      body: body,
      name: 'Thao Eyelash Booking'
    });
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: 'Thao Eyelash booking API is running.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    ensureHeaders_(sheet);

    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '';
    const data = JSON.parse(rawBody);
    const name = String(data.name || '').trim();
    const phone = String(data.phone || '').trim();
    const service = String(data.service || '').trim();
    const bookingDateTime = String(data.bookingDateTime || '').trim();
    const timestamp = new Date();

    if (!name || !phone || !service || !bookingDateTime) {
      throw new Error('Thiếu trường bắt buộc: name, phone, service, bookingDateTime.');
    }

    sheet.appendRow([timestamp, name, phone, service, bookingDateTime]);

    const formattedTime = Utilities.formatDate(
      timestamp,
      'Asia/Ho_Chi_Minh',
      'dd/MM/yyyy HH:mm'
    );

    let emailSent = false;
    let emailError = '';

    try {
      const email = buildBookingEmail_(name, phone, service, bookingDateTime, formattedTime);
      sendBookingNotifications_(email.subject, email.body);
      emailSent = true;
    } catch (notifyErr) {
      emailError = String(notifyErr);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        emailSent: emailSent,
        emailError: emailError || null
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function testEmailNotifications() {
  const timestamp = new Date();
  const formattedTime = Utilities.formatDate(
    timestamp,
    'Asia/Ho_Chi_Minh',
    'dd/MM/yyyy HH:mm'
  );
  const email = buildBookingEmail_(
    'Test Email',
    '0900000000',
    'Lash Lift',
    '2026-06-15 14:00',
    formattedTime
  );
  sendBookingNotifications_(email.subject, email.body);
}

function setupSheet() {
  ensureHeaders_(SpreadsheetApp.getActiveSpreadsheet().getActiveSheet());
}
