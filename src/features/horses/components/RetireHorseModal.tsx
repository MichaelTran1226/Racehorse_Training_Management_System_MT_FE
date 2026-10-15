import { useState } from "react";
import { Modal } from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";
import { Field } from "@/shared/components/form/Field";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { Alert } from "@/shared/components/ui/Alert";
import { useToast } from "@/shared/components/ui/Toast";
import { messageFor } from "@/shared/lib/messages";
import { changeHorseStatus } from "../api";
import { RETIRE_REASON_LABEL } from "../types";
import type { Horse, RetireReason } from "../types";

import { tr } from "@/shared/i18n/tr";
interface RetireHorseModalProps {
  horse: Horse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REASONS = Object.keys(RETIRE_REASON_LABEL) as RetireReason[];

function noteError(note: string): string {
  const n = note.trim().length;
  if (n === 0) return "Please enter a reason.";
  if (n < 10 || n > 500) return "Reason must be 10 to 500 characters.";
  return "";
}

/**
 * DL-1.08 Ngừng quản lý (ngựa đang hoạt động) và DL-1.09 Kích hoạt lại (ngựa đã Ngừng quản lý).
 * Chỉ CM mở được. Luật thật nằm ở BE; ở đây chỉ chặn sớm cho dễ dùng.
 */
export function RetireHorseModal({ horse, isOpen, onClose, onSuccess }: RetireHorseModalProps) {
  const toast = useToast();
  const reactivate = horse.status === "RETIRED";
  const [retireReason, setRetireReason] = useState<RetireReason | "">(horse.isMedicalLocked ? "DECEASED" : "");
  const [note, setNote] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const err = noteError(note);
  const reasonMissing = !reactivate && !retireReason;
  const canSubmit = !err && !reasonMissing && (reactivate || understood) && !submitting;

  // Tác động hiện trước khi xác nhận (DL-1.08).
  const impacts: string[] = [];
  if (horse.stallCode) impacts.push(`Return stall ${horse.stallCode}`);
  if (horse.primaryGroom) impacts.push("End the groom assignment");
  if ((retireReason === "SOLD" || retireReason === "TRANSFERRED") && (horse.owner || horse.ownerId)) {
    impacts.push("End ownership of 1 owner");
  }
  if (horse.isMedicalLocked && retireReason === "DECEASED") impacts.push("End the active Training Lock");

  const submit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      if (reactivate) {
        await changeHorseStatus(horse.id, { status: "RESTING", reason: note.trim() });
        toast.show(`Horse ${horse.name} has been reactivated.`, "ok");
      } else {
        await changeHorseStatus(horse.id, {
          status: "RETIRED",
          retireReason: retireReason as RetireReason,
          reason: note.trim(),
        });
        toast.show(`Horse ${horse.name} is no longer managed.`, "ok");
      }
      onSuccess();
      onClose();
    } catch (e: unknown) {
      toast.show(messageFor(e), "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      tone={reactivate ? undefined : "danger"}
      title={reactivate ? tr(`Reactivate ${horse.name}?`) : tr(`Stop managing ${horse.name}`)}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button tone="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button tone={reactivate ? "primary" : "danger"} onClick={() => void submit()} disabled={!canSubmit}>
            {submitting ? "Processing..." : reactivate ? "Reactivate" : "Stop managing"}
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {reactivate ? (
          <p style={{ margin: 0 }}>
            {tr("The horse goes back to")}{" "}<strong>{tr("Resting")}</strong>{tr(", without a stall and without a groom.")}
          </p>
        ) : (
          <>
            {horse.isMedicalLocked && (
              <Alert tone="danger" title={tr("Training Lock in effect")}>
                {tr("While the horse is locked, only the reason \"Deceased\" can be chosen.")}
              </Alert>
            )}
            <Field
              label={tr("Reason for stopping")}
              required
              error={touched && reasonMissing ? "Please select a reason." : undefined}
            >
              <Select
                value={retireReason}
                onChange={(e) => setRetireReason(e.target.value as RetireReason)}
                options={[
                  { value: "", label: "Select a reason", disabled: true },
                  ...REASONS.map((r) => ({
                    value: r,
                    label: RETIRE_REASON_LABEL[r],
                    disabled: horse.isMedicalLocked && r !== "DECEASED",
                  })),
                ]}
              />
            </Field>
          </>
        )}

        <Field label={tr("Note")} required error={touched ? err || undefined : undefined} hint={tr("10-500 characters")}>
          <Textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        {!reactivate && (
          <>
            {impacts.length > 0 && (
              <div style={{ fontSize: "var(--fs-body)" }}>
                <strong>{tr("Impact")}</strong>
                <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.25rem" }}>
                  {impacts.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            )}
            <Checkbox label={tr("I understand the impact above")} checked={understood} onChange={setUnderstood} />
          </>
        )}
      </div>
    </Modal>
  );
}
