import { cx } from "@/shared/lib/cx";
import { Icon } from "./Icon";
import styles from "./WizardStepper.module.css";

interface WizardStepperProps {
  steps: string[];
  current: number; // vị trí bước đang làm, bắt đầu từ 0
}

// Thanh tiến trình của form nhiều bước (ví dụ wizard lập giáo án). Bước đã xong hiện dấu tick, bước hiện tại nổi bật.
export function WizardStepper({ steps, current }: WizardStepperProps) {
  return (
    <ol className={styles.steps}>
      {steps.map((label, i) => {
        const done = i < current;
        const on = i === current;
        return (
          <li key={label} className={cx(styles.step, i === steps.length - 1 && styles.last)} aria-current={on ? "step" : undefined}>
            <div className={styles.node}>
              <span className={cx(styles.circle, done && styles.done, on && styles.on)}>
                {done ? <Icon name="check" size={13} strokeWidth={2.6} /> : i + 1}
              </span>
              <span className={cx(styles.label, on && styles.labelOn, done && styles.labelDone)}>{label}</span>
            </div>
            {i < steps.length - 1 && <span className={cx(styles.line, done && styles.lineDone)} />}
          </li>
        );
      })}
    </ol>
  );
}
