## 3. UI / UX Specification — Ranh giới tích hợp backend

**Tài liệu đích đề xuất:** `docs/uiux-specification.md`.

Backend không có màn hình riêng. Phần này ghi các tương tác của hai FE đã được người dùng mô tả để làm rõ mục đích tích hợp; không mở rộng công việc sang triển khai hoặc thiết kế FE.

| ID | Bề mặt và tương tác | Hành vi backend liên quan |
| --- | --- | --- |
| UX-01 | Trên trang yêu cầu cảnh sát, người dùng nhập thông tin, chọn `gun` hoặc `fighting`, rồi bấm yêu cầu. FE gửi POST. | FS-01 |
| UX-02 | Khi mở trang admin police, FE gọi GET để lấy danh sách hiện đang lưu. | FS-02 |
| UX-03 | Khi mở trang admin police, FE mở kết nối SSE để nhận từng item mới trong lúc kết nối hoạt động. | FS-03 |
| UX-04 | Yêu cầu phát sinh khi admin chưa kết nối vẫn có thể đọc bằng GET. Sau kết nối lại, SSE không tự phát lại dữ liệu cũ. | FS-04 |
| UX-05 | Không có bước đăng nhập hoặc phân quyền bắt buộc trước các thao tác tích hợp trên. | FS-05 |

Không quy định bố cục, màu sắc, thành phần hiển thị, thiết kế responsive hoặc bổ sung màn hình FE trong gói này.

