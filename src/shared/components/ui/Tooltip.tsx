import { useId, useState } from "react";
import type { ReactNode } from "react";
import { cx } from "@/shared/lib/cx";
import styles from "./Tooltip.module.css";

interface TooltipProps {
  label: string;
  children: ReactNode;
  placement?: "top" | "bottom" | "right";
  block?: boolean;
}

// Hiện chú thích khi rê chuột HOẶC khi focus bàn phím vào phần tử con.
export function Tooltip({ label, children, placement = "top", block }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span
      className={cx(styles.wrap, block && styles.block)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span role="tooltip" id={id} className={cx(styles.tip, styles[placement])}>
          {label}
        </span>
      )}
    </span>
  );
}
