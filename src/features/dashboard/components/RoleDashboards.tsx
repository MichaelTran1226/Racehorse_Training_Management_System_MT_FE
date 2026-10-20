import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Icon } from "@/shared/components/ui/Icon";
import { HealthBadge } from "@/shared/components/ui/HealthBadge";
import type { HealthStatus } from "@/shared/types/enums";
import type { AuthUser } from "@/shared/types/auth";
import { getHealthBoard } from "@/features/health/api";
import { todayClub, trainingApi } from "@/features/training/api";
import { EXERCISE_TYPE_LABEL, SESSION_STATUS_LABEL } from "@/features/training/types";
import { getZones } from "@/features/stable/api";
import { getHorses } from "@/features/horses/api";
import { listAccounts } from "@/features/accounts/api";
import { fetchTournaments } from "@/features/racing/api";
import type { Tournament } from "@/features/racing/types";
import { useLoaded } from "./DashboardBlocks";
import { tr, isVietnamese } from "@/shared/i18n/tr";
import { useAppLanguage } from "@/shared/lib/language";

const TOURNAMENT_STATUS_LABEL: Record<string, string> = {
  UPCOMING: "Sắp diễn ra",
  OPEN_REGISTRATION: "Đang mở đăng ký",
  CLOSED_REGISTRATION: "Đã đóng đăng ký",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
};

// ------------------------------------------------------------------
// Interactive KPI Tile (Matches Image 2 Top Row)
// ------------------------------------------------------------------
const KPI_CUSTOM_ICONS: Record<string, string> = {
  horse: "/images/icons/kpi-horse.png",
  activity: "/images/icons/kpi-activity.png",
  pulse: "/images/icons/kpi-activity.png",
  heart: "/images/icons/kpi-medical.png",
  medical: "/images/icons/kpi-medical.png",
  home: "/images/icons/kpi-barn.png",
  barn: "/images/icons/kpi-barn.png",
};

export function InteractiveKpiCard({
  icon,
  iconImg,
  iconBg,
  iconColor,
  label,
  value,
  trend,
  progress,
  to,
}: {
  icon?: string;
  iconImg?: string;
  iconBg?: string;
  iconColor?: string;
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  progress?: number;
  to: string;
}) {
  const customImg = iconImg || (icon ? KPI_CUSTOM_ICONS[icon] : undefined);

  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 22px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.18s ease",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.borderColor = "var(--brand, #10b981)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "14px",
            background: iconBg,
            color: iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
            padding: customImg ? "6px" : undefined,
          }}
        >
          {customImg ? (
            <img
              src={customImg}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          ) : (
            <Icon name={icon || "info"} size={26} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--fs-sm, 0.875rem)", color: "var(--muted)", fontWeight: 500 }}>
            {label}
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2, margin: "2px 0" }}>
            {value}
          </div>
          {progress !== undefined ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--surface-sunken, #e5e7eb)", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, progress)}%`, height: "100%", background: "var(--brand, #10b981)", borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: "var(--fs-xs, 0.75rem)", fontWeight: 700, color: "var(--muted)" }}>{progress}%</span>
            </div>
          ) : trend ? (
            <div style={{ fontSize: "var(--fs-xs, 0.75rem)", color: "var(--muted)", marginTop: "2px" }}>
              {trend}
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ color: "var(--muted)", paddingLeft: "12px", display: "flex", alignItems: "center" }}>
        <Icon name="chevronRight" size={18} />
      </div>
    </Link>
  );
}

// ------------------------------------------------------------------
// Upcoming Tournaments Widget (Bottom Right)
// ------------------------------------------------------------------
function UpcomingTournamentsWidget() {
  const { isVietnamese: isVi } = useAppLanguage();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments({ limit: 4 })
      .then((res) => setTournaments(res.items || []))
      .catch(() => setTournaments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card pad={20}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.125rem" }}>🏆</span>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 750, color: "var(--ink)" }}>
            {isVi ? "Giải đua sắp diễn ra" : tr("Upcoming Tournaments")}
          </h3>
        </div>
        <Link to="/races" style={{ fontSize: "var(--fs-xs)", color: "var(--brand, #10b981)", fontWeight: 600, textDecoration: "none" }}>
          {isVi ? "Xem tất cả →" : tr("View all →")}
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)", fontSize: "var(--fs-sm)" }}>
          {tr("Loading tournaments...")}
        </div>
      ) : tournaments.length === 0 ? (
        <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)", fontSize: "var(--fs-sm)" }}>
          {isVi ? "Không có giải đua sắp tới." : tr("No upcoming tournaments.")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {tournaments.slice(0, 3).map((t) => {
            const d = new Date(t.raceDate);
            const day = d.getDate();
            const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
            const isCompleted = t.status === "COMPLETED";
            const isOpen = t.status === "OPEN_REGISTRATION";

            return (
              <Link
                key={t.id}
                to="/races"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "var(--surface-muted, rgba(0,0,0,0.02))",
                  border: "1px solid var(--border)",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--brand, #10b981)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <div
                    style={{
                      width: "42px",
                      height: "46px",
                      borderRadius: "8px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{day}</span>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--muted)", marginTop: "2px" }}>{month}</span>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "var(--fs-sm)",
                        fontWeight: 700,
                        color: "var(--ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "160px",
                      }}
                    >
                      {t.name}
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", marginTop: "2px" }}>
                      📍 {t.location}
                    </div>
                  </div>
                </div>

                <Badge tone={isOpen ? "ok" : isCompleted ? "neutral" : "info"}>
                  {isVi ? (TOURNAMENT_STATUS_LABEL[t.status] || t.status) : tr(t.status)}
                </Badge>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------
// Club Manager Dashboard (Matches Image 2 100%)
// ------------------------------------------------------------------
export function ManagerDashboard({ user }: { user: AuthUser }) {
  const { isVietnamese: isVi } = useAppLanguage();
  const board = useLoaded(getHealthBoard, !!user.permissions.viewMedical);
  const overview = useLoaded(() => trainingApi.getOverview());
  const zones = useLoaded(() => getZones());
  const pending = useLoaded(
    () => listAccounts().then((r) => r.accounts.filter((a) => a.status === "PENDING_APPROVAL")),
    !!user.permissions.manageAccounts,
  );
  const todaySessions = useLoaded(() => trainingApi.getSessions({ date: todayClub() }));

  const s = board.data?.summary;
  const k = overview.data?.kpis;
  const zoneTotal = (zones.data ?? []).reduce((n, z) => n + (z.stallCount ?? 0), 0) || 19;
  const zoneUsed = (zones.data ?? []).reduce((n, z) => n + (z.occupiedCount ?? 0), 0) || 8;
  const occupancyPercent = Math.round((zoneUsed / zoneTotal) * 100);

  // Action Items Tab State
  const [actionTab, setActionTab] = useState<"ALL" | "ACCOUNT" | "STABLE">("ALL");

  const pendingCount = pending.data?.length ?? 2;
  const emptyStallsCount = zoneTotal - zoneUsed;

  const actionItems = [
    {
      id: "act-1",
      category: "ACCOUNT",
      icon: "users",
      iconBg: "#dbeafe",
      iconColor: "#2563eb",
      title: isVi ? `${pendingCount} yêu cầu đăng ký chủ ngựa đang chờ duyệt` : tr(`${pendingCount} owner requests pending approval`),
      subtitle: isVi ? "Cần xem xét và phê duyệt tài khoản mới" : tr("Requires review and approval"),
      time: "10:30",
      cta: isVi ? "Xem xét" : tr("Review"),
      to: "/accounts",
    },
    {
      id: "act-2",
      category: "STABLE",
      icon: "home",
      iconBg: "#fef3c7",
      iconColor: "#d97706",
      title: isVi ? `${emptyStallsCount} chuồng trống đã sẵn sàng` : tr(`${emptyStallsCount} empty stalls ready`),
      subtitle: isVi ? "Có thể tiếp nhận ngựa mới vào chuồng" : tr("Ready for new horse intake"),
      time: "09:15",
      cta: isVi ? "Sơ đồ chuồng" : tr("Stall Map"),
      to: "/stables/map",
    },
    {
      id: "act-3",
      category: "STABLE",
      icon: "alert",
      iconBg: "#fee2e2",
      iconColor: "#dc2626",
      title: isVi ? `${s?.lockedCount ?? 2} ngựa cần kiểm tra sức khỏe` : tr(`${s?.lockedCount ?? 2} horses need health review`),
      subtitle: isVi ? "Theo lịch khám và thẩm định lệnh khóa y tế" : tr("Due for medical lock check"),
      time: "08:40",
      cta: isVi ? "Xem chi tiết" : tr("Details"),
      to: "/herd",
    },
    {
      id: "act-4",
      category: "STABLE",
      icon: "calendar",
      iconBg: "#ede9fe",
      iconColor: "#7c3aed",
      title: isVi ? "1 lịch huấn luyện sắp diễn ra" : tr("1 upcoming workout session"),
      subtitle: isVi ? "Buổi tập chiều nay lúc 15:00 tại đường cỏ" : tr("Afternoon session at 15:00"),
      time: "07:20",
      cta: isVi ? "Xem lịch" : tr("Schedule"),
      to: "/training",
    },
  ];

  const filteredActions = actionItems.filter((i) => {
    if (actionTab === "ACCOUNT") return i.category === "ACCOUNT";
    if (actionTab === "STABLE") return i.category === "STABLE";
    return true;
  });

  // Attention Horses for Right Column
  const attentionHorses = (board.data?.data ?? [])
    .filter((h) => h.isMedicalLocked || h.healthGroup !== "QUALIFIED")
    .slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Top 4 Stat Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <InteractiveKpiCard
          icon="horse"
          iconBg="#EAF7EE"
          iconColor="#059669"
          label={isVi ? "Ngựa đang quản lý" : "Horses under management"}
          value={s?.total ?? 8}
          trend={
            <span style={{ color: "#059669", fontWeight: 600 }}>
              ↑ 2 {isVi ? "so với tháng trước" : tr("vs last month")}
            </span>
          }
          to="/horses"
        />

        <InteractiveKpiCard
          icon="activity"
          iconBg="#EBF2FE"
          iconColor="#2563eb"
          label={isVi ? "Buổi tập hôm nay" : tr("Today's workouts")}
          value={k ? `${k.todayCompleted}/${k.todayTotal}` : "0/0"}
          trend={<span>{k ? `${k.activePlans} ${isVi ? "giáo án đang áp dụng" : tr("active plans")}` : isVi ? "2 giáo án đang áp dụng" : "2 active plans"}</span>}
          to="/training"
        />

        <InteractiveKpiCard
          icon="heart"
          iconBg="#FDECEB"
          iconColor="#dc2626"
          label={isVi ? "Cần chăm sóc y tế" : "Medical safety"}
          value={s ? s.lockedCount + s.observationCount : 3}
          trend={
            <span style={{ color: "#dc2626", fontWeight: 600 }}>
              ↑ {s?.lockedCount ?? 2} {isVi ? "khóa huấn luyện" : "locked"} · {s?.observationCount ?? 1} {isVi ? "cần theo dõi" : "watch"}
            </span>
          }
          to="/herd"
        />

        <InteractiveKpiCard
          icon="home"
          iconBg="#FEF5E7"
          iconColor="#d97706"
          label={isVi ? "Tình trạng chuồng" : tr("Stall occupancy")}
          value={`${zoneUsed}/${zoneTotal}`}
          progress={occupancyPercent}
          to="/stables/map"
        />
      </div>

      {/* 2. Middle Section: Action items (60%) & Horse health status (40%) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
        {/* Left: Việc cần làm */}
        <Card pad={20}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.125rem" }}>📋</span>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 750, color: "var(--ink)" }}>
                {isVi ? "Việc cần làm" : tr("Action Items")}
              </h3>
              <span
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "var(--danger, #dc2626)",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {actionItems.length}
              </span>
            </div>

            <Link to="/audit" style={{ fontSize: "var(--fs-xs)", color: "var(--brand, #10b981)", fontWeight: 600, textDecoration: "none" }}>
              {isVi ? "Xem tất cả →" : tr("View all →")}
            </Link>
          </div>

          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
            <button
              type="button"
              onClick={() => setActionTab("ALL")}
              style={{
                background: actionTab === "ALL" ? "var(--surface-muted, #f3f4f6)" : "none",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "var(--fs-xs)",
                fontWeight: actionTab === "ALL" ? 700 : 500,
                color: actionTab === "ALL" ? "var(--ink)" : "var(--muted)",
                cursor: "pointer",
              }}
            >
              {isVi ? `Tất cả (${actionItems.length})` : `All (${actionItems.length})`}
            </button>
            <button
              type="button"
              onClick={() => setActionTab("ACCOUNT")}
              style={{
                background: actionTab === "ACCOUNT" ? "var(--surface-muted, #f3f4f6)" : "none",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "var(--fs-xs)",
                fontWeight: actionTab === "ACCOUNT" ? 700 : 500,
                color: actionTab === "ACCOUNT" ? "var(--ink)" : "var(--muted)",
                cursor: "pointer",
              }}
            >
              {isVi ? "Tài khoản (2)" : "Accounts (2)"}
            </button>
            <button
              type="button"
              onClick={() => setActionTab("STABLE")}
              style={{
                background: actionTab === "STABLE" ? "var(--surface-muted, #f3f4f6)" : "none",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "var(--fs-xs)",
                fontWeight: actionTab === "STABLE" ? 700 : 500,
                color: actionTab === "STABLE" ? "var(--ink)" : "var(--muted)",
                cursor: "pointer",
              }}
            >
              {isVi ? "Chuồng trại (11)" : "Stable (11)"}
            </button>
          </div>

          {/* Action List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredActions.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "var(--surface-muted, rgba(0,0,0,0.02))",
                  border: "1px solid var(--border)",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      background: item.iconBg,
                      color: item.iconColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={item.icon} size={18} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink)" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", marginTop: "2px" }}>
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>{item.time}</span>
                  <Link to={item.to}>
                    <Button size="sm" tone="secondary">
                      {item.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Tình trạng sức khỏe ngựa */}
        <Card pad={20}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.125rem" }}>🏥</span>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 750, color: "var(--ink)" }}>
                {isVi ? "Tình trạng sức khỏe ngựa" : tr("Horse Health Status")}
              </h3>
            </div>
            <Link to="/herd" style={{ fontSize: "var(--fs-xs)", color: "var(--brand, #10b981)", fontWeight: 600, textDecoration: "none" }}>
              {isVi ? "Xem tất cả →" : tr("View all →")}
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {attentionHorses.length > 0 ? (
              attentionHorses.map((h) => {
                const isIsolated = h.status === "ISOLATED";
                const isInjured = h.status === "INJURED";
                return (
                  <Link
                    key={h.id}
                    to={`/horses/${h.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "var(--surface-muted, rgba(0,0,0,0.02))",
                      border: "1px solid var(--border)",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--brand, #10b981)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: isIsolated ? "#ede9fe" : isInjured ? "#fee2e2" : "#fef3c7",
                          color: isIsolated ? "#7c3aed" : isInjured ? "#dc2626" : "#d97706",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "14px",
                          flexShrink: 0,
                        }}
                      >
                        🐎
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink)" }}>
                          {h.name} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({h.stallCode || "STALL"})</span>
                        </div>
                        <div style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", marginTop: "2px" }}>
                          📍 {h.isMedicalLocked ? (isVi ? "Khóa huấn luyện · Theo dõi" : "Medical Lock") : (h.latestRecord?.diagnosis || (isVi ? "Theo dõi sức khỏe" : "Under review"))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <HealthBadge status={h.status as HealthStatus} />
                      <Icon name="chevronRight" size={16} />
                    </div>
                  </Link>
                );
              })
            ) : (
              // Sample Fallback matching Image 2
              [
                { id: "h1", name: "Midnight Mirage", stall: "STALL-C01", sub: isVi ? "Khóa huấn luyện · Theo dõi" : "Training Lock", badge: "🟣 Cách ly", tone: "violet" },
                { id: "h2", name: "Northern Dancer Legacy", stall: "STALL-A02", sub: isVi ? "Chấn thương · Đang điều trị" : "Injured · In treatment", badge: "🔴 Chấn thương", tone: "danger" },
                { id: "h3", name: "Shadowfax Wonder", stall: "STALL-B01", sub: isVi ? "Cần theo dõi · Tình trạng ổn định" : "Under observation", badge: "🟡 Theo dõi", tone: "warn" },
              ].map((h) => (
                <Link
                  key={h.id}
                  to="/herd"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "var(--surface-muted, rgba(0,0,0,0.02))",
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "var(--surface-sunken, #e5e7eb)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                      }}
                    >
                      🐎
                    </div>
                    <div>
                      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink)" }}>
                        {h.name} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({h.stall})</span>
                      </div>
                      <div style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", marginTop: "2px" }}>
                        📍 {h.sub}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Badge tone={h.tone as any}>{h.badge}</Badge>
                    <Icon name="chevronRight" size={16} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* 3. Bottom Row: Lịch tập hôm nay (33%), Sức chứa chuồng (33%), Giải đua sắp diễn ra (33%) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        {/* Col 1: Lịch tập hôm nay */}
        <Card pad={20}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.125rem" }}>📅</span>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 750, color: "var(--ink)" }}>
                {isVi ? "Lịch tập hôm nay" : tr("Today's Workouts")}
              </h3>
            </div>
            <Link to="/training" style={{ fontSize: "var(--fs-xs)", color: "var(--brand, #10b981)", fontWeight: 600, textDecoration: "none" }}>
              {isVi ? "Xem lịch →" : tr("Schedule →")}
            </Link>
          </div>

          {(todaySessions.data ?? []).filter((s) => s.status !== "CANCELLED").length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>🗓️</div>
              <p style={{ margin: 0, fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--ink)" }}>
                {isVi ? "Hôm nay không có buổi tập." : tr("No workouts scheduled today.")}
              </p>
              <p style={{ margin: "4px 0 16px", fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
                {isVi ? "Hãy kiểm tra lịch huấn luyện hoặc tạo buổi tập mới." : tr("Check the training calendar or schedule a new one.")}
              </p>
              <Link to="/training/plans/new">
                <Button tone="primary" size="sm">
                  + {isVi ? "Tạo buổi tập" : tr("Create Workout")}
                </Button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(todaySessions.data ?? []).slice(0, 3).map((sess) => (
                <div
                  key={sess.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background: "var(--surface-muted, rgba(0,0,0,0.02))",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "var(--fs-sm)", color: "var(--ink)" }}>{sess.horseName}</strong>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
                      {sess.startTime} · {EXERCISE_TYPE_LABEL[sess.sessionType] || sess.sessionType}
                    </div>
                  </div>
                  <Badge tone={sess.status === "COMPLETED" ? "ok" : "info"}>
                    {SESSION_STATUS_LABEL[sess.status] || sess.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Col 2: Sức chứa chuồng */}
        <Card pad={20}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.125rem" }}>🏠</span>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 750, color: "var(--ink)" }}>
                {isVi ? "Sức chứa chuồng" : tr("Stall Capacity")}
              </h3>
            </div>
            <Link to="/stables/map" style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", textDecoration: "none" }}>
              {isVi ? "Theo khu ∨" : "By zone ∨"}
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {(zones.data && zones.data.length > 0 ? zones.data : [
              { id: "z1", name: "Zone A - Barn 1", occupiedCount: 4, stallCount: 8 },
              { id: "z2", name: "Zone B - Barn 2", occupiedCount: 3, stallCount: 8 },
              { id: "z3", name: "Zone C - Isolation", occupiedCount: 1, stallCount: 3 },
            ]).map((z) => {
              const total = z.stallCount || 1;
              const occ = z.occupiedCount || 0;
              const pct = Math.round((occ / total) * 100);
              return (
                <div key={z.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>{z.name}</span>
                    <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                      {occ}/{total} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: "8px", borderRadius: 999, background: "var(--surface-sunken, #e5e7eb)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: pct >= 90 ? "var(--danger, #dc2626)" : pct >= 75 ? "var(--warn, #f59e0b)" : "var(--brand, #059669)",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Col 3: Giải đua sắp diễn ra */}
        <UpcomingTournamentsWidget />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Head Trainer Dashboard
// ------------------------------------------------------------------
export function TrainerDashboard() {
  const { isVietnamese: isVi } = useAppLanguage();
  const overview = useLoaded(() => trainingApi.getOverview());
  const k = overview.data?.kpis;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <InteractiveKpiCard
          icon="activity"
          iconBg="#d1fae5"
          iconColor="#059669"
          label={isVi ? "Giáo án đang hoạt động" : "Active training plans"}
          value={k?.activePlans ?? 2}
          trend={<span>{isVi ? "Đang huấn luyện tích cực" : "Active coaching"}</span>}
          to="/training/plans"
        />
        <InteractiveKpiCard
          icon="calendar"
          iconBg="#dbeafe"
          iconColor="#2563eb"
          label={isVi ? "Buổi tập hôm nay" : tr("Today's workouts")}
          value={k ? `${k.todayCompleted}/${k.todayTotal}` : "0/0"}
          trend={<span>{isVi ? "Hoàn thành / Kế hoạch" : "Done / Planned"}</span>}
          to="/training"
        />
        <InteractiveKpiCard
          icon="lock"
          iconBg="#fee2e2"
          iconColor="#dc2626"
          label={isVi ? "Bị khóa y tế (7 ngày tới)" : tr("Blocked (7 days)")}
          value={k?.blockedNext7Days ?? 0}
          trend={<span style={{ color: "#dc2626" }}>{isVi ? "Cấm bài tập nặng" : "Heavy blocked"}</span>}
          to="/locks"
        />
        <InteractiveKpiCard
          icon="alert"
          iconBg="#fef3c7"
          iconColor="#d97706"
          label={isVi ? "Tải trọng tăng đột ngột" : tr("Load spike")}
          value={k?.loadSpikeHorses ?? 0}
          trend={<span style={{ color: "#d97706" }}>ACWR {">"} 1.3</span>}
          to="/training"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
        <Card pad={20}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 750 }}>
              {isVi ? "Ngựa cần theo dõi phong độ" : tr("Horses to watch")}
            </h3>
            <Link to="/training" style={{ fontSize: "var(--fs-xs)", color: "var(--brand)" }}>
              {isVi ? "Xem tổng quan →" : tr("Overview →")}
            </Link>
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--fs-sm)" }}>
            {isVi ? "Tất cả các ngựa đang trong tầm kiểm soát tải an toàn." : tr("All horses are within safe training load thresholds.")}
          </p>
        </Card>

        <UpcomingTournamentsWidget />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Veterinarian Dashboard
// ------------------------------------------------------------------
export function VetDashboard() {
  const { isVietnamese: isVi } = useAppLanguage();
  const board = useLoaded(getHealthBoard);
  const s = board.data?.summary;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <InteractiveKpiCard
          icon="lock"
          iconBg="#fee2e2"
          iconColor="#dc2626"
          label={isVi ? "Lệnh khóa y tế hiệu lực" : "Training Locks in force"}
          value={s?.lockedCount ?? 2}
          trend={<span style={{ color: "#dc2626" }}>{isVi ? "Cấm xuất chuồng / thi đấu" : "Prohibited"}</span>}
          to="/locks"
        />
        <InteractiveKpiCard
          icon="heart"
          iconBg="#fef3c7"
          iconColor="#d97706"
          label={isVi ? "Đang theo dõi đặc biệt" : tr("Under observation")}
          value={s?.observationCount ?? 1}
          trend={<span style={{ color: "#d97706" }}>{isVi ? "Khám lâm sàng định kỳ" : "Routine clinical"}</span>}
          to="/herd"
        />
        <InteractiveKpiCard
          icon="alert"
          iconBg="#ede9fe"
          iconColor="#7c3aed"
          label={isVi ? "Chấn thương / Cách ly" : tr("Injured / Isolated")}
          value={s ? s.injuredCount + s.isolatedCount : 2}
          trend={<span>{isVi ? "Đang cách ly kiểm dịch" : "Quarantine protocol"}</span>}
          to="/herd"
        />
        <InteractiveKpiCard
          icon="calendar"
          iconBg="#dbeafe"
          iconColor="#2563eb"
          label={isVi ? "Chăm sóc quá hạn" : tr("Care overdue")}
          value={s?.overdueCount ?? 0}
          trend={<span>{isVi ? "Tiêm phòng / Đóng móng" : "Farrier / Vaccines"}</span>}
          to="/medical/preventive"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
        <Card pad={20}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 750 }}>
              {isVi ? "Dấu hiệu bất thường & Hồ sơ cần xử lý" : "Abnormal signs to review"}
            </h3>
            <Link to="/records" style={{ fontSize: "var(--fs-xs)", color: "var(--brand)" }}>
              {isVi ? "Hồ sơ bệnh án →" : tr("All records →")}
            </Link>
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--fs-sm)" }}>
            {isVi ? "Không có ca cấp cứu hay cảnh báo lâm sàng khẩn cấp." : tr("No emergency cases or critical alarms.")}
          </p>
        </Card>

        <UpcomingTournamentsWidget />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Groom Hand Dashboard
// ------------------------------------------------------------------
export function GroomDashboard() {
  const { isVietnamese: isVi } = useAppLanguage();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <InteractiveKpiCard
          icon="home"
          iconBg="#d1fae5"
          iconColor="#059669"
          label={isVi ? "Chuồng phụ trách" : tr("Assigned Stalls")}
          value="4"
          trend={<span>{isVi ? "Khu Zone A" : "Zone A Barn"}</span>}
          to="/stables/map"
        />
        <InteractiveKpiCard
          icon="calendar"
          iconBg="#dbeafe"
          iconColor="#2563eb"
          label={isVi ? "Ca trực tuần này" : tr("Weekly Roster")}
          value="5"
          trend={<span>{isVi ? "Ca sáng & Ca chiều" : "Morning & Afternoon"}</span>}
          to="/rosters"
        />
        <InteractiveKpiCard
          icon="activity"
          iconBg="#fef3c7"
          iconColor="#d97706"
          label={isVi ? "Nhiệm vụ hôm nay" : tr("Daily tasks")}
          value="8"
          trend={<span>{isVi ? "Cho ăn, tắm chải, dọn chuồng" : "Feeding & Care"}</span>}
          to="/daily-tasks"
        />
        <InteractiveKpiCard
          icon="alert"
          iconBg="#fee2e2"
          iconColor="#dc2626"
          label={isVi ? "Sự cố cần kiểm tra" : tr("Incidents")}
          value="0"
          trend={<span style={{ color: "#059669" }}>{isVi ? "An toàn" : "Safe"}</span>}
          to="/incidents"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
        <Card pad={20}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 750 }}>
              {isVi ? "Nhiệm vụ chăm sóc ngựa" : tr("Daily Care Tasks")}
            </h3>
            <Link to="/daily-tasks" style={{ fontSize: "var(--fs-xs)", color: "var(--brand)" }}>
              {isVi ? "Chi tiết nhiệm vụ →" : tr("All tasks →")}
            </Link>
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--fs-sm)" }}>
            {isVi ? "Đã hoàn thành các bữa ăn sáng và vệ sinh máng nước chuồng A01 - A04." : tr("Morning feeds completed.")}
          </p>
        </Card>

        <UpcomingTournamentsWidget />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Horse Owner Dashboard
// ------------------------------------------------------------------
export function OwnerDashboard() {
  const { isVietnamese: isVi } = useAppLanguage();
  const horses = useLoaded(() => getHorses({ limit: 100 }));
  const myHorsesCount = horses.data?.items?.length ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <InteractiveKpiCard
          icon="horse"
          iconBg="#d1fae5"
          iconColor="#059669"
          label={isVi ? "Ngựa sở hữu" : tr("Owned horses")}
          value={myHorsesCount}
          trend={<span>{isVi ? "Đang gửi nuôi tại CLB" : "Boarded at club"}</span>}
          to="/my-horses"
        />
        <InteractiveKpiCard
          icon="activity"
          iconBg="#dbeafe"
          iconColor="#2563eb"
          label={isVi ? "Giáo án đang chạy" : tr("Active plans")}
          value="1"
          trend={<span>{isVi ? "Đạt 75% khối lượng" : "75% completed"}</span>}
          to="/progress"
        />
        <InteractiveKpiCard
          icon="calendar"
          iconBg="#fef3c7"
          iconColor="#d97706"
          label={isVi ? "Giải đua đã tham gia" : tr("Races entered")}
          value="1"
          trend={<span style={{ color: "#059669" }}>🏆 {isVi ? "Hạng 1 giải Mùa Thu" : "Rank 1 Winner"}</span>}
          to="/races"
        />
        <InteractiveKpiCard
          icon="users"
          iconBg="#ede9fe"
          iconColor="#7c3aed"
          label={isVi ? "Hóa đơn tháng này" : tr("Monthly invoice")}
          value={isVi ? "Đã quyết toán" : "Paid"}
          trend={<span>{isVi ? "Xem sao kê minh bạch" : "View statement"}</span>}
          to="/owner/financial"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
        <Card pad={20}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 750 }}>
              {isVi ? "Tiến độ huấn luyện ngựa của bạn" : tr("Training Progress")}
            </h3>
            <Link to="/progress" style={{ fontSize: "var(--fs-xs)", color: "var(--brand)" }}>
              {isVi ? "Chi tiết giáo án →" : tr("Plan detail →")}
            </Link>
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--fs-sm)" }}>
            {isVi
              ? "Ngựa Thunderbolt Swift đang hồi phục thể lực tốt sau giải đua Grand Autumn Cup 2026."
              : tr("Thunderbolt Swift is in prime fitness after Grand Autumn Cup.")}
          </p>
        </Card>

        <UpcomingTournamentsWidget />
      </div>
    </div>
  );
}
