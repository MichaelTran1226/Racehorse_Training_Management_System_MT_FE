import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Icon } from "@/shared/components/ui/Icon";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import {
  type AppNotification,
  formatTimeAgo,
  getStoredNotifications,
  isToday,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeNotifications,
  clearAllNotifications,
} from "@/shared/lib/notifications";

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    getStoredNotifications(user?.role),
  );

  useEffect(() => {
    const sync = () => {
      setNotifications(getStoredNotifications(user?.role));
    };
    sync();
    return subscribeNotifications(sync);
  }, [user?.role]);

  const filtered = notifications.filter((n) => {
    if (activeTab === "unread") return !n.read;
    return true;
  });

  const todayList = filtered.filter((n) => isToday(n.createdAt));
  const earlierList = filtered.filter((n) => !isToday(n.createdAt));
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getCategoryTheme = (category: AppNotification["category"]) => {
    switch (category) {
      case "LOCK":
        return { icon: "lock", bg: "#ef4444", text: "#ffffff", label: "Training Lock" };
      case "MEDICAL":
        return { icon: "stethoscope", bg: "#0284c7", text: "#ffffff", label: "Health & Medical" };
      case "TRAINING":
        return { icon: "activity", bg: "#f59e0b", text: "#ffffff", label: "Training & Workouts" };
      case "ACCOUNT":
        return { icon: "users", bg: "#8b5cf6", text: "#ffffff", label: "Accounts & Roles" };
      default:
        return { icon: "bell", bg: "#64748b", text: "#ffffff", label: "System Notification" };
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
        }}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          padding: "16px 20px",
          borderRadius: "var(--r)",
          cursor: "pointer",
          background: n.read ? "var(--surface)" : "var(--nav-item-active-bg, rgba(59, 130, 246, 0.08))",
          border: `1px solid ${n.read ? "var(--border)" : "rgba(59, 130, 246, 0.25)"}`,
          transition: "all 0.15s ease",
          boxShadow: n.read ? "none" : "var(--shadow-sm)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = n.read ? "var(--border)" : "rgba(59, 130, 246, 0.25)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Category Circle Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: theme.bg,
            color: theme.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
          }}
        >
          <Icon name={theme.icon} size={24} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Badge tone={n.category === "LOCK" ? "danger" : n.category === "ACCOUNT" ? "violet" : "info"}>
              {theme.label}
            </Badge>
            {n.senderName && (
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                From: <strong>{n.senderName}</strong>
              </span>
            )}
            <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--text-muted)", flexShrink: 0 }}>
              {formatTimeAgo(n.createdAt)}
            </span>
          </div>

          <h4
            style={{
              margin: "0 0 4px",
              fontSize: "14.5px",
              fontWeight: n.read ? 600 : 750,
              color: n.read ? "var(--text)" : "var(--text-strong)",
            }}
          >
            {n.title}
          </h4>

          <p
            style={{
              margin: 0,
              fontSize: "13px",
              lineHeight: 1.5,
              color: n.read ? "var(--text-muted)" : "var(--text)",
            }}
          >
            {n.message}
          </p>

          {/* Action Link Button */}
          {n.link && (
            <div style={{ marginTop: 10 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
              >
                <span>View details</span>
                <Icon name="arrowRight" size={13} />
              </span>
            </div>
          )}
        </div>

        {/* Unread Indicator */}
        {!n.read && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 4 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#2563eb",
                display: "inline-block",
              }}
              title="Unread"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 880, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
            Notifications
          </h1>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {unreadCount > 0 && (
            <Button tone="secondary" onClick={() => markAllNotificationsAsRead(user?.role)}>
              <Icon name="check" size={15} style={{ marginRight: 6 }} />
              Mark all as read
            </Button>
          )}
          <Link to="/notifications/settings">
            <Button tone="ghost">
              <Icon name="settings" size={15} style={{ marginRight: 6 }} />
              Notification settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <Card pad={14}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              style={{
                padding: "8px 18px",
                borderRadius: 20,
                border: "none",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
                background: activeTab === "all" ? "var(--nav-item-active-bg, #e0f2fe)" : "var(--surface-sunken)",
                color: activeTab === "all" ? "var(--nav-item-active-text, #0369a1)" : "var(--text-muted)",
              }}
            >
              All ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              style={{
                padding: "8px 18px",
                borderRadius: 20,
                border: "none",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
                background: activeTab === "unread" ? "var(--nav-item-active-bg, #e0f2fe)" : "var(--surface-sunken)",
                color: activeTab === "unread" ? "var(--nav-item-active-text, #0369a1)" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: "2px 7px",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => clearAllNotifications(user?.role)}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--text-muted)",
                fontSize: "12px",
                cursor: "pointer",
                padding: "4px 8px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              Clear notification history
            </button>
          )}
        </div>
      </Card>

      {/* Notifications Listing */}
      {filtered.length === 0 ? (
        <Card pad={40}>
          <EmptyState
            title={activeTab === "unread" ? "You're all caught up!" : "No notifications yet"}
            description={
              activeTab === "unread"
                ? "All notifications for your role have been read or marked as reviewed."
                : "When training locks, clinical alerts, vaccination schedules, or system updates occur, they will appear here."
            }
          />
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {todayList.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-strong)", padding: "0 4px" }}>
                Today
              </div>
              {todayList.map(renderItem)}
            </div>
          )}

          {earlierList.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: todayList.length > 0 ? "0.5rem" : 0 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-strong)", padding: "0 4px" }}>
                Earlier
              </div>
              {earlierList.map(renderItem)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
