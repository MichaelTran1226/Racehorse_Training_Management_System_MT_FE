import { Suspense } from "react";
import { Outlet, useParams, useRouteError } from "react-router-dom";
import { tr } from "@/shared/i18n/tr";
import { Providers } from "@/shared/components/layout/Providers";
import { AppShell } from "@/shared/components/layout/AppShell";
import { RoleGuard } from "./RoleGuard";
import { useCurrentUser } from "@/shared/components/layout/authContext";
import PermissionMatrix from "@/features/accounts/pages/PermissionMatrix";
import ComingSoonPage from "@/features/dashboard/pages/ComingSoonPage";
import { PlanListPage, TrainingOverviewPage } from "./lazyPages";

// Bắt lỗi phát sinh từ các tuyến đường hoặc xung đột DOM do tiện ích dịch tự động
export function RouteErrorBoundary() {
  const error = useRouteError();
  console.error("Route error captured:", error);
  return (
    <div style={{ padding: "4rem 1.5rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
      <h2 style={{ fontSize: "var(--fs-kpi)", fontWeight: 700, margin: 0, color: "var(--ink)" }}>
        {tr("Unexpected Display Conflict")}
      </h2>
      <p style={{ color: "var(--muted)", maxWidth: 520, margin: 0, fontSize: "var(--fs-body)", lineHeight: 1.6 }}>
        {tr("The browser encountered a DOM reconciliation conflict (often caused by auto-translation extensions). Please reload or navigate back to the dashboard.")}
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
          {tr("Reload Page")}
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
          {tr("Back to Herd Health")}
        </a>
      </div>
    </div>
  );
}

// Bọc mọi trang bằng các provider toàn cục (toast, trạng thái đăng nhập).
export function RootLayout() {
  return (
    <Providers>
      <Outlet />
    </Providers>
  );
}

// Khung chung của mọi trang SAU đăng nhập: Sidebar + Topbar. Chưa đăng nhập thì AppShell đưa về /login.
export function AppLayout() {
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
export function PermissionMatrixRoute() {
  const { id = "" } = useParams();
  return <PermissionMatrix accountId={id} />;
}

// "Training Progress" trên menu: Chủ ngựa xem giáo án ngựa của mình (SC-2.02), nhân viên xem Tổng quan (SC-2.01).
export function TrainingProgressRoute() {
  const user = useCurrentUser();
  return user.role === "HORSE_OWNER" ? <PlanListPage /> : <TrainingOverviewPage />;
}

// Mọi đường dẫn chưa có trang riêng (ngựa, huấn luyện, y tế...). RoleGuard trong AppShell đã kiểm quyền trước đó.
export function ComingSoonRoute() {
  const { "*": path = "" } = useParams();
  return <ComingSoonPage slug={path.split("/")[0] ?? ""} />;
}
