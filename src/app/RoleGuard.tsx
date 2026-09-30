import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Forbidden403Page from "@/features/auth/pages/Forbidden403Page";
import { screenAccess } from "@/shared/lib/permissions";
import { useAuth } from "@/shared/components/layout/AuthProvider";

// Chặn route theo quyền. Một chỗ duy nhất kiểm tra — các trang KHÔNG tự kiểm vai trò.
// Bị chặn thì hiện 403 ngay tại URL hiện tại (giữ khung app), không chuyển trang.
export function RoleGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (!user) return null;

  const access = screenAccess(user.role, user.permissions, pathname);
  if (!access.allowed) return <Forbidden403Page access={access} />;
  return <>{children}</>;
}
