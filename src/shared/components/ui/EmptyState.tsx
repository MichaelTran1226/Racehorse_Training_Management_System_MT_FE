import type { ReactNode } from "react";
import { Icon } from "./Icon";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

// Trạng thái rỗng nói điều gì chưa có rồi chỉ việc tiếp theo.
export function EmptyState({ icon = "inbox", title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>
        <Icon name={icon} size={22} />
      </span>
      <strong className={styles.title}>{title}</strong>
      {description && <p className={styles.desc}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
