import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Field } from "@/shared/components/form/Field";
import { OtpInput } from "@/shared/components/form/OtpInput";
import { Alert } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { useToast } from "@/shared/components/ui/Toast";
import { ApiError } from "@/shared/lib/api";
import { formatCountdown, formatDateTime } from "@/shared/lib/format";
import { useCountdown } from "@/shared/lib/hooks";
import { otpMessage } from "@/shared/lib/messages";
import { otpStatus, resendOtp } from "../api";
import type { OtpPurpose, OtpTimes } from "../types";
import styles from "./OtpVerifyForm.module.css";

const CODE_LENGTH = 6;

interface OtpVerifyFormProps {
  email: string;
  purpose: OtpPurpose;
  // Nội dung Alert "đã gửi mã". Với quên mật khẩu phải TRUNG TÍNH (không khẳng định email có tồn tại).
  sentTitle: string;
  sentBody: (times: OtpTimes) => string;
  submitLabel: string;
  // Gọi API kiểm tra mã. Ném lỗi (ApiError) nếu sai — form tự hiện thông báo.
  onVerify: (code: string) => Promise<void>;
  footer: ReactNode;
}

// Form nhập mã OTP dùng cho cả xác minh email khi đăng ký và quên mật khẩu.
// Lo: đếm ngược hết hạn, nút gửi lại có thời gian chờ, lỗi sai mã còn mấy lần thử.
export function OtpVerifyForm({ email, purpose, sentTitle, sentBody, submitLabel, onVerify, footer }: OtpVerifyFormProps) {
  const toast = useToast();
  const [times, setTimes] = useState<OtpTimes | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    otpStatus(email, purpose)
      .then((t) => {
        if (!cancelled) setTimes(t);
      })
      .catch(() => {
        // OTP_NOT_FOUND: chưa có mã nào đang chờ => hiện thông báo và cho gửi mã mới.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [email, purpose]);

  const expiresLeft = useCountdown(times?.expiresAt ?? null);
  const resendLeft = useCountdown(times?.resendAt ?? null);
  const expired = times !== null && expiresLeft === 0;

  async function submit(value: string) {
    if (value.length < CODE_LENGTH) {
      setError(`Enter all ${CODE_LENGTH} digits.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onVerify(value);
    } catch (err) {
      setError(otpMessage(err));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit(code);
  }

  async function onResend() {
    setResending(true);
    setError("");
    try {
      setTimes(await resendOtp(email, purpose));
      setCode("");
      toast.show("A new code was sent.", "ok");
    } catch (err) {
      if (err instanceof ApiError && err.code === "OTP_COOLDOWN") {
        setTimes((t) => (t ? { ...t, resendAt: Number(err.data.resendAt) } : t));
      } else {
        setError(otpMessage(err));
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      {times && !expired && (
        <Alert tone="ok" icon="checkCircle" title={sentTitle}>
          {sentBody(times)}
        </Alert>
      )}
      {loaded && !times && (
        <Alert tone="warn" icon="clock" title="No code is waiting">
          Request a new code to continue.
        </Alert>
      )}
      {expired && (
        <Alert tone="warn" icon="clock" title="The code has expired">
          It was valid until {formatDateTime(times.expiresAt)}. Request a new one below.
        </Alert>
      )}

      <Field label="Verification code" required error={error} hint={times && !expired ? `The code expires in ${formatCountdown(expiresLeft)}.` : undefined}>
        <OtpInput value={code} onChange={setCode} disabled={busy} autoFocus onComplete={(v) => void submit(v)} />
      </Field>

      <Button type="submit" size="lg" block iconAfter="arrowRight" disabled={busy || expired || !times}>
        {busy ? "Checking…" : submitLabel}
      </Button>

      <Button
        tone="secondary"
        size="lg"
        block
        icon="mail"
        disabled={resending}
        blockedReason={resendLeft > 0 ? `A new code can be requested in ${formatCountdown(resendLeft)}.` : undefined}
        onClick={onResend}
      >
        Send the code again
      </Button>

      <p className={styles.footer}>{footer}</p>
    </form>
  );
}
