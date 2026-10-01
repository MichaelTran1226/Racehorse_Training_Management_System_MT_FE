import { useState } from "react";
import type { FormEvent } from "react";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import type { StopPrescriptionInput } from "../types";

const STOP_REASON_OPTIONS = [
  { value: "Resolved", label: "Condition resolved / Symptoms cleared" },
  { value: "Adverse reaction", label: "Adverse reaction / Allergy detected" },
  { value: "Medication switched", label: "Switched to alternative medication" },
  { value: "Other", label: "Other clinical reason" },
];

interface StopPrescriptionModalProps {
  medicationName: string;
  onClose: () => void;
  onSubmit: (input: StopPrescriptionInput) => Promise<void>;
}

export function StopPrescriptionModal({ medicationName, onClose, onSubmit }: StopPrescriptionModalProps) {
  const [stoppedReason, setStoppedReason] = useState("Resolved");
  const [stopNotes, setStopNotes] = useState("");
  const [stoppedDate, setStoppedDate] = useState(new Date().toISOString().split("T")[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        stoppedReason,
        stopNotes: stopNotes.trim() || undefined,
        stoppedDate,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to discontinue medication.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`Discontinue Medication: ${medicationName} (DL-3.06)`}
      subtitle="Marks medication status as Discontinued. Discontinued prescriptions cannot be reactivated."
      width={480}
      tone="warn"
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
          <Button tone="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button tone="danger" onClick={handleSubmit} disabled={busy}>
            Confirm Discontinue
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

        <Field label="Discontinuation Reason *">
          <Select
            options={STOP_REASON_OPTIONS}
            value={stoppedReason}
            onChange={(e) => setStoppedReason(e.target.value)}
          />
        </Field>

        <Field label="Discontinuation Date *">
          <Input type="date" value={stoppedDate} onChange={(e) => setStoppedDate(e.target.value)} required />
        </Field>

        <Field label="Detailed Notes">
          <Textarea
            rows={2}
            value={stopNotes}
            onChange={(e) => setStopNotes(e.target.value)}
            placeholder="Describe clinical rationale or findings upon discontinuing medication..."
          />
        </Field>
      </form>
    </Modal>
  );
}
