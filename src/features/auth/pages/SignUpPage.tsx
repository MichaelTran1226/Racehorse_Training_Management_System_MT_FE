import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { AuthLayout, HERO_TEAM } from "@/shared/components/layout/AuthLayout";
import { Alert } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { ApiError } from "@/shared/lib/api";
import { messageFor } from "@/shared/lib/messages";
import { register } from "../api";
import { EMAIL_PLACEHOLDER } from "@/shared/lib/brand";
import styles from "./AuthPages.module.css";

const EMAIL_RE = /^[^\s@]+@gmail\.com$/i;

// Trang này CHỈ để Horse Owner tự đăng ký (không có ô chọn vai trò); nhân viên do Club Manager mời.

type Errors = Partial<Record<"name" | "email" | "password" | "confirm", string>>;

export default function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [alertBody, setAlertBody] = useState("");
  const [busy, setBusy] = useState(false);

  function clearError(key: keyof Errors) {
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function fail(next: Errors) {
    setErrors(next);
    const count = Object.values(next).filter(Boolean).length;
    setAlertBody(
      count === 1
        ? "One field needs attention before the request can go to the Club Manager."
        : `${count} fields need attention before the request can go to the Club Manager.`,
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const mail = email.trim().toLowerCase();
    const next: Errors = {};
    if (!name.trim()) next.name = "Full name is required.";
    if (!mail) next.email = "Club email is required.";
    else if (!EMAIL_RE.test(mail)) next.email = "Email must be a @gmail.com address.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (confirm !== password) next.confirm = "The two passwords do not match.";
    if (Object.keys(next).length > 0) return fail(next);

    setBusy(true);
    setErrors({});
    setAlertBody("");
    try {
      await register({ fullName: name.trim(), email: mail, role: "HORSE_OWNER", password });
      // Bước kế tiếp: nhập mã OTP gửi về email.
      navigate(`/sign-up/verify?email=${encodeURIComponent(mail)}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_TAKEN") fail({ email: messageFor(err) });
      else {
        setErrors({});
        setAlertBody(messageFor(err));
      }
    } finally {
      setBusy(false);
    }
  }

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <AuthLayout
      compact
      hero={HERO_TEAM}
      title="Request a Horse Owner account."
      description="For owners who keep horses at the club. The Club Manager reviews every request before the account can be used. Staff accounts are created by the Club Manager."
    >
      <form onSubmit={onSubmit} noValidate style={{ display: "contents" }}>
        {alertBody && (
          <Alert tone="danger" icon="alert" title="Request not sent">
            {alertBody}
          </Alert>
        )}

        <Field label="Full name" required error={errors.name}>
          <Input
            icon="user"
            placeholder="Nguyễn Hoàng Anh"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError("name");
            }}
          />
        </Field>

        <Field label="Club email" required error={errors.email} hint={`For example ${EMAIL_PLACEHOLDER}`}>
          <Input
            type="email"
            icon="mail"
            placeholder={EMAIL_PLACEHOLDER}
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
          />
        </Field>

        <Field label="Password" required error={errors.password}>
          <Input
            type="password"
            icon="key"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
          />
        </Field>

        <Field label="Confirm password" required error={errors.confirm}>
          <Input
            type="password"
            icon="key"
            placeholder="Repeat the password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              clearError("confirm");
            }}
          />
        </Field>

        <Checkbox label="I accept the club data and stable safety rules" checked={agree} onChange={setAgree} />

        <Button
          type="submit"
          size="lg"
          block
          iconAfter="arrowRight"
          disabled={busy}
          blockedReason={!agree ? "Accept the club rules to send the request." : undefined}
        >
          {busy ? "Sending…" : "Send request to Club Manager"}
        </Button>

        <p className={styles.foot}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        {hasErrors && <span className="sr-only" role="status">The form has errors.</span>}
      </form>
    </AuthLayout>
  );
}
