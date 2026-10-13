import { Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet, useParams, useRouteError } from "react-router-dom";
import AuditLogPage from "@/features/dashboard/pages/AuditLogPage";
import AccountListPage from "@/features/accounts/pages/AccountListPage";
import StaffDirectoryPage from "@/features/master-data/pages/StaffDirectoryPage";
import HorseListPage from "@/features/horses/pages/HorseListPage";
import HorseDetailPage from "@/features/horses/pages/HorseDetailPage";
import HorseFormPage from "@/features/horses/pages/HorseFormPage";
import DeletedHorsesPage from "@/features/horses/pages/DeletedHorsesPage";
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
import NotificationsPage from "@/features/dashboard/pages/NotificationsPage";
import NotificationSettingsPage from "@/features/dashboard/pages/NotificationSettingsPage";
import HorseCatalogPage from "@/features/horses/pages/HorseCatalogPage";
import StableMapPage from "@/features/stable/pages/StableMapPage";
import StallCatalogPage from "@/features/stable/pages/StallCatalogPage";
import {
  MedicalRecordPage,
  RecordListPage,
  RecordDetailPage,
  RecordFormPage,
  InjuryMapPage,
  TrainingLockPage,
  CareSchedulePage,
  HerdHealthPage,
  PlanListPage,
  PlanWizardPage,
  PlanHistoryPage,
  WeeklyCalendarPage,
  TrialRunsPage,
  SessionMetricsPage,
  LiveMonitorPage,
  AlertListPage,
  TrainingOverviewPage,
  PlanDetailPage,
  SessionResultPage,
  FitnessChartPage,
  MyTrainingPage,
} from "./lazyPages";
import { AppShell } from "@/shared/components/layout/AppShell";
import { Providers } from "@/shared/components/layout/Providers";
import { RoleGuard } from "./RoleGuard";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";

// BẢNG ROUTE DUY NHẤT của ứng dụng: đường dẫn URL → trang thật nằm trong features/*/pages.
// Thêm màn hình mới = thêm một dòng { path, element } vào đây (xem CONTRIBUTING.md).

// Bắt lỗi phát sinh từ các tuyến đường hoặc xung đột DOM do tiện ích dịch tự động
function RouteErrorBoundary() {
  const error = useRouteError();
  console.error("Route error captured:", error);
  return (
    <div style={{ padding: "4rem 1.5rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
      <h2 style={{ fontSize: "var(--fs-kpi)", fontWeight: 700, margin: 0, color: "var(--ink)" }}>
        Unexpected Display Conflict
      </h2>
      <p style={{ color: "var(--muted)", maxWidth: 520, margin: 0, fontSize: "var(--fs-body)", lineHeight: 1.6 }}>
        The browser encountered a DOM reconciliation conflict (often caused by auto-translation extensions). Please reload or navigate back to the dashboard.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "0.625rem 1.25rem",
            background: "var(--brand)",
            color: "var(--text-on-brand)",
            border: "none",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Reload Page
        </button>
        <a
          href="/herd"
          style={{
            padding: "0.625rem 1.25rem",
            background: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Back to Herd Health
        </a>
      </div>
    </div>
  );
}

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
        {/* Nhóm Y tế và Huấn luyện tải theo route (React.lazy) để file JS đầu tiên nhẹ hơn. */}
        <Suspense fallback={<p role="status" style={{ margin: 0, color: "var(--muted)" }}>Loading…</p>}>
          <Outlet />
        </Suspense>
      </RoleGuard>
    </AppShell>
  );
}

// Lấy :id từ URL /accounts/:id/permissions rồi truyền cho trang.
function PermissionMatrixRoute() {
  const { id = "" } = useParams();
  return <PermissionMatrix accountId={id} />;
}

// "Training Progress" trên menu: Chủ ngựa xem giáo án ngựa của mình (SC-2.02), nhân viên xem Tổng quan (SC-2.01).
function TrainingProgressRoute() {
  const user = useCurrentUser();
  return user.role === "HORSE_OWNER" ? <PlanListPage /> : <TrainingOverviewPage />;
}

// Mọi đường dẫn chưa có trang riêng (ngựa, huấn luyện, y tế...). RoleGuard trong AppShell đã kiểm quyền trước đó.
function ComingSoonRoute() {
  const { "*": path = "" } = useParams();
  return <ComingSoonPage slug={path.split("/")[0] ?? ""} />;
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
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
          { path: "/audit", element: <AuditLogPage /> },
          { path: "/accounts", element: <AccountListPage /> },
          { path: "/accounts/:id/permissions", element: <PermissionMatrixRoute /> },
          { path: "/staff", element: <StaffDirectoryPage /> },
          { path: "/horses", element: <HorseListPage /> },
          { path: "/horses/new", element: <HorseFormPage /> },
          { path: "/horses/deleted", element: <DeletedHorsesPage /> },
          { path: "/horses/:id", element: <HorseDetailPage /> },
          { path: "/horses/:id/edit", element: <HorseFormPage /> },
          { path: "/my-horses", element: <HorseListPage /> },
          { path: "/profile", element: <MyProfilePage /> },
          { path: "/profile/password", element: <ChangePasswordPage /> },
          { path: "/notifications", element: <NotificationsPage /> },
          { path: "/notifications/settings", element: <NotificationSettingsPage /> },
          { path: "/settings/notifications", element: <NotificationSettingsPage /> },
          { path: "/forbidden", element: <Forbidden403Page /> },
          { path: "/session-expired", element: <SessionExpiredPage /> },

          // ---- Phân hệ Y tế & Sức khỏe (Flow 3: P2-01 -> P2-05)
          { path: "/records", element: <RecordListPage /> },
          { path: "/medical/records", element: <RecordListPage /> },
          { path: "/medical/records/new", element: <RecordFormPage /> },
          { path: "/medical/records/:id/edit", element: <RecordFormPage /> },
          { path: "/medical/records/:id", element: <RecordDetailPage /> },
          { path: "/medical/horses/:id", element: <MedicalRecordPage /> },
          { path: "/records/horse/:id", element: <MedicalRecordPage /> },
          { path: "/medical/horses/:id/injuries", element: <InjuryMapPage /> },
          { path: "/injuries/:id", element: <InjuryMapPage /> },
          { path: "/injuries", element: <InjuryMapPage /> },
          { path: "/medical/locks", element: <TrainingLockPage /> },
          { path: "/rx", element: <Navigate to="/records" replace /> },
          { path: "/locks", element: <TrainingLockPage /> },
          { path: "/medical/preventive", element: <CareSchedulePage /> },
          { path: "/catalogs/preventive-types", element: <CareSchedulePage /> },
          { path: "/vaccine", element: <CareSchedulePage /> },
          { path: "/medical/herd", element: <HerdHealthPage /> },
          { path: "/herd", element: <HerdHealthPage /> },

          // ---- Phân hệ Huấn luyện & Giáo án (Flow 2: P2-06 -> P2-09)
          { path: "/training", element: <TrainingOverviewPage /> },
          { path: "/progress", element: <TrainingProgressRoute /> },
          { path: "/training/plans", element: <PlanListPage /> },
          { path: "/plans", element: <PlanListPage /> },
          { path: "/training/plans/new", element: <PlanWizardPage /> },
          { path: "/plans/new", element: <PlanWizardPage /> },
          { path: "/training/plans/:id", element: <PlanDetailPage /> },
          { path: "/plans/:id", element: <PlanDetailPage /> },
          { path: "/training/plans/:id/edit", element: <PlanWizardPage /> },
          { path: "/training/plans/history", element: <PlanHistoryPage /> },
          { path: "/training/plans/:id", element: <PlanDetailPage /> },
          { path: "/training/plans/:id/edit", element: <PlanWizardPage /> },
          { path: "/training/sessions/:id/result", element: <SessionResultPage /> },
          { path: "/horses/:id/fitness", element: <FitnessChartPage /> },
          { path: "/my-training", element: <MyTrainingPage /> },
          { path: "/my/training", element: <MyTrainingPage /> },
          { path: "/training/calendar", element: <WeeklyCalendarPage /> },
          { path: "/training/schedule", element: <WeeklyCalendarPage /> },
          { path: "/calendar", element: <WeeklyCalendarPage /> },
          { path: "/training/trials", element: <TrialRunsPage /> },
          { path: "/trials", element: <TrialRunsPage /> },
          { path: "/training/metrics", element: <SessionMetricsPage /> },
          { path: "/metrics", element: <SessionMetricsPage /> },
          { path: "/horses/:id/fitness", element: <SessionMetricsPage /> },
          { path: "/training/monitor", element: <LiveMonitorPage /> },
          { path: "/monitor", element: <LiveMonitorPage /> },
          { path: "/training/alerts", element: <AlertListPage /> },
          { path: "/alerts", element: <AlertListPage /> },

          // ---- Phân hệ Chuồng trại (Flow 4 & P1-09)
          { path: "/stables/map", element: <StableMapPage /> },
          { path: "/stalls", element: <StableMapPage /> },
          { path: "/catalogs/stalls", element: <StallCatalogPage /> },
          { path: "/catalogs/breeds", element: <HorseCatalogPage /> },

          { path: "*", element: <ComingSoonRoute /> },
        ],
      },
    ],
  },
]);

