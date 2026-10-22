import type { TextareaHTMLAttributes } from "react";
import { cx } from "@/shared/lib/cx";
import { useFieldControl } from "./fieldContext";
import styles from "./Control.module.css";
import { tr } from "@/shared/i18n/tr";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

// Ô nhập nhiều dòng (ghi chú, nhận xét chuyên môn, lý do khóa huấn luyện). Dùng bên trong <Field> để có nhãn và lỗi.
export function Textarea({ invalid, className, id, rows = 4, placeholder, ...rest }: TextareaProps) {
  const field = useFieldControl();
  const isInvalid = invalid ?? field?.invalid ?? false;

  return (
    <textarea
      id={id ?? field?.id}
      rows={rows}
      aria-invalid={isInvalid || undefined}
      aria-describedby={field?.describedBy}
      className={cx(styles.control, styles.textarea, isInvalid && styles.invalid, className)}
      placeholder={placeholder === undefined ? undefined : tr(placeholder)}
      {...rest}
    />
  );
}
