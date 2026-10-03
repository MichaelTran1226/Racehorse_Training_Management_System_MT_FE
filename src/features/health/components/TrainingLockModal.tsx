import { useState } from "react";
import type { FormEvent } from "react";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";

const APPLIED_STATUS_OPTIONS = [
  { value: "INJURED", label: "Injured" },
  { value: "UNDER_OBSERVATION", label: "Under Observation" },
  { value: "QUARANTINED", label: "Quarantined" },
];

const RESTORE_STATUS_OPTIONS = [
  { value: "FIT", label: "Fit - Allow full training resumption" },
  { value: "UNDER_OBSERVATION", label: "Under Observation - Light exercise only" },
];

interface TrainingLockModalProps {
  mode: "place" | "lift" | "extend";
  horseName: string;
  horseId?: string;
  horseOptions?: { value: string; label: string }[];
  currentReviewDate?: string;
  onClose: () => void;
  onPlaceLock?: (dto: { horseId?: string; reason: string; reviewDate: string; appliedStatus: string; unlockConditions?: string }) => Promise<void>;
  onLiftLock?: (dto: { reason: string; restoreStatus: string }) => Promise<void>;
  onExtendLock?: (dto: { newReviewDate: string; reason: string }) => Promise<void>;
}

export function TrainingLockModal({
  mode,
  horseName,
  horseId,
  horseOptions,
  currentReviewDate,
  onClose,
  onPlaceLock,
  onLiftLock,
  onExtendLock,
}: TrainingLockModalProps) {
  const [selectedHorseId, setSelectedHorseId] = useState(
    horseId || (horseOptions && horseOptions.length > 0 ? horseOptions[0].value : "")
  );
  const [reason, setReason] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("INJURED");
  const [reviewDate, setReviewDate] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  );
  const [newReviewDate, setNewReviewDate] = useState(() =>
    currentReviewDate
      ? new Date(new Date(currentReviewDate).getTime() + 7 * 86400000).toISOString().split("T")[0]
      : new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
  );
  const [restoreStatus, setRestoreStatus] = useState("FIT");
  const [unlockConditions, setUnlockConditions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeHorseLabel =
    horseOptions?.find((h) => h.value === selectedHorseId)?.label || horseName;

  const titles = {
    place: `Place Training Lock: ${activeHorseLabel}`,
    lift: `Lift Training Lock: ${horseName}`,
    extend: `Extend Lock Review Date: ${horseName}`,
  };

  const subtitles = {
    place: "Highest system priority order; immediately blocks heavy training assignments and race entries.",
    lift: "Lift lock following clinical recovery. Blocked sessions transition to pending trainer reactivation.",
    extend: "Extend recovery period if the horse has not yet met unlocking criteria.",
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please enter a clinical reason.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (mode === "place" && onPlaceLock) {
        await onPlaceLock({
          horseId: selectedHorseId || horseId,
          reason: reason.trim(),
          reviewDate,
          appliedStatus,
          unlockConditions: unlockConditions.trim() || undefined,
        });
      } else if (mode === "lift" && onLiftLock) {
        await onLiftLock({
          reason: reason.trim(),
          restoreStatus,
        });
      } else if (mode === "extend" && onExtendLock) {
        await onExtendLock({
          newReviewDate,
          reason: reason.trim(),
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={titles[mode]}
      subtitle={subtitles[mode]}
      tone={mode === "place" ? "danger" : "warn"}
      width={500}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
          <Button tone="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            tone={mode === "lift" ? "primary" : mode === "place" ? "danger" : "primary"}
            onClick={handleSubmit}
            disabled={busy}
          >
            {mode === "place" ? "Confirm Training Lock" : mode === "lift" ? "Confirm Lift Lock" : "Save Extension"}
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

        {mode === "place" && (
          <>
            {horseOptions && horseOptions.length > 0 && (
              <Field label="Target Horse *">
                <Select
                  options={horseOptions}
                  value={selectedHorseId}
                  onChange={(e) => setSelectedHorseId(e.target.value)}
                />
              </Field>
            )}

            <Field label="Applied Health Status *">
              <Select
                options={APPLIED_STATUS_OPTIONS}
                value={appliedStatus}
                onChange={(e) => setAppliedStatus(e.target.value)}
              />
            </Field>

            <Field label="Review Date *" hint="System will send an alert notification to the VET when due">
              <Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} required />
            </Field>

            <Field label="Lock Reason *" hint="Min 10 characters, state clear veterinary diagnosis">
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Superficial digital flexor tendon strain post-exercise, suspected micro-tear..."
                required
              />
            </Field>

            <Field label="Unlock Conditions" hint="Clinical criteria required before lifting lock">
              <Input
                value={unlockConditions}
                onChange={(e) => setUnlockConditions(e.target.value)}
                placeholder="e.g., Zero lameness upon palpation and flexion, ultrasound clearance..."
              />
            </Field>
          </>
        )}

        {mode === "lift" && (
          <>
            <Field label="Post-Lift Health Status *">
              <Select
                options={RESTORE_STATUS_OPTIONS}
                value={restoreStatus}
                onChange={(e) => setRestoreStatus(e.target.value)}
              />
            </Field>

            <Field label="Reason for Lifting Lock *" hint="Veterinary evaluation notes prior to releasing horse">
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Re-examination today confirms joint stability, full range of motion, normal gait..."
                required
              />
            </Field>
          </>
        )}

        {mode === "extend" && (
          <>
            {currentReviewDate && (
              <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                Current review date: <strong>{new Date(currentReviewDate).toLocaleDateString("en-US")}</strong>
              </div>
            )}

            <Field label="New Review Date *">
              <Input type="date" value={newReviewDate} onChange={(e) => setNewReviewDate(e.target.value)} required />
            </Field>

            <Field label="Reason for Extension *" hint="State clinical reasons for extending rehabilitation">
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Lesion not fully resolved, requires 7 more days of physical therapy..."
                required
              />
            </Field>
          </>
        )}
      </form>
    </Modal>
  );
}
