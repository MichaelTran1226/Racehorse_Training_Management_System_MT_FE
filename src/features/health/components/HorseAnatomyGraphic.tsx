import React from "react";

interface HorseAnatomyGraphicProps {
  view: "LEFT" | "RIGHT";
  layer: "MUSCLE" | "SKELETON";
}

export const HorseAnatomyGraphic: React.FC<HorseAnatomyGraphicProps> = ({
  view,
  layer,
}) => {
  const isSkeleton = layer === "SKELETON";
  const isRight = view === "RIGHT";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        padding: "8px",
      }}
    >
      <svg
        viewBox="0 0 1024 682"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          overflow: "visible",
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle medical grid background */}
          <pattern id="vetGridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="var(--border)"
              strokeWidth="0.5"
              strokeOpacity="0.3"
            />
          </pattern>

          {/* Glowing tendon filter */}
          <filter id="tendonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Blueprint Grid Canvas */}
        <rect width="1024" height="682" fill="url(#vetGridPattern)" rx="8" />

        {/* Horse Anatomy Image (Lớp Cơ: horse_muscle.png | Lớp Xương: horse_anatomy.png) */}
        <g
          style={{
            transform: isRight ? "scaleX(-1)" : "none",
            transformOrigin: "512px 341px",
            transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <image
            href={isSkeleton ? "/assets/horse_anatomy.png" : "/assets/horse_muscle.png"}
            x="0"
            y="0"
            width="1024"
            height="682"
            preserveAspectRatio="xMidYMid meet"
            style={{
              filter: isSkeleton
                ? "contrast(1.15) brightness(1.02)"
                : "contrast(1.02)",
              transition: "filter 0.3s ease, opacity 0.25s ease",
            }}
          />
        </g>
      </svg>
    </div>
  );
};

export default HorseAnatomyGraphic;
