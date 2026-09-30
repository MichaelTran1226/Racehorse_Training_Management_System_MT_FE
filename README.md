# TMEC - Quản lý CLB đua ngựa (Frontend)

Đồ án SWP391. **React 19 + Vite + TypeScript**, định tuyến bằng React Router.

> **Thành viên mới:** đọc [docs/HUONG_DAN_GITHUB.md](docs/HUONG_DAN_GITHUB.md) (clone, chạy, tạo nhánh, mở PR qua bot CI). Task + đặc tả: [Project 2](https://github.com/users/MichaelTran1226/projects/2) · [tasks/](tasks/) · [docs/specs/](docs/specs/).

Đã code xong **Giai đoạn 0 (đăng nhập) và Priority 1 (xác thực + phân quyền)** — 16 màn hình theo
bản thiết kế trong `design-handoff`. Các nghiệp vụ sau (hồ sơ ngựa, giáo án, y tế...) mới có
thư mục rỗng, sẽ code ở giai đoạn sau.

## Chạy thử

```bash
npm install
Copy-Item .env.example .env.local     # macOS/Linux: cp .env.example .env.local
npm run dev
```

Mở http://localhost:5173

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy server phát triển, tự tải lại khi sửa code |
| `npm run build` | Kiểm tra kiểu TypeScript rồi đóng gói ra `dist/` |
| `npm run preview` | Chạy thử bản đã đóng gói |
| `npm run lint` | Kiểm tra lỗi code |

## Tài khoản dùng thử

Chưa có backend nên dữ liệu là **dữ liệu giả** lưu trong trình duyệt (`VITE_USE_MOCK=true`).
Mọi tài khoản dùng mật khẩu **`equiflow123`**, mã OTP luôn là **`123456`**.

| Email | Vai trò | Thấy gì |
|---|---|---|
| `viet.do@gmail.com` | Club Manager | Quản lý tài khoản và phân quyền |
| `nam.tran@gmail.com` | Head Trainer | Menu huấn luyện; vào `/accounts` sẽ ra trang 403 |
| `chau.le@gmail.com` | Veterinarian | Menu y tế |
| `ha.ly@gmail.com` | Horse Owner | Menu chủ ngựa |
| `binh.pham@gmail.com` | Groom | Tài khoản bị khóa - xem thông báo khi đăng nhập |
| `anh.nguyen@gmail.com` | Horse Owner | Đang chờ duyệt - xem thông báo khi đăng nhập |

Muốn xóa dữ liệu thử về ban đầu: F12 → Application → Local Storage → xóa `equiflow.mock.db.v1`.

## Các màn hình đã có

**Công khai:** Đăng nhập · Đăng ký · Nhập OTP xác minh email · Chờ duyệt · Quên mật khẩu ·
Nhập OTP đặt lại · Đặt mật khẩu mới

**Sau đăng nhập:** Dashboard · Danh sách tài khoản (duyệt, từ chối, khóa, mở khóa) ·
Phân quyền từng tài khoản · Hồ sơ cá nhân · Đổi mật khẩu · Trang 403 · Hết phiên ·
Trang "sắp có" cho các menu chưa code

## Cấu trúc thư mục

```text
Horse-Training-Club/
├── public/                  ảnh, font, logo
├── docs/                    WorkFlow_*.md (luồng chuẩn để làm theo), API_CONTRACT.md (API)
├── index.html               trang HTML duy nhất
├── package.json             danh sách thư viện và lệnh chạy
├── vite.config.ts           cấu hình Vite
├── tsconfig.json            cấu hình TypeScript
├── .env.example             mẫu biến môi trường
└── src/
    ├── main.tsx             điểm khởi động
    ├── app/                 TẦNG ĐỊNH TUYẾN
    │   ├── router.tsx       bảng đường dẫn: URL nào hiện trang nào
    │   └── RoleGuard.tsx    chặn trang khi tài khoản không đủ quyền
    ├── features/            MỖI NGHIỆP VỤ MỘT THƯ MỤC
    │   ├── auth/            đăng nhập, đăng ký, OTP, hồ sơ cá nhân        (đã code)
    │   ├── accounts/        danh sách tài khoản, phân quyền               (đã code)
    │   ├── dashboard/       trang tổng quan                               (đã code)
    │   ├── horses/          hồ sơ ngựa                                    (giai đoạn sau)
    │   ├── master-data/     nhân viên, vật tư, chuồng                     (giai đoạn sau)
    │   ├── training/        giáo án, lịch tập, cảnh báo                   (giai đoạn sau)
    │   ├── health/          sức khỏe, khóa huấn luyện                     (giai đoạn sau)
    │   ├── stable/          chuồng trại, khẩu phần                        (tùy chọn)
    │   └── racing/          thi đấu                                       (tùy chọn)
    │      (mỗi feature có: pages/ = màn hình, components/ = mảnh giao diện,
    │       api.ts = gọi dữ liệu, types.ts = kiểu dữ liệu)
    └── shared/              ĐỒ DÙNG CHUNG cho mọi nghiệp vụ
        ├── components/      ui/ (nút, bảng, hộp thoại), form/ (ô nhập), layout/ (khung trang)
        ├── lib/             gọi API, phân quyền, nhãn trạng thái, câu báo lỗi
        ├── mock/            dữ liệu giả khi chưa có backend
        ├── styles/          màu, font, CSS chung
        └── types/           kiểu dữ liệu dùng chung
```

**Quy tắc phụ thuộc:** `app` → `features` → `shared`. Import chỉ đi xuống.
Một feature không được import feature khác; thứ gì hai feature cùng cần thì đưa vào `shared/`.
