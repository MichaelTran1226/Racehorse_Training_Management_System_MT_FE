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
  const [now, setNow] = useState(() => new Date());

  // Real-time ticking clock: updates every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Strip role suffix like (Club Manager) from user name for clean greeting
  const cleanName = user.fullName.replace(/\s*\([^)]*\)/g, "").trim() || user.fullName;

  // Real-time formatted Vietnam Club time (Asia/Ho_Chi_Minh)
  const timeStr = new Intl.DateTimeFormat(isVi ? "vi-VN" : "en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  // 1. Thứ
  const weekdayStr = new Intl.DateTimeFormat(isVi ? "vi-VN" : "en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
  }).format(now);
  const formattedWeekday = weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1);

  // 2. Ngày
  const dayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "numeric",
  }).format(now);

  // 3. Tháng (& Năm)
  const rawMonthStr = new Intl.DateTimeFormat(isVi ? "vi-VN" : "en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    month: "long",
  }).format(now);
  const monthStr = rawMonthStr.charAt(0).toUpperCase() + rawMonthStr.slice(1);

  const yearStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  }).format(now);

  // Dynamic contextual greeting by hour of the day
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "numeric",
      hour12: false,
    }).format(now),
    10,
  );

  let greeting = isVi ? "Chào mừng trở lại" : "Welcome back";
  let greetingIcon = "☀️";
  if (hour >= 5 && hour < 12) {
    greeting = isVi ? "Chào buổi sáng" : "Good morning";
    greetingIcon = "🌅";
  } else if (hour >= 12 && hour < 18) {
    greeting = isVi ? "Chào buổi chiều" : "Good afternoon";
    greetingIcon = "☀️";
  } else if (hour >= 18 && hour < 22) {
    greeting = isVi ? "Chào buổi tối" : "Good evening";
    greetingIcon = "🌆";
  } else {
    greeting = isVi ? "Chào ca đêm" : "Good night";
    greetingIcon = "🌙";
  }

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
        {/* Welcome Greeting with Time-of-day Icon */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.85rem", lineHeight: 1 }} role="img" aria-hidden="true">
            {greetingIcon}
          </span>
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
            {greeting}, {cleanName}!
          </h1>
        </div>

        {/* Real-time Synchronized Vietnam Club Date & Clock Chip: Thứ -> Ngày -> Tháng -> Giờ */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            alignSelf: "flex-start",
            marginTop: "4px",
            padding: "9px 18px",
            borderRadius: "12px",
            background: "rgba(10, 35, 27, 0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(110, 231, 183, 0.28)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.35)",
            fontSize: "0.875rem",
            color: "rgba(255, 255, 255, 0.95)",
            flexWrap: "wrap",
          }}
        >
          {/* 1. Thứ */}
          <span style={{ color: "#a7f3d0", fontWeight: 700, fontSize: "0.95rem" }}>
            {formattedWeekday}
          </span>

          <span style={{ color: "rgba(255, 255, 255, 0.35)" }}>•</span>

          {/* 2. Ngày */}
          <span style={{ color: "#ffffff", fontWeight: 700 }}>
            {isVi ? `Ngày ${dayStr}` : `Day ${dayStr}`}
          </span>

          <span style={{ color: "rgba(255, 255, 255, 0.35)" }}>•</span>

          {/* 3. Tháng & Năm */}
          <span style={{ color: "#ffffff", fontWeight: 600 }}>
            {monthStr}, {yearStr}
          </span>

          <span style={{ color: "rgba(255, 255, 255, 0.35)" }}>•</span>

          {/* 4. Giờ (Real-time Clock) */}
          <span
            style={{
              fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 800,
              fontSize: "1.18rem",
              letterSpacing: "0.04em",
              color: "#6ee7b7",
              textShadow: "0 0 12px rgba(110, 231, 183, 0.4)",
            }}
          >
            {timeStr}
          </span>
        </div>
      </div>
    </div>
  );
}
