import type { ReactNode } from "react";
import { cx } from "@/shared/lib/cx";
import { Icon } from "./Icon";
import styles from "./Alert.module.css";

export type AlertTone = "ok" | "warn" | "danger" | "info";

const DEFAULT_ICON: Record<AlertTone, string> = {
  ok: "checkCircle",
  warn: "alert",
  danger: "xCircle",
  info: "info",
};

interface AlertProps {
  tone?: AlertTone;
  icon?: string;
  title?: string;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
  children?: ReactNode;
}

// Thông báo cấp TRANG/YÊU CẦU: luôn có icon để nghĩa không chỉ nằm ở màu.
// danger dùng role="alert" (đọc ngay), các tông còn lại dùng role="status".
export function Alert({ tone = "info", icon, title, action, onDismiss, className, children }: AlertProps) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cx(styles.alert, styles[tone], className)}>
      <span className={styles.icon}>
        <Icon name={icon ?? DEFAULT_ICON[tone]} size={17} />
      </span>
      <div className={styles.body}>
        {title && <strong className={styles.title}>{title}</strong>}
        {children}
      </div>
      {action}
      {onDismiss && (
        <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss">
          <Icon name="x" size={15} />
        </button>
      )}
    </div>
  );
}
