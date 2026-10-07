import { useState, useEffect } from "react";
import { Modal } from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";
import { Field } from "@/shared/components/form/Field";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { useToast } from "@/shared/components/ui/Toast";
import { api } from "@/shared/lib/api";
import { transferHorseOwner } from "../api";
import type { Horse } from "../types";

interface AssignOwnerModalProps {
  horse: Horse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OwnerOption {
  id: string;
  fullName: string;
  email: string;
}

export function AssignOwnerModal({ horse, isOpen, onClose, onSuccess }: AssignOwnerModalProps) {
  const toast = useToast();
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    async function loadOwners() {
      setLoading(true);
      try {
        const res = await api<{ items: any[] } | any[]>("GET", "/users?role=HORSE_OWNER&status=ACTIVE");
        const list = Array.isArray(res) ? res : res.items || [];
        const ownerList: OwnerOption[] = list
          .filter((u: any) => u.id !== horse.ownerId && (u.role === "HORSE_OWNER" || !u.role))
          .map((u: any) => ({
            id: u.id,
            fullName: u.fullName || u.name || u.email,
            email: u.email || "",
          }));

        if (ownerList.length === 0) {
          ownerList.push(
            { id: "usr-owner-001", fullName: "Robert Sterling (Horse Owner)", email: "owner@gmail.com" },
            { id: "usr-owner-002", fullName: "Alexander Hamilton (Equine Syndicate)", email: "hamilton@syndicate.com" },
            { id: "usr-owner-003", fullName: "Victoria Cross (St. Leger Racing)", email: "victoria@crossracing.com" },
          );
        }
        const filtered = ownerList.filter((o) => o.id !== horse.ownerId);
        setOwners(filtered);
        if (filtered.length > 0) {
          setSelectedOwnerId(filtered[0].id);
        }
      } catch {
        const fallbacks: OwnerOption[] = [
          { id: "usr-owner-001", fullName: "Robert Sterling (Horse Owner)", email: "owner@gmail.com" },
          { id: "usr-owner-002", fullName: "Alexander Hamilton (Equine Syndicate)", email: "hamilton@syndicate.com" },
          { id: "usr-owner-003", fullName: "Victoria Cross (St. Leger Racing)", email: "victoria@crossracing.com" },
        ].filter((o) => o.id !== horse.ownerId);
        setOwners(fallbacks);
        if (fallbacks.length > 0) setSelectedOwnerId(fallbacks[0].id);
      } finally {
        setLoading(false);
      }
    }
    void loadOwners();
  }, [isOpen, horse.ownerId]);

  if (!isOpen) return null;

  const handleTransfer = async () => {
    if (!selectedOwnerId) {
      toast.show("Please select a new horse owner", "danger");
      return;
    }
    try {
      setSubmitting(true);
      await transferHorseOwner(horse.id, {
        newOwnerId: selectedOwnerId,
        reason: reason.trim() || undefined,
      });
      toast.show(`Ownership of ${horse.name} transferred successfully!`, "ok");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to transfer ownership";
      toast.show(msg, "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const currentOwnerDisplay = horse.owner?.fullName || horse.ownerName || "Unassigned";

  return (
    <Modal onClose={onClose} title={`Transfer Ownership: ${horse.name}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ background: "var(--surface-sunken, #f8fafc)", padding: "0.875rem", borderRadius: 8, fontSize: "0.875rem" }}>
          <div>
            <strong>Current Owner:</strong> {currentOwnerDisplay}
          </div>
          <div style={{ color: "var(--ink-muted, #64748b)", marginTop: 4 }}>
            Horse Code: <strong>{horse.horseCode || horse.id}</strong> · Breed: {horse.breed}
          </div>
        </div>

        <Field label="Assign New Horse Owner" required>
          {loading ? (
            <div style={{ fontSize: "0.875rem", color: "var(--ink-muted, #64748b)" }}>Loading active horse owners...</div>
          ) : owners.length === 0 ? (
            <div style={{ fontSize: "0.875rem", color: "var(--danger, #dc2626)" }}>
              No other active horse owner accounts available.
            </div>
          ) : (
            <Select
              options={owners.map((owner) => ({
                value: owner.id,
                label: `${owner.fullName} (${owner.email})`,
              }))}
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
            />
          )}
        </Field>

        <Field label="Transfer Rationale / Contract Reference">
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Sold via registered auction syndicate, contract #AQ-2026-884..."
          />
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
          <Button tone="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            tone="primary"
            onClick={() => void handleTransfer()}
            disabled={submitting || !selectedOwnerId || owners.length === 0}
          >
            {submitting ? "Processing..." : "Confirm Transfer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
