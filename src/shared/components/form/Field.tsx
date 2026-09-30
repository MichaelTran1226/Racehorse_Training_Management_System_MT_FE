import { createContext, useContext, useId } from "react";
import type { ReactNode } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import styles from "./Field.module.css";

interface FieldControl {
  id: string;
  describedBy?: string;
  invalid: boolean;
}

// Field "chia sẻ" id, mô tả lỗi và trạng thái invalid cho ô nhập nằm bên trong qua Context,
// nên trang không phải tự đặt id/htmlFor/aria-describedby cho từng ô.
const FieldContext = createContext<FieldControl | null>(null);

export function useFieldControl(): FieldControl | null {
  return useContext(FieldContext);
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, required, hint, error, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  const control: FieldControl = { id, describedBy: error || hint ? messageId : undefined, invalid: Boolean(error) };

  return (
    <FieldContext.Provider value={control}>
      <div className={styles.field}>
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
        {children}
        {error ? (
          <span id={messageId} className={styles.error}>
            <Icon name="alert" size={12} />
            {error}
          </span>
        ) : hint ? (
          <span id={messageId} className={styles.hint}>
            {hint}
          </span>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}
