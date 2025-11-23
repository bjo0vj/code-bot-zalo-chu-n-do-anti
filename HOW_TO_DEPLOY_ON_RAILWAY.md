# HƯỚNG DẪN TRIỂN KHAI TRÊN RAILWAY (CÓ DATABASE)

Bot này đã được nâng cấp để chạy trên Railway và sử dụng PostgreSQL để lưu trữ dữ liệu (điểm danh, lịch sử gửi ảnh) vĩnh viễn.

## Bước 1: Chuẩn bị
1.  Đăng ký tài khoản tại [Railway.app](https://railway.app/).
2.  Cài đặt [GitHub Desktop](https://desktop.github.com/) hoặc Git để đẩy code lên GitHub.
3.  Tạo một repository mới trên GitHub và đẩy toàn bộ code của bot lên đó.

## Bước 2: Tạo Project trên Railway
1.  Vào Railway, chọn **"New Project"** -> **"Deploy from GitHub repo"**.
2.  Chọn repository bot của bạn.
3.  Chọn **"Add Variables"** (chưa cần điền ngay, làm bước tiếp theo trước).

## Bước 3: Thêm Database (PostgreSQL)
1.  Trong giao diện project trên Railway, chuột phải vào khoảng trống hoặc chọn nút **"New"**.
2.  Chọn **"Database"** -> **"PostgreSQL"**.
3.  Chờ một chút để Railway tạo database.

## Bước 4: Kết nối Bot với Database
1.  Sau khi PostgreSQL đã chạy, Railway sẽ tự động tạo biến môi trường `DATABASE_URL` trong service PostgreSQL.
2.  Tuy nhiên, bạn cần biến này ở bên service **Bot**.
3.  Vào service **Bot** -> Tab **"Variables"**.
4.  Thêm biến mới:
    -   **Tên**: `DATABASE_URL`
    -   **Giá trị**: `${{Postgres.DATABASE_URL}}` (Railway sẽ tự động gợi ý biến từ service Postgres của bạn).
    -   *Hoặc*: Bạn có thể copy thủ công "Connection URL" từ tab "Connect" của service Postgres và dán vào đây.

## Bước 5: Cấu hình Start Command
1.  Vào service **Bot** -> Tab **"Settings"**.
2.  Tìm phần **"Build & Deploy"**.
3.  Mục **"Start Command"**, điền:
    ```bash
    npm start
    ```
    (Hoặc `node index.js`)

## Bước 6: Deploy
1.  Railway thường sẽ tự động deploy khi bạn push code hoặc thay đổi biến.
2.  Vào tab **"Deployments"** để xem log.
3.  Nếu thấy dòng chữ **"Connected to PostgreSQL database successfully"** nghĩa là thành công!

## Lưu ý quan trọng
-   **Dữ liệu**: Mọi dữ liệu điểm danh và lịch sử giờ đây sẽ nằm trong database. Bạn restart bot thoải mái mà không mất dữ liệu.
-   **File JSON**: Các file trong thư mục `data/tracking_data` và `data/history_data` ở local sẽ **KHÔNG** được sử dụng trên Railway nữa.
