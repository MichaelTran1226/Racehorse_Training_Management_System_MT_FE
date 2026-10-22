import { useId } from "react";
import type { ReactNode } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import styles from "./Field.module.css";
import { trNode } from "@/shared/i18n/tr";
import { FieldContext, type FieldControl } from "./fieldContext";

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
          {trNode(label)}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
        {children}
        {error ? (
          <span id={messageId} className={styles.error}>
            <Icon name="alert" size={12} />
            {trNode(error)}
          </span>
        ) : hint ? (
          <span id={messageId} className={styles.hint}>
            {trNode(hint)}
          </span>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}
