import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Field } from "@/shared/components/form/Field";
import { Modal } from "@/shared/components/ui/Modal";
import { Textarea } from "@/shared/components/form/Textarea";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { trainingApi } from "../api";
import type { TrainingAlert } from "../types";

export default function AlertListPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isVet = user?.role === "VETERINARIAN" || user?.role === "CLUB_MANAGER";

  const [alerts, setAlerts] = useState<TrainingAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Acknowledge Modal
  const [selectedAlert, setSelectedAlert] = useState<TrainingAlert | null>(null);
  const [vetNotes, setVetNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await trainingApi.getAlerts();
      setAlerts(data);
    } catch {
      toast.show("Unable to load threshold alerts", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const handleConfirmAck = async () => {
    if (!selectedAlert || !vetNotes.trim()) return;
    try {
      setSubmitting(true);
      await trainingApi.acknowledgeAlert(selectedAlert.id, vetNotes);
      toast.show("Veterinarian acknowledged and recorded clinical intervention", "ok");
      setSelectedAlert(null);
      setVetNotes("");
      void loadAlerts();
    } catch {
      toast.show("Error acknowledging alert", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Biomechanical & Medical Alerts</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Direct clinical bridge between Training Sessions (Flow 2) and Veterinary Team (Flow 3) when anomalies are flagged
          </p>
        </div>

        <Link to="/training/calendar">
          <Button tone="secondary">← Training Calendar</Button>
        </Link>
      </div>

      {/* Alert list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading threshold alerts...</div>
        ) : alerts.length === 0 ? (
          <EmptyState
            title="No Active Alerts"
            description="No clinical abnormalities or metric threshold spikes recorded from recent training sessions."
          />
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
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Badge tone={alert.severity === "HIGH" || alert.severity === "CRITICAL" ? "danger" : "warn"}>
                    Severity: {alert.severity}
                  </Badge>
                  <span style={{ fontWeight: 700, fontSize: "1.125rem" }}>
                    <Link to={`/medical/horses/${alert.horseId}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {alert.horseName}
                    </Link>
                  </span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{alert.createdAt}</span>
                </div>

                <Badge tone={alert.acknowledgedByVet ? "ok" : "danger"}>
                  {alert.acknowledgedByVet ? "Vet Acknowledged" : "Pending Vet Review"}
                </Badge>
              </div>

              <div style={{ fontSize: "0.9375rem", color: "var(--text-main)" }}>
                {alert.message}
              </div>

              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Reported by: <strong>{alert.reportedBy}</strong> · Session Date: <strong>{alert.sessionDate}</strong>
              </div>

              {alert.vetNotes && (
                <div style={{ background: "var(--surface-sunken)", padding: "0.75rem", borderRadius: 6, fontSize: "0.875rem" }}>
                  <strong>Veterinarian Clinical Response:</strong> {alert.vetNotes}
                </div>
              )}

              {isVet && !alert.acknowledgedByVet && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <Button tone="primary" onClick={() => setSelectedAlert(alert)}>
                    Clinical Review & Intervention
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Acknowledge Modal */}
      {selectedAlert && (
        <Modal onClose={() => setSelectedAlert(null)} title={`Clinical Feedback for ${selectedAlert.horseName}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "var(--surface-sunken)", padding: "0.75rem", borderRadius: 6, fontSize: "0.875rem" }}>
              <strong>Reported Anomaly:</strong> {selectedAlert.message}
            </div>

            <Field label="Clinical Notes & Veterinary Intervention Protocol" required>
              <Textarea
                rows={3}
                value={vetNotes}
                onChange={(e) => setVetNotes(e.target.value)}
                placeholder="e.g. Ultrasound examination completed on left carpus, minor inflammation noted. Prescribed cold therapy and issued 7-day Medical Lock..."
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <Button tone="ghost" onClick={() => setSelectedAlert(null)}>
                Cancel
              </Button>
              <Button
                tone="primary"
                onClick={() => void handleConfirmAck()}
                disabled={submitting || !vetNotes.trim()}
              >
                Confirm Clinical Response
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
