import { useState } from "react";
import type { FormEvent } from "react";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Textarea } from "@/shared/components/form/Textarea";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import type { FollowUpInput } from "../types";

interface AddFollowUpModalProps {
  onClose: () => void;
  onSubmit: (input: FollowUpInput) => Promise<void>;
}

export function AddFollowUpModal({ onClose, onSubmit }: AddFollowUpModalProps) {
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().slice(0, 16));
  const [temperature, setTemperature] = useState(38.0);
  const [restingHeartRate, setRestingHeartRate] = useState(36);
  const [respiratoryRate, setRespiratoryRate] = useState(12);
  const [progressNotes, setProgressNotes] = useState("");
  const [adjustments, setAdjustments] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!progressNotes.trim()) {
      setError("Please enter clinical progress notes.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        followUpDate: new Date(followUpDate).toISOString(),
        temperature: Number(temperature),
        restingHeartRate: Number(restingHeartRate),
        respiratoryRate: Number(respiratoryRate),
        progressNotes: progressNotes.trim(),
        adjustments: adjustments.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record follow-up examination.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Add Follow-up Examination (DL-3.07)"
      subtitle="Record latest vital signs, evaluate clinical progression, and adjust treatment protocol."
      width={520}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
          <Button tone="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button tone="primary" onClick={handleSubmit} disabled={busy}>
            Save Follow-up
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

        <Field label="Follow-up Date & Time *">
          <Input
            type="datetime-local"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            required
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Field label="Temperature (°C) *" hint="Normal: 37.2 - 38.6">
            <Input
              type="number"
              step="0.1"
              min={35}
              max={43}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Heart Rate (bpm) *" hint="Normal: 28 - 44">
            <Input
              type="number"
              min={20}
              max={120}
              value={restingHeartRate}
              onChange={(e) => setRestingHeartRate(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Respiratory Rate (breaths/min) *" hint="Normal: 8 - 16">
            <Input
              type="number"
              min={4}
              max={60}
              value={respiratoryRate}
              onChange={(e) => setRespiratoryRate(Number(e.target.value))}
              required
            />
          </Field>
        </div>

        <Field label="Clinical Progress *" hint="Evaluate horse response to current treatment">
          <Textarea
            rows={3}
            value={progressNotes}
            onChange={(e) => setProgressNotes(e.target.value)}
            placeholder="Describe swelling, heat, gait lameness score, appetite, and attitude..."
            required
          />
        </Field>

        <Field label="Protocol Adjustments / Additional Notes" hint="Changes to exercise restrictions or medication">
          <Textarea
            rows={2}
            value={adjustments}
            onChange={(e) => setAdjustments(e.target.value)}
            placeholder="e.g., Transition to 15-min hand walking, continue cold hosing for 3 more days..."
          />
        </Field>
      </form>
    </Modal>
  );
}
