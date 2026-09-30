import { createBrowserRouter, Navigate, Outlet, useParams } from "react-router-dom";
import AccountListPage from "@/features/accounts/pages/AccountListPage";
import AcceptInvitePage from "@/features/auth/pages/AcceptInvitePage";
import PermissionMatrix from "@/features/accounts/pages/PermissionMatrix";
import ChangePasswordPage from "@/features/auth/pages/ChangePasswordPage";
import Forbidden403Page from "@/features/auth/pages/Forbidden403Page";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import MyProfilePage from "@/features/auth/pages/MyProfilePage";
import PendingApprovalPage from "@/features/auth/pages/PendingApprovalPage";
import ResetOtpPage from "@/features/auth/pages/ResetOtpPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import SessionExpiredPage from "@/features/auth/pages/SessionExpiredPage";
import SignUpPage from "@/features/auth/pages/SignUpPage";
import VerifyEmailPage from "@/features/auth/pages/VerifyEmailPage";
import ComingSoonPage from "@/features/dashboard/pages/ComingSoonPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import { AppShell } from "@/shared/components/layout/AppShell";
import { Providers } from "@/shared/components/layout/Providers";
import { RoleGuard } from "./RoleGuard";

// BẢNG ROUTE DUY NHẤT của ứng dụng: đường dẫn URL → trang thật nằm trong features/*/pages.
// Thêm màn hình mới = thêm một dòng { path, element } vào đây (xem CONTRIBUTING.md).

// Bọc mọi trang bằng các provider toàn cục (toast, trạng thái đăng nhập).
function RootLayout() {
  return (
    <Providers>
      <Outlet />
    </Providers>
  );
}

// Khung chung của mọi trang SAU đăng nhập: Sidebar + Topbar. Chưa đăng nhập thì AppShell đưa về /login.
function AppLayout() {
  return (
    <AppShell>
      {/* RoleGuard chặn trang khi tài khoản không đủ quyền (hiện 403 ngay tại URL đó). */}
      <RoleGuard>
        <Outlet />
      </RoleGuard>
    </AppShell>
  );
}

// Lấy :id từ URL /accounts/:id/permissions rồi truyền cho trang.
function PermissionMatrixRoute() {
  const { id = "" } = useParams();
  return <PermissionMatrix accountId={id} />;
}

// Mọi đường dẫn chưa có trang riêng (ngựa, huấn luyện, y tế...). RoleGuard trong AppShell đã kiểm quyền trước đó.
function ComingSoonRoute() {
  const { "*": path = "" } = useParams();
  return <ComingSoonPage slug={path.split("/")[0] ?? ""} />;
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Navigate to="/login" replace /> },

      // ---- Trang công khai (chưa đăng nhập)
      { path: "/login", element: <LoginPage /> },
      { path: "/sign-up", element: <SignUpPage /> },
      { path: "/sign-up/verify", element: <VerifyEmailPage /> },
      { path: "/sign-up/pending", element: <PendingApprovalPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/forgot-password/verify", element: <ResetOtpPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/accept-invite", element: <AcceptInvitePage /> },

      // ---- Trang sau đăng nhập (nằm trong khung AppShell)
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/accounts", element: <AccountListPage /> },
          { path: "/accounts/:id/permissions", element: <PermissionMatrixRoute /> },
          { path: "/profile", element: <MyProfilePage /> },
          { path: "/profile/password", element: <ChangePasswordPage /> },
          { path: "/forbidden", element: <Forbidden403Page /> },
          { path: "/session-expired", element: <SessionExpiredPage /> },
          { path: "*", element: <ComingSoonRoute /> },
        ],
      },
    ],
  },
]);
