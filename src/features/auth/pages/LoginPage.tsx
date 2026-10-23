import { useEffect, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { AuthLayout } from "@/shared/components/layout/AuthLayout";
import { Alert } from "@/shared/components/ui/Alert";
import type { AlertTone } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { formatCountdown } from "@/shared/lib/format";
import { useCountdown, useQueryParams } from "@/shared/lib/hooks";
import { useAppLanguage } from "@/shared/lib/language";
import { loginFailure } from "@/shared/lib/messages";
import type { LoginFailure } from "@/shared/lib/messages";
import { EMAIL_MAX, EMAIL_RE } from "@/shared/lib/email";
import { PASSWORD_MAX } from "@/shared/lib/password";
import { safeNext } from "../flow";
import { EMAIL_PLACEHOLDER } from "@/shared/lib/brand";
import { triggerCloudTransition } from "@/shared/lib/cloudTransition";
import styles from "./AuthPages.module.css";

interface AlertState {
  tone: AlertTone;
  icon: string;
  title: string;
  body: string;
}

// Mốc khóa tạm theo email, giữ trong tab để F5 vẫn thấy đồng hồ đếm ngược (server vẫn là nơi quyết định).
const LOCK_KEY = "equiflow.loginLocks";

function readLocks(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(LOCK_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function lockOf(mail: string): number | null {
  const until = readLocks()[mail];
  return until && until > Date.now() ? until : null;
}

function saveLock(mail: string, until: number | null) {
  try {
    const locks = readLocks();
    if (until) locks[mail] = until;
    else delete locks[mail];
    sessionStorage.setItem(LOCK_KEY, JSON.stringify(locks));
  } catch {
    // Không lưu được (chế độ riêng tư…): chỉ mất đồng hồ khi tải lại trang.
  }
}

function emailProblem(mail: string): string {
  if (!mail) return "Email is required.";
  if (!EMAIL_RE.test(mail)) return "Enter a valid @gmail.com address.";
  return "";
}

function passwordProblem(password: string): string {
  if (!password) return "Password is required.";
  if (!password.trim()) return "Password cannot be only spaces.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return "";
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [capsLock, setCapsLock] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [nextStep, setNextStep] = useState<LoginFailure["next"]>();
  // Khóa tạm sau nhiều lần sai: mốc do server trả (retryAt).
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const lockLeft = useCountdown(lockUntil);
  const locked = lockLeft > 0;

  const next = safeNext(params?.get("next"));
  const justReset = params?.get("reset") === "1";
  const justInvited = params?.get("invited") === "1";
  const mail = email.trim().toLowerCase();

  // Đã đăng nhập rồi mà vào /login thì đưa thẳng vào app.
  useEffect(() => {
    if (status === "authenticated" && params && !isTransitioning) navigate(next, { replace: true });
  }, [status, params, next, navigate, isTransitioning]);

  function onEmailChange(value: string) {
    setEmail(value);
    setEmailError("");
    setAlert(null);
    setNextStep(undefined);
    // Khóa tạm tính theo email: đổi email thì lấy đồng hồ của email mới (nếu có).
    setLockUntil(lockOf(value.trim().toLowerCase()));
  }

  function onPasswordKey(e: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(e.getModifierState("CapsLock"));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (checking || locked) return;

    const eErr = emailProblem(mail);
    const pErr = passwordProblem(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setAlert(null);
    setNextStep(undefined);
    setChecking(true);
    try {
      setIsTransitioning(true);
      await signIn(mail, password, remember);
      saveLock(mail, null);
      triggerCloudTransition(() => {
        navigate(next, { replace: true });
      });
    } catch (err) {
      setIsTransitioning(false);
      const failure = loginFailure(err);
      setAlert(failure.alert);
      setEmailError(failure.emailError ?? "");
      setPasswordError(failure.passwordError ?? "");
      setNextStep(failure.next);
      if (failure.retryAt) {
        setLockUntil(failure.retryAt);
        saveLock(mail, failure.retryAt);
      }
    } finally {
      setChecking(false);
    }
  }

  // Đang khóa tạm: đồng hồ đếm ngược; hết giờ thì báo có thể đăng nhập lại.
  const lockAlert: AlertState | null =
    lockUntil === null
      ? null
      : locked
        ? { tone: "danger", icon: "clock", title: "Sign-in paused", body: `Try again in ${formatCountdown(lockLeft)} or reset your password.` }
        : { tone: "info", icon: "clock", title: "You can sign in again", body: "" };

  const banner: AlertState | null = lockAlert ?? alert ?? (justReset
    ? { tone: "ok", icon: "checkCircle", title: "Password changed", body: "Please sign in again." }
    : justInvited
      ? { tone: "ok", icon: "checkCircle", title: "Account activated", body: "Please sign in." }
      : null);

  const action =
    nextStep === "verifyEmail" ? (
      <Button size="sm" tone="secondary" onClick={() => navigate(`/sign-up/verify?email=${encodeURIComponent(mail)}`)}>
        Enter the code
      </Button>
    ) : nextStep === "acceptInvite" ? (
      <Button size="sm" tone="secondary" onClick={() => navigate(`/accept-invite?email=${encodeURIComponent(mail)}`)}>
        Accept invitation
      </Button>
    ) : nextStep === "signUp" ? (
      <Button size="sm" tone="secondary" onClick={() => navigate("/sign-up")}>
        Sign up again
      </Button>
    ) : undefined;

  return (
    <AuthLayout title={t("auth.loginTitle", "Sign in")}>
      <form onSubmit={onSubmit} noValidate style={{ display: "contents" }}>
        {banner && (
          <Alert tone={banner.tone} icon={banner.icon} title={banner.title} action={action}>
            {banner.body}
          </Alert>
        )}

        <Field label={t("auth.email", "Email")} required error={emailError}>
          <Input
            type="email"
            icon="mail"
            placeholder={EMAIL_PLACEHOLDER}
            autoComplete="username"
            maxLength={EMAIL_MAX}
            value={email}
            disabled={checking}
            onChange={(e) => onEmailChange(e.target.value)}
            // Chỉ báo sai định dạng khi rời ô; ô trống thì đợi lúc bấm Đăng nhập.
            onBlur={() => setEmailError(mail ? emailProblem(mail) : "")}
          />
        </Field>

        <Field
          label={t("auth.password", "Password")}
          required
          error={passwordError}
          hint={capsLock ? "Caps Lock is on." : undefined}
        >
          <Input
            type="password"
            icon="key"
            autoComplete="current-password"
            maxLength={PASSWORD_MAX}
            value={password}
            disabled={checking}
            onKeyDown={onPasswordKey}
            onKeyUp={onPasswordKey}
            onBlur={() => setCapsLock(false)}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
              setAlert(null);
            }}
          />
        </Field>

        <div className={styles.row}>
          <Checkbox label={t("auth.rememberMe", "Remember me")} checked={remember} onChange={setRemember} disabled={checking} />
          <Link to="/forgot-password">{t("auth.forgotPassword", "Forgot password?")}</Link>
        </div>

        <Button type="submit" size="lg" block iconAfter="arrowRight" disabled={checking || locked}>
          {checking ? t("auth.submitting", "Signing in…") : t("auth.submitSignIn", "Sign in")}
        </Button>

        <p className={styles.foot}>
          {t("auth.noAccount", "No account yet?")} <Link to="/sign-up">{t("auth.signUpLink", "Sign up")}</Link>
        </p>
        <p className={styles.foot}>
          {t("auth.invitedStaff", "Invited as staff?")} <Link to="/accept-invite">{t("auth.acceptInviteLink", "Accept invitation")}</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
