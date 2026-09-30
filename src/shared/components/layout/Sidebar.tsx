import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/ui/Icon";
import { BRAND } from "@/shared/lib/brand";
import { cx } from "@/shared/lib/cx";
import { initials } from "@/shared/lib/format";
import { isNavItemActive, navFor, ROLE_LABEL } from "@/shared/lib/permissions";
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
  const groups = navFor(user.role, user.permissions);

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

      <div className={styles.user}>
        <span className={styles.userAvatar}>{initials(user.fullName)}</span>
        <div className={styles.userText}>
          <strong>{user.fullName}</strong>
          <span>{ROLE_LABEL[user.role]}</span>
        </div>
      </div>

      <div className={styles.groups}>
        {groups.map((g) => (
          <div key={g.label} className={styles.group}>
            <p className={styles.groupLabel}>{g.label}</p>
            {g.items.map((it) => {
              const active = isNavItemActive(it, pathname);
              return (
                <Link
                  key={it.id}
                  to={it.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cx(styles.item, active && styles.active)}
                >
                  <Icon name={it.icon} size={18} />
                  <span className={styles.itemLabel}>{it.label}</span>
                  {active && <span className={styles.dot} />}
                  {!active && it.alert && <span className={cx(styles.dot, styles.alertDot)} aria-label="Work waiting" />}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {note && (
        <div className={styles.note}>
          <div>
            <strong>{note.title}</strong>
            <span>{note.body}</span>
          </div>
          <Icon name="horse" size={16} />
        </div>
      )}

      <div className={styles.foot}>
        <span className={styles.footDot} />
        Thiên Mã Equestrian Club
      </div>
    </nav>
  );
}
