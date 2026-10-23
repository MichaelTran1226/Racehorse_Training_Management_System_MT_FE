import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/shared/lib/cx";
import styles from "./Skeleton.module.css";

export type SkeletonVariant = "rect" | "text" | "title" | "circle" | "badge" | "button";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Phần tử Skeleton cơ sở với hiệu ứng tia sáng chuyển động mượt mà (Shimmer Wave).
 */
export function Skeleton({
  variant = "rect",
  width,
  height,
  borderRadius,
  className,
  style,
  children,
}: SkeletonProps) {
  const customStyle: CSSProperties = {
    ...style,
    ...(width !== undefined ? { width: typeof width === "number" ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === "number" ? `${height}px` : height } : {}),
    ...(borderRadius !== undefined
      ? { borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius }
      : {}),
  };

  return (
    <span
      className={cx(
        styles.skeleton,
        variant === "text" && styles.text,
        variant === "title" && styles.title,
        variant === "circle" && styles.circle,
        variant === "rect" && styles.rect,
        variant === "badge" && styles.badge,
        variant === "button" && styles.button,
        className
      )}
      style={customStyle}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

/**
 * Skeleton cho nhiều dòng văn bản (paragraph) với độ dài các dòng so le tự nhiên
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ["100%", "92%", "78%", "85%", "64%"];
  return (
    <div className={className} style={{ width: "100%" }} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={widths[i % widths.length]}
          style={{ marginBottom: i === lines - 1 ? 0 : 8 }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton Bảng dữ liệu hoàn chỉnh (Header + các hàng mô phỏng Avatar, Chữ, Badge)
 */
export function SkeletonTable({
  columns = 4,
  rows = 5,
  className,
}: {
  columns?: number;
  rows?: number;
  className?: string;
}) {
  const colWidths = ["30%", "25%", "20%", "15%", "10%"];

  return (
    <div className={cx(styles.tableContainer, className)} aria-busy="true">
      {/* Header */}
      <div className={styles.tableHeader}>
        {Array.from({ length: columns }, (_, c) => (
          <div key={c} style={{ flex: c === 0 ? 1.4 : 1 }}>
            <Skeleton variant="text" width={colWidths[c % colWidths.length]} height={12} />
          </div>
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className={styles.tableRow}>
          {Array.from({ length: columns }, (_, c) => (
            <div
              key={c}
              style={{
                flex: c === 0 ? 1.4 : 1,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {c === 0 && <Skeleton variant="circle" width={32} height={32} />}
              <div style={{ flex: 1 }}>
                <Skeleton
                  variant="text"
                  width={c === 0 ? "70%" : c === 1 ? "85%" : "55%"}
                  height={13}
                />
                {c === 0 && <Skeleton variant="text" width="40%" height={10} style={{ marginTop: 4 }} />}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton danh sách các Thẻ Card (Cards Grid)
 */
export function SkeletonCards({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cx(styles.cardGrid, className)} aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.cardItem}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Skeleton variant="circle" width={40} height={40} />
            <Skeleton variant="badge" width={68} height={20} />
          </div>
          <div>
            <Skeleton variant="title" width="65%" height={18} />
            <Skeleton variant="text" width="45%" height={12} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            <Skeleton variant="text" width="100%" height={8} />
            <Skeleton variant="text" width="80%" height={8} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <Skeleton variant="badge" width={55} height={18} />
            <Skeleton variant="button" width={72} height={28} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Hàng chỉ số KPI thống kê
 */
export function SkeletonKpiGrid({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cx(styles.kpiGrid, className)} aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.kpiCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Skeleton variant="text" width="50%" height={12} />
            <Skeleton variant="circle" width={28} height={28} />
          </div>
          <Skeleton variant="title" width="40%" height={26} />
          <Skeleton variant="text" width="60%" height={11} />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Tiêu đề trang (PageHeader)
 */
export function SkeletonPageHeader() {
  return (
    <div className={styles.pageHeader} aria-hidden="true">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Skeleton variant="title" width={240} height={28} />
        <Skeleton variant="text" width={380} height={14} />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Skeleton variant="button" width={96} height={38} />
        <Skeleton variant="button" width={120} height={38} />
      </div>
    </div>
  );
}

/**
 * Skeleton Thanh công cụ / Bộ lọc (Toolbar)
 */
export function SkeletonToolbar() {
  return (
    <div className={styles.toolbar} aria-hidden="true">
      <div style={{ display: "flex", gap: 10, flex: 1, maxWidth: 450 }}>
        <Skeleton variant="rect" width="100%" height={36} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Skeleton variant="button" width={82} height={36} />
        <Skeleton variant="button" width={92} height={36} />
      </div>
    </div>
  );
}

/**
 * Skeleton nguyên một trang đầy đủ (Header + KPI + Toolbar + Table)
 * Dùng làm fallback cho router.tsx khi chuyển trang
 */
export function SkeletonPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }} aria-busy="true">
      <SkeletonPageHeader />
      <SkeletonKpiGrid count={4} />
      <SkeletonToolbar />
      <SkeletonTable columns={5} rows={6} />
    </div>
  );
}

/**
 * Skeleton toàn bộ khung làm việc (Sidebar + Topbar + Content)
 * Dùng cho AppShell khi khởi động hoặc ấn F5 tải lại trang
 */
export function SkeletonWorkspace() {
  return (
    <div className={styles.workspace} aria-busy="true" aria-label="Loading workspace">
      {/* Sidebar Wireframe */}
      <div className={styles.workspaceSidebar}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skeleton variant="rect" width={36} height={36} borderRadius={9} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            <Skeleton variant="text" width="75%" height={14} />
            <Skeleton variant="text" width="45%" height={8} />
          </div>
        </div>

        {/* Nav Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 4px" }}>
              <Skeleton variant="circle" width={20} height={20} />
              <Skeleton variant="text" width={`${55 + (i * 11) % 35}%`} height={13} />
            </div>
          ))}
        </div>

        {/* User profile at bottom */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, paddingTop: 14 }}>
          <Skeleton variant="circle" width={32} height={32} />
          <div style={{ flex: 1 }}>
            <Skeleton variant="text" width="80%" height={12} />
            <Skeleton variant="text" width="50%" height={10} style={{ marginTop: 4 }} />
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className={styles.workspaceMain}>
        {/* Topbar Wireframe */}
        <div className={styles.workspaceTopbar}>
          <Skeleton variant="text" width={180} height={14} />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Skeleton variant="rect" width={220} height={34} borderRadius={8} />
            <Skeleton variant="circle" width={34} height={34} />
            <Skeleton variant="circle" width={34} height={34} />
          </div>
        </div>

        {/* Content Wireframe */}
        <div className={styles.workspaceContent}>
          <SkeletonPageHeader />
          <SkeletonKpiGrid count={4} />
          <SkeletonToolbar />
          <SkeletonTable columns={5} rows={6} />
        </div>
      </div>
    </div>
  );
}
