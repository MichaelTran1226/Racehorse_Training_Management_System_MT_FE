import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/ui/Icon";
import { BRAND } from "@/shared/lib/brand";
import { cx } from "@/shared/lib/cx";
import { capitalize, initials } from "@/shared/lib/format";
import { isNavItemActive, navFor, ROLE_LABEL } from "@/shared/lib/permissions";
import { useAppLanguage } from "@/shared/lib/language";
import { healthApi } from "@/features/health/api";
import { subscribeNotifications } from "@/shared/lib/notifications";
import type { AuthUser } from "@/shared/types/auth";
import type { SidebarNote } from "./useSidebarInfo";
import styles from "./Sidebar.module.css";

import { tr } from "@/shared/i18n/tr";
interface SidebarProps {
  user: AuthUser;
  pathname: string;
  note: SidebarNote | null;
  accountsAlert: boolean;
  open: boolean; // chỉ có ý nghĩa ở màn hình hẹp (menu trượt ra)
  onNavigate: () => void;
}

// Sidebar xây từ DANH SÁCH QUYỀN của tài khoản (navFor), không chỉ từ tên vai trò:
// thu hồi quyền => mục tương ứng biến mất ở lần tải trang kế tiếp.
export function Sidebar({ user, pathname, note, accountsAlert, open, onNavigate }: SidebarProps) {
  const { t, isVietnamese } = useAppLanguage();
  const groups = navFor(user.role, user.permissions);
  const [hasActiveLocks, setHasActiveLocks] = useState(false);
  const canViewLocks = Boolean(user.permissions.viewMedical);

  // Chấm đỏ cạnh Training Locks: có ít nhất 1 khóa đang hiệu lực (đọc từ API; lỗi thì không hiện chấm).
  useEffect(() => {
    if (!canViewLocks) return;
    let cancelled = false;
    const updateLocks = () => {
      healthApi.getLocks()
        .then((locks) => {
          if (!cancelled && Array.isArray(locks)) {
            setHasActiveLocks(locks.some((l) => l.status === "ACTIVE"));
          }
        })
        .catch(() => {
          // Giữ trạng thái cũ, lần cập nhật sau thử lại.
        });
    };

    updateLocks();
    // Có thông báo mới (VD vừa đặt/gỡ khóa) => đọc lại; dữ liệu mock phát "horsesUpdated".
    const offNotifications = subscribeNotifications(updateLocks);
    window.addEventListener("horsesUpdated", updateLocks);
    return () => {
      cancelled = true;
      offNotifications();
      window.removeEventListener("horsesUpdated", updateLocks);
    };
  }, [canViewLocks]);

  return (
    <nav aria-label={tr("Main navigation")} className={cx(styles.nav, open && styles.open)}>
      <div className={styles.brand}>
        <span className={styles.logo}>
          <img src={BRAND.logo} alt="" width={26} height={26} />
        </span>
        <div>
          <strong>{BRAND.name}</strong>
          <span>{BRAND.fullNameShort}</span>
        </div>
      </div>

      <div className={styles.groups}>
        {groups.map((g) => {
          const rawKey = g.label.toLowerCase().replace(/\s+/g, "_");
          const isWorkspace = g.label === "WORKSPACE";
          const groupTitle = isWorkspace ? "" : t(`nav.group_${rawKey}`, t(`nav.${rawKey}`, capitalize(g.label)));
          return (
            <div key={g.label} className={styles.group}>
              {groupTitle ? <p className={styles.groupLabel}>{groupTitle}</p> : null}
            {g.items.map((it) => {
              const active = isNavItemActive(it, pathname);
              const showAlertDot =
                (it.id === "locks" && hasActiveLocks) || (it.id === "accounts" && accountsAlert) || Boolean(it.alert);
              const itemKey = it.i18nKey || it.id;
              const itemLabel = isVietnamese ? t(`nav.${itemKey}`, it.label) : it.label;
              return (
                <Link
                  key={it.id}
                  to={it.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cx(styles.item, active && styles.active)}
                >
                  <Icon name={it.icon} size={18} />
                  <span className={styles.itemLabel}>{itemLabel}</span>
                  {showAlertDot && <span className={cx(styles.dot, styles.alertDot)} aria-label={tr("Action required")} />}
                </Link>
              );
            })}
          </div>
          );
        })}
      </div>

      {note && (
        <Link to={note.href} onClick={onNavigate} className={styles.note}>
          <strong>{tr(note.title)}</strong>
          <span>{tr(note.body)}</span>
        </Link>
      )}

      <div className={styles.user} title={`${user.fullName} · ${t(`nav.role_${user.role}`, ROLE_LABEL[user.role])}`}>
        <span className={styles.userAvatar} aria-hidden="true">
          {initials(user.fullName)}
        </span>
        <div className={styles.userText}>
          <strong>{user.fullName}</strong>
          <span>{t(`nav.role_${user.role}`, ROLE_LABEL[user.role])}</span>
        </div>
      </div>
    </nav>
  );
}
