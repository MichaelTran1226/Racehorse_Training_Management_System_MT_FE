import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { PasswordStrength } from "@/shared/components/form/PasswordStrength";
import { AuthLayout } from "@/shared/components/layout/AuthLayout";
import { Alert } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { ApiError } from "@/shared/lib/api";
import { formatDateTime } from "@/shared/lib/format";
import { messageFor } from "@/shared/lib/messages";
import { passwordError } from "@/shared/lib/password";
import { resetPassword } from "../api";
import { resetFlow } from "../flow";
import type { ResetFlow } from "../flow";
import styles from "./AuthPages.module.css";

// Bước 3 quên mật khẩu (design 1.6): đặt mật khẩu mới sau khi OTP đã đúng.
// Cũng là bước cuối của Accept Invite (flow.kind = "invite"): nhân viên đặt mật khẩu lần đầu.
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<ResetFlow | null | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [alert, setAlert] = useState<{ title: string; body: string } | null>(null);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = resetFlow.get();
    setFlow(stored);
    // Chưa qua bước nhập OTP thì không vào được màn này.
    if (!stored) navigate("/forgot-password", { replace: true });
  }, [navigate]);

  if (!flow) return null;
  const invite = flow.kind === "invite";
  const restart = invite ? `/accept-invite?email=${encodeURIComponent(flow.email)}` : "/forgot-password";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !flow) return;

    const next: typeof errors = {};
    const weak = passwordError(password);
    if (weak) next.password = weak;
    if (confirm !== password) next.confirm = "The two passwords do not match.";
    if (next.password || next.confirm) {
      setErrors(next);
      setAlert({ title: "Password not saved", body: "Check the marked fields below." });
      return;
    }

    setBusy(true);
    setErrors({});
    setAlert(null);
    try {
      await resetPassword(flow.token, password);
      resetFlow.clear();
      navigate(invite ? "/login?invited=1" : "/login?reset=1");
    } catch (err) {
      if (err instanceof ApiError && err.code === "RESET_EXPIRED") setExpired(true);
      else setAlert({ title: "Password not saved", body: messageFor(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title={invite ? "Choose your password." : "Choose the new password."}
      description={
        invite
          ? `Welcome${flow.fullName ? `, ${flow.fullName}` : ""}. The invitation for ${flow.email} was accepted; set a password before ${formatDateTime(flow.expiresAt).split(" · ")[1]} to activate the account.`
          : `Resetting for ${flow.email}. The code was accepted; this step expires at ${formatDateTime(flow.expiresAt).split(" · ")[1]}.`
      }
    >
      <form onSubmit={onSubmit} noValidate style={{ display: "contents" }}>
        {expired && (
          <Alert tone="warn" icon="clock" title={invite ? "This step has expired" : "This reset has expired"}>
            Request a new code to set the password.
          </Alert>
        )}
        {alert && (
          <Alert tone="danger" icon="alert" title={alert.title}>
            {alert.body}
          </Alert>
        )}

        <Field label="New password" required error={errors.password}>
          <Input
            type="password"
            icon="key"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={password}
            disabled={busy}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((x) => ({ ...x, password: undefined }));
            }}
          />
        </Field>

        <PasswordStrength password={password} />

        <Field label="Confirm new password" required error={errors.confirm}>
          <Input
            type="password"
            icon="key"
            placeholder="Repeat the new password"
            autoComplete="new-password"
            value={confirm}
            disabled={busy}
            onChange={(e) => {
              setConfirm(e.target.value);
              setErrors((x) => ({ ...x, confirm: undefined }));
            }}
          />
        </Field>

        <Button type="submit" size="lg" block iconAfter="arrowRight" disabled={busy || expired}>
          {busy ? "Saving…" : invite ? "Activate account" : "Save password and sign in"}
        </Button>
        <p className={styles.foot}>
          Code expired? <Link to={restart}>Request a new one</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
