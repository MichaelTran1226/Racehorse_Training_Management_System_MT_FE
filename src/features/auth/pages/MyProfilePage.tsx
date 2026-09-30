import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { useAuth, useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Avatar } from "@/shared/components/ui/Avatar";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Switch } from "@/shared/components/ui/Switch";
import { Tooltip } from "@/shared/components/ui/Tooltip";
import { useToast } from "@/shared/components/ui/Toast";
import { formatDate, formatDateTime, padCount } from "@/shared/lib/format";
import { messageFor } from "@/shared/lib/messages";
import { NOTIFY_META, notifyLock, PERMISSIONS, ROLE_LABEL } from "@/shared/lib/permissions";
import { ACCOUNT_STATUS } from "@/shared/lib/status";
import { updateNotification, updateProfile } from "../api";
import styles from "./ProfilePages.module.css";

// Design 1.15: hồ sơ cá nhân — dùng chung cho cả 5 vai trò, mỗi người chỉ thấy hồ sơ của mình.
export default function MyProfilePage() {
  const user = useCurrentUser();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);

  const granted = PERMISSIONS.filter((p) => user.permissions[p.key]).length;
  const status = ACCOUNT_STATUS[user.status];

  async function onSave() {
    if (!fullName.trim()) {
      setNameError("Full name is required.");
      return;
    }
    setSaving(true);
    setNameError("");
    try {
      const res = await updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      setUser(res.user);
      toast.show("Details saved.", "ok");
    } catch (err) {
      toast.show(messageFor(err), "danger");
    } finally {
      setSaving(false);
    }
  }

  async function onNotify(key: (typeof NOTIFY_META)[number]["key"], value: boolean) {
    try {
      const res = await updateNotification(key, value);
      setUser(res.user);
      toast.show("Notification setting saved.", "ok");
    } catch (err) {
      toast.show(messageFor(err), "danger");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="MY ACCOUNT"
        title="Your details and how you are reached."
        description="Name and contact details are yours to change. Role and permissions belong to the Club Manager."
      />

      <div className={styles.profileGrid}>
        <div className={styles.stack}>
          <Card title="Personal details">
            <div className={styles.twoCols}>
              <Field label="Full name" required error={nameError}>
                <Input
                  icon="user"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setNameError("");
                  }}
                />
              </Field>
              <Field label="Phone">
                <Input autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field label="Club email" hint="The sign-in address is changed by the Club Manager">
                <Input icon="mail" value={user.email} disabled readOnly />
              </Field>
              <Field label="Role">
                <Tooltip label="Only the Club Manager can change a role." placement="bottom" block>
                  <Input value={ROLE_LABEL[user.role]} disabled readOnly />
                </Tooltip>
              </Field>
            </div>
          </Card>

          <Card title="Notifications" subtitle="Saved as soon as they are switched">
            <div className={styles.stack}>
              {NOTIFY_META.map((n) => {
                const lock = notifyLock(user.role, n.key);
                return (
                  <div key={n.key} className={styles.notify}>
                    <div>
                      <strong>{n.name}</strong>
                      <span>{n.note}</span>
                    </div>
                    <Switch
                      label={n.name}
                      checked={lock.locked ? Boolean(lock.value) : user.notify[n.key]}
                      blockedReason={lock.locked ? lock.reason : undefined}
                      onChange={(v) => void onNotify(n.key, v)}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className={styles.stack}>
          <Card title="Account">
            <div className={styles.stack}>
              <div className={styles.identity}>
                <Avatar name={user.fullName} size={42} />
                <div>
                  <strong>{user.fullName}</strong>
                  <span>
                    {ROLE_LABEL[user.role]} · since {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
              <div className={styles.rows}>
                <div>
                  <span>Status</span>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </div>
                <div>
                  <span>Permissions</span>
                  <b className={styles.num}>{padCount(granted)} granted</b>
                </div>
                <div>
                  <span>Last sign-in</span>
                  <b>{user.lastActive ? formatDateTime(user.lastActive) : "—"}</b>
                </div>
              </div>
              <Button tone="secondary" size="sm" block icon="key" onClick={() => navigate("/profile/password")}>
                Change password
              </Button>
            </div>
          </Card>

          <Card title="Save">
            <div className={styles.stack}>
              <Button block icon="check" disabled={saving} onClick={onSave}>
                {saving ? "Saving…" : "Save details"}
              </Button>
              <p className={styles.note}>
                Changing a name is written to the Audit Log because it appears on Training Plans and medical records.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
