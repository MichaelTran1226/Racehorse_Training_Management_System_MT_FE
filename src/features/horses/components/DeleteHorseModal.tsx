import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Textarea } from "@/shared/components/form/Textarea";
import { Alert } from "@/shared/components/ui/Alert";
import { useToast } from '@/shared/components/ui/useToast';
import { messageFor } from "@/shared/lib/messages";
import { deleteHorse, restoreHorse } from "../api";
import type { Horse } from "../types";

import { tr } from "@/shared/i18n/tr";
interface DeleteHorseModalProps {
  horse: Horse;
  isOpen: boolean;
  onClose: () => void;
}

const UNDO_MS = 10_000;

/**
 * DL-1.10 Xóa hồ sơ (xóa mềm, chỉ CM). Chỉ dùng cho hồ sơ tạo nhầm. Sau khi xóa về danh sách,
 * toast có nút Undo trong 10 giây (bấm = khôi phục ngay, BE tự ghi lý do "Hoàn tác thao tác xóa").
 */
export function DeleteHorseModal({ horse, isOpen, onClose }: DeleteHorseModalProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const n = reason.trim().length;
  const reasonErr = n === 0 ? "Please enter a reason." : n < 10 || n > 500 ? "Reason must be 10 to 500 characters." : "";
  const sameName =
    confirmName.trim().replace(/\s+/g, " ").toLowerCase() === horse.name.trim().toLowerCase();
  const nameErr = confirmName.trim() && !sameName ? "The name does not match." : "";

  const undo = async () => {
    try {
      await restoreHorse(horse.id, { undo: true });
      toast.show(`Horse profile ${horse.name} has been restored.`, "ok");
      navigate(`/horses/${horse.id}`);
    } catch (e: unknown) {
      toast.show(messageFor(e), "danger");
    }
  };

  const handleDelete = async () => {
    setTouched(true);
    if (reasonErr || !sameName) return;
    setSubmitting(true);
    try {
      await deleteHorse(horse.id, { reason: reason.trim(), confirmName: confirmName.trim() });
      onClose();
      navigate("/horses");
      toast.show(`Horse profile ${horse.name} has been deleted.`, "ok", {
        durationMs: UNDO_MS,
        action: { label: "Undo", onClick: () => void undo() },
      });
    } catch (e: unknown) {
      toast.show(messageFor(e), "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      tone="danger"
      title={tr(`Delete profile: ${horse.name}`)}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button tone="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button tone="danger" onClick={() => void handleDelete()} disabled={submitting || !sameName || Boolean(reasonErr)}>
            {submitting ? "Deleting..." : "Delete profile"}
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Alert tone="danger" title={tr("Only for profiles created by mistake")}>
          {tr("A deleted profile is hidden from the roster but can be restored from Deleted horses. To stop managing a real horse (sold, retired, deceased), use Stop managing instead.")}
        </Alert>

        <Field label={tr("Reason for deletion")} required error={touched ? reasonErr || undefined : undefined} hint={tr("10-500 characters")}>
          <Textarea rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>

        <Field label={tr(`Type the horse name "${horse.name}" to confirm`)} required error={nameErr || undefined}>
          <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} autoComplete="off" />
        </Field>
      </div>
    </Modal>
  );
}
