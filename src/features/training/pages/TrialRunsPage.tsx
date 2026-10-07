import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { Select } from "@/shared/components/form/Select";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { trainingApi } from "../api";
import type { TrackType, TrialRunSchedule } from "../types";

export default function TrialRunsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isTrainer = user?.role === "HEAD_TRAINER" || user?.role === "CLUB_MANAGER";

  const [trials, setTrials] = useState<TrialRunSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Create Trial Modal
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [runDate, setRunDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState<string>("07:00");
  const [trackType, setTrackType] = useState<TrackType>("TURF");
  const [distance, setDistance] = useState<number>(1200);
  const [notes, setNotes] = useState<string>("");

  const loadTrials = useCallback(async () => {
    try {
      setLoading(true);
      const data = await trainingApi.getTrialRuns();
      setTrials(data);
    } catch {
      toast.show("Unable to load trial runs", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadTrials();
  }, [loadTrials]);

  const handleCreateTrial = async () => {
    try {
      await trainingApi.createTrialRun({
        runDate,
        trackType,
        distanceMeters: distance,
        startTime,
        notes,
        horses: [
          { horseId: "horse-1", horseName: "Thunderbolt Swift", jockeyName: "Alex Turner", gateNumber: 1 },
          { horseId: "horse-3", horseName: "Shadowfax Wonder", jockeyName: "Kyle Bennett", gateNumber: 2 },
        ],
      });
      toast.show("Trial run scheduled successfully", "ok");
      setIsOpenModal(false);
      void loadTrials();
    } catch {
      toast.show("Failed to schedule trial run", "danger");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Trial Runs Coordination</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Schedule barrier break trial runs by surface, allocate starting gates, and coordinate jockeys
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/training/calendar">
            <Button tone="secondary">← Master Calendar</Button>
          </Link>
          {isTrainer && (
            <Button tone="primary" onClick={() => setIsOpenModal(true)}>
              + Schedule Trial Run
            </Button>
          )}
        </div>
      </div>

      {/* Trial Run List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading trial runs...</div>
        ) : trials.length === 0 ? (
          <EmptyState
            title="No Trial Runs Scheduled"
            description="Click 'Schedule Trial Run' to coordinate a performance evaluation heat."
          />
        ) : (
          trials.map((trial) => (
            <div
              key={trial.id}
              style={{
                padding: "1.5rem",
                background: "var(--surface)",
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                      Heat #{trial.orderNumber} · {trial.runCode}
                    </span>
                    <Badge tone={trial.trackType === "TURF" ? "ok" : "warn"}>
                      {trial.trackType === "TURF" ? "Turf Track (Grass)" : "Sand Track (Dirt)"}
                    </Badge>
                    <Badge tone="neutral">{trial.distanceMeters}m</Badge>
                    <Badge tone={trial.status === "PENDING" ? "info" : "ok"}>
                      {trial.status === "PENDING" ? "Pending Start" : "Completed"}
                    </Badge>
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Date: <strong>{trial.runDate}</strong> · Time: <strong>{trial.startTime}</strong> · Coordinator:{" "}
                    <strong>{trial.coordinatorName}</strong>
                  </div>
                </div>

                {isTrainer && trial.status === "PENDING" && (
                  <Button tone="primary" onClick={() => toast.show("Trial heat started!", "ok")}>
                    Start Trial Heat
                  </Button>
                )}
              </div>

              {trial.notes && (
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", background: "var(--surface-sunken)", padding: "0.5rem 0.75rem", borderRadius: 4 }}>
                  {trial.notes}
                </div>
              )}

              {/* Horse gate table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Gate</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Racehorse</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Jockey</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Finish Timing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trial.horses.map((entry) => (
                      <tr key={entry.horseId} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.5rem 0.75rem", fontWeight: 700, color: "var(--accent)" }}>
                          Gate {entry.gateNumber}
                        </td>
                        <td style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>{entry.horseName}</td>
                        <td style={{ padding: "0.5rem 0.75rem" }}>{entry.jockeyName}</td>
                        <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted)" }}>
                          {entry.timingSeconds ? `${entry.timingSeconds}s` : "Pending"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal create */}
      {isOpenModal && (
        <Modal onClose={() => setIsOpenModal(false)} title="Schedule New Trial Run">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Trial Date" required>
                <Input type="date" value={runDate} onChange={(e) => setRunDate(e.target.value)} />
              </Field>

              <Field label="Start Time" required>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Track Surface" required>
                <Select
                  value={trackType}
                  onChange={(e) => setTrackType(e.target.value as TrackType)}
                  options={[
                    { value: "TURF", label: "Natural Turf (Grass)" },
                    { value: "SAND", label: "Sand Track (Dirt)" },
                  ]}
                />
              </Field>

              <Field label="Distance (meters)" required>
                <Input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  min={800}
                  max={2400}
                  step={200}
                />
              </Field>
            </div>

            <Field label="Coordination Notes">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Trial objectives, pace targets..." />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button tone="ghost" onClick={() => setIsOpenModal(false)}>
                Cancel
              </Button>
              <Button tone="primary" onClick={() => void handleCreateTrial()}>
                Schedule Heat
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
