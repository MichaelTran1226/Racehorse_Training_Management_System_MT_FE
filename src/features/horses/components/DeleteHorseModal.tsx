import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";
import { Field } from "@/shared/components/form/Field";
import { Textarea } from "@/shared/components/form/Textarea";
import { Alert } from "@/shared/components/ui/Alert";
import { useToast } from "@/shared/components/ui/Toast";
import { deleteHorse, changeHorseStatus } from "../api";
import type { Horse } from "../types";

interface DeleteHorseModalProps {
  horse: Horse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteHorseModal({ horse, isOpen, onClose, onSuccess }: DeleteHorseModalProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [retireReason, setRetireReason] = useState<string>("Career retirement / Transferred to stud farm");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionType, setActionType] = useState<"RETIRE" | "DELETE">("RETIRE");

  if (!isOpen) return null;

  const handleRetire = async () => {
    try {
      setSubmitting(true);
      await changeHorseStatus(horse.id, {
        status: "RETIRED",
        reason: retireReason.trim() || "Retired by Club Manager",
      });
      toast.show(`Horse ${horse.name} has been successfully retired from active stable roster`, "ok");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error retiring horse";
      toast.show(msg, "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      const res = await deleteHorse(horse.id);
      toast.show(res.message || `Horse profile ${horse.name} deleted successfully`, "ok");
      onClose();
      navigate("/horses");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting horse profile";
      toast.show(msg, "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} title={`Manage Roster Status: ${horse.name}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {horse.isMedicalLocked && (
          <Alert tone="danger" title="Medical Lock In Effect">
            This racehorse is currently under a veterinary Medical Lock. Deletion or retirement should only be performed after clinical review.
          </Alert>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            tone={actionType === "RETIRE" ? "primary" : "secondary"}
            onClick={() => setActionType("RETIRE")}
          >
            Retire Racehorse (Recommended)
          </Button>
          <Button
            tone={actionType === "DELETE" ? "danger" : "secondary"}
            onClick={() => setActionType("DELETE")}
          >
            Permanent Delete
          </Button>
        </div>

        {actionType === "RETIRE" ? (
          <>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--ink-muted, #64748b)" }}>
              Retiring marks the horse as <strong>RETIRED</strong>. It preserves all pedigree, clinical history, and workout logs while automatically freeing up stall assignments.
            </p>

            <Field label="Retirement Reason" required>
              <Textarea
                rows={3}
                value={retireReason}
                onChange={(e) => setRetireReason(e.target.value)}
                placeholder="e.g. Age-related retirement, permanent pasture breeding, sold out of country..."
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button tone="ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                tone="primary"
                onClick={() => void handleRetire()}
                disabled={submitting || !retireReason.trim()}
              >
                {submitting ? "Processing..." : "Confirm Retirement"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Alert tone="warn" title="Permanent Record Deletion">
              Hard deletion completely purges this horse from the database. This operation is only permitted if the horse has zero training sessions, medical treatments, or financial records.
            </Alert>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button tone="ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                tone="danger"
                onClick={() => void handleDelete()}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Permanently Delete Record"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
