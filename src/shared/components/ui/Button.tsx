import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { cx } from "@/shared/lib/cx";
import { DisabledHint } from "./DisabledHint";
import { Icon } from "./Icon";
import styles from "./Button.module.css";

type Tone = "primary" | "secondary" | "ghost" | "quiet" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  size?: Size;
  icon?: string;
  iconAfter?: string;
  block?: boolean;
  // Có lý do => nút bị chặn: mờ đi, không bấm được, nhưng vẫn focus được và hiện tooltip giải thích.
  blockedReason?: string;
}

const ICON_SIZE: Record<Size, number> = { sm: 13, md: 15, lg: 16 };

export function Button({
  tone = "primary",
  size = "md",
  icon,
  iconAfter,
  block,
  blockedReason,
  disabled,
  type = "button",
  className,
  onClick,
  children,
  ...rest
}: ButtonProps) {
  const blocked = Boolean(blockedReason);
  const off = Boolean(disabled) || blocked;

  // Nút bị chặn dùng aria-disabled (chứ không dùng thuộc tính disabled) để bàn phím vẫn focus được và đọc được lý do.
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (off) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const button = (
    <button
      type={type}
      disabled={disabled && !blocked}
      aria-disabled={off || undefined}
      onClick={handleClick}
      className={cx(styles.btn, styles[tone], styles[size], block && styles.block, off && styles.off, className)}
      {...rest}
    >
      {icon && <Icon name={icon} size={ICON_SIZE[size]} />}
      {children}
      {iconAfter && <Icon name={iconAfter} size={ICON_SIZE[size]} />}
      {blocked && <span className="sr-only">{`Unavailable: ${blockedReason}`}</span>}
    </button>
  );

  return (
    <DisabledHint reason={blockedReason} block={block}>
      {button}
    </DisabledHint>
  );
}
