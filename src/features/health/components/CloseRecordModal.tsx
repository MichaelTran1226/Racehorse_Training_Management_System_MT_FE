import { useState } from "react";
import type { FormEvent } from "react";
import { Field } from "@/shared/components/form/Field";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";

const TREATMENT_RESULT_OPTIONS = [
  { value: "Fully recovered", label: "Fully recovered" },
  { value: "Significantly improved", label: "Significantly improved" },
  { value: "Unimproved / Referral required", label: "Unimproved / Referral required" },
];

interface CloseRecordModalProps {
  recordNumber: string;
  isClosed?: boolean;
  onClose: () => void;
  onConfirmClose: (conclusion: string, result: string) => Promise<void>;
  onConfirmReopen: (reason: string) => Promise<void>;
}

export function CloseRecordModal({
  recordNumber,
  isClosed = false,
  onClose,
  onConfirmClose,
  onConfirmReopen,
}: CloseRecordModalProps) {
  const [conclusion, setConclusion] = useState("");
  const [treatmentResult, setTreatmentResult] = useState("Fully recovered");
  const [reopenReason, setReopenReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isClosed) {
        if (!reopenReason.trim()) {
          setError("Please enter a reason for reopening the medical record.");
          setBusy(false);
          return;
        }
        await onConfirmReopen(reopenReason.trim());
      } else {
        if (conclusion.trim().length < 10) {
          setError("Treatment conclusion must be at least 10 characters.");
          setBusy(false);
          return;
        }
        await onConfirmClose(conclusion.trim(), treatmentResult);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={isClosed ? `Reopen Medical Record ${recordNumber} (DL-3.09)` : `Close Treatment Record ${recordNumber} (DL-3.09)`}
      subtitle={
        isClosed
          ? "May only be reopened within 7 days of closure for supplemental treatment."
          : "Concludes medical record. All active medications will automatically be marked as stopped."
      }
      width={500}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
          <Button tone="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button tone="primary" onClick={handleSubmit} disabled={busy}>
            {isClosed ? "Confirm Reopen" : "Save Conclusion & Close Record"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error && (
          <div style={{ color: "var(--danger)", fontSize: "13px", padding: "8px", background: "var(--danger-bg)", borderRadius: "4px" }}>
            {error}
          </div>
        )}

        {isClosed ? (
          <Field label="Reopen Reason *" hint="State symptoms recurrence or clinical justification">
            <Textarea
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="e.g., Horse showed mild recurrence of swelling 2 days after stopping medication..."
              required
            />
          </Field>
        ) : (
          <>
            <Field label="Treatment Outcome Evaluation *">
              <Select
                options={TREATMENT_RESULT_OPTIONS}
                value={treatmentResult}
                onChange={(e) => setTreatmentResult(e.target.value)}
              />
            </Field>

            <Field label="Treatment Conclusion *" hint="Min 10 characters, max 2000 characters">
              <Textarea
                rows={4}
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                placeholder="Overall evaluation of protocol efficacy, current physical status, and post-recovery care instructions..."
                required
              />
            </Field>
          </>
        )}
      </form>
    </Modal>
  );
}
