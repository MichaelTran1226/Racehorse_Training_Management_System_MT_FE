import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import { isVietnamese } from "@/shared/i18n/tr";
import type { AuthUser } from "@/shared/types/auth";

interface DashboardHeroBannerProps {
  user: AuthUser;
}

interface HeroSlide {
  id: string;
  image: string;
  tagVi: string;
  tagEn: string;
  iconName: string;
  badgeVi: string;
  badgeEn: string;
  focusPosition: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "racing",
    image: "/images/hero/hero-racing.jpg",
    tagVi: "Đua Ngựa Tốc Độ",
    tagEn: "Championship Racing",
    iconName: "trophy",
    badgeVi: "Đấu Trường & Thành Tích",
    badgeEn: "Championship Arena",
    focusPosition: "center 42%",
  },
  {
    id: "stables",
    image: "/images/hero/hero-stables.png",
    tagVi: "Chuồng Trại & Y Tế",
    tagEn: "Equine Care & Wellness",
    iconName: "heart",
    badgeVi: "Chăm Sóc & Chuồng Trại Chuẩn Quốc Tế",
    badgeEn: "World-Class Stables & Care",
    focusPosition: "right 28%",
  },
  {
    id: "jumping",
    image: "/images/hero/hero-jumping.jpg",
    tagVi: "Huấn Luyện Vượt Rào",
    tagEn: "Show Jumping",
    iconName: "flag",
    badgeVi: "Kỷ Luật & Bứt Phá",
    badgeEn: "Discipline & Precision",
    focusPosition: "center 32%",
  },
];

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

  // Carousel State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const handlePrev = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  // Auto-advance every 6.5 seconds, paused on user hover or reduced motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) return;
    }

    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const currentSlide = HERO_SLIDES[currentSlideIndex];

  return (
    <div
      role="region"
      aria-label={isVi ? "Biểu ngữ giới thiệu câu lạc bộ" : "Club Hero Banner"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
        padding: "26px 32px 20px",
        background: "linear-gradient(135deg, rgba(4, 47, 36, 0.98) 0%, rgba(2, 44, 34, 0.99) 100%)",
        color: "#ffffff",
        boxShadow: "0 10px 25px -5px rgba(6, 78, 59, 0.35), 0 8px 10px -6px rgba(6, 78, 59, 0.25)",
        minHeight: "210px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "1.25rem",
      }}
    >
      {/* Background Image Carousel Layers with Ken Burns and Crossfade */}
      {HERO_SLIDES.map((slide, index) => {
        const isActive = index === currentSlideIndex;
        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${slide.image})`,
              backgroundPosition: slide.focusPosition,
              backgroundSize: "cover",
              opacity: isActive ? 0.62 : 0,
              transform: isActive ? "scale(1.03)" : "scale(1.0)",
              transition:
                "opacity 1000ms cubic-bezier(0.4, 0, 0.2, 1), transform 6500ms cubic-bezier(0.25, 1, 0.5, 1)",
              pointerEvents: "none",
              willChange: "opacity, transform",
            }}
          />
        );
      })}

      {/* Layer 1: Left-to-Right Deep Emerald Gradient for Text Contrast */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(4, 47, 36, 0.96) 0%, rgba(4, 47, 36, 0.88) 38%, rgba(6, 78, 59, 0.52) 72%, rgba(6, 78, 59, 0.2) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Layer 2: Bottom Subtle Vignette for Controls Legibility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(0deg, rgba(2, 44, 34, 0.8) 0%, rgba(2, 44, 34, 0.25) 30%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Main Content (Header & Info) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "700px" }}>
          {/* Tag Bar: Club Badge & Active Scene Tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            {/* Club Tag */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.14)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(110, 231, 183, 0.35)",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#6ee7b7",
              }}
            >
              <Icon name="horse" size={14} />
              <span>THIÊN MÃ EQUESTRIAN CLUB</span>
            </div>

            {/* Dynamic Scene Tag */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "999px",
                background: "rgba(6, 78, 59, 0.65)",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "#a7f3d0",
                transition: "all 400ms ease",
              }}
            >
              <Icon name={currentSlide.iconName} size={12} />
              <span>{isVi ? currentSlide.tagVi : currentSlide.tagEn}</span>
            </div>
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
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            {isVi ? `Chào mừng trở lại, ${user.fullName}!` : `Welcome back, ${user.fullName}!`}
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: "0.9375rem",
              color: "rgba(255, 255, 255, 0.9)",
              lineHeight: 1.5,
              textShadow: "0 1px 4px rgba(0, 0, 0, 0.25)",
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
            background: "rgba(255, 255, 255, 0.09)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
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
              color: "rgba(255, 255, 255, 0.7)",
              marginTop: "2px",
            }}
          >
            {isVi ? "Giờ chuẩn CLB (GMT+7)" : "Club Standard Time (GMT+7)"}
          </div>
        </div>
      </div>

      {/* Bottom Carousel Controls Bar */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          paddingTop: "6px",
        }}
      >
        {/* Indicators & Current Scene Caption */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {/* Indicators */}
          <div
            role="tablist"
            aria-label={isVi ? "Chọn trang ảnh nền" : "Select hero slide"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {HERO_SLIDES.map((slide, idx) => {
              const isActive = idx === currentSlideIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${isVi ? "Xem ảnh" : "View"} ${isVi ? slide.tagVi : slide.tagEn}`}
                  onClick={() => setCurrentSlideIndex(idx)}
                  style={{
                    height: "8px",
                    width: isActive ? "26px" : "8px",
                    borderRadius: "4px",
                    background: isActive ? "#34d399" : "rgba(255, 255, 255, 0.35)",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: isActive ? "0 0 10px rgba(52, 211, 153, 0.6)" : "none",
                  }}
                />
              );
            })}
          </div>

          {/* Scene Name & Counter */}
          <span
            style={{
              fontSize: "0.75rem",
              color: "rgba(255, 255, 255, 0.8)",
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ color: "#6ee7b7", fontWeight: 700 }}>
              {currentSlideIndex + 1}/{HERO_SLIDES.length}
            </span>{" "}
            • {isVi ? currentSlide.badgeVi : currentSlide.badgeEn}
          </span>
        </div>

        {/* Prev & Next Navigation Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <button
            type="button"
            aria-label={isVi ? "Ảnh trước" : "Previous slide"}
            onClick={handlePrev}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              cursor: "pointer",
              transition: "all 200ms ease",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
              e.currentTarget.style.borderColor = "rgba(110, 231, 183, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
            }}
          >
            <Icon name="chevronLeft" size={14} />
          </button>

          <button
            type="button"
            aria-label={isVi ? "Ảnh kế tiếp" : "Next slide"}
            onClick={handleNext}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              cursor: "pointer",
              transition: "all 200ms ease",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
              e.currentTarget.style.borderColor = "rgba(110, 231, 183, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
            }}
          >
            <Icon name="chevronRight" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
