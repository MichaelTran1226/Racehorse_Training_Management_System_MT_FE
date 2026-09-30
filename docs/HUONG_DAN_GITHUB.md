# Hướng dẫn dùng GitHub — repo Frontend

Dự án có **2 repo riêng**: FE (repo này) và [BE](https://github.com/MichaelTran1226/Racehorse_Training_Management_System_MT_BE). Code giao diện chỉ để ở repo FE. Task và đặc tả nằm ở [Project 2](https://github.com/users/MichaelTran1226/projects/2) (issue ở repo BE).

## 1. Cài một lần

1. Cài [Git](https://git-scm.com/downloads) và [Node.js 20.19 trở lên](https://nodejs.org/) (bản LTS).
2. Khai tên cho Git (dùng đúng email tài khoản GitHub):
   ```bash
   git config --global user.name "Tên của bạn"
   git config --global user.email "email-github@gmail.com"
   ```
3. Nhờ Michael thêm tài khoản GitHub của bạn vào repo (quyền **Write**).

## 2. Lấy code về và chạy

```bash
git clone https://github.com/MichaelTran1226/Racehorse_Training_Management_System_MT_FE.git
cd Racehorse_Training_Management_System_MT_FE
npm ci
cp .env.example .env.local        # PowerShell: Copy-Item .env.example .env.local
npm run dev
```

Mở http://localhost:5173.

- `VITE_USE_MOCK=true` (mặc định): chạy bằng dữ liệu giả, **không cần BE**.
- Muốn nối BE thật: chạy BE (xem hướng dẫn ở repo BE), rồi trong `.env.local` đặt `VITE_USE_MOCK=false`, `VITE_API_URL=http://localhost:3000/api`, và chạy lại `npm run dev`.

## 3. Mỗi lần làm một task

```bash
git checkout main
git pull                                   # luôn lấy bản mới nhất trước
git checkout -b feat/<số issue>-<ten-ngan> # vd: feat/40-so-do-chuong
# ... code ...
npm run lint && npm run typecheck && npm run build   # đúng các bước bot chạy
git add .
git commit -m "feat(stable): so do chuong trai va gan o"
git push -u origin feat/<số issue>-<ten-ngan>
```

Sau đó lên GitHub bấm **Compare & pull request** vào nhánh `main`:

1. Điền đủ **mẫu PR** (tự hiện ra), tích các mục đã làm thật.
2. Ghi `Refs MichaelTran1226/Racehorse_Training_Management_System_MT_BE#<số issue>`. PR cuối cùng của task (khi cả FE lẫn BE đã xong) thì ghi `Closes …#<số issue>`.
3. Chờ bot CI chạy xanh và có người review rồi mới merge.

Đọc **đặc tả trong issue** trước khi code: luồng nghiệp vụ, việc FE/BE, API, tiêu chí nghiệm thu. Đặc tả gốc đầy đủ (nút, ô nhập, câu báo lỗi) nằm ở `docs/specs/`.

## 4. Bot kiểm tra gì (repo FE)

| Bước | Lệnh | Qua khi |
|---|---|---|
| 0. Repository Gate | tự chạy | Không có file BE (`prisma/`, migration, `*.sqlite`, controller); không có `.env`, khoá, token bị commit |
| 1. Lint & Typecheck | `npm run lint`, `npm run typecheck` | Không có **lỗi** (cảnh báo vẫn qua) |
| 2. Build | `npm run build` | Build được (chế độ mock) |
| 3. Playwright | `npm run test:e2e` | Test pass |
| 4. Security & Quality | `npm audit --omit=dev --audit-level=critical` + SonarQube | Không có lỗ hổng **Critical**; SonarQube đạt Quality Gate (khi Lead đã cài secret) |

Quy tắc của mẫu PR: chỉ code FE (không có migration hay controller server); làm đúng tiêu chí của issue, không tự thêm tính năng; không cài package mới khi Lead chưa duyệt.

## 5. Lỗi hay gặp

| Lỗi | Cách sửa |
|---|---|
| `npm ci` báo lock không khớp | Không sửa tay `package-lock.json`. Chạy `git checkout package-lock.json` rồi `npm ci` lại |
| `git push` bị từ chối (rejected) | `git pull origin main` vào nhánh của bạn, sửa xung đột nếu có, rồi push lại |
| Push nhầm lên `main` | Không push thẳng `main`; luôn tạo nhánh và mở PR |
| Lỡ tạo file `.env.local` trong commit | File này đã bị bỏ qua (`.gitignore`); đừng dùng `git add -f` |
| Cổng 5173 đang bận | Tắt cửa sổ `npm run dev` cũ, hoặc Vite tự đổi sang 5174 |
| CI đỏ | Mở tab **Checks** của PR xem bước nào lỗi, chạy lại đúng lệnh đó trên máy |
