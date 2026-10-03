import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@/shared/components/ui/Icon";
import { useTheme } from "@/shared/lib/theme";
import { cx } from "@/shared/lib/cx";
import {
  getStoredNotifications,
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

// Topbar floating navigation bar: Home icon button -> Breadcrumb -> Search -> Divider -> Bell -> Theme -> Logout
export function Topbar({ breadcrumb, onMenu, onLogout }: TopbarProps) {
  const { user } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const bellTriggerRef = useRef<HTMLDivElement>(null);
  const [notificationsList, setNotificationsList] = useState<AppNotification[]>(() =>
    getStoredNotifications(user?.role),
  );
  const [unreadCount, setUnreadCount] = useState<number>(() =>
    getUnreadNotificationsCount(user?.role),
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
      setNotificationsList(getStoredNotifications(user?.role));
      setUnreadCount(getUnreadNotificationsCount(user?.role));
    };
    sync();
    return subscribeNotifications(sync);
  }, [user?.role]);

  return (
    <div className={styles.wrapper}>
      <header className={styles.bar}>
        {/* Left: Mobile Menu + Home Button + Breadcrumbs */}
        <div className={styles.leftGroup}>
          <button
            type="button"
            aria-label="Open menu"
            onClick={onMenu}
            className={styles.menu}
          >
            <Icon name="list" size={16} />
          </button>

          {/* Home Button -> Navigates to /dashboard */}
          <button
            type="button"
            aria-label="Dashboard"
            title="Dashboard"
            onClick={() => navigate("/dashboard")}
            className={styles.homeBtn}
          >
            <Icon name="home" size={16} />
          </button>

          {/* Breadcrumbs with chevron separators and clickable navigation links */}
          <nav aria-label="Breadcrumb" className={styles.crumbs}>
            <ol>
              {breadcrumb.map((part, i) => {
                const last = i === breadcrumb.length - 1;
                const isOnlyOne = breadcrumb.length === 1;
                const label = typeof part === "string" ? part : part.label;
                const href = typeof part === "object" ? part.href : i === 0 ? "/dashboard" : undefined;

                return (
                  <li key={i} className={cx(!isOnlyOne && last && styles.current)} aria-current={last ? "page" : undefined}>
                    {i > 0 && (
                      <span className={styles.sep} aria-hidden="true">
                        <Icon name="chevronRight" size={13} strokeWidth={2.2} />
                      </span>
                    )}
                    {!last && href ? (
                      <Link to={href} className={styles.crumbLink} title={`Go to ${label}`}>
                        {label}
                      </Link>
                    ) : (
                      <span className={isOnlyOne ? styles.workspaceTitle : last ? styles.currentLabel : styles.crumbText}>
                        {label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Right: Search + Divider + Notifications + Theme + Logout */}
        <div className={styles.tools}>
          <div className={styles.search} ref={searchContainerRef}>
            <span className={styles.searchIcon}>
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              aria-label="Search horses, plans, people"
              placeholder="Search horses, plans, people..."
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
              style={{ paddingRight: searchQuery ? 28 : 12 }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                style={{
                  position: "absolute",
                  right: 8,
                  background: "none",
                  border: "none",
                  color: "var(--muted-2)",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Icon name="x" size={12} />
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

          {/* Thin Vertical Divider */}
          <div className={styles.divider} aria-hidden="true" />

          {/* Notifications Button */}
          <div style={{ position: "relative" }}>
            <div ref={bellTriggerRef} style={{ display: "inline-flex" }}>
              <button
                type="button"
                aria-label="Notifications"
                title="Notifications"
                onClick={() => setPopoverOpen((prev) => !prev)}
                className={styles.actionBtn}
              >
                <Icon name="bell" size={16} />
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
              </button>
            </div>
            <NotificationPopover
              notifications={notificationsList}
              userRole={user?.role}
              open={popoverOpen}
              onClose={() => setPopoverOpen(false)}
              triggerRef={bellTriggerRef}
            />
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
            className={styles.actionBtn}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
          </button>

          {/* Logout Button */}
          <button
            type="button"
            aria-label="Log out"
            title="Log out"
            onClick={onLogout}
            className={styles.actionBtn}
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </header>
    </div>
  );
}
