import { Icon } from "@/shared/components/ui/Icon";
import { IconButton } from "@/shared/components/ui/IconButton";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import { cx } from "@/shared/lib/cx";
import styles from "./Topbar.module.css";

interface TopbarProps {
  breadcrumb: string[]; // đoạn cuối in đậm
  notifications: number;
  onMenu: () => void;
  onLogout: () => void;
}

// Thứ tự cố định trên mọi màn hình: breadcrumb → tìm kiếm → thông báo → đổi theme → đăng xuất.
export function Topbar({ breadcrumb, notifications, onMenu, onLogout }: TopbarProps) {
  return (
    <header className={styles.bar}>
      <IconButton icon="list" label="Open menu" onClick={onMenu} className={styles.menu} />
      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <ol>
          {breadcrumb.map((part, i) => {
            const last = i === breadcrumb.length - 1;
            return (
              <li key={i} className={cx(last && styles.current)} aria-current={last ? "page" : undefined}>
                {i > 0 && <span className={styles.sep} aria-hidden="true">/</span>}
                {part}
              </li>
            );
          })}
        </ol>
      </nav>
      <div className={styles.tools}>
        <div className={styles.search}>
          <span className={styles.searchIcon}>
            <Icon name="search" size={15} />
          </span>
          <input type="search" aria-label="Search horses, plans, people" placeholder="Search horses, plans, people" />
        </div>
        <IconButton icon="bell" label="Notifications" badge={notifications} />
        <ThemeToggle />
        <IconButton icon="logout" label="Log out" onClick={onLogout} />
      </div>
    </header>
  );
}
