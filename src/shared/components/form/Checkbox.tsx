import type { ReactNode } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import { cx } from "@/shared/lib/cx";
import styles from "./Checkbox.module.css";

interface CheckboxProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

// <input> thật (ẩn bằng CSS nhưng vẫn focus/bấm bằng bàn phím được) + ô vuông tự vẽ.
export function Checkbox({ label, checked, onChange, disabled }: CheckboxProps) {
  return (
    <label className={cx(styles.wrap, disabled && styles.disabled)}>
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={cx(styles.box, checked && styles.checked)}>
        {checked && <Icon name="check" size={11} strokeWidth={2.6} />}
      </span>
      {label}
    </label>
  );
}
