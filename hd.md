TÀI LIỆU YÊU CẦU SẢN PHẨM (PRD)
QUẢN LÝ PHÒNG KHÁM

1. NGUYÊN TẮC VẬN HÀNH CỐT LÕI (Logic A+B+C)
   Dev bắt buộc phải cài đặt 3 quy tắc này vào hệ thống trước khi làm giao diện:
   A. Quản lý Chỗ (Slot) theo mô hình "12 + 4"
   Không chia giờ cứng (8:00, 8:15). Hệ thống quản lý theo CA (Sáng /Chiều) và BỂ CHỨA.
   VÍ DỤ : CA SÁNG 7H-11H , CA CHIỀU 13H-17H
   • Công suất 1 Bác sĩ: 16 chỗ / Ca (Trung bình 15 phút/khách).
   • Bể Chung (12 chỗ): Dành cho cả Khách đặt Web và Khách Vãng Lai. Ai đến trước/đặt trước thì lấy trước.
   • Bể Dự Phòng (4 chỗ): CHỈ DÀNH CHO KHÁCH VÃNG LAI. Web không bao giờ đặt được 4 chỗ này (để dành cho cấp cứu, người già, quan hệ).
   B. Hàng Chờ Thông Minh (Tự động sắp xếp)
   Danh sách bệnh nhân trên màn hình Bác sĩ tự động nhảy vị trí theo độ ưu tiên:
1. Ưu tiên 1 (VIP): Bệnh nhân đã xét nghiệm xong, quay lại đọc kết quả.
1. Ưu tiên 2: Khách đặt Web đến đúng giờ.
1. Ưu tiên 3: Khách vãng lai.
   C. Kho Thuốc 2 Bước
   • Bước 1: Bác sĩ kê đơn -> Hệ thống "Tạm giữ" (Trừ kho ảo, kho thật chưa trừ).
   • Bước 2: Thu ngân thu tiền -> Hệ thống "Trừ thật".

---

PHẦN 2: CHI TIẾT CHỨC NĂNG - ADMIN
Đối tượng sử dụng: Quản trị viên (Kiêm Lễ tân, Kiêm Thu ngân).
Đặc điểm: truy cập toàn quyền, xử lý luồng đi từ lúc Khách đến -> Khám -> Thu tiền.

1. Quản lý hệ thống
   • Đăng nhập admin + phân quyền (Admin-Lễ tân-Thu ngân, Bác sĩ).
   • Tạo / sửa / khóa tài khoản bác sĩ.
   • Reset mật khẩu.
   • Dashboard tổng quan: Thống kê nhanh số khách trong ngày.
2. Quản lý tài khoản người dùng
   • Tài khoản Bác sĩ: Tạo / sửa / khóa / mở khóa.
   • Tài khoản Bệnh nhân (Khách hàng):
   o Xem danh sách, thông tin cơ bản.
   o Reset mật khẩu (hỗ trợ khách quên mật khẩu Web).
3. Quản lý nghiệp vụ phòng khám (Cấu hình Logic A)
   • Dịch vụ khám: Tên dịch vụ, Thời lượng dự kiến, Giá tiền.
   • Chuyên khoa: Tên chuyên khoa, Gán bác sĩ vào chuyên khoa.
   • Lịch làm việc bác sĩ (Quan trọng):
   o Tạo ca làm: Ca Sáng (7h–11h), Ca Chiều (13h–17h).
   o Logic tự động: Khi tạo ca cho 1 Bác sĩ, hệ thống tự sinh ra quỹ chỗ:
    Tổng Slot: 16.
    Bể Chung (Web + Vãng lai): 12.
    Bể Dự Phòng (Chỉ Vãng lai): 4.
   o Chức năng: Mở / Khóa slot (khi bác sĩ nghỉ đột xuất).
4. Điều phối khám (Lễ tân / Y tá) - MÀN HÌNH CHÍNH
   • Xem danh sách bệnh nhân hôm nay: Lọc theo Bác sĩ, Theo Ca.
   • Khu vực 1: Check-in Khách Đặt Web:
   o Cách 1: Quét mã QR trên điện thoại khách -> Tìm booking -> Tự động Check-in.
   o Cách 2 (Khách quên điện thoại): Nhập SĐT vào ô tìm kiếm -> Ra tên -> Bấm "Check-in".
   o Hành động: Set trạng thái BOOKED → CHECKED_IN -> Cấp STT.
   • Khu vực 2: Khách Vãng Lai (Walk-in):
   o Nhập nhanh: Tên + SĐT + Chọn Bác sĩ.
   o Bấm "Tạo phiếu":
    Logic: Hệ thống kiểm tra Bể Chung (12) trước. Nếu còn -> Trừ Bể Chung.
    Logic: Nếu Bể Chung hết -> Kiểm tra Bể Dự Phòng (4). Nếu còn -> Trừ Bể Dự Phòng.
    Logic: Nếu cả 2 đều hết -> Cảnh báo "Hết số" (Cho phép Lễ tân ghi đè/Override nếu cần thiết).
   • Theo dõi trạng thái:
   o Nhìn thấy ai CHỜ, ai ĐANG KHÁM, ai ĐANG XÉT NGHIỆM.
   o Đánh dấu NO_SHOW: Khách hẹn mà không đến (để hệ thống lọc data xấu).
   • Lưu ý: Admin/Lễ tân KHÔNG trực tiếp set trạng thái ĐANG KHÁM/ĐÃ KHÁM (Việc đó của Bác sĩ).
5. Thu ngân (Logic C - Bước 2- đọc quy tắc)
   • Xem danh sách lịch khám trạng thái COMPLETED (Đã khám xong, chưa trả tiền).
   Xử lý Đơn thuốc (2 Cách):
   • Cách 1 (Theo đơn Bác sĩ): Bấm vào tên bệnh nhân -> Hệ thống tự hiện đơn thuốc bác sĩ đã kê (đang ở trạng thái "Tạm giữ"). Thu ngân kiểm tra, có thể xóa bớt thuốc nếu khách không đủ tiền mua hết.
   • Cách 2 (Bán lẻ/Vãng lai): Tạo đơn thuốc thủ công mới (dành cho khách mua thêm hoặc khách vãng lai chỉ mua thuốc).
   Chi tiết bill: Tiền Khám + Tiền XN + Tiền Thuốc.
   Nút "THANH TOÁN (PAID)":
6. Cập nhật trạng thái: UNPAID → PAID.
7. Trừ kho thật (Commit): Chuyển thuốc từ trạng thái "Tạm giữ" sang "Đã xuất".
8. In hóa đơn.
9. Mở khóa hồ sơ trên Web Khách hàng.
   Cơ chế Tự động hủy (Background Job):
   • Nếu sau 2 tiếng (hoặc hết ca làm việc) mà đơn thuốc COMPLETED chưa được thanh toán -> Hệ thống tự động Hủy đơn và Nhả lại kho (Release Stock) để bán cho người khác.
10. Quản lý danh mục thuốc
    • Thông tin: Tên thuốc, Đơn vị, Cách dùng, Liều dùng mặc định, Giá.
    • Quản lý Tồn kho: Số lượng tồn thực tế.
    • Chức năng: Thêm/Sửa/Ẩn thuốc.
    • Mục đích: Khi Bác sĩ kê đơn, chỉ được chọn từ danh sách này (dropdown), có hiển thị số lượng tồn.
11. Quản lý “Toa thuốc mẫu”
    • Admin (hoặc bác sĩ) tạo các Combo thuốc hay dùng (VD: "Combo Viêm họng").
    • Giúp bác sĩ kê đơn nhanh bằng 1 click.
12. Báo cáo & Audit log
    • Thống kê: Lượt khám, Doanh thu, Tỷ lệ Khách Web vs Khách Vãng Lai.
    • Thống kê Override: Báo cáo số lượng ca Lễ tân "nhét thêm" (vượt quá 16 slot/bác sĩ) để Admin kiểm soát chất lượng.
    • Audit log: Ghi lại ai đã sửa kho, ai đã hủy lịch.
    2.7. Quản lý hồ sơ bệnh nhân
    • Tra cứu: Tìm hồ sơ theo SĐT/Tên/Mã BN/CCCD.
    • Lịch sử Y tế: Xem lại các lần khám trước, toa thuốc cũ, kết quả xét nghiệm (để in lại nếu khách mất).
    • Logic ( nếu yêu cầu ): Khi tạo phiếu cho khách vãng lai mới, hệ thống tự động tạo ngầm tài khoản App (User=SĐT) để khách về nhà đăng nhập được ngay.

PHẦN 3. CHI TIẾT CHỨC NĂNG: BÁC SĨ

1. Đăng nhập & Dashboard
   • Đăng nhập bằng SĐT + Mật khẩu.
   • Xem lịch khám theo ngày, thống kê số lượng khách chờ.
2. Hàng chờ bệnh nhân (Logic B-đọc quy tắc)
   • Hàng chờ thông minh:
   o Tự động sắp xếp danh sách theo điểm ưu tiên: Có KQ Xét Nghiệm > Đặt Web đúng giờ > Vãng lai.
   • Đồng bộ Realtime: Lễ tân vừa check-in xong, tên khách hiện ngay trên màn hình bác sĩ (không cần F5).
   • Hiển thị: STT, Tên, Trạng thái (CHỜ / CÓ KẾT QUẢ).
3. Điều khiển Ca khám
   • Nút “MỜI KHÁM”: Gọi người đầu tiên trong danh sách đã sắp xếp.
   • Nút “BỎ QUA” (Skip):
   Dùng khi gọi 3 lần không thấy khách.
   Hành động: Khách bị đẩy xuống dưới (trừ điểm ưu tiên). KHÔNG HỦY LƯỢT NGAY.
   Logic Hủy: Hệ thống chỉ tự động chuyển sang NO_SHOW (Hủy) khi kết thúc Ca làm việc .
4. Quy trình Khám & Xét nghiệm (State Machine)
   • Tab 1: Khám & Chỉ định (Đi xét nghiệm):
   o Nhập triệu chứng, chẩn đoán sơ bộ.
   o Nếu cần xét nghiệm: Chọn dịch vụ -> Bấm "Gửi đi Xét nghiệm".
   o Logic: Tên bệnh nhân tạm ẩn khỏi hàng chờ, trạng thái chuyển sang PENDING_LAB.
   • Tab 2: Đọc kết quả & Kê đơn:
   o Khi có kết quả (nhập tay hoặc upload) -> Tên bệnh nhân NỔI LÊN ĐẦU hàng chờ.
   o Bác sĩ bấm gọi lại -> Xem kết quả -> Kê đơn thuốc.
   Logic Kê đơn (Logic C - Bước 1):
   • Hệ thống hiển thị tồn kho thực tế.
   • Ngay khi Bác sĩ bấm "Lưu/Hoàn Thành" -> Hệ thống "Tạm giữ" (Soft Reserve) số lượng thuốc đó ngay lập tức (Để đảm bảo khách ra quầy là chắc chắn có thuốc).
   Bấm "HOÀN THÀNH": Chuyển bệnh nhân ra Thu ngân.
5. Xem lịch sử khám
   • Xem lại các lần khám trước của bệnh nhân (Read-only) để tham khảo.

PHẦN 4: CHI TIẾT CHỨC NĂNG - KHÁCH HÀNG

1. Đăng ký / Đăng nhập
   • Đăng ký/Đăng nhập bằng Số điện thoại.
   • Quên mật khẩu (gửi OTP hoặc liên hệ Admin).
2. Xem thông tin phòng khám
   • Trang chủ, Giới thiệu, Bảng giá dịch vụ, Danh sách Bác sĩ.
3. Đặt lịch khám (Logic A)
   • Bước 1: Chọn Bác sĩ / Chuyên khoa.
   • Bước 2: Chọn Ngày & Chọn CA.
   Logic: Chỉ check Bể Chung (12 chỗ). Hết 12 chỗ báo Full.
   • Bước 3: Nhập thông tin.
   • Bước 4: Xác nhận & Thanh toán.
   Logic Mô phỏng (MVP): Hệ thống hiển thị nút "Thanh toán". Khách bấm vào -> Hệ thống tự động xác nhận Thành công (không cần API ngân hàng thật) -> Chuyển trạng thái BOOKED.
   • Bước 5: Hiện Mã QR Vé khám.
   o Chức năng: "Lưu ảnh vé về máy".
4. Check-in (Tại quầy)
   • Đưa mã QR cho Lễ tân quét.
   • Hoặc đọc SĐT cho Lễ tân check.
5. Xem lịch khám
   • Xem lịch sắp tới.
   • Hủy lịch (trước 24h).
   • Trạng thái: ĐÃ ĐẶT -> ĐÃ CHECK-IN -> ĐÃ KHÁM.
6. Hồ sơ sức khỏe
   • Logic hiển thị:
   o Nếu chưa thanh toán: Hiện "Đang xử lý".
   o Nếu đã thanh toán (PAID): Hiện nút "Xem Đơn Thuốc", "Xem Kết Quả XN".
   • Gửi đánh giá/phản hồi sao cho bác sĩ.
