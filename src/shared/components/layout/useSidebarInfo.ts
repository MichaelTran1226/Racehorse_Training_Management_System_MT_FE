import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { formatShortDate } from "@/shared/lib/format";
import { ROLE_LABEL } from "@/shared/lib/permissions";
import type { AuthUser, PublicAccount } from "@/shared/types/auth";
import { getUnreadNotificationsCount } from "@/shared/lib/notifications";

export interface SidebarNote {
  title: string;
  body: string;
  href: string;
}

interface SidebarInfo {
  note: SidebarNote | null;
  notifications: number;
}

// Thông tin phụ của khung app: ghi chú dưới sidebar + số thông báo trên chuông.
// Chỉ hiện ghi chú khi có dữ liệu thật: Club Manager thấy số yêu cầu đang chờ duyệt.
export function useSidebarInfo(user: AuthUser | null, pathname: string): SidebarInfo {
  const [pending, setPending] = useState<{ count: number; first?: string }>({ count: 0 });
  const canManage = Boolean(user?.permissions.manageAccounts);

  useEffect(() => {
    if (!canManage) return;
    let cancelled = false;
    api<{ accounts: PublicAccount[] }>("GET", "/accounts")
      .then(({ accounts }) => {
        if (cancelled) return;
        const waiting = accounts.filter((a) => a.status === "PENDING_APPROVAL");
        const first = waiting[0];
        setPending({
          count: waiting.length,
          first: first ? `${ROLE_LABEL[first.role]} · sent ${formatShortDate(first.requestedAt ?? first.createdAt)}` : undefined,
        });
      })
      .catch(() => {
        // Lỗi tải danh sách đã được trang Accounts xử lý; ở đây chỉ bỏ ghi chú.
      });
    return () => {
      cancelled = true;
    };
  }, [canManage, pathname]);

  const unreadCount = getUnreadNotificationsCount(user?.role);

  if (!user) return { note: null, notifications: 0 };
  if (canManage) {
    return {
      note: pending.count > 0 ? { title: `${pending.count} ${pending.count === 1 ? "request" : "requests"} waiting`, body: pending.first ?? "", href: "/accounts" } : null,
      notifications: pending.count || unreadCount,
    };
  }
  return { note: null, notifications: unreadCount };
}
