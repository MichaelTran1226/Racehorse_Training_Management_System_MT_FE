import { useEffect, useRef } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { cx } from "@/shared/lib/cx";
import { useFieldControl } from "./Field";
import styles from "./OtpInput.module.css";

interface OtpInputProps {
  value: string; // chỉ gồm chữ số
  onChange: (value: string) => void;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
}

// Ô nhập mã OTP: mỗi chữ số một ô. Hỗ trợ gõ, dán cả chuỗi, Backspace, phím ← →,
// và gợi ý tự điền mã của điện thoại (autoComplete="one-time-code").
export function OtpInput({ value, onChange, length = 6, invalid, disabled, autoFocus, onComplete }: OtpInputProps) {
  const field = useFieldControl();
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const isInvalid = invalid ?? field?.invalid ?? false;
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) refs.current[Math.min(value.length, length - 1)]?.focus();
    // chỉ chạy lúc mở màn hình
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function focusAt(index: number) {
    refs.current[Math.max(0, Math.min(length - 1, index))]?.focus();
  }

  function commit(next: string) {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  }

  function onInput(index: number, raw: string) {
    const typed = raw.replace(/\D/g, "");
    if (typed.length > 1) {
      // Tự điền hoặc dán cả chuỗi vào một ô.
      commit(typed);
      focusAt(typed.length >= length ? length - 1 : typed.length);
      return;
    }
    const next = [...digits];
    next[index] = typed;
    commit(next.join(""));
    if (typed) focusAt(index + 1);
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index]) {
      e.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      commit(next.join(""));
      focusAt(index - 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(index + 1);
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    commit(pasted);
    focusAt(pasted.length >= length ? length - 1 : pasted.length);
  }

  return (
    <div role="group" aria-label="6-digit code" className={styles.row} aria-describedby={field?.describedBy}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          id={i === 0 ? field?.id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={i === 0 ? length : 1}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={isInvalid || undefined}
          disabled={disabled}
          value={digit}
          className={cx(styles.box, isInvalid && styles.invalid)}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
