import { cx } from "@/shared/lib/cx";
import styles from "./Segmented.module.css";

interface SegmentedItem<T extends string> {
  id: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  items: SegmentedItem<T>[];
  active: T;
  onChange: (id: T) => void;
  label?: string;
}

// Nút chọn một trong vài lựa chọn nhỏ, ví dụ kỳ báo cáo 7 ngày / 30 ngày. Khác Tabs: không đổi cả trang, chỉ đổi cách xem.
export function Segmented<T extends string>({ items, active, onChange, label = "Options" }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className={styles.group}>
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button key={it.id} type="button" aria-pressed={on} onClick={() => onChange(it.id)} className={cx(styles.item, on && styles.on)}>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
