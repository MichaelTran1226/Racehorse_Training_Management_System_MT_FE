import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Field } from "@/shared/components/form/Field";
import { Modal } from "@/shared/components/ui/Modal";
import { Textarea } from "@/shared/components/form/Textarea";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { formatDateTime } from "@/shared/lib/format";
import { messageFor } from "@/shared/lib/messages";
import { trainingApi } from "../api";
import { EXERCISE_TYPE_LABEL } from "../types";
import type { TrainingAlert } from "../types";

/** FR-2.14: buổi tập có dấu hiệu bất thường. HT và VET xem; chỉ VET ghi nhận. */
export default function AlertListPage() {
  const user = useCurrentUser();
  const toast = useToast();
  const isVet = user.role === "VETERINARIAN";

  const [alerts, setAlerts] = useState<TrainingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TrainingAlert | null>(null);
  const [vetNotes, setVetNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      setAlerts(await trainingApi.getAlerts());
    } catch (err) {
      toast.show(messageFor(err), "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const handleConfirmAck = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await trainingApi.acknowledgeAlert(selected.id, vetNotes.trim());
      toast.show("Alert acknowledged.", "ok");
      setSelected(null);
      setVetNotes("");
      void loadAlerts();
    } catch (err) {
      toast.show(messageFor(err), "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Abnormal-sign Alerts</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Raised when the Head Trainer records abnormal signs after a workout. The Veterinarian reviews and responds.
          </p>
        </div>
        <Link to="/training/calendar">
          <Button tone="secondary">← Training schedule</Button>
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <EmptyState title="No alerts" description="No abnormal signs have been recorded after workouts." />
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: "1.25rem",
                background: "var(--surface)",
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--border)",
                borderLeft: alert.acknowledgedByVet ? "4px solid var(--ok)" : "4px solid var(--danger)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: "1.125rem" }}>
                    <Link to={`/medical/horses/${alert.horseId}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {alert.horseName}
                    </Link>
                  </span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {EXERCISE_TYPE_LABEL[alert.sessionType]} on {alert.sessionDate} · reported {formatDateTime(alert.createdAt)}
                  </span>
                </div>
                <Badge tone={alert.acknowledgedByVet ? "ok" : "danger"}>
                  {alert.acknowledgedByVet ? "Vet acknowledged" : "Pending vet review"}
                </Badge>
              </div>
              <div style={{ fontSize: "0.9375rem" }}>{alert.message}</div>
              {alert.vetNotes && (
                <div style={{ background: "var(--surface-sunken)", padding: "0.75rem", borderRadius: 6, fontSize: "0.875rem" }}>
                  <strong>Veterinarian:</strong> {alert.vetNotes}
                </div>
              )}
              {isVet && !alert.acknowledgedByVet && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button tone="primary" onClick={() => setSelected(alert)}>Review & respond</Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selected && (
        <Modal
          onClose={() => setSelected(null)}
          title={`Response for ${selected.horseName}`}
          foot={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <Button tone="ghost" onClick={() => setSelected(null)}>Cancel</Button>
              <Button tone="primary" onClick={() => void handleConfirmAck()} disabled={submitting || vetNotes.trim().length < 2}>
                Save response
              </Button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "var(--surface-sunken)", padding: "0.75rem", borderRadius: 6, fontSize: "0.875rem" }}>
              <strong>Reported:</strong> {selected.message}
            </div>
            <Field label="Clinical notes" required hint="If treatment is needed, create a medical record or Training Lock in the medical module.">
              <Textarea rows={3} maxLength={1000} value={vetNotes} onChange={(e) => setVetNotes(e.target.value)} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
