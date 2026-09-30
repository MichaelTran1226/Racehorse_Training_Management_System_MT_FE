import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/shared/lib/cx";
import { Icon } from "./Icon";
import styles from "./IconButton.module.css";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: string;
  label: string; // bắt buộc: nút chỉ có icon thì phải có tên cho trình đọc màn hình
  badge?: number;
}

export function IconButton({ icon, label, badge, className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} title={label} className={cx(styles.btn, className)} {...rest}>
      <Icon name={icon} size={16} />
      {badge != null && badge > 0 && <span className={styles.badge}>{badge}</span>}
    </button>
  );
}
