import { useNavigate } from "react-router-dom";
import { clubParts } from "../api";
import type { FitnessData } from "../types";

import { tr } from "@/shared/i18n/tr";
export type FitnessSeries = "speed" | "score" | "peakHr" | "recoveryHr" | "load";

export const SERIES_LABEL: Record<FitnessSeries, string> = {
  speed: "Avg speed (km/h)",
  score: "Performance (1-10)",
  peakHr: "Peak heart rate",
  recoveryHr: "HR after 10 min",
  load: "Weekly load",
};

const COLORS: Record<FitnessSeries, string> = {
  speed: "var(--info)",
  score: "var(--ok)",
  peakHr: "var(--danger)",
  recoveryHr: "var(--warn)",
  load: "var(--border-field)",
};

const W = 760;
const H = 280;
const PAD = { left: 40, right: 16, top: 16, bottom: 32 };

/**
 * Biểu đồ thể lực vẽ bằng SVG (không cần thư viện): trục ngang là ngày, mỗi chỉ số một đường
 * (tự co giãn theo giá trị lớn nhất của chính nó), tải tuần là cột. Dải đỏ nhạt = thời gian bị Khóa huấn luyện.
 * Bấm một điểm để mở kết quả buổi tập (SC-2.06).
 */
export function FitnessChart({ data, series, from, to }: { data: FitnessData; series: FitnessSeries[]; from: number; to: number }) {
  const navigate = useNavigate();
  const span = Math.max(1, to - from);
  const x = (t: number) => PAD.left + ((t - from) / span) * (W - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;

  const value = (s: FitnessSeries, p: FitnessData["points"][number]) =>
    s === "speed" ? p.avgSpeedKmh : s === "score" ? p.performanceScore : s === "peakHr" ? p.maxHeartRate : s === "recoveryHr" ? p.recoveryHeartRate : null;

  const lines = series.filter((s) => s !== "load");
  const maxLoad = Math.max(1, ...data.weeklyLoad.map((w) => w.load));
  const weekWidth = ((7 * 24 * 3600_000) / span) * (W - PAD.left - PAD.right);

  const ticks = Array.from({ length: 5 }, (_, i) => from + (span * i) / 4);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", maxHeight: 320 }} role="img" aria-label={tr("Fitness chart")}>
      {/* Dải Khóa huấn luyện */}
      {data.lockPeriods.map((l) => {
        const a = Math.max(from, new Date(l.from).getTime());
        const b = Math.min(to, l.to ? new Date(l.to).getTime() : to);
        if (b <= a) return null;
        return <rect key={l.from} x={x(a)} y={PAD.top} width={x(b) - x(a)} height={plotH} fill="var(--danger-bg)" />;
      })}
      {/* Trục */}
      <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="var(--border)" />
      {ticks.map((t) => (
        <text key={t} x={x(t)} y={H - 10} fontSize="11" textAnchor="middle" fill="var(--text-muted)">
          {clubParts(new Date(t).toISOString()).date.slice(5)}
        </text>
      ))}
      {/* Tải tuần (cột) */}
      {series.includes("load") &&
        data.weeklyLoad.map((w) => {
          const t = new Date(`${w.weekStart}T00:00:00+07:00`).getTime();
          const h = (w.load / maxLoad) * plotH;
          return (
            <rect key={w.weekStart} x={x(t)} y={H - PAD.bottom - h} width={Math.max(4, weekWidth - 4)} height={h} fill={COLORS.load} opacity={0.45}>
              <title>{tr(`Week of ${w.weekStart}: load ${w.load}`)}</title>
            </rect>
          );
        })}
      {/* Đường chỉ số */}
      {lines.map((s) => {
        const pts = data.points
          .map((p) => ({ p, v: value(s, p) }))
          .filter((d): d is { p: FitnessData["points"][number]; v: number } => d.v != null);
        if (pts.length === 0) return null;
        const max = Math.max(...pts.map((d) => d.v)) * 1.1 || 1;
        const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
        const path = pts.map((d, i) => `${i ? "L" : "M"}${x(new Date(d.p.date).getTime())},${y(d.v)}`).join(" ");
        return (
          <g key={s}>
            <path d={path} fill="none" stroke={COLORS[s]} strokeWidth={2} />
            {pts.map((d) => (
              <circle
                key={d.p.workoutId}
                cx={x(new Date(d.p.date).getTime())}
                cy={y(d.v)}
                r={4}
                fill={d.p.hasAlert ? "var(--danger)" : COLORS[s]}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/training/sessions/${d.p.workoutId}/result`)}
              >
                <title>{`${clubParts(d.p.date).date} · ${d.p.workoutType} · ${SERIES_LABEL[s]}: ${d.v}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export const SERIES_COLOR = COLORS;
