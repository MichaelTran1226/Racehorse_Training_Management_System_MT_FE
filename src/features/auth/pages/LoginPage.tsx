import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { useAuth } from '@/shared/components/layout/authContext';
import { AuthLayout } from "@/shared/components/layout/AuthLayout";
import { Alert } from "@/shared/components/ui/Alert";
import type { AlertTone } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { formatCountdown, formatTime } from "@/shared/lib/format";
import { useCountdown, useQueryParams } from "@/shared/lib/hooks";
import { useAppLanguage } from "@/shared/lib/language";
import { loginFailure } from "@/shared/lib/messages";
import type { LoginFailure } from "@/shared/lib/messages";
import { safeNext } from "../flow";
import { EMAIL_PLACEHOLDER } from "@/shared/lib/brand";
import styles from "./AuthPages.module.css";


import { tr } from "@/shared/i18n/tr";
const EMAIL_RE = /^[^\s@]+@gmail\.com$/i;

interface AlertState {
  tone: AlertTone;
  icon: string;
  title: string;
  body: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { status, signIn } = useAuth();
  const { t } = useAppLanguage();
  const params = useQueryParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [checking, setChecking] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | undefined>();
  const [footNote, setFootNote] = useState<string | undefined>();
  const [nextStep, setNextStep] = useState<LoginFailure["next"]>();
  // Khóa tạm sau 5 lần sai: mốc do server trả (retryAt). F5 thì thử lại sẽ nhận lại đúng mốc này.
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const lockLeft = useCountdown(lockUntil);
  const locked = lockLeft > 0;

  const next = safeNext(params?.get("next"));
  const justReset = params?.get("reset") === "1";
  const justInvited = params?.get("invited") === "1";

  // Đã đăng nhập rồi mà vào /login thì đưa thẳng vào app.
  useEffect(() => {
    if (status === "authenticated" && params) navigate(next, { replace: true });
  }, [status, params, next, navigate]);

  // Sửa email/mật khẩu => thoát trạng thái bị chặn của lần thử trước.
  function clearOutcome() {
    setBlockedReason(undefined);
    setFootNote(undefined);
    setNextStep(undefined);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (checking || locked) return;

    const mail = email.trim().toLowerCase();
    let eErr = "";
    let pErr = "";
    if (!mail) eErr = "Club email is required.";
    else if (!EMAIL_RE.test(mail)) eErr = "Email must be a @gmail.com address.";
    if (!password) pErr = "Password is required.";
    else if (password.length < 8) pErr = "Password must be at least 8 characters.";

    if (eErr || pErr) {
      setEmailError(eErr);
      setPasswordError(pErr);
      setAlert({ tone: "danger", icon: "alert", title: "Sign-in request not sent", body: "Check the marked fields below." });
      return;
    }

    setEmailError("");
    setPasswordError("");
    clearOutcome();
    setChecking(true);
    setAlert({ tone: "info", icon: "clock", title: "Signing in", body: "Checking the credentials and the permissions granted to this account." });

    try {
      await signIn(mail, password, remember);
      setAlert({ tone: "ok", icon: "checkCircle", title: "Signed in", body: "Opening your workspace." });
      navigate(next, { replace: true });
    } catch (err) {
      const failure = loginFailure(err);
      // Khóa tạm: Alert đếm ngược (lockAlert) lo phần hiển thị, không giữ thêm bản tĩnh.
      setAlert(failure.retryAt ? null : failure.alert);
      setPasswordError(failure.passwordError ?? "");
      setBlockedReason(failure.blockedReason);
      setFootNote(failure.footNote);
      setNextStep(failure.next);
      setLockUntil(failure.retryAt ?? null);
    } finally {
      setChecking(false);
    }
  }

  // Đang khóa tạm: Alert đếm ngược sống; hết giờ thì báo có thể thử lại.
  const lockAlert: AlertState | null =
    lockUntil === null
      ? null
      : locked
        ? {
            tone: "danger",
            icon: "alert",
            title: "Too many attempts",
            body: `Sign-in is paused for this account. Try again in ${formatCountdown(lockLeft)} (at ${formatTime(lockUntil)}), or use Forgot password to unlock it now.`,
          }
        : { tone: "info", icon: "clock", title: "You can try again now", body: "The 15-minute pause is over. Enter the password again." };
  const mail = email.trim().toLowerCase();

  const banner: AlertState | null = lockAlert ?? alert ?? (justReset
    ? { tone: "ok", icon: "checkCircle", title: "Password saved", body: "All other sessions were signed out. Sign in with the new password." }
    : justInvited
      ? { tone: "ok", icon: "checkCircle", title: "Invitation accepted", body: "The account is active. Sign in with your email and the password you just chose." }
      : null);

  return (
    <AuthLayout
      title={t("auth.loginTitle", "Sign in to start your shift.")}
      description={t("auth.loginSubtitle", "Use the club account you were issued. Each role sees only the work it is granted.")}
    >
      <form onSubmit={onSubmit} noValidate style={{ display: "contents" }}>
        {banner && (
          <Alert
            tone={banner.tone}
            icon={banner.icon}
            title={banner.title}
            action={
              nextStep === "verifyEmail" ? (
                <Button size="sm" tone="secondary" onClick={() => navigate(`/sign-up/verify?email=${encodeURIComponent(mail)}`)}>
                  Enter the code
                </Button>
              ) : nextStep === "acceptInvite" ? (
                <Button size="sm" tone="secondary" onClick={() => navigate(`/accept-invite?email=${encodeURIComponent(mail)}`)}>
                  Accept invitation
                </Button>
              ) : undefined
            }
          >
            {banner.body}
          </Alert>
        )}

        <Field label={t("auth.email", "Club email")} required error={emailError}>
          <Input
            type="email"
            icon="mail"
            placeholder={EMAIL_PLACEHOLDER}
            autoComplete="username"
            value={email}
            disabled={checking}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
              clearOutcome();
              // Khóa tạm tính theo email: đổi email thì bỏ đồng hồ (email mới được thử bình thường).
              setLockUntil(null);
            }}
          />
        </Field>

        <Field label={t("auth.password", "Password")} required error={passwordError}>
          <Input
            type="password"
            icon="key"
            placeholder={tr("Enter password")}
            autoComplete="current-password"
            value={password}
            disabled={checking}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
              clearOutcome();
            }}
          />
        </Field>

        <div className={styles.row}>
          <Checkbox label={t("auth.rememberMe", "Keep me signed in")} checked={remember} onChange={setRemember} disabled={checking} />
          <Link to="/forgot-password">{t("auth.forgotPassword", "Forgot password?")}</Link>
        </div>

        <Button
          type="submit"
          size="lg"
          block
          iconAfter="arrowRight"
          disabled={checking}
          blockedReason={locked ? tr(`Sign-in is paused. Try again in ${formatCountdown(lockLeft)}.`) : blockedReason}
        >
          {checking ? t("auth.submitting", "Signing in…") : t("auth.enterWorkspace", "Enter workspace")}
        </Button>

        <div className={styles.divider} aria-hidden="true">
          <span>{t("auth.or", "OR")}</span>
        </div>
        <p className={styles.foot}>
          {footNote ?? (
            <>
              {t("auth.noAccount", "No account yet?")} <Link to="/sign-up">{t("auth.signUpWait", "Sign up and wait for Club Manager approval")}</Link>
            </>
          )}
        </p>
        <p className={styles.foot}>
          {t("auth.invitedStaff", "Invited as staff?")} <Link to="/accept-invite">{t("auth.acceptInviteLink", "Accept the invitation")}</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
