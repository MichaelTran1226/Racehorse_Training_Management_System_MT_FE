import { Icon } from "@/shared/components/ui/Icon";
import { isVietnamese } from "@/shared/i18n/tr";
import type { AuthUser } from "@/shared/types/auth";

interface DashboardHeroBannerProps {
  user: AuthUser;
}

export function DashboardHeroBanner({ user }: DashboardHeroBannerProps) {
  const isVi = isVietnamese();
  const now = new Date();

  // Always synchronized to Vietnam Club time (Asia/Ho_Chi_Minh)
  const weekdayStr = new Intl.DateTimeFormat(isVi ? "vi-VN" : "en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
  }).format(now);

  const dateStr = new Intl.DateTimeFormat(isVi ? "vi-VN" : "en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "numeric",
    month: isVi ? "long" : "short",
    year: "numeric",
  }).format(now);

  const formattedWeekday = weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1);

  const SUBTITLE_BY_ROLE: Record<string, { vi: string; en: string }> = {
    CLUB_MANAGER: {
      vi: "Quản lý ngựa, huấn luyện, an toàn y tế và sức chứa chuồng trại hiệu quả.",
      en: "Efficiently manage horses, training schedules, medical safety, and stable capacity.",
    },
    HEAD_TRAINER: {
      vi: "Chỉ đạo giáo án huấn luyện, kiểm soát cường độ tập luyện và phát hiện dấu hiệu bất thường.",
      en: "Oversee training plans, monitor workout loads, and track recovery markers.",
    },
    VETERINARIAN: {
      vi: "Giám sát sức khỏe đàn ngựa, thẩm định lệnh khóa y tế và quản lý lịch chăm sóc phòng ngừa.",
      en: "Monitor herd health, evaluate medical locks, and manage preventive care schedules.",
    },
    GROOM: {
      vi: "Theo dõi nhiệm vụ chăm sóc chuồng trại, phân công ca trực và hỗ trợ ngựa luyện tập.",
      en: "Execute daily barn care tasks, follow shift rosters, and support horse wellness.",
    },
    HORSE_OWNER: {
      vi: "Theo dõi chỉ số thể lực, tiến độ thi đấu của ngựa và sao kê chi phí hàng tháng minh bạch.",
      en: "Track your horses' training progress, racing entries, and financial statements.",
    },
  };

  const subtitle = SUBTITLE_BY_ROLE[user.role]
    ? isVi
      ? SUBTITLE_BY_ROLE[user.role].vi
      : SUBTITLE_BY_ROLE[user.role].en
    : isVi
    ? "Hệ thống quản lý chuồng trại & huấn luyện ngựa đua EquiFlow."
    : "EquiFlow racehorse management & training platform.";

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
        padding: "26px 32px",
        background: "linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(2, 44, 34, 0.98) 100%)",
        color: "#ffffff",
        boxShadow: "0 10px 25px -5px rgba(6, 78, 59, 0.25), 0 8px 10px -6px rgba(6, 78, 59, 0.2)",
      }}
    >
      {/* Background Image Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/equine-editorial.webp)",
          backgroundPosition: "center 30%",
          backgroundSize: "cover",
          opacity: 0.18,
          mixBlendMode: "luminosity",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "700px" }}>
          {/* Club Tag */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(4px)",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#6ee7b7",
              marginBottom: "10px",
            }}
          >
            <Icon name="horse" size={14} />
            <span>THIÊN MÃ EQUESTRIAN CLUB</span>
          </div>

          {/* Welcome Greeting */}
          <h1
            style={{
              margin: 0,
              fontSize: "1.65rem",
              fontWeight: 800,
              lineHeight: 1.25,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            {isVi ? `Chào mừng trở lại, ${user.fullName}!` : `Welcome back, ${user.fullName}!`}
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: "0.9375rem",
              color: "rgba(255, 255, 255, 0.85)",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Live Synchronized Vietnam Club Date */}
        <div
          style={{
            textAlign: "right",
            padding: "12px 20px",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <div
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#a7f3d0",
              textTransform: "capitalize",
            }}
          >
            {formattedWeekday}
          </div>
          <div
            style={{
              fontSize: "1.125rem",
              fontWeight: 800,
              color: "#ffffff",
              marginTop: "2px",
            }}
          >
            {dateStr}
          </div>
          <div
            style={{
              fontSize: "0.6875rem",
              color: "rgba(255, 255, 255, 0.65)",
              marginTop: "2px",
            }}
          >
            {isVi ? "Giờ chuẩn CLB (GMT+7)" : "Club Standard Time (GMT+7)"}
          </div>
        </div>
      </div>
    </div>
  );
}
