import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/shared/components/ui/Icon";
import type { Role } from "@/shared/types/enums";
import {
  type AppNotification,
  formatTimeAgo,
  isToday,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/shared/lib/notifications";

interface NotificationPopoverProps {
  notifications: AppNotification[];
  userRole?: Role;
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function NotificationPopover({
  notifications,
  userRole,
  open,
  onClose,
  triggerRef,
}: NotificationPopoverProps) {
  const navigate = useNavigate();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef?.current && triggerRef.current.contains(target)) {
        return;
      }
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        onClose();
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.read;
    return true;
  });

  const todayList = filteredNotifications.filter((n) => isToday(n.createdAt));
  const earlierList = filteredNotifications.filter((n) => !isToday(n.createdAt));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getCategoryTheme = (category: AppNotification["category"]) => {
    switch (category) {
      case "LOCK":
        return { icon: "lock", bg: "#ef4444", text: "#ffffff" };
      case "MEDICAL":
        return { icon: "stethoscope", bg: "#0284c7", text: "#ffffff" };
      case "TRAINING":
        return { icon: "activity", bg: "#f59e0b", text: "#ffffff" };
      case "ACCOUNT":
        return { icon: "users", bg: "#8b5cf6", text: "#ffffff" };
      default:
        return { icon: "bell", bg: "#64748b", text: "#ffffff" };
    }
  };

  const renderItem = (n: AppNotification) => {
    const theme = getCategoryTheme(n.category);
    return (
      <div
        key={n.id}
        onClick={() => {
          markNotificationAsRead(n.id);
          if (n.link) navigate(n.link);
          onClose();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          borderRadius: 8,
          cursor: "pointer",
          background: n.read ? "transparent" : "var(--nav-item-active-bg, rgba(59, 130, 246, 0.08))",
          transition: "background 0.15s ease",
          position: "relative",
          margin: "2px 8px",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-sunken, rgba(0, 0, 0, 0.05))")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = n.read
            ? "transparent"
            : "var(--nav-item-active-bg, rgba(59, 130, 246, 0.08))")
        }
      >
        {/* Category Avatar Badge */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: theme.bg,
            color: theme.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        >
          <Icon name={theme.icon} size={22} />
        </div>

        {/* Text Details */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 6 }}>
          <div
            style={{
              fontSize: "13px",
              lineHeight: "1.35",
              color: n.read ? "var(--text-muted)" : "var(--text)",
            }}
          >
            <strong style={{ color: "var(--text)", fontWeight: 700 }}>
              {n.senderName ? `${n.senderName}: ` : ""}
            </strong>
            <span style={{ fontWeight: n.read ? 400 : 600 }}>{n.message}</span>
          </div>
          <div
            style={{
              fontSize: "11px",
              color: n.read ? "var(--text-muted)" : "#3b82f6",
              fontWeight: n.read ? 400 : 600,
              marginTop: 3,
            }}
          >
            {formatTimeAgo(n.createdAt)}
          </div>
        </div>

        {/* Facebook-style Blue Unread Dot */}
        {!n.read && (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#2563eb",
              flexShrink: 0,
            }}
            title="Unread"
          />
        )}
      </div>
    );
  };

  return (
    <div
      ref={popoverRef}
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        width: 380,
        maxWidth: "94vw",
        background: "var(--surface)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Top Header: Title + ... Menu */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 16px 8px",
          position: "relative",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.01em" }}>Notifications</h3>

        {/* ... More Action Button */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="More options"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: menuOpen ? "var(--surface-sunken)" : "transparent",
              color: "var(--text)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 700,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-sunken)")}
            onMouseLeave={(e) => {
              if (!menuOpen) e.currentTarget.style.background = "transparent";
            }}
          >
            •••
          </button>

          {/* ... Dropdown Menu (Facebook style) */}
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                width: 250,
                background: "var(--surface)",
                borderRadius: 8,
                border: "1px solid var(--border)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                zIndex: 1010,
                padding: "6px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  markAllNotificationsAsRead(userRole);
                  setMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "transparent",
                  color: "var(--text)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-sunken)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Icon name="check" size={16} />
                <span>Mark all as read</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onClose();
                  navigate("/notifications/settings");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "transparent",
                  color: "var(--text)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-sunken)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Icon name="settings" size={16} />
                <span>Notification settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onClose();
                  navigate("/notifications");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "transparent",
                  color: "var(--text)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-sunken)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Icon name="file" size={16} />
                <span>Open notifications page</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs: All | Unread */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px 10px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          style={{
            padding: "6px 14px",
            borderRadius: 20,
            border: "none",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            background: activeTab === "all" ? "var(--nav-item-active-bg, #e0f2fe)" : "var(--surface-sunken)",
            color: activeTab === "all" ? "var(--nav-item-active-text, #0369a1)" : "var(--text-muted)",
          }}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          style={{
            padding: "6px 14px",
            borderRadius: 20,
            border: "none",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            background: activeTab === "unread" ? "var(--nav-item-active-bg, #e0f2fe)" : "var(--surface-sunken)",
            color: activeTab === "unread" ? "var(--nav-item-active-text, #0369a1)" : "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span
              style={{
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "11px",
                borderRadius: 999,
                padding: "1px 6px",
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification Items List */}
      <div style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-muted)" }}>
            <Icon name="bell" size={32} style={{ margin: "0 auto 10px", opacity: 0.35 }} />
            <div style={{ fontSize: "14px", fontWeight: 600 }}>No notifications yet</div>
            <div style={{ fontSize: "12px", marginTop: 4 }}>
              {activeTab === "unread" ? "You're all caught up." : "No new notifications."}
            </div>
          </div>
        ) : (
          <>
            {todayList.length > 0 && (
              <div>
                <div style={{ padding: "8px 16px 4px", fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
                  Today
                </div>
                {todayList.map(renderItem)}
              </div>
            )}

            {earlierList.length > 0 && (
              <div style={{ marginTop: todayList.length > 0 ? 8 : 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 16px 4px",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>Earlier</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate("/notifications");
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#2563eb",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    See all
                  </button>
                </div>
                {earlierList.map(renderItem)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Footer: Facebook "View earlier notifications" */}
      <div
        style={{
          padding: "8px 12px",
          borderTop: "1px solid var(--border)",
          background: "var(--surface-sunken)",
          textAlign: "center",
        }}
      >
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate("/notifications");
          }}
          style={{
            width: "100%",
            padding: "8px 0",
            borderRadius: 6,
            border: "none",
            background: "transparent",
            color: "var(--text)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          View earlier notifications
        </button>
      </div>
    </div>
  );
}
