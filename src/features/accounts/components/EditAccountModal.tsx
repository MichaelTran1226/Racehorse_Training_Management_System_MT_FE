import { useState } from "react";
import type { FormEvent } from "react";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { ApiError } from "@/shared/lib/api";
import { formatDateTime } from "@/shared/lib/format";
import { messageFor } from "@/shared/lib/messages";
import { ROLE_LABEL } from "@/shared/lib/permissions";
import { ACCOUNT_STATUS } from "@/shared/lib/status";
import type { AccountStatus, PublicAccount } from "@/shared/types/auth";
import { updateAccount } from "../api";
import styles from "./EditAccountModal.module.css";

// Chỉ xóa hẳn được tài khoản chưa từng hoạt động (khớp backend); tài khoản đã dùng thì vô hiệu hóa.
const DELETABLE: AccountStatus[] = ["INVITED", "PENDING_EMAIL", "REJECTED"];

interface EditAccountModalProps {
  account: PublicAccount;
  isSelf: boolean;
  isLastManager: boolean; // Club Manager hoạt động cuối cùng
  onClose: () => void;
  onSaved: (account: PublicAccount) => void;
  onDeactivate: () => void; // mở hộp xác nhận vô hiệu hóa (trang cha lo)
  onDelete: () => void; // mở hộp xác nhận xóa hẳn (trang cha lo)
}

// Club Manager sửa họ tên + số điện thoại của một tài khoản, xem ai mời / ai đổi trạng thái gần nhất,
// và (vùng cuối) vô hiệu hóa hoặc xóa hẳn tài khoản. Email và vai trò chỉ để xem.
export function EditAccountModal({ account, isSelf, isLastManager, onClose, onSaved, onDeactivate, onDelete }: EditAccountModalProps) {
  const [fullName, setFullName] = useState(account.fullName);
  const [phone, setPhone] = useState(account.phone);
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const status = ACCOUNT_STATUS[account.status];
  const unchanged = fullName.trim() === account.fullName && phone.trim() === account.phone;
  const deletable = DELETABLE.includes(account.status);
  const canDeactivate = account.status === "ACTIVE" || account.status === "LOCKED";
  const removeBlocked = isSelf
    ? "You cannot do this to your own account. Ask another Club Manager."
    : isLastManager
      ? "The club must keep at least one active Club Manager."
      : undefined;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!fullName.trim()) return setErrors({ fullName: "Full name is required." });

    setBusy(true);
    setErrors({});
    try {
      const res = await updateAccount(account.id, { fullName: fullName.trim(), phone: phone.trim() });
      onSaved(res.account);
    } catch (err) {
      const field = err instanceof ApiError ? err.data.field : undefined;
      if (field === "fullName" || field === "phone") setErrors({ [field]: messageFor(err) });
      else setErrors({ form: messageFor(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Edit account" subtitle={`${ROLE_LABEL[account.role]} · ${account.email}`} width={500} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className={styles.form}>
        <dl className={styles.facts}>
          <dt>Status</dt>
          <dd>
            <Badge tone={status.tone}>{status.label}</Badge>
          </dd>
          {account.statusChangedBy && account.statusChangedAt && (
            <>
              <dt>Last change</dt>
              <dd>
                {account.statusChangedBy} · {formatDateTime(account.statusChangedAt)}
              </dd>
            </>
          )}
          {account.statusReason && (
            <>
              <dt>Reason</dt>
              <dd>{account.statusReason}</dd>
            </>
          )}
          {account.invitedBy && (
            <>
              <dt>Invited by</dt>
              <dd>
                {account.invitedBy} · {formatDateTime(account.createdAt)}
              </dd>
            </>
          )}
          {account.requestCode && (
            <>
              <dt>Request</dt>
              <dd>
                {account.requestCode}
                {account.requestedAt ? ` · ${formatDateTime(account.requestedAt)}` : ""}
              </dd>
            </>
          )}
        </dl>

        {errors.form && <span className={styles.formError}>{errors.form}</span>}
        <Field label="Full name" required error={errors.fullName}>
          <Input icon="user" value={fullName} data-autofocus onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <Input type="tel" autoComplete="off" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Club email" hint="The email is the sign-in name, so it cannot be changed here.">
          <Input icon="mail" value={account.email} readOnly disabled />
        </Field>

        <div className={styles.buttons}>
          <Button tone="secondary" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" size="sm" icon="check" disabled={busy || unchanged}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>

        {deletable && (
          <div className={styles.danger}>
            <p className={styles.dangerText}>
              <strong>Delete this account</strong>
              It has never been used, so it can be removed for good.
            </p>
            <Button tone="danger" size="sm" icon="trash" disabled={busy} onClick={onDelete}>
              Delete
            </Button>
          </div>
        )}
        {canDeactivate && (
          <div className={styles.danger}>
            <p className={styles.dangerText}>
              <strong>Deactivate this account</strong>
              Sign-in stops and every session ends. Its records stay in place; it can be reactivated later.
            </p>
            <Button tone="danger" size="sm" icon="ban" disabled={busy} blockedReason={removeBlocked} onClick={onDeactivate}>
              Deactivate
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}
