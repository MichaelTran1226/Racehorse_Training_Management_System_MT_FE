import { useState, useEffect } from "react";
import { useAppLanguage } from "@/shared/lib/language";
import type { AuthUser } from "@/shared/types/auth";

interface DashboardHeroBannerProps {
  user: AuthUser;
}

interface HeroSlide {
  id: string;
  image: string;
  focusPosition: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "turf-race",
    image: "/images/hero/hero-turf-race.png",
    focusPosition: "center 38%",
  },
  {
    id: "sky-jump",
    image: "/images/hero/hero-sky-jump.png",
    focusPosition: "55% 40%",
  },
  {
    id: "stables",
    image: "/images/hero/hero-stables.png",
    focusPosition: "88% 28%",
  },
  {
    id: "jumping",
    image: "/images/hero/hero-jumping.jpg",
    focusPosition: "30% 12%",
  },
  {
    id: "racing",
    image: "/images/hero/hero-racing.jpg",
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
        padding: "48px 48px",
        background: "linear-gradient(135deg, #032b1f 0%, #02241a 100%)",
        color: "#ffffff",
        boxShadow: "0 14px 32px -6px rgba(2, 36, 26, 0.45), 0 8px 18px -4px rgba(2, 36, 26, 0.3)",
        minHeight: "260px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* 1. Right Showcase Photo Area: 68% width, 100% full vibrant color, no green tint over horses */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "68%",
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
              "linear-gradient(90deg, #032b1f 0%, rgba(3, 43, 31, 0.95) 14%, rgba(3, 43, 31, 0.35) 32%, transparent 55%)",
            pointerEvents: "none",
          }}
        />

        {/* Subtle Top & Bottom edge soft shade */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(3, 43, 31, 0.25) 0%, transparent 20%, transparent 80%, rgba(2, 36, 26, 0.5) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* 2. Left Content Section: Pure, high-contrast, uncluttered typography */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          maxWidth: "560px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Welcome Greeting without awkward role suffix */}
        <h1
          style={{
            margin: 0,
            fontSize: "2.35rem",
            fontWeight: 850,
            lineHeight: 1.2,
            color: "#ffffff",
            letterSpacing: "-0.025em",
            textShadow: "0 2px 8px rgba(0, 0, 0, 0.45)",
          }}
        >
          {isVi ? `Chào mừng trở lại, ${cleanName}!` : `Welcome back, ${cleanName}!`}
        </h1>

        {/* Live Synchronized Vietnam Club Date & Time Chip */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            alignSelf: "flex-start",
            marginTop: "2px",
            padding: "8px 16px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            fontSize: "0.85rem",
            color: "rgba(255, 255, 255, 0.9)",
          }}
        >
          <span style={{ color: "#6ee7b7", fontWeight: 700 }}>{formattedWeekday}</span>
          <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>•</span>
          <span style={{ color: "#ffffff", fontWeight: 600 }}>{dateStr}</span>
          <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>•</span>
          <span style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.7)" }}>
            {isVi ? "Giờ CLB (GMT+7)" : "Club Time (GMT+7)"}
          </span>
        </div>
      </div>
    </div>
  );
}
