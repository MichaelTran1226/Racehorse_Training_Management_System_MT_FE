import type { ReactNode } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import { formatLongDate } from "@/shared/lib/format";
import { useToday } from "@/shared/lib/hooks";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  eyebrow?: string;
  title: string; // câu hoàn chỉnh kết bằng dấu chấm — nét nhận diện của EquiFlow
  description?: string;
  showDate?: boolean; // hiện ngày hôm nay ở góc phải
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, showDate, action }: PageHeaderProps) {
  const today = useToday();
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      <div className={styles.side}>
        {showDate && today && (
          <span className={styles.meta}>
            <Icon name="calendar" size={14} />
            {formatLongDate(today)}
          </span>
        )}
        {action}
      </div>
    </header>
  );
}
