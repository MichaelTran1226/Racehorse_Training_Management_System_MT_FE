import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBreadcrumbTail } from "@/shared/components/layout/BreadcrumbContext";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Alert } from "@/shared/components/ui/Alert";
import { Avatar } from "@/shared/components/ui/Avatar";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { ConfirmModal } from "@/shared/components/ui/ConfirmModal";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Switch } from "@/shared/components/ui/Switch";
import { useToast } from "@/shared/components/ui/Toast";
import { ApiError } from "@/shared/lib/api";
import { formatDate, padCount } from "@/shared/lib/format";
import { messageFor } from "@/shared/lib/messages";
import { PERMISSION_GROUPS, PERMISSIONS, permissionLock, ROLE_LABEL } from "@/shared/lib/permissions";
import type { PermissionMeta } from "@/shared/lib/permissions";
import { ACCOUNT_STATUS } from "@/shared/lib/status";
import type { PermissionKey, PermissionMap, PublicAccount } from "@/shared/types/auth";
import { getAccount, savePermissions } from "../api";
import styles from "./PermissionMatrix.module.css";

const GENERIC_EFFECT = "The matching sidebar items disappear at the next page load, and opening their URLs returns 403 Access Denied.";

// Giá trị thực sự hiển thị của một công tắc: quyền bị khóa thì lấy giá trị ép buộc.
function effective(account: PublicAccount, perms: PermissionMap, meta: PermissionMeta): boolean {
  const lock = permissionLock(account.role, meta);
  return lock.locked ? Boolean(lock.value) : perms[meta.key];
}

// Design 1.10 + 1.11: quyền của MỘT tài khoản — cấp/thu hồi, thu hồi phải xác nhận, lưu rồi mới có hiệu lực.
export default function PermissionMatrix({ accountId }: { accountId: string }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [account, setAccount] = useState<PublicAccount | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [draft, setDraft] = useState<PermissionMap | null>(null); // bản đang sửa
  const [revokeKey, setRevokeKey] = useState<PermissionKey | null>(null);
  const [saving, setSaving] = useState(false);

  useBreadcrumbTail(account?.fullName);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await getAccount(accountId);
      setAccount(res.account);
      setDraft(res.account.permissions);
      setState("ready");
    } catch (err) {
      setState(err instanceof ApiError && err.code === "NOT_FOUND" ? "missing" : "error");
    }
  }, [accountId]);

  useEffect(() => {
    void load();
  }, [load]);

  const changes = useMemo(() => {
    if (!account || !draft) return { granted: 0, revoked: 0 };
    let granted = 0;
    let revoked = 0;
    for (const meta of PERMISSIONS) {
      const before = effective(account, account.permissions, meta);
      const after = effective(account, draft, meta);
      if (after && !before) granted += 1;
      if (!after && before) revoked += 1;
    }
    return { granted, revoked };
  }, [account, draft]);

  const dirty = changes.granted + changes.revoked > 0;

  if (state === "loading") {
    return (
      <>
        <PageHeader eyebrow="MANAGEMENT WORKSPACE" title="Loading permissions…" />
        <Card>
          <div aria-busy="true" style={{ height: 240 }} />
        </Card>
      </>
    );
  }

  if (state === "missing" || state === "error" || !account || !draft) {
    return (
      <>
        <PageHeader eyebrow="MANAGEMENT WORKSPACE" title="Permissions of an account." />
        <Card>
          <EmptyState
            icon={state === "missing" ? "users" : "refresh"}
            title={state === "missing" ? "This account does not exist." : "The account could not be loaded."}
            description={
              state === "missing"
                ? "It may have been removed. Go back to the account list and pick another one."
                : "The account service did not answer. Nothing was changed."
            }
            action={
              <Button size="sm" icon={state === "missing" ? "arrowLeft" : "refresh"} onClick={() => (state === "missing" ? navigate("/accounts") : load())}>
                {state === "missing" ? "Back to accounts" : "Try again"}
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  const status = ACCOUNT_STATUS[account.status];
  const total = PERMISSIONS.length;
  const on = PERMISSIONS.filter((m) => effective(account, draft, m)).length;

  function toggle(key: PermissionKey, next: boolean) {
    if (next) setDraft((d) => (d ? { ...d, [key]: true } : d));
    else setRevokeKey(key); // thu hồi phải qua hộp xác nhận
  }

  function discard() {
    if (!account) return;
    setDraft(account.permissions);
    toast.show("Changes discarded. The saved permission list is back.", "warn");
  }

  async function save() {
    if (!account || !draft || !dirty) return;
    setSaving(true);
    try {
      const res = await savePermissions(account.id, draft);
      setAccount(res.account);
      setDraft(res.account.permissions);
      toast.show(`Permissions saved. ${res.granted} granted, ${res.revoked} revoked for ${account.fullName}.`, "ok");
    } catch (err) {
      // Lưu lỗi: giữ nguyên bản đang sửa để không mất công.
      toast.show(err instanceof ApiError && err.code === "NETWORK_ERROR" ? "Permissions not saved. The account service did not answer." : messageFor(err), "danger");
    } finally {
      setSaving(false);
    }
  }

  const revokeMeta = revokeKey ? PERMISSIONS.find((p) => p.key === revokeKey) : undefined;

  const saveButton = (size: "sm" | "md", block: boolean) => (
    <Button size={size} block={block} icon="check" disabled={saving} blockedReason={!dirty ? "No changes to save." : undefined} onClick={save}>
      {saving ? "Saving…" : "Save permissions"}
    </Button>
  );
  const discardButton = (size: "sm" | "md", block: boolean) => (
    <Button tone="secondary" size={size} block={block} icon="refresh" disabled={!dirty || saving} onClick={discard}>
      {size === "sm" ? "Discard" : "Discard changes"}
    </Button>
  );

  return (
    <>
      <PageHeader
        eyebrow="MANAGEMENT WORKSPACE"
        title={`Permissions of ${account.fullName}.`}
        description={`${ROLE_LABEL[account.role]} · ${account.email} · active since ${formatDate(account.createdAt)}. Changes take effect at the next page load for that account.`}
      />

      {dirty && (
        <Alert tone="warn" icon="alert" title="Unsaved permission changes">
          {changes.granted > 0 && `${changes.granted} to grant`}
          {changes.granted > 0 && changes.revoked > 0 && " · "}
          {changes.revoked > 0 && `${changes.revoked} to revoke`}. Save to apply them, or discard to keep the saved list.
        </Alert>
      )}

      <div className={styles.compact}>
        <div className={styles.compactWho}>
          <Avatar name={account.fullName} size={34} />
          <div>
            <strong>
              {account.fullName} · {ROLE_LABEL[account.role]}
            </strong>
            <span>
              Granted {padCount(on)} of {padCount(total)} · last change {account.permissionsChangedAt ? formatDate(account.permissionsChangedAt) : "—"}
            </span>
          </div>
        </div>
        <div className={styles.compactBtns}>
          {discardButton("sm", false)}
          {saveButton("sm", false)}
        </div>
      </div>

      <div className={styles.grid}>
        <Card title="Permission list" subtitle="Grouped the same way as the sidebar">
          <div className={styles.groups}>
            {PERMISSION_GROUPS.map((group) => (
              <div key={group}>
                <p className={styles.groupLabel}>{group}</p>
                {PERMISSIONS.filter((p) => p.group === group).map((meta) => {
                  const lock = permissionLock(account.role, meta);
                  return (
                    <div key={meta.key} className={styles.row}>
                      <div className={styles.rowText}>
                        <strong>{meta.name}</strong>
                        <span>{meta.note}</span>
                      </div>
                      <Switch
                        label={meta.name}
                        checked={effective(account, draft, meta)}
                        blockedReason={lock.locked ? lock.reason : undefined}
                        onChange={(v) => toggle(meta.key, v)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        <div className={styles.aside}>
          <Card title="Account">
            <div className={styles.facts}>
              <div className={styles.identity}>
                <Avatar name={account.fullName} size={38} />
                <div>
                  <strong>{account.fullName}</strong>
                  <span>{ROLE_LABEL[account.role]}</span>
                </div>
              </div>
              <div>
                <span>Status</span>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
              <div>
                <span>Granted</span>
                <b className={styles.num}>
                  {padCount(on)} of {padCount(total)}
                </b>
              </div>
              <div>
                <span>Last change</span>
                <b>{account.permissionsChangedAt ? formatDate(account.permissionsChangedAt) : "—"}</b>
              </div>
              <div>
                <span>Changed by</span>
                <b>{account.permissionsChangedBy ?? "—"}</b>
              </div>
            </div>
          </Card>
          <Card title="Save changes" subtitle="Revoking asks for confirmation first">
            <div className={styles.saveStack}>
              {saveButton("md", true)}
              {discardButton("md", true)}
              <p className={styles.note}>Every change is written to the Audit Log with the time, the editor and the previous value.</p>
            </div>
          </Card>
        </div>
      </div>

      {revokeMeta && (
        <ConfirmModal
          title={`Revoke “${revokeMeta.name}”?`}
          subtitle={`${account.fullName} · ${ROLE_LABEL[account.role]}`}
          tone="danger"
          confirmLabel="Revoke permission"
          cancelLabel="Keep permission"
          onCancel={() => setRevokeKey(null)}
          onConfirm={() => {
            setDraft((d) => (d ? { ...d, [revokeMeta.key]: false } : d));
            setRevokeKey(null);
          }}
        >
          {revokeMeta.revokeEffect ? `${revokeMeta.revokeEffect} ` : ""}
          {GENERIC_EFFECT}
        </ConfirmModal>
      )}
    </>
  );
}
