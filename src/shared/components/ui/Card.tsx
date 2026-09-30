import type { ReactNode } from "react";
import { cx } from "@/shared/lib/cx";
import styles from "./Card.module.css";

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  foot?: ReactNode;
  pad?: number | string;
  className?: string;
  children?: ReactNode;
}

// Quy tắc design: card không lồng card, chân card (foot) nền surface-2 cho chú giải/phân trang.
export function Card({ title, subtitle, action, foot, pad = 22, className, children }: CardProps) {
  return (
    <section className={cx(styles.card, className)}>
      {(title || action) && (
        <header className={styles.head}>
          <div className={styles.headText}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </header>
      )}
      <div className={styles.body} style={{ padding: pad }}>
        {children}
      </div>
      {foot && <footer className={styles.foot}>{foot}</footer>}
    </section>
  );
}
