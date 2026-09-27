# EquiFlow - Racehorse Training & Stable Management System (Frontend)

[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%2B-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?logo=reactrouter)](https://reactrouter.com/)

Giao diện Web Portal của Hệ thống Quản lý và Huấn luyện Ngựa đua EquiFlow (Thiết kế tối ưu cho Desktop 1280px / 1440px / 1920px theo quy chuẩn Stitch V2).

---

## 1. Công nghệ Frontend (Tech Stack - Decision D-01)

- **Framework:** React `19.2.8`
- **Build Tool:** Vite `8.3.0` / `^6.x`
- **Language:** TypeScript `~5.8` / `~6.0` (Target `ES2022`)
- **Routing:** `react-router-dom` `^7.18.4` (Data router & component routes)
- **Styling:** Tailwind CSS (bảng màu EquiFlow Forest Green `#1B4332`, Gold accents, font Manrope)
- **Icon Set:** Lucide React

---

## 2. Cài đặt & Khởi động (Getting Started)

### 2.1. Cài đặt Dependencies
```bash
npm install
```

### 2.2. Cấu hình Biến Môi Trường
```bash
cp .env.example .env
```
Nội dung file `.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

### 2.3. Khởi động Development Server
```bash
npm run dev
```
Truy cập: `http://localhost:5173`

---

## 3. Lệnh Kiểm thử & Chất lượng Code (Quality Gates)

| Lệnh | Mục đích |
|---|---|
| `npm run lint` | Chạy ESLint kiểm tra quy chuẩn mã nguồn |
| `npm run typecheck` | Kiểm tra tính toàn vẹn kiểu dữ liệu TypeScript (`tsc --noEmit`) |
| `npm run build` | Biên dịch dự án phục vụ môi trường Production |
| `npm run preview` | Khởi chạy xem trước bản build production |
