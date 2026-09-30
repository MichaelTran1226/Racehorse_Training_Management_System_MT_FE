import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { AuthLayout } from "@/shared/components/layout/AuthLayout";
import { Alert } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { ApiError } from "@/shared/lib/api";
import { messageFor } from "@/shared/lib/messages";
import { forgotPassword } from "../api";
import { EMAIL_PLACEHOLDER } from "@/shared/lib/brand";
import styles from "./AuthPages.module.css";

const EMAIL_RE = /^[^\s@]+@gmail\.com$/i;

// Bước 1 quên mật khẩu: nhập email để nhận mã OTP.
// Kết quả LUÔN giống nhau dù email có tồn tại hay không (thông báo trung tính).
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const mail = email.trim().toLowerCase();
    if (!mail) return setError("Club email is required.");
    if (!EMAIL_RE.test(mail)) return setError("Email must be a @gmail.com address.");

    setBusy(true);
    setError("");
    setFailure("");
    try {
      await forgotPassword(mail);
      navigate(`/forgot-password/verify?email=${encodeURIComponent(mail)}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_EMAIL") setError("Email must be a @gmail.com address.");
      else setFailure(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password."
      description="Enter the club email of the account. A 6-digit code follows by email and stays valid for 10 minutes."
    >
      <form onSubmit={onSubmit} noValidate style={{ display: "contents" }}>
        {failure && (
          <Alert tone="danger" icon="xCircle" title="The code could not be sent">
            {failure}
          </Alert>
        )}
        <Field label="Club email" required error={error} hint="For security the answer is the same whether or not the email exists">
          <Input
            type="email"
            icon="mail"
            placeholder={EMAIL_PLACEHOLDER}
            autoComplete="username"
            value={email}
            disabled={busy}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />
        </Field>
        <Button type="submit" size="lg" block iconAfter="arrowRight" disabled={busy}>
          {busy ? "Sending…" : "Send OTP"}
        </Button>
        <p className={styles.foot}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
