import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import { cx } from "@/shared/lib/cx";
import { useFieldControl } from "./Field";
import styles from "./Control.module.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
  invalid?: boolean;
  numeric?: boolean;
}

export function Input({ icon, invalid, numeric, className, id, type, ...rest }: InputProps) {
  const field = useFieldControl();
  const isInvalid = invalid ?? field?.invalid ?? false;
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);

  const input = (
    <input
      id={id ?? field?.id}
      type={isPassword ? (visible ? "text" : "password") : type}
      aria-invalid={isInvalid || undefined}
      aria-describedby={field?.describedBy}
      className={cx(
        styles.control,
        icon && styles.withIcon,
        isPassword && styles.withToggle,
        numeric && styles.numeric,
        isInvalid && styles.invalid,
        className,
      )}
      {...rest}
    />
  );

  if (!icon && !isPassword) return input;
  return (
    <div className={styles.wrap}>
      {icon && (
        <span className={styles.icon}>
          <Icon name={icon} size={15} />
        </span>
      )}
      {input}
      {isPassword && (
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <Icon name={visible ? "eyeOff" : "eye"} size={15} />
        </button>
      )}
    </div>
  );
}
