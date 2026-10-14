# EquiFlow - Racehorse Training & Stable Management System (Frontend)

[![Frontend CI / CD Pipeline](https://github.com/MichaelTran1226/Racehorse_Training_Management_System_MT_FE/actions/workflows/ci.yml/badge.svg)](https://github.com/MichaelTran1226/Racehorse_Training_Management_System_MT_FE/actions)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%2B-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Tests-2EAD33?logo=playwright)](https://playwright.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

Giao diện ứng dụng web Single Page Application (SPA) hiện đại dành cho Câu lạc bộ đua ngựa chuyên nghiệp EquiFlow (Đồ án SWP391 - FPT University).

---

## 1. Điểm Mới & Các Phân Hệ Đã Hoàn Thiện (100% Full Flows)

Frontend hiện tại đã hoàn thiện toàn diện **tất cả 6 luồng nghiệp vụ cốt lõi**, không còn bất kỳ thư mục rỗng nào:

### 🏇 Flow 1: Quản lý Hồ sơ Ngựa & Chuồng trại (`/horses`, `/stalls`, `/stable-map`)
* **Hồ sơ ngựa 6 tab chuyên sâu:** Thông tin chung, phả hệ, lịch sử cân nặng/chiều cao, theo dõi vị trí chuồng, nhật ký trạng thái và phân quyền chủ sở hữu.
* **Danh mục & Quản trị vòng đời:** Tạo mới, chỉnh sửa thông tin chip RFID, gắn nhãn trạng thái (`ACTIVE`, `IN_TRAINING`, `INJURED`, `ISOLATED`, `RESTING`, `RETIRED`), lưu trữ mềm và phục hồi ngựa đã xóa.
* **Sơ đồ chuồng trại 2D tương tác:** Bản đồ trực quan theo lưới cho 3 khu vực (Barn 1, Barn 2, Khu cách ly), gán chuồng, điều chuyển chuồng và theo dõi trạng thái bảo trì/ngừng sử dụng.

### 📈 Flow 2: Lập Giáo án & Nhật ký Huấn luyện (`/training/*`)
* **Quy trình lập giáo án thông minh (Plan Wizard):** Phân chia giai đoạn huấn luyện (Base, Speed, Tapering, Recovery), đặt mục tiêu cự ly, tốc độ tối đa theo mặt đường (Turf / Dirt).
* **Lịch tập tuần (Weekly Calendar):** Kéo thả và theo dõi bài tập theo ngày, gán Groom/Jockey phụ trách.
* **Chặn bài tập nặng tự động (RULE-MED-01):** Tự động phát hiện ngựa đang bị Khóa Y Tế để chặn các bài tập cường độ nặng, chỉ cho phép bài tập đi bộ nhẹ phục hồi.
* **Giám sát thời gian thực & Biểu đồ thể lực (Fitness Chart):** Đo nhịp tim đỉnh, nhịp tim hồi phục, tốc độ trung bình và tính điểm rủi ro chấn thương.

### 🩺 Flow 3: Y tế, Bệnh án & Khóa Huấn luyện (`/health/*`)
* **Hồ sơ bệnh án điện tử:** Ghi nhận triệu chứng, chẩn đoán, phác đồ điều trị, đơn thuốc, chỉ định xét nghiệm và lịch hẹn tái khám.
* **Bản đồ giải phẫu chấn thương 2D (Interactive Injury Map):** Đánh dấu chính xác vị trí tổn thương trên sơ đồ cơ bắp/xương ngựa (nhìn bên trái/phải), theo dõi tiến trình hồi phục qua từng giai đoạn (`ACUTE` -> `RECOVERING` -> `HEALED`).
* **Lệnh Khóa Y Tế (Training Lock Modal):** Bác sĩ thú y ban hành lệnh cấm tập luyện với đánh giá tác động cảnh báo (`impact assessment`), thiết lập ngày xem xét và điều kiện giải tỏa khóa.
* **Lịch chăm sóc định kỳ:** Theo dõi tiêm phòng vắc-xin, tẩy giun, mài răng, đóng móng định kỳ và cảnh báo quá hạn.

### 👥 Flow 4: Tài khoản, Phân quyền & Nhật ký Kiểm toán (`/accounts`, `/audit-logs`)
* **Phân quyền 5 vai trò (RBAC):** Club Manager, Head Trainer, Veterinarian, Groom, Horse Owner với điều hướng và quyền truy cập riêng biệt.
* **Quy trình xét duyệt thành viên:** Duyệt đăng ký (`PENDING_APPROVAL`), mời nhân sự (`INVITED`), khóa/mở khóa tài khoản (`LOCKED`).
* **Nhật ký kiểm toán (Audit Trail):** Truy vết toàn bộ thay đổi dữ liệu theo thời gian thực (ai làm gì, thời điểm nào, chi tiết thay đổi JSON diff).

### 🌐 Song ngữ Toàn diện 100% (Bilingual VI / EN)
* Chuyển đổi ngôn ngữ tức thì giữa **Tiếng Việt** và **Tiếng Anh** trên toàn bộ menu, thanh điều hướng, các form nhập liệu, bảng thống kê và thông báo.
* Từ điển dịch thuật hơn **2.500 từ chuyên ngành** ([vi-text.ts](src/shared/i18n/vi-text.ts)) giữ văn phong tự nhiên, chuẩn y tế và thể thao đua ngựa.

---

## 2. Hướng dẫn Khởi động

### 2.1. Cài đặt & Chạy thử
```bash
# 1. Cài đặt thư viện dependencies
npm install

# 2. Cấu hình file môi trường
Copy-Item .env.example .env.local    # macOS/Linux: cp .env.example .env.local

# 3. Khởi chạy chế độ phát triển
npm run dev
```
Truy cập ứng dụng tại: **`http://localhost:5173`**

### 2.2. Chuyển đổi Chế độ API Thật / Dữ liệu Giả (Mock)
Mở file `.env.local`:
* **Chạy với API Thật kết nối Backend NestJS (Khuyên dùng):**
  ```env
  VITE_USE_MOCK=false
  VITE_API_URL=http://localhost:3000/api
  ```
* **Chạy độc lập Offline với dữ liệu giả trong trình duyệt:**
  ```env
  VITE_USE_MOCK=true
  ```

---

## 3. Tài khoản Đăng nhập Kiểm thử (Khi chạy với API Thật)

Mật khẩu mặc định: **`EquiFlow@2026`**

| Email | Vai trò | Quyền hạn và Giao diện |
| :--- | :--- | :--- |
| `manager@gmail.com` | **Club Manager** | Toàn quyền quản trị tài khoản, duyệt thành viên, xem sơ đồ chuồng, nhật ký kiểm toán |
| `trainer@gmail.com` | **Head Trainer** | Quản lý giáo án huấn luyện, xếp lịch tuần, theo dõi chỉ số thể lực |
| `vet@gmail.com` | **Veterinarian** | Quản lý bệnh án, bản đồ chấn thương 2D, đặt và mở Khóa Y Tế |
| `groom@gmail.com` | **Groom Hand 1** | Quản lý chuồng Barn 1 (STALL-A01 đến A04), xác nhận ca trực |
| `groom2@gmail.com` | **Groom Hand 2** | Quản lý chuồng Barn 2 và Khu cách ly thú y |
| `owner@gmail.com` | **Horse Owner 1** | Theo dõi ngựa sở hữu (Thunderbolt Swift, Pegasus Dream, Midnight Mirage) |
| `owner2@gmail.com` | **Horse Owner 2** | Theo dõi ngựa sở hữu (Northern Dancer Legacy, Shadowfax Wonder) |

---

## 4. Danh mục Lệnh Phát Triển & Kiểm Thử (Quality Gates)

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm run dev` | Khởi chạy Vite Dev Server có HMR (Hot Module Replacement) |
| `npm run typecheck` | Kiểm tra lỗi kiểu dữ liệu TypeScript (`tsc --noEmit`) |
| `npm run build` | Kiểm tra TypeScript và đóng gói ứng dụng sản phẩm vào thư mục `/dist` |
| `npm run preview` | Khởi chạy bản preview gói build tĩnh |
| `npm run lint` | Chạy bộ linter `oxlint` siêu tốc kiểm tra chất lượng mã nguồn |
| `npm test` hoặc `npm run test:e2e` | Chạy toàn bộ bài test tự động E2E bằng Playwright |

---

## 5. Cấu trúc Thư mục Mã nguồn (Feature-Driven Architecture)

```text
Racehorse_Training_Management_System_MT_FE/
├── src/
│   ├── app/                 # Routing, RoleGuard, App Provider
│   ├── features/            # Modules nghiệp vụ độc lập:
│   │   ├── auth/            # Đăng nhập, đăng ký, xác minh OTP, hồ sơ cá nhân
│   │   ├── accounts/        # Quản trị danh sách tài khoản, phê duyệt thành viên
│   │   ├── dashboard/       # Dashboard tổng quan theo từng vai trò, Audit Logs, Thông báo
│   │   ├── horses/          # Danh mục ngựa, hồ sơ chi tiết 6 tab, lưu trữ ngựa giải nghệ
│   │   ├── stable/          # Sơ đồ chuồng 2D, gán chuồng, điều chuyển chuồng
│   │   ├── training/        # Lập giáo án, lịch tập tuần, biểu đồ thể lực, cảnh báo
│   │   └── health/          # Bệnh án, bản đồ chấn thương 2D, Khóa Y Tế, chăm sóc định kỳ
│   └── shared/              # Thành phần dùng chung:
│       ├── components/      # UI components (Button, Modal, DataTable, Card, Tabs, Select...)
│       ├── i18n/            # Hệ thống song ngữ i18next & bộ từ điển vi-text.ts 2500+ từ
│       ├── lib/             # API client, xử lý token, phân quyền, format ngày giờ
│       └── mock/            # Mock Service Worker và bộ dữ liệu giả lập
│
└── tests/e2e/               # Kịch bản kiểm thử tự động Playwright:
    ├── auth.spec.ts         # Kiểm thử đăng nhập, phân quyền 403
    ├── horses.spec.ts       # Kiểm thử CRUD hồ sơ ngựa, chip RFID
    ├── medical.spec.ts      # Kiểm thử quy trình Khóa Y Tế & cảnh báo chưa lưu
    ├── training.spec.ts     # Kiểm thử lập giáo án & chặn bài tập nặng
    ├── audit.spec.ts        # Kiểm thử truy vết lịch sử kiểm toán
    ├── notifications.spec.ts# Kiểm thử gửi và đánh dấu đã đọc thông báo
    └── i18n.spec.ts         # Kiểm thử chuyển đổi ngôn ngữ tức thì
```
