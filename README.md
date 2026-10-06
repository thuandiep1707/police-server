# Police server demo

ExpressJS + JavaScript thuần, lowdb `MemorySync` lưu trong RAM. Không đăng nhập/phân quyền. Không cần database bên ngoài hoặc file cấu hình.

## Chạy

Node.js 20 trở lên:

```sh
npm install
npm start
```

Mặc định port `3000`, lắng nghe trên `0.0.0.0`. Khi deploy, server đọc biến `PORT` của hosting. Chạy một instance cho demo vì dữ liệu và kết nối SSE nằm trong bộ nhớ từng process. Restart sẽ mất toàn bộ yêu cầu.

`npm run dev` tự khởi động lại khi sửa file. `npm test` chạy kiểm thử HTTP/SSE.

## API

| Method | URL | Kết quả |
| --- | --- | --- |
| GET | `/api/requests` | `200`, mảng tất cả yêu cầu, thứ tự tiếp nhận; ban đầu `[]` |
| POST | `/api/requests` | `201`, item vừa lưu |
| GET (SSE) | `/api/requests/events` | Kết nối mở, mỗi `message` là một item mới |

POST dùng `Content-Type: application/json`:

```json
{
  "lat": 10.7769,
  "lon": 106.7009,
  "reason": "Cần cảnh sát hỗ trợ",
  "name": "Nguyễn Văn A",
  "phone": "0900000000",
  "type": "gun"
}
```

Đủ sáu trường và đúng kiểu như trên; `type` chỉ nhận `gun` hoặc `fighting`. `phone` là chuỗi để giữ số 0 đầu. Response POST và item trong GET/SSE có đúng sáu trường; trường bổ sung trong POST không được lưu. Dữ liệu sai hoặc JSON lỗi trả `400`, không lưu và không phát SSE. Body quá 16 KB trả `413`. Không thêm kiểm tra định dạng số điện thoại hoặc nghiệp vụ khác cho demo.

## FE gửi yêu cầu

```js
const baseUrl = 'http://localhost:3000'; // Thay bằng URL server khi deploy.
const response = await fetch(`${baseUrl}/api/requests`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lat: 10.7769, lon: 106.7009,
    reason: 'Cần cảnh sát hỗ trợ',
    name: 'Nguyễn Văn A', phone: '0900000000', type: 'gun'
  })
});
const result = await response.json();
if (!response.ok) throw new Error(result.error);
```

## FE admin nhận realtime

```js
const baseUrl = 'http://localhost:3000';
const events = new EventSource(`${baseUrl}/api/requests/events`);

events.onopen = async () => {
  // Lấy lại danh sách khi mở hoặc kết nối lại. Thay toàn bộ danh sách đang hiển thị.
  const response = await fetch(`${baseUrl}/api/requests`);
  const requests = await response.json();
  console.log('Danh sách hiện tại:', requests);
};
events.onmessage = (event) => {
  const item = JSON.parse(event.data);
  console.log('Yêu cầu mới:', item); // Thêm item vào giao diện admin.
};
events.onerror = () => console.log('Mất kết nối; EventSource sẽ thử kết nối lại.');

// Khi rời trang/unmount: events.close();
```

SSE chỉ gửi item mới tới mọi admin đang kết nối; không gửi item cũ khi mở/kết nối lại. Không có admin thì POST vẫn lưu để GET đọc sau. Comment heartbeat mỗi 15 giây giữ luồng hoạt động và không gọi `onmessage`.

GET và SSE là hai luồng riêng; ví dụ FE trên chỉ minh họa tích hợp, không bảo đảm đồng bộ tuyệt đối khi có POST ngay trong lúc GET đang tải. Có thể dùng GET để thay lại danh sách khi cần. Khi dùng reverse proxy, cần cho phép kết nối dài và tắt buffering cho đường dẫn SSE. Backend đã đặt `X-Accel-Buffering: no` và mở CORS để hai FE demo gọi từ domain/port khác.

Tham khảo thư viện: [lowdb](https://github.com/typicode/lowdb), [Express](https://expressjs.com/).
