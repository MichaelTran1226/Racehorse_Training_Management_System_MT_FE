import { ProgressBar } from "@/shared/components/ui/ProgressBar";
import { strengthOf } from "@/shared/lib/password";
import { tr } from "@/shared/i18n/tr";
import styles from "./PasswordStrength.module.css";

// Thanh độ mạnh mật khẩu (design 1.6 / 1.16): nhãn + thanh màu + gợi ý cải thiện.
export function PasswordStrength({ password }: { password: string }) {
  const s = strengthOf(password);
  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <span className={styles.caption}>{tr("Password strength")}</span>
        <b className={styles[s.tone]} aria-live="polite">
          {tr(s.label)}
        </b>
      </div>
      <ProgressBar value={s.value} tone={s.tone} label={tr("Password strength")} />
      <p className={styles.hint}>{tr(s.hint)}</p>
    </div>
  );
}
