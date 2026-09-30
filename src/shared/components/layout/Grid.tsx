import type { CSSProperties, ReactNode } from "react";

interface GridProps {
  children: ReactNode;
  cols?: string; // ví dụ "2fr 1fr"
  gap?: number;
}

// Lưới chia cột cho vùng nội dung. Mặc định 2 cột bằng nhau, khoảng cách 22px (theo design system).
export function Grid({ children, cols = "1fr 1fr", gap = 22 }: GridProps) {
  const style: CSSProperties = { display: "grid", gridTemplateColumns: cols, gap, alignItems: "start" };
  return <div style={style}>{children}</div>;
}
