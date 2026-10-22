export type FitnessSeries = "speed" | "score" | "peakHr" | "recoveryHr" | "load";

export const SERIES_LABEL: Record<FitnessSeries, string> = {
  speed: "Avg speed (km/h)",
  score: "Performance (1-10)",
  peakHr: "Peak heart rate",
  recoveryHr: "HR after 10 min",
  load: "Weekly load",
};

export const SERIES_COLOR: Record<FitnessSeries, string> = {
  speed: "var(--info)",
  score: "var(--ok)",
  peakHr: "var(--danger)",
  recoveryHr: "var(--warn)",
  load: "var(--border-field)",
};
