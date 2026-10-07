import React, { useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { useToast } from "@/shared/components/ui/Toast";
import { changeHorseStatus } from "../api";
import { HEALTH_STATUS } from "@/shared/lib/status";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { Badge } from "@/shared/components/ui/Badge";
import type { HealthStatus } from "@/shared/types/enums";
import type { Horse } from "../types";

interface ChangeStatusDialogProps {
  horse: Horse;
  onSuccess: (updatedHorse: Horse) => void;
}

export function ChangeStatusDialog({ horse, onSuccess }: ChangeStatusDialogProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<HealthStatus | "RETIRED">(horse.status as HealthStatus);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const currentUser = useCurrentUser();
  const toast = useToast();

  const isHeadTrainer = currentUser.role === "HEAD_TRAINER";
  const isVeterinarian = currentUser.role === "VETERINARIAN";
  const isManager = currentUser.role === "CLUB_MANAGER";

  let allowedStatuses: string[] = [];
  if (isHeadTrainer) {
    allowedStatuses = ["RESTING", "IN_TRAINING", "ACTIVE"];
  } else if (isVeterinarian) {
    allowedStatuses = ["INJURED", "ISOLATED", "UNDER_OBSERVATION", "RESTING", "IN_TRAINING"];
  } else if (isManager) {
    allowedStatuses = ["ACTIVE", "IN_TRAINING", "UNDER_OBSERVATION", "INJURED", "ISOLATED", "RESTING", "RETIRED"];
  }

  if (horse.isMedicalLocked) {
    if (isVeterinarian) {
      allowedStatuses = allowedStatuses.filter((s) => ["INJURED", "ISOLATED", "UNDER_OBSERVATION"].includes(s));
    } else if (isManager) {
      allowedStatuses = ["ACTIVE", "IN_TRAINING", "UNDER_OBSERVATION", "INJURED", "ISOLATED", "RESTING", "RETIRED"];
    } else {
      allowedStatuses = [];
    }
  }

  const handleOpen = () => {
    if (allowedStatuses.length === 0) {
      if (horse.isMedicalLocked && isHeadTrainer) {
        toast.show("Horse is currently under Medical Lock. Cannot transition to operational status.", "danger");
      }
      return;
    }
    setStatus(horse.status as HealthStatus);
    setReason("");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;
    if (status === horse.status) {
      toast.show("Status unchanged", "info");
      return;
    }

    setLoading(true);
    try {
      const res = await changeHorseStatus(horse.id, { status, reason });
      toast.show(res.message || "Horse status updated successfully", "ok");
      setOpen(false);
      onSuccess({ ...horse, status: status as any });
    } catch (err: any) {
      toast.show(err.message || "Failed to update horse status", "danger");
    } finally {
      setLoading(false);
    }
  };

  const currentStatusCfg = HEALTH_STATUS[horse.status as HealthStatus] || { label: horse.status, tone: "neutral" };

  return (
    <>
      <Button 
        tone="secondary" 
        onClick={handleOpen}
        disabled={allowedStatuses.length === 0}
        title={horse.isMedicalLocked && isHeadTrainer ? "Blocked by Medical Lock" : ""}
      >
        Change Status
      </Button>

      {open && (
        <Modal
          title="Change Horse Status"
          onClose={() => setOpen(false)}
          foot={
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <Button tone="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={(e: any) => handleSubmit(e)} disabled={status === horse.status || loading}>
                Confirm
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
                Current Status
              </label>
              <Badge tone={currentStatusCfg.tone as any}>{currentStatusCfg.label}</Badge>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
                New Status <span style={{ color: "red" }}>*</span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {allowedStatuses.map((s) => {
                  const cfg = HEALTH_STATUS[s as HealthStatus] || { label: s };
                  return (
                    <label key={s} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        checked={status === s}
                        onChange={(e) => setStatus(e.target.value as HealthStatus)}
                      />
                      <span>{cfg.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
                Status Change Rationale (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  color: "var(--ink)",
                }}
                placeholder="Enter clinical or operational rationale..."
              />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
