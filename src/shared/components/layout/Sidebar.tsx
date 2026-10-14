import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/ui/Icon";
import { BRAND } from "@/shared/lib/brand";
import { cx } from "@/shared/lib/cx";
import { capitalize, initials } from "@/shared/lib/format";
import { isNavItemActive, navFor, ROLE_LABEL } from "@/shared/lib/permissions";
import { useAppLanguage } from "@/shared/lib/language";
import { healthApi } from "@/features/health/api";
import type { AuthUser } from "@/shared/types/auth";
import type { SidebarNote } from "./useSidebarInfo";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  user: AuthUser;
  pathname: string;
  note: SidebarNote | null;
  open: boolean; // chỉ có ý nghĩa ở màn hình hẹp (menu trượt ra)
  onNavigate: () => void;
}

// Sidebar xây từ DANH SÁCH QUYỀN của tài khoản (navFor), không chỉ từ tên vai trò:
// thu hồi quyền => mục tương ứng biến mất ở lần tải trang kế tiếp.
export function Sidebar({ user, pathname, note, open, onNavigate }: SidebarProps) {
  const { t, isVietnamese } = useAppLanguage();
  const groups = navFor(user.role, user.permissions);
  const [hasActiveLocks, setHasActiveLocks] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const updateLocks = () => {
      healthApi.getLocks()
        .then((locks) => {
          if (!cancelled && Array.isArray(locks)) {
            setHasActiveLocks(locks.some((l) => l.status === "ACTIVE"));
          }
        })
        .catch(() => {
          if (!cancelled) setHasActiveLocks(false);
        });
    };

    updateLocks();
    window.addEventListener("horsesUpdated", updateLocks);
    window.addEventListener("storage", updateLocks);
    return () => {
      cancelled = true;
      window.removeEventListener("horsesUpdated", updateLocks);
      window.removeEventListener("storage", updateLocks);
    };
  }, []);

  return (
    <nav aria-label="Main navigation" className={cx(styles.nav, open && styles.open)}>
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
          return (
            <div key={g.label} className={styles.group}>
              <p className={styles.groupLabel}>{t(`nav.group_${rawKey}`, t(`nav.${rawKey}`, capitalize(g.label)))}</p>
            {g.items.map((it) => {
              const active = isNavItemActive(it, pathname);
              const showAlertDot = (it.id === "locks" && hasActiveLocks) || (it.id !== "locks" && Boolean(it.alert));
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
                  {showAlertDot && <span className={cx(styles.dot, styles.alertDot)} aria-label="Action required" />}
                </Link>
              );
            })}
          </div>
          );
        })}
      </div>

      {note && (
        <Link to={note.href} onClick={onNavigate} className={styles.note}>
          <strong>{note.title}</strong>
          <span>{note.body}</span>
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
