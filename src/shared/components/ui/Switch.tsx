import { cx } from "@/shared/lib/cx";
import { Tooltip } from "./Tooltip";
import styles from "./Switch.module.css";

interface SwitchProps {
  checked: boolean;
  onChange?: (next: boolean) => void;
  label: string; // tên đọc bằng trình đọc màn hình (không hiện ra)
  disabled?: boolean;
  // Có lý do => công tắc khóa nhưng vẫn hiện, kèm tooltip giải thích.
  blockedReason?: string;
}

export function Switch({ checked, onChange, label, disabled, blockedReason }: SwitchProps) {
  const off = Boolean(disabled) || Boolean(blockedReason);
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={off || undefined}
      onClick={() => {
        if (!off) onChange?.(!checked);
      }}
      className={cx(styles.switch, checked && styles.on, off && styles.off)}
    >
      <span className={styles.knob} />
    </button>
  );
  // Công tắc luôn nằm sát mép phải của thẻ (thẻ có overflow: hidden) => tooltip canh mép phải để không bị cắt chữ.
  return blockedReason ? (
    <Tooltip label={blockedReason} placement="topEnd">
      {control}
    </Tooltip>
  ) : (
    control
  );
}
