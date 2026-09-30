import type { ReactNode } from "react";
import { Children } from "react";
import { cx } from "@/shared/lib/cx";
import { Icon } from "./Icon";
import styles from "./KpiTile.module.css";

interface KpiTileProps {
  label: string;
  value: string | number;
  unit?: string;
  caption?: string;
  icon?: string;
  trend?: { dir: "up" | "down"; value: string };
  accent?: boolean; // burgundy: chỉ dùng cho MỘT chỉ số nổi bật mỗi trang
}

// Ô chỉ số (KPI) trên dashboard: nhãn, số lớn, đơn vị, chú thích và xu hướng.
export function KpiTile({ label, value, unit, caption, icon, trend, accent }: KpiTileProps) {
  return (
    <div className={styles.tile}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        {icon && (
          <span className={styles.icon}>
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <div className={styles.valueRow}>
        <strong className={cx(styles.value, accent && styles.accent)}>{value}</strong>
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {(caption || trend) && (
        <p className={styles.caption}>
          {trend && (
            <span className={cx(styles.trend, trend.dir === "down" && styles.down)}>
              {/* Bộ icon chỉ có "trend" (mũi tên đi lên); xu hướng giảm thì lật hình. */}
              <span className={cx(trend.dir === "down" && styles.flip)}>
                <Icon name="trend" size={12} />
              </span>
              {trend.value}
            </span>
          )}
          {caption}
        </p>
      )}
    </div>
  );
}

// Hàng các KpiTile chia đều cột, ngăn cách bằng đường kẻ.
export function KpiRow({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  return (
    <div className={styles.row} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((child, i) => (
        <div key={i} className={styles.cell}>
          {child}
        </div>
      ))}
    </div>
  );
}
