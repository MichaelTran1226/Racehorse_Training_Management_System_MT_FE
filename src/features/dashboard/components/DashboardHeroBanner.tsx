import { useState, useEffect } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import { useAppLanguage } from "@/shared/lib/language";
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
    id: "turf-race",
    image: "/images/hero/hero-turf-race.png",
    tagVi: "Đua Ngựa Tốc Độ",
    tagEn: "Turf Racing Sprint",
    iconName: "trophy",
    badgeVi: "Đấu Trường & Thành Tích Tốc Độ",
    badgeEn: "Premier Turf Championship Sprint",
    // Lead horses and sprinting jockeys on turf
    focusPosition: "center 38%",
  },
  {
    id: "sky-jump",
    image: "/images/hero/hero-sky-jump.png",
    tagVi: "Vượt Rào Đỉnh Cao",
    tagEn: "Grand Prix Jumping",
    iconName: "flag",
    badgeVi: "Huấn Luyện & Biểu Diễn Vượt Rào",
    badgeEn: "Grand Prix Equestrian Show Jumping",
    // Rider & horse jumping over black scrollwork barrier into blue sky
    focusPosition: "55% 40%",
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
    tagVi: "Kỹ Thuật Vượt Rào",
    tagEn: "Show Jumping Technique",
    iconName: "flag",
    badgeVi: "Kỹ Thuật Vượt Rào Thể Thao",
    badgeEn: "Equestrian Show Jumping & Training",
    // Rider & horse jumping are in the upper-left/center-left of the photo
    focusPosition: "30% 12%",
  },
  {
    id: "racing",
    image: "/images/hero/hero-racing.jpg",
    tagVi: "Bứt Phá Về Đích",
    tagEn: "Thoroughbred Finish",
    iconName: "trophy",
    badgeVi: "Về Đích Đấu Trường Chuyên Nghiệp",
    badgeEn: "Championship Sprint Finish",
    // Focus on the lead racehorses and sprinting jockeys on the right
    focusPosition: "right 40%",
  },
];

export function DashboardHeroBanner({ user }: DashboardHeroBannerProps) {
  const { isVietnamese: isVi } = useAppLanguage();
  const now = new Date();

  // Strip role suffix like (Club Manager) from user name for clean greeting
  const cleanName = user.fullName.replace(/\s*\([^)]*\)/g, "").trim() || user.fullName;

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

  // Carousel State - Pure Automatic Rotation
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance every 5.5 seconds, paused on hover or reduced motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) return;
    }

    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);

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
        background: "linear-gradient(135deg, #032b1f 0%, #02241a 100%)",
        color: "#ffffff",
        boxShadow: "0 10px 25px -5px rgba(2, 36, 26, 0.4), 0 6px 14px -4px rgba(2, 36, 26, 0.25)",
        minHeight: "220px",
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
                transition: "opacity 850ms cubic-bezier(0.4, 0, 0.2, 1), transform 5500ms ease-out",
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
          maxWidth: "520px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
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

        {/* Welcome Greeting without awkward role suffix */}
        <h1
          style={{
            margin: 0,
            fontSize: "1.85rem",
            fontWeight: 800,
            lineHeight: 1.2,
            color: "#ffffff",
            letterSpacing: "-0.025em",
            textShadow: "0 2px 6px rgba(0, 0, 0, 0.4)",
          }}
        >
          {isVi ? `Chào mừng trở lại, ${cleanName}!` : `Welcome back, ${cleanName}!`}
        </h1>

        {/* Live Synchronized Vietnam Club Date & Time Chip */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            alignSelf: "flex-start",
            marginTop: "2px",
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

      {/* 3. Bottom Carousel Progress Bar (Pure Automatic, No Arrow Buttons) */}
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
      </div>
    </div>
  );
}
