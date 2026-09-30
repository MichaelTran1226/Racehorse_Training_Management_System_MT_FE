// Tính breadcrumb trên Topbar: "Không gian › Nhóm › Màn hình" (đoạn cuối in đậm).

import { capitalize } from "@/shared/lib/format";
import { ROLE_WORKSPACE, screenAccess } from "@/shared/lib/permissions";
import type { AuthUser } from "@/shared/types/auth";

export function breadcrumbFor(user: AuthUser, pathname: string, accountName?: string): string[] {
  const workspace = ROLE_WORKSPACE[user.role];

  if (pathname === "/dashboard") return [workspace, "Dashboard"];
  if (pathname === "/profile") return [workspace, "My account", "My Profile"];
  if (pathname === "/profile/password") return [workspace, "My account", "Change password"];
  if (pathname === "/accounts") return [workspace, "Administration", "Accounts"];
  if (/^\/accounts\/[^/]+\/permissions/.test(pathname)) {
    return [workspace, "Administration", "Accounts", accountName ?? "Account"];
  }
  if (pathname === "/forbidden") return [workspace, "Access denied"];
  if (pathname === "/session-expired") return [workspace, "Session expired"];

  const access = screenAccess(user.role, user.permissions, pathname);
  if (access.group && access.label) return [workspace, capitalize(access.group), access.label];
  return [workspace, "Page not found"];
}
