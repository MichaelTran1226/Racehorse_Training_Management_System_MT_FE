// Tính breadcrumb trên Topbar: "{Workspace} › {Màn hình}" (bỏ nhóm trung gian theo yêu cầu người dùng, đoạn trước có link về Dashboard).

import { ROLE_WORKSPACE, screenAccess } from "@/shared/lib/permissions";
import type { AuthUser } from "@/shared/types/auth";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export function breadcrumbFor(user: AuthUser, pathname: string, accountName?: string): BreadcrumbSegment[] {
  const workspace = ROLE_WORKSPACE[user.role];
  const homeSegment: BreadcrumbSegment = { label: workspace, href: "/dashboard" };

  // 1. Dashboard: chỉ hiện tên không gian (Medical workspace), không hiện > Dashboard thừa
  if (pathname === "/dashboard") {
    return [homeSegment];
  }

  // 2. Tài khoản cá nhân
  if (pathname === "/profile") {
    return [homeSegment, { label: "My Profile" }];
  }
  if (pathname === "/profile/password") {
    return [homeSegment, { label: "My Profile", href: "/profile" }, { label: "Change password" }];
  }

  // 3. Thông báo
  if (pathname === "/notifications") {
    return [homeSegment, { label: "Notifications" }];
  }
  if (pathname === "/notifications/settings" || pathname === "/settings/notifications") {
    return [homeSegment, { label: "Notifications", href: "/notifications" }, { label: "Notification Settings" }];
  }

  // 4. Quản lý tài khoản
  if (pathname === "/accounts") {
    return [homeSegment, { label: "Accounts" }];
  }
  if (/^\/accounts\/[^/]+\/permissions/.test(pathname)) {
    return [
      homeSegment,
      { label: "Accounts", href: "/accounts" },
      { label: accountName ?? "Account Permissions" },
    ];
  }
  // 5. Trang lỗi hệ thống
  if (pathname === "/forbidden") return [homeSegment, { label: "Access denied" }];
  if (pathname === "/session-expired") return [homeSegment, { label: "Session expired" }];


  // 6. Chi tiết ngựa & hồ sơ bệnh án (các trang lồng cấp)
  if (pathname.startsWith("/medical/horses/") || pathname.startsWith("/records/horse/")) {
    return [
      homeSegment,
      { label: "Herd Health", href: "/herd" },
      { label: accountName ?? "Horse Profile" },
    ];
  }
  if (pathname === "/medical/records/new") {
    return [
      homeSegment,
      { label: "Medical Records", href: "/records" },
      { label: "New Clinical Record" },
    ];
  }
  if (/^\/medical\/records\/[^/]+\/edit/.test(pathname)) {
    return [
      homeSegment,
      { label: "Medical Records", href: "/records" },
      { label: "Edit Clinical Record" },
    ];
  }
  if (/^\/medical\/records\/[^/]+/.test(pathname)) {
    return [
      homeSegment,
      { label: "Medical Records", href: "/records" },
      { label: "Record Details" },
    ];
  }

  // 7. Chi tiết giáo án huấn luyện (các trang lồng cấp)
  if (pathname === "/plans/new" || pathname === "/training/plans/new") {
    return [
      homeSegment,
      { label: "Training Plans", href: "/plans" },
      { label: "Create Plan" },
    ];
  }
  if (pathname === "/training/plans/history") {
    return [
      homeSegment,
      { label: "Training Plans", href: "/plans" },
      { label: "Plan History" },
    ];
  }

  // 8. Tất cả các trang chức năng thông thường: đi thẳng từ Workspace > {Tên màn hình} (BỎ nhóm trung gian)
  const access = screenAccess(user.role, user.permissions, pathname);
  if (access.label) {
    return [
      homeSegment,
      { label: access.label },
    ];
  }

  return [homeSegment, { label: "Page not found" }];
}
