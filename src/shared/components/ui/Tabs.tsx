import { cx } from "@/shared/lib/cx";
import styles from "./Tabs.module.css";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  label?: string;
}

// Thanh tab: tab đang mở có gạch chân burgundy (màu nhấn thương hiệu). Hỗ trợ phím ← → để đổi tab.
export function Tabs<T extends string>({ items, active, onChange, label = "Filter" }: TabsProps<T>) {
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const index = items.findIndex((t) => t.id === active);
    const next = items[(index + (e.key === "ArrowRight" ? 1 : items.length - 1)) % items.length];
    onChange(next.id);
    e.preventDefault();
  }

  return (
    <div role="tablist" aria-label={label} className={styles.tabs} onKeyDown={onKeyDown}>
      {items.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cx(styles.tab, on && styles.on)}
          >
            {t.label}
            {t.count != null && <span className={styles.count}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
