import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { PasswordStrength } from "@/shared/components/form/PasswordStrength";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Alert } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { useToast } from "@/shared/components/ui/Toast";
import { ApiError } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
import { messageFor } from "@/shared/lib/messages";
import { passwordError } from "@/shared/lib/password";
import { changePassword } from "../api";
import styles from "./ProfilePages.module.css";

type Errors = Partial<Record<"current" | "next" | "confirm", string>>;

// Design 1.16: đổi mật khẩu — mọi thiết bị khác bị đăng xuất sau khi lưu.
export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [alert, setAlert] = useState<{ tone: "danger" | "ok"; title: string; body: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function fail(nextErrors: Errors, body = "Check the marked fields below. Nothing was changed.") {
    setErrors(nextErrors);
    setAlert({ tone: "danger", title: "Password not saved", body });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const found: Errors = {};
    if (!current) found.current = "Current password is required.";
    const weak = passwordError(next);
    if (weak) found.next = weak;
    else if (next === current) found.next = "The new password must differ from the current one.";
    if (confirm !== next) found.confirm = "The two passwords do not match.";
    if (Object.keys(found).length > 0) return fail(found);

    setBusy(true);
    setErrors({});
    setAlert(null);
    try {
      const res = await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setAlert({
        tone: "ok",
        title: "Password saved",
        body: `Every other device was signed out. The next change is due ${formatDate(res.nextChangeDue)}.`,
      });
      toast.show("Password saved. Other devices were signed out.", "ok");
    } catch (err) {
      if (err instanceof ApiError && err.code === "WRONG_PASSWORD") fail({ current: "The current password is not correct." });
      else if (err instanceof ApiError && (err.code === "WEAK_PASSWORD" || err.code === "SAME_PASSWORD")) {
        fail({ next: err.code === "SAME_PASSWORD" ? "The new password must differ from the current one." : messageFor(err) });
      } else fail({}, messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="MY ACCOUNT"
        title="Change your password."
        description="Changing the password signs out every other device. The club requires a change every 180 days."
      />

      <div className={styles.pwGrid}>
        <Card title="New password">
          <form onSubmit={onSubmit} noValidate className={styles.stack}>
            {alert && (
              <Alert tone={alert.tone} icon={alert.tone === "ok" ? "checkCircle" : "alert"} title={alert.title}>
                {alert.body}
              </Alert>
            )}
            <Field label="Current password" required error={errors.current}>
              <Input
                type="password"
                icon="key"
                placeholder="Enter the current password"
                autoComplete="current-password"
                value={current}
                disabled={busy}
                onChange={(e) => {
                  setCurrent(e.target.value);
                  setErrors((x) => ({ ...x, current: undefined }));
                }}
              />
            </Field>
            <Field label="New password" required error={errors.next}>
              <Input
                type="password"
                icon="key"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={next}
                disabled={busy}
                onChange={(e) => {
                  setNext(e.target.value);
                  setErrors((x) => ({ ...x, next: undefined }));
                }}
              />
            </Field>
            <PasswordStrength password={next} />
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
            <div className={styles.buttons}>
              <Button type="submit" icon="check" disabled={busy}>
                {busy ? "Saving…" : "Save password"}
              </Button>
              <Button tone="secondary" onClick={() => navigate("/profile")}>
                Back to profile
              </Button>
            </div>
          </form>
        </Card>

        <div className={styles.side}>
          <Card title="Club password rules">
            <ul className={styles.rules}>
              <li>At least 8 characters, and not one of the last three used.</li>
              <li>A mix of upper and lower case, digits or a symbol.</li>
              <li>Changed every 180 days; a reminder arrives 14 days ahead.</li>
              <li>Five wrong attempts lock the account for 15 minutes.</li>
            </ul>
          </Card>
          <Card title="Signed-in devices" subtitle="All other devices are signed out on save">
            <div className={styles.devices}>
              <div className={styles.device}>
                <span>Stable office · Windows</span>
                <b>this device</b>
              </div>
              <div className={styles.device}>
                <span>Trackside tablet</span>
                <b>18/09 · 16:40</b>
              </div>
              <div className={styles.device}>
                <span>Phone · Android</span>
                <b>17/09 · 20:05</b>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
