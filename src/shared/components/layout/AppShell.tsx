import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SessionExpiredModal } from "./SessionExpiredModal";
import { ConfirmModal } from "@/shared/components/ui/ConfirmModal";
import { BRAND } from "@/shared/lib/brand";
import { breadcrumbFor } from "@/shared/lib/navigation";
import { ROLE_LABEL } from "@/shared/lib/permissions";
import { useAppLanguage } from "@/shared/lib/language";
import { useAuth } from "./AuthProvider";
import { BreadcrumbContext } from "./BreadcrumbContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useSidebarInfo } from "./useSidebarInfo";
import styles from "./AppShell.module.css";

// Khung chung của mọi trang sau đăng nhập: Sidebar 224px + Topbar 64px + vùng nội dung (DESIGN.md §5).
// Chưa đăng nhập => chuyển về /login (kèm ?next= để quay lại sau khi đăng nhập).
export function AppShell({ children }: { children: ReactNode }) {
  const { status, user, expired, signOut, refresh } = useAuth();
  const { pathname } = useLocation();
  const { t } = useAppLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [crumbTail, setCrumbTail] = useState<string | undefined>(undefined);
  const info = useSidebarInfo(user, pathname);

  useEffect(() => {
    if (status === "anonymous") navigate(`/login?next=${encodeURIComponent(pathname)}`, { replace: true });
  }, [status, pathname, navigate]);

  // Mỗi lần đổi trang: đóng menu hẹp và hỏi lại server (quyền có thể vừa bị đổi).
  useEffect(() => {
    setMenuOpen(false);
    if (status === "authenticated") void refresh();
    // chỉ chạy khi đổi trang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (status !== "authenticated" || !user) {
    return (
      <div className={styles.boot} role="status">
        Loading workspace…
      </div>
    );
  }

  return (
    <BreadcrumbContext.Provider value={setCrumbTail}>
      <div className={styles.shell}>
        <Sidebar user={user} pathname={pathname} note={info.note} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        {menuOpen && <button type="button" className={styles.scrim} aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
        <div className={styles.main}>
          <Topbar
            breadcrumb={breadcrumbFor(user, pathname, crumbTail)}
            notifications={info.notifications}
            onMenu={() => setMenuOpen(true)}
            onLogout={() => setLogoutOpen(true)}
          />
          <main id="content" className={styles.content}>
            {children}
          </main>
        </div>
      </div>

      {/* Hộp thoại nằm NGOÀI RoleGuard: vẫn hiện được khi trang bên trong bị chặn (403). */}
      {logoutOpen && (
        <ConfirmModal
          title={t("common.confirmLogoutTitle", `Log out of ${BRAND.name}?`)}
          subtitle={t("common.confirmLogoutSubtitle", "Unsaved changes on open forms are discarded.")}
          tone="warn"
          confirmLabel={t("common.logout", "Log out")}
          cancelLabel={t("common.staySignedIn", "Stay signed in")}
          onCancel={() => setLogoutOpen(false)}
          onConfirm={async () => {
            await signOut();
            navigate("/login", { replace: true });
          }}
        >
          {t("common.confirmLogoutBody", `The session for ${user.fullName} · ${t(`nav.role_${user.role}`, ROLE_LABEL[user.role])} closes and the browser returns to the sign-in page.`)}
        </ConfirmModal>
      )}
      {expired && <SessionExpiredModal />}
    </BreadcrumbContext.Provider>
  );
}
