import type { ReactNode } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import { formatLongDate } from "@/shared/lib/format";
import { useToday } from "@/shared/lib/hooks";
import styles from "./PageHeader.module.css";
import { tr, trNode } from "@/shared/i18n/tr";

interface PageHeaderProps {
  eyebrow?: string; // không còn hiển thị (DESIGN.md: không dùng nhãn IN HOA phía trên tiêu đề)
  title: string;
  description?: string;
  showDate?: boolean; // hiện ngày hôm nay ở góc phải
  action?: ReactNode;
}

export function PageHeader({ title, description, showDate, action }: PageHeaderProps) {
  const today = useToday();
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <h1 className={styles.title}>{tr(title).replace(/\.$/, "")}</h1>
        {description && <p className={styles.description}>{trNode(description)}</p>}
      </div>
      <div className={styles.side}>
        {showDate && today && (
          <span className={styles.meta}>
            <Icon name="calendar" size={16} />
            {formatLongDate(today)}
          </span>
        )}
        {action}
      </div>
    </header>
  );
}
