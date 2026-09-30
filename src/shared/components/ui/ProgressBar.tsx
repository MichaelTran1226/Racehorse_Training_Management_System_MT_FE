import { cx } from "@/shared/lib/cx";
import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: "brand" | "ok" | "warn" | "danger";
  label?: string;
}

export function ProgressBar({ value, max = 100, tone = "brand", label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={styles.track}
    >
      <span className={cx(styles.fill, styles[tone])} style={{ width: `${pct}%` }} />
    </span>
  );
}
