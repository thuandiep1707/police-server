## 1. Product / Feature Requirement

**Tài liệu đích đề xuất:** `docs/product-requirement.md`.

### Mục tiêu và người dùng

Người dân gửi yêu cầu hỗ trợ từ trang yêu cầu cảnh sát. Trang admin police lấy danh sách hiện có và nhận yêu cầu mới theo thời gian thực. Phạm vi lần này là backend mới hoàn toàn để demo trên một server.

### Phạm vi

- Một API POST nhận và lưu yêu cầu.
- Một API GET trả toàn bộ yêu cầu hiện đang lưu.
- Một endpoint SSE riêng truyền từng yêu cầu mới đến các kết nối admin đang hoạt động.
- Lưu dữ liệu tạm trong thời gian server chạy; không yêu cầu giữ dữ liệu khi server tắt hoặc khởi động lại.
- ExpressJS và JavaScript thuần theo yêu cầu người dùng. Người dùng cho phép thư viện phục vụ lưu dữ liệu tạm.
- Không xác thực hoặc phân quyền.

Không triển khai FE, chức năng phân công/xử lý yêu cầu, cập nhật/xóa yêu cầu hoặc bảo đảm lưu trữ bền vững trong phạm vi này.

### Yêu cầu và quy tắc

| ID | Yêu cầu |
| --- | --- |
| PR-01 | Nhận vị trí, lý do, thông tin người gửi và loại tình huống từ POST. |
| PR-02 | Lưu yêu cầu phù hợp trong thời gian server chạy. |
| PR-03 | GET cung cấp toàn bộ danh sách yêu cầu hiện đang lưu. |
| PR-04 | Mỗi yêu cầu mới được lưu thành công được gửi thành một item qua SSE đến mọi admin đang kết nối. |

Loại tình huống chỉ gồm `gun` hoặc `fighting`. Không có kết nối SSE thì không gửi sự kiện; yêu cầu vẫn được lưu để GET đọc. SSE không phát lại item cũ khi admin kết nối hoặc kết nối lại. Không yêu cầu hàng đợi sự kiện bền vững.

### Tiêu chí nghiệm thu

| ID | Điều kiện quan sát được |
| --- | --- |
| AC-01 | POST với đủ trường và đúng kiểu/loại tình huống lưu được yêu cầu. |
| AC-02 | GET sau khi lưu chứa yêu cầu đó và mọi yêu cầu khác hiện đang lưu; khi chưa có yêu cầu, danh sách rỗng. |
| AC-03 | Admin đang kết nối SSE nhận từng item mới sau khi item được lưu thành công, không nhận toàn bộ danh sách trong sự kiện này. |
| AC-04 | Không có kết nối SSE, POST vẫn lưu được yêu cầu và GET vẫn đọc được trong thời gian server chạy. |
| AC-05 | Admin mở hoặc mở lại SSE không được gửi lại item cũ; danh sách hiện có lấy qua GET. |
| AC-06 | Dữ liệu không phù hợp với các trường/kiểu/enum quy định không tạo yêu cầu và không tạo sự kiện yêu cầu mới. |
| AC-07 | GET, POST và SSE không yêu cầu đăng nhập hoặc quyền truy cập. |

