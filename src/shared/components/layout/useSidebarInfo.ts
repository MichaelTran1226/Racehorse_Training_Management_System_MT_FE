import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { formatShortDate } from "@/shared/lib/format";
import { ROLE_LABEL } from "@/shared/lib/permissions";
import type { AuthUser, PublicAccount } from "@/shared/types/auth";
import { getUnreadNotificationsCount } from "@/shared/lib/notifications";
import { hasNewPendingRequests, subscribePendingSeen } from "@/shared/lib/pendingRequests";

export interface SidebarNote {
  title: string;
  body: string;
  href: string;
}

interface SidebarInfo {
  note: SidebarNote | null;
  notifications: number;
  accountsAlert: boolean; // chấm đỏ cạnh Accounts: có yêu cầu đăng ký mới chưa xem
}

// Thông tin phụ của khung app: ghi chú dưới sidebar + số thông báo trên chuông.
// Chỉ hiện ghi chú khi có dữ liệu thật: Club Manager thấy số yêu cầu đang chờ duyệt.
export function useSidebarInfo(user: AuthUser | null, pathname: string): SidebarInfo {
  const [pending, setPending] = useState<{ count: number; first?: string }>({ count: 0 });
  const [accounts, setAccounts] = useState<PublicAccount[]>([]);
  const [accountsAlert, setAccountsAlert] = useState(false);
  const canManage = Boolean(user?.permissions.manageAccounts);

  useEffect(() => {
    if (!canManage) return;
    let cancelled = false;
    api<{ accounts: PublicAccount[] }>("GET", "/accounts")
      .then(({ accounts }) => {
        if (cancelled) return;
        setAccounts(accounts);
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

  useEffect(() => {
    if (!canManage) return;
    const update = () => setAccountsAlert(hasNewPendingRequests(accounts));
    update();
    return subscribePendingSeen(update);
  }, [canManage, accounts]);

  const unreadCount = getUnreadNotificationsCount();

  if (!user) return { note: null, notifications: 0, accountsAlert: false };
  if (canManage) {
    return {
      note: pending.count > 0 ? { title: `${pending.count} ${pending.count === 1 ? "request" : "requests"} waiting`, body: pending.first ?? "", href: "/accounts" } : null,
      notifications: pending.count || unreadCount,
      accountsAlert,
    };
  }
  return { note: null, notifications: unreadCount, accountsAlert: false };
}
