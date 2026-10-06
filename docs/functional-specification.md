## 2. Functional Specification

**Tài liệu đích đề xuất:** `docs/functional-specification.md`.

### Dữ liệu nhận từ POST

| Trường | Kiểu | Ý nghĩa |
| --- | --- | --- |
| `lat` | number | Vĩ độ |
| `lon` | number | Kinh độ |
| `reason` | string | Lý do yêu cầu |
| `name` | string | Tên người gửi |
| `phone` | string | Số điện thoại người gửi |
| `type` | `gun` hoặc `fighting` | Loại tình huống |

Các trường trên là thông tin đầu vào được người dùng yêu cầu. Ví dụ hợp lệ về cấu trúc:

```json
{
  "lat": 0,
  "lon": 0,
  "reason": "Cần cảnh sát hỗ trợ",
  "name": "Nguyễn Văn A",
  "phone": "0900000000",
  "type": "gun"
}
```

### Hành vi

**FS-01 — Tiếp nhận (PR-01, PR-02).** FE gửi POST khi người dân bấm yêu cầu. Backend kiểm tra sự phù hợp với các trường/kiểu/enum trên và lưu yêu cầu trước khi thông báo tiếp nhận thành công. Nếu không phù hợp hoặc việc lưu thất bại, không phát item như một yêu cầu đã được lưu thành công.

**FS-02 — Danh sách (PR-03).** Khi admin gọi GET, backend trả toàn bộ yêu cầu hiện đang lưu. Không có yêu cầu thì trả danh sách rỗng. Danh sách bao gồm cả yêu cầu được lưu khi không có admin kết nối SSE.

**FS-03 — Luồng yêu cầu mới (PR-04).** Admin mở kết nối SSE khi mở trang. Backend giữ kết nối SSE mở cho đến khi kết nối bị ngắt. Sau mỗi lần lưu thành công một yêu cầu mới, backend gửi chính item vừa lưu đến mọi kết nối SSE admin đang hoạt động. Mỗi thông báo chứa một item, không chứa toàn bộ danh sách.

**FS-04 — Không có kết nối hoặc kết nối lại (PR-03, PR-04).** Nếu không có kết nối SSE, không gửi sự kiện. Việc này không làm mất yêu cầu đã lưu. Khi admin kết nối sau đó hoặc kết nối lại, SSE chỉ tiếp nhận các item mới phát sinh trong lúc kết nối hoạt động; dùng GET để đọc danh sách hiện có. Không yêu cầu phát lại lịch sử SSE.

**FS-05 — Quyền truy cập.** GET, POST và SSE không có bước xác thực hoặc phân quyền trong demo này.

### Trạng thái và tính nhất quán

- Tập yêu cầu có thể rỗng hoặc có dữ liệu. POST lưu thành công bổ sung một yêu cầu; GET không thay đổi tập dữ liệu.
- Kết nối admin có thể đang mở hoặc đã ngắt. Chỉ kết nối đang hoạt động nhận item mới.
- Item đã được thông báo qua SSE cũng phải có trong danh sách GET khi server còn giữ dữ liệu đó.
- Không bảo đảm dữ liệu còn sau khi server tắt hoặc khởi động lại.

Tài liệu này xác định hành vi. URL endpoint, mã HTTP, cấu trúc bao ngoài response, tên sự kiện SSE, metadata bổ sung và cách triển khai thuộc bước kỹ thuật; chúng không được tự chọn trong workflow tài liệu này.

## Tham khảo kỹ thuật, chưa phải quyết định áp dụng

`lowdb` là ứng viên phù hợp để bước kỹ thuật xem xét cho lưu tạm: tài liệu chính thức mô tả thao tác dữ liệu bằng JavaScript và các adapter trong bộ nhớ `Memory` / `MemorySync`. Gói này chưa lựa chọn, cài đặt hoặc áp dụng thư viện. Nguồn: [README chính thức của lowdb](https://github.com/typicode/lowdb).
