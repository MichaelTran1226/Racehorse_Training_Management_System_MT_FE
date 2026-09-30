import type { ReactNode } from "react";
import { cx } from "@/shared/lib/cx";
import type { BadgeTone } from "@/shared/lib/status";
import { Icon } from "./Icon";
import styles from "./Badge.module.css";

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  icon?: string;
  children: ReactNode;
}

export function Badge({ tone = "neutral", dot = true, icon, children }: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[tone])}>
      {icon ? <Icon name={icon} size={12} /> : dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}
