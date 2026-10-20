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
    badgeVi: "Đấu Trường & Thành Tích Đua Ngựa",
    badgeEn: "Championship Thoroughbred Sprint",
    // Focus on the lead racehorses and sprinting jockeys on the right
    focusPosition: "right 36%",
  },
  {
    id: "stables",
    image: "/images/hero/hero-stables.png",
    tagVi: "Chuồng Trại & Y Tế",
    tagEn: "Equine Care & Stables",
    iconName: "heart",
    badgeVi: "Chăm Sóc & Chuồng Trại Quốc Tế",
    badgeEn: "World-Class Equine Care & Stables",
    // Focus directly on the chestnut horse's head, eye, ears, white blaze and halter
    focusPosition: "88% 28%",
  },
  {
    id: "jumping",
    image: "/images/hero/hero-jumping.jpg",
    tagVi: "Huấn Luyện Vượt Rào",
    tagEn: "Show Jumping",
    iconName: "flag",
    badgeVi: "Huấn Luyện Vượt Rào Thể Thao",
    badgeEn: "Equestrian Show Jumping & Training",
    // Focus directly on the rider in helmet/jacket and the leaping horse with ears forward
    focusPosition: "52% 14%",
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
      en: "Efficiently manage horses, training schedules, medical safety, and stable capacity.",
      vi: "Quản lý ngựa, huấn luyện, an toàn y tế và sức chứa chuồng trại hiệu quả.",
    },
    HEAD_TRAINER: {
      en: "Oversee training plans, monitor workout loads, and track recovery markers.",
      vi: "Chỉ đạo giáo án huấn luyện, kiểm soát cường độ tập luyện và phát hiện dấu hiệu bất thường.",
    },
    VETERINARIAN: {
      en: "Monitor herd health, evaluate medical locks, and manage preventive care schedules.",
      vi: "Giám sát sức khỏe đàn ngựa, thẩm định lệnh khóa y tế và quản lý lịch chăm sóc phòng ngừa.",
    },
    GROOM: {
      en: "Execute daily barn care tasks, follow shift rosters, and support horse wellness.",
      vi: "Theo dõi nhiệm vụ chăm sóc chuồng trại, phân công ca trực và hỗ trợ ngựa luyện tập.",
    },
    HORSE_OWNER: {
      en: "Track your horses' training progress, racing entries, and financial statements.",
      vi: "Theo dõi chỉ số thể lực, tiến độ thi đấu của ngựa và sao kê chi phí hàng tháng minh bạch.",
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

  // Auto-advance every 6.5 seconds, paused on hover or reduced motion
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
        padding: "28px 36px 24px",
        background: "linear-gradient(135deg, #032b1f 0%, #02241a 100%)",
        color: "#ffffff",
        boxShadow: "0 12px 30px -6px rgba(2, 36, 26, 0.4), 0 6px 14px -4px rgba(2, 36, 26, 0.25)",
        minHeight: "270px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* 1. Right Showcase Photo Area: 65% width, 100% full vibrant color, no green tint over horses */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "66%",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
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
                backgroundRepeat: "no-repeat",
                opacity: isActive ? 1 : 0,
                transform: isActive ? "scale(1.02)" : "scale(1.0)",
                transition: "opacity 850ms cubic-bezier(0.4, 0, 0.2, 1), transform 6000ms ease-out",
                willChange: "opacity, transform",
              }}
            />
          );
        })}

        {/* Soft Feathered Blend: Left edge transitions smoothly into solid emerald card */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, #032b1f 0%, rgba(3, 43, 31, 0.95) 12%, rgba(3, 43, 31, 0.4) 30%, transparent 55%)",
            pointerEvents: "none",
          }}
        />

        {/* Subtle Top & Bottom edge soft shade */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(3, 43, 31, 0.3) 0%, transparent 20%, transparent 80%, rgba(2, 36, 26, 0.5) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* 2. Left Content Section: Pure, high-contrast, uncluttered typography */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          maxWidth: "540px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* Badges Bar: Club Badge & Scene Tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
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
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(110, 231, 183, 0.3)",
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
              background: "rgba(6, 78, 59, 0.75)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
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
            fontSize: "1.75rem",
            fontWeight: 800,
            lineHeight: 1.25,
            color: "#ffffff",
            letterSpacing: "-0.025em",
            textShadow: "0 2px 6px rgba(0, 0, 0, 0.4)",
          }}
        >
          {isVi ? `Chào mừng trở lại, ${user.fullName}!` : `Welcome back, ${user.fullName}!`}
        </h1>

        {/* Role-Specific Subtitle */}
        <p
          style={{
            margin: 0,
            fontSize: "0.9375rem",
            color: "rgba(255, 255, 255, 0.88)",
            lineHeight: 1.55,
            textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
          }}
        >
          {subtitle}
        </p>

        {/* Live Synchronized Vietnam Club Date & Time Chip */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            alignSelf: "flex-start",
            marginTop: "4px",
            padding: "5px 12px",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            fontSize: "0.78125rem",
            color: "rgba(255, 255, 255, 0.85)",
          }}
        >
          <span style={{ color: "#6ee7b7", fontWeight: 700 }}>{formattedWeekday}</span>
          <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>•</span>
          <span style={{ color: "#ffffff", fontWeight: 600 }}>{dateStr}</span>
          <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>•</span>
          <span style={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.65)" }}>
            {isVi ? "Giờ CLB (GMT+7)" : "Club Time (GMT+7)"}
          </span>
        </div>
      </div>

      {/* 3. Bottom Carousel Controls Bar */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginTop: "16px",
          paddingTop: "10px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Indicators & Current Scene Caption */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
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
                    width: isActive ? "28px" : "8px",
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
              fontSize: "0.78125rem",
              color: "rgba(255, 255, 255, 0.85)",
              fontWeight: 500,
              letterSpacing: "0.01em",
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
            gap: "8px",
          }}
        >
          <button
            type="button"
            aria-label={isVi ? "Ảnh trước" : "Previous slide"}
            onClick={handlePrev}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              color: "#ffffff",
              cursor: "pointer",
              transition: "all 200ms ease",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
              e.currentTarget.style.borderColor = "rgba(110, 231, 183, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
            }}
          >
            <Icon name="chevronLeft" size={15} />
          </button>

          <button
            type="button"
            aria-label={isVi ? "Ảnh kế tiếp" : "Next slide"}
            onClick={handleNext}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              color: "#ffffff",
              cursor: "pointer",
              transition: "all 200ms ease",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
              e.currentTarget.style.borderColor = "rgba(110, 231, 183, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
            }}
          >
            <Icon name="chevronRight" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
