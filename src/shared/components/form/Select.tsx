import type { SelectHTMLAttributes } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import { cx } from "@/shared/lib/cx";
import { useFieldControl } from "./Field";
import styles from "./Control.module.css";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean; // hiện nhưng không chọn được (kèm giải thích ở hint của Field)
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  invalid?: boolean;
}

export function Select({ options, invalid, className, id, ...rest }: SelectProps) {
  const field = useFieldControl();
  const isInvalid = invalid ?? field?.invalid ?? false;

  return (
    <div className={styles.wrap}>
      <select
        id={id ?? field?.id}
        aria-invalid={isInvalid || undefined}
        aria-describedby={field?.describedBy}
        className={cx(styles.control, styles.select, isInvalid && styles.invalid, className)}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <span className={styles.chevron}>
        <Icon name="chevronDown" size={15} />
      </span>
    </div>
  );
}
