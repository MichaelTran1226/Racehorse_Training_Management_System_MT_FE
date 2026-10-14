import type { ReactNode } from "react";
import { Icon } from "./Icon";
import styles from "./EmptyState.module.css";
import { trNode } from "@/shared/i18n/tr";

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
      <strong className={styles.title}>{trNode(title)}</strong>
      {description && <p className={styles.desc}>{trNode(description)}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
