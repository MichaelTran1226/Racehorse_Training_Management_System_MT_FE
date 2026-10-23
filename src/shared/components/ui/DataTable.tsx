import type { ReactNode } from "react";
import { cx } from "@/shared/lib/cx";
import { EmptyState } from "./EmptyState";
import styles from "./DataTable.module.css";
import { tr, trNode } from "@/shared/i18n/tr";

export interface Column<T> {
  key: string;
  header: string;
  width?: number | string;
  align?: "left" | "right";
  // Ẩn cột này khi màn hình hẹp (≤ 1280px) — design giữ lại vai trò, trạng thái, hành động.
  hideOnNarrow?: boolean;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  empty?: ReactNode;
  caption: string; // mô tả bảng cho trình đọc màn hình
  selectedKey?: string | null;
  onRowClick?: (row: T) => void;
}

const SKELETON_ROWS = 5;

// Bảng dữ liệu dùng chung. Tự lo 3 trạng thái: đang tải (skeleton) · rỗng · có dữ liệu.
// (Trạng thái lỗi do trang quyết định vì cần nút "Try again" riêng.)
export function DataTable<T>({ columns, rows, rowKey, loading, empty, caption, selectedKey, onRowClick }: DataTableProps<T>) {
  if (!loading && rows.length === 0) {
    return <>{empty ?? <EmptyState title={tr("Nothing to show yet.")} description={tr("New records appear here as soon as they exist.")} />}</>;
  }

  return (
    <div className={styles.scroll}>
      <table className={styles.table} aria-busy={loading || undefined}>
        <caption className="sr-only">{trNode(caption)}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cx(styles.th, c.align === "right" && styles.right, c.hideOnNarrow && styles.narrow)}
                style={{ width: c.width }}
              >
                {trNode(c.header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: SKELETON_ROWS }, (_, i) => {
                const rowWidths = [
                  ["75%", "55%", "65%", "45%", "40%"],
                  ["60%", "70%", "50%", "60%", "35%"],
                  ["85%", "45%", "75%", "50%", "45%"],
                  ["65%", "60%", "45%", "55%", "30%"],
                  ["70%", "50%", "60%", "40%", "50%"],
                ];
                const widths = rowWidths[i % rowWidths.length];
                return (
                  <tr key={i} className={styles.row}>
                    {columns.map((c, colIdx) => (
                      <td key={c.key} className={cx(styles.td, c.hideOnNarrow && styles.narrow)}>
                        <span
                          className={styles.skeleton}
                          style={{ width: widths[colIdx % widths.length] || "60%" }}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })
            : rows.map((row) => {
                const isSelected = selectedKey !== undefined && selectedKey !== null && rowKey(row) === selectedKey;
                return (
                  <tr
                    key={rowKey(row)}
                    className={cx(styles.row, onRowClick && styles.clickable, isSelected && styles.selected)}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={cx(styles.td, c.align === "right" && styles.right, c.hideOnNarrow && styles.narrow)}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}

// Ô "chính" của một hàng: avatar + tên đậm + dòng phụ.
export function CellPrimary({ title, meta, avatar }: { title: string; meta?: string; avatar?: ReactNode }) {
  return (
    <div className={styles.primary}>
      {avatar}
      <div className={styles.primaryText}>
        <strong>{trNode(title)}</strong>
        {meta && <span>{meta}</span>}
      </div>
    </div>
  );
}
