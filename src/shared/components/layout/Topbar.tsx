import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@/shared/components/ui/Icon";
import { LanguageToggle } from "@/shared/components/ui/LanguageToggle";
import { useTheme } from "@/shared/lib/theme";
import { useAppLanguage } from "@/shared/lib/language";
import { cx } from "@/shared/lib/cx";
import {
  getNotifications,
  subscribeNotifications,
  getUnreadNotificationsCount,
  type AppNotification,
} from "@/shared/lib/notifications";
import { getStoredHorses } from "@/shared/mock/horsesData";
import type { BreadcrumbSegment } from "@/shared/lib/navigation";
import { useAuth } from "./AuthProvider";
import { NotificationPopover } from "./NotificationPopover";
import { SearchSuggestionsPopover } from "./SearchSuggestionsPopover";
import styles from "./Topbar.module.css";

interface TopbarProps {
  breadcrumb: (string | BreadcrumbSegment)[]; // đoạn cuối in đậm, các đoạn trước có link điều hướng
  notifications?: number;
  onMenu: () => void;
  onLogout: () => void;
}

// Topbar phẳng 64px: (menu khi hẹp) · breadcrumb trang con · ô tìm · chuông · đổi theme · đăng xuất.
export function Topbar({ breadcrumb, onMenu, onLogout }: TopbarProps) {
  const { user } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const { isVietnamese, t } = useAppLanguage();
  const navigate = useNavigate();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const bellTriggerRef = useRef<HTMLDivElement>(null);
  const [notificationsList, setNotificationsList] = useState<AppNotification[]>(() =>
    getNotifications(),
  );
  const [unreadCount, setUnreadCount] = useState<number>(() =>
    getUnreadNotificationsCount(),
  );

  // Search suggestions state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Scoped horses by user role with real-time reactive sync
  const [allStoredHorses, setAllStoredHorses] = useState(() => getStoredHorses());

  useEffect(() => {
    const handleSyncHorses = () => {
      setAllStoredHorses(getStoredHorses());
    };
    window.addEventListener("horsesUpdated", handleSyncHorses);
    window.addEventListener("storage", handleSyncHorses);
    return () => {
      window.removeEventListener("horsesUpdated", handleSyncHorses);
      window.removeEventListener("storage", handleSyncHorses);
    };
  }, []);

  const scopedHorses = useMemo(() => {
    if (!user) return [];
    if (user.role === "HORSE_OWNER") {
      return allStoredHorses.filter((h) => (h.ownerId ? h.ownerId === user.id : true));
    }
    if (user.role === "GROOM") {
      return allStoredHorses.filter((h) => (h.assignedGroomId ? h.assignedGroomId === user.id : true));
    }
    return allStoredHorses;
  }, [user, allStoredHorses]);

  const filteredHorses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = scopedHorses;
    if (q) {
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.code.toLowerCase().includes(q) ||
          (h.stall && h.stall.toLowerCase().includes(q)) ||
          (h.healthGroup && h.healthGroup.toLowerCase().includes(q)) ||
          (h.statusText && h.statusText.toLowerCase().includes(q)) ||
          (h.lockReason && h.lockReason.toLowerCase().includes(q)),
      );
    }
    return [...list].sort((a, b) => {
      if (a.isLocked && !b.isLocked) return -1;
      if (!a.isLocked && b.isLocked) return 1;
      const priority = { INJURED: 1, WATCH: 2, QUARANTINED: 3, FIT: 4 };
      return (priority[a.healthGroup] || 5) - (priority[b.healthGroup] || 5);
    });
  }, [scopedHorses, searchQuery]);

  useEffect(() => {
    const sync = () => {
      setNotificationsList(getNotifications());
      setUnreadCount(getUnreadNotificationsCount());
    };
    sync();
    return subscribeNotifications(sync);
  }, []);

  // Trang cấp 1 đã có tiêu đề H1 nên không cần breadcrumb; chỉ trang con (Accounts › Tên) mới hiện.
  const trail = breadcrumb.slice(1);
  const showTrail = trail.length >= 2;

  return (
    <header className={styles.bar}>
      <div className={styles.leftGroup}>
        <button type="button" aria-label={isVietnamese ? "Mở menu" : "Open menu"} onClick={onMenu} className={styles.menu}>
          <Icon name="list" size={18} />
        </button>

        {showTrail && (
          <nav aria-label={isVietnamese ? "Đường dẫn" : "Breadcrumb"} className={styles.crumbs}>
            <ol>
              {trail.map((part, i) => {
                const last = i === trail.length - 1;
                const label = typeof part === "string" ? part : part.label;
                const href = typeof part === "object" ? part.href : undefined;
                return (
                  <li key={i} aria-current={last ? "page" : undefined}>
                    {i > 0 && (
                      <span className={styles.sep} aria-hidden="true">
                        <Icon name="chevronRight" size={14} />
                      </span>
                    )}
                    {!last && href ? (
                      <Link to={href} className={styles.crumbLink}>
                        {label}
                      </Link>
                    ) : (
                      <span className={last ? styles.currentLabel : styles.crumbText}>{label}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>

      <div className={styles.tools}>
        <div className={styles.search} ref={searchContainerRef}>
          <span className={styles.searchIcon}>
            <Icon name="search" size={16} />
          </span>
          <input
            type="text"
            aria-label={t("topbar.searchAria", "Search horses, plans, people")}
            placeholder={t("topbar.searchPlaceholder", "Search horses, plans, people")}
            className={cx(searchQuery && styles.hasValue)}
            onFocus={() => {
              setAllStoredHorses(getStoredHorses());
              setSearchOpen(true);
            }}
            onClick={() => {
              setAllStoredHorses(getStoredHorses());
              setSearchOpen(true);
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchOpen(false);
              } else if (e.key === "Enter" && filteredHorses.length > 0) {
                navigate(`/medical/horses/${filteredHorses[0].id}`);
                setSearchOpen(false);
                setSearchQuery("");
              }
            }}
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} aria-label={isVietnamese ? "Xóa tìm kiếm" : "Clear search"} className={styles.clear}>
              <Icon name="x" size={14} />
            </button>
          )}

          <SearchSuggestionsPopover
            horses={filteredHorses}
            user={user}
            query={searchQuery}
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            onSelect={(horse) => {
              navigate(`/medical/horses/${horse.id}`);
              setSearchOpen(false);
              setSearchQuery("");
            }}
            triggerRef={searchContainerRef}
          />
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.bellWrap}>
          <div ref={bellTriggerRef} className={styles.bellTrigger}>
            <button
              type="button"
              aria-label={unreadCount > 0 ? (isVietnamese ? `Thông báo, ${unreadCount} chưa đọc` : `Notifications, ${unreadCount} unread`) : (isVietnamese ? "Thông báo" : "Notifications")}
              title={isVietnamese ? "Thông báo" : "Notifications"}
              onClick={() => setPopoverOpen((prev) => !prev)}
              className={styles.actionBtn}
            >
              <Icon name="bell" size={18} />
              {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>
          </div>
            <NotificationPopover
              notifications={notificationsList}
              open={popoverOpen}
              onClose={() => setPopoverOpen(false)}
              triggerRef={bellTriggerRef}
            />
          </div>

          {/* Language Switcher */}
          <LanguageToggle />

          {/* Theme Toggle Button */}
          <button
            type="button"
            aria-label={theme === "dark" ? t("topbar.themeToggleLight", "Switch to light mode") : t("topbar.themeToggleDark", "Switch to dark mode")}
            title={theme === "dark" ? t("topbar.themeToggleLight", "Switch to light mode") : t("topbar.themeToggleDark", "Switch to dark mode")}
            onClick={toggleTheme}
            className={styles.actionBtn}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>

          {/* Logout Button */}
          <button
            type="button"
            aria-label={t("topbar.logout", "Log out")}
            title={t("topbar.logout", "Log out")}
            onClick={onLogout}
            className={styles.actionBtn}
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
    </header>
  );
}
