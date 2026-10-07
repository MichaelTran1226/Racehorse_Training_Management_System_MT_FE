import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { Select } from "@/shared/components/form/Select";
import { Tabs } from "@/shared/components/ui/Tabs";
import { Textarea } from "@/shared/components/form/Textarea";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { getStoredHorses } from "@/shared/mock/horsesData";
import { trainingApi } from "../api";
import type { ExerciseIntensity, ExerciseSession, ExerciseType, TrackType } from "../types";

const INTENSITY_COLORS: Record<ExerciseIntensity, "ok" | "warn" | "danger"> = {
  LIGHT: "ok",
  MODERATE: "warn",
  HEAVY: "danger",
};

export default function WeeklyCalendarPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isTrainer = user?.role === "HEAD_TRAINER" || user?.role === "CLUB_MANAGER";

  // Available horses
  const availableHorses = useMemo(() => getStoredHorses(), []);

  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDate, setActiveDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [filterIntensity, setFilterIntensity] = useState<string>("ALL");

  // Create Session Modal (DL-2.01)
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newHorseId, setNewHorseId] = useState<string>(() => availableHorses[0]?.id || "horse-1");
  const [newType, setNewType] = useState<ExerciseType>("TROT");
  const [newIntensity, setNewIntensity] = useState<ExerciseIntensity>("MODERATE");
  const [newStart, setNewStart] = useState<string>("06:30");
  const [newEnd, setNewEnd] = useState<string>("07:30");
  const [newGroom, setNewGroom] = useState<string>("John Smith (Groom Hand)");
  const [newJockey, setNewJockey] = useState<string>("Alex Turner (Jockey)");
  const [newTrack, setNewTrack] = useState<TrackType>("TURF");
  const [newDistance, setNewDistance] = useState<number>(1200);
  const [newNotes, setNewNotes] = useState<string>("");

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await trainingApi.getSessions();
      setSessions(data);
    } catch {
      toast.show("Unable to load training sessions schedule", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const handleRestoreSession = async (sessionId: string) => {
    try {
      await trainingApi.restoreBlockedSession(sessionId);
      toast.show("Restored workout session schedule after lock resolution", "ok");
      void loadSessions();
    } catch {
      toast.show("Failed to restore workout session", "danger");
    }
  };

  const handleCreateSession = async () => {
    try {
      const targetHorse = availableHorses.find((h) => h.id === newHorseId);
      const horseName = targetHorse?.name || "Racehorse";

      const created = await trainingApi.createSession({
        horseId: newHorseId,
        horseName,
        sessionDate: activeDate,
        startTime: newStart,
        endTime: newEnd,
        sessionType: newType,
        intensity: newIntensity,
        groomName: newGroom,
        jockeyName: newJockey,
        trackType: newTrack,
        targetDistanceMeters: newDistance,
        notes: newNotes,
      });

      if (created.status === "BLOCKED_BY_LOCK") {
        toast.show(
          "Heavy workout automatically blocked: Horse is under active Medical Lock!",
          "danger",
        );
      } else {
        toast.show("Workout session added to schedule successfully", "ok");
      }

      setIsCreateOpen(false);
      void loadSessions();
    } catch {
      toast.show("Failed to create workout session", "danger");
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesIntensity = filterIntensity === "ALL" ? true : s.intensity === filterIntensity;
    return matchesIntensity;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Training Schedule & Assignments</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Coordinate timeslots, assign Grooms/Jockeys, and enforce automated Medical Lock blocks
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/training/trials">
            <Button tone="secondary">Trial Runs Coordinator</Button>
          </Link>
          {isTrainer && (
            <Button tone="primary" onClick={() => setIsCreateOpen(true)}>
              + Schedule Workout
            </Button>
          )}
        </div>
      </div>

      {/* Control bar */}
      <Card pad={16}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Date:</span>
            <Input type="date" value={activeDate} onChange={(e) => setActiveDate(e.target.value)} style={{ width: 170 }} />
          </div>

          <Tabs
            items={[
              { id: "ALL", label: `All Intensities (${sessions.length})` },
              { id: "LIGHT", label: "Light Workout" },
              { id: "MODERATE", label: "Moderate" },
              { id: "HEAVY", label: "Heavy Workout" },
            ]}
            active={filterIntensity}
            onChange={setFilterIntensity}
          />
        </div>
      </Card>

      {/* Session list / calendar tiles */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading schedule...</div>
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            title="No Workout Sessions Found"
            description="No sessions are scheduled for the selected date or intensity filter."
          />
        ) : (
          filteredSessions.map((session) => {
            const isBlocked = session.status === "BLOCKED_BY_LOCK";
            return (
              <div
                key={session.id}
                style={{
                  padding: "1.25rem",
                  background: isBlocked ? "rgba(239, 68, 68, 0.03)" : "var(--surface)",
                  borderRadius: "var(--radius-card)",
                  border: "1px solid var(--border)",
                  borderLeft: isBlocked ? "5px solid var(--danger)" : "5px solid var(--accent)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {/* Blocked banner if locked */}
                {isBlocked && (
                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: 6,
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid var(--danger)",
                      color: "var(--danger)",
                      fontSize: "0.875rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <strong>🔒 BLOCKED BY MEDICAL LOCK:</strong> {session.blockedReason}
                    </div>
                    {isTrainer && (
                      <Button tone="danger" onClick={() => void handleRestoreSession(session.id)}>
                        Restore Workout
                      </Button>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                        {session.startTime} – {session.endTime}
                      </span>
                      <Badge tone={INTENSITY_COLORS[session.intensity]}>
                        Intensity: {session.intensity} · {session.sessionType}
                      </Badge>
                      {session.status === "COMPLETED" && <Badge tone="ok">Completed</Badge>}
                      {session.status === "SCHEDULED" && <Badge tone="neutral">Scheduled</Badge>}
                    </div>

                    <h3 style={{ margin: "0.5rem 0 0", fontSize: "1.25rem", fontWeight: 700 }}>
                      <Link to={`/horses/${session.horseId}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {session.horseName}
                      </Link>
                    </h3>

                    {session.planName && (
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                        Plan: <strong>{session.planName}</strong>
                      </div>
                    )}
                  </div>

                  {/* Assignment pills */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Assigned Groom:</span>{" "}
                      <strong>{session.groomName || "Unassigned"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Assigned Jockey:</span>{" "}
                      <strong>{session.jockeyName || "Unassigned"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Track Surface:</span>{" "}
                      <strong>{session.trackType} · {session.targetDistanceMeters}m</strong>
                    </div>
                  </div>
                </div>

                {session.notes && (
                  <div style={{ fontSize: "0.875rem", background: "var(--surface-sunken)", padding: "0.5rem 0.75rem", borderRadius: 4 }}>
                    <strong>Trainer Notes:</strong> {session.notes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Session Modal */}
      {isCreateOpen && (
        <Modal onClose={() => setIsCreateOpen(false)} title="Schedule New Workout Session">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Field label="Select Racehorse" required>
              <Select
                value={newHorseId}
                onChange={(e) => setNewHorseId(e.target.value)}
                options={availableHorses.map((h) => ({
                  value: h.id,
                  label: `${h.name} (${h.code || h.horseCode})${h.isLocked ? " - Medical Lock 🔒" : ""}`,
                }))}
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Workout Type" required>
                <Select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ExerciseType)}
                  options={[
                    { value: "WALK", label: "Walk (Controlled Walk)" },
                    { value: "TROT", label: "Trot (Trotting Drill)" },
                    { value: "CANTER", label: "Canter (Steady Pace)" },
                    { value: "GALLOP", label: "Gallop (Sprint / High-speed)" },
                    { value: "GATE_PRACTICE", label: "Starting Gate Drill" },
                  ]}
                />
              </Field>

              <Field label="Intensity Level" required>
                <Select
                  value={newIntensity}
                  onChange={(e) => setNewIntensity(e.target.value as ExerciseIntensity)}
                  options={[
                    { value: "LIGHT", label: "Light (Rehab / Gentle)" },
                    { value: "MODERATE", label: "Moderate (Aerobic Conditioning)" },
                    { value: "HEAVY", label: "Heavy (Sprint / Fast Work)" },
                  ]}
                />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Start Time" required>
                <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
              </Field>

              <Field label="End Time" required>
                <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Assigned Groom" required>
                <Input value={newGroom} onChange={(e) => setNewGroom(e.target.value)} />
              </Field>

              <Field label="Assigned Jockey">
                <Input value={newJockey} onChange={(e) => setNewJockey(e.target.value)} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Track Surface" required>
                <Select
                  value={newTrack}
                  onChange={(e) => setNewTrack(e.target.value as TrackType)}
                  options={[
                    { value: "TURF", label: "Turf Track (Grass)" },
                    { value: "SAND", label: "Sand Track (Dirt)" },
                  ]}
                />
              </Field>

              <Field label="Target Distance (meters)">
                <Input
                  type="number"
                  value={newDistance}
                  onChange={(e) => setNewDistance(Number(e.target.value))}
                />
              </Field>
            </div>

            <Field label="Trainer Instructions & Notes">
              <Textarea
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Specific tactical instructions for this session..."
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button tone="ghost" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button tone="primary" onClick={() => void handleCreateSession()}>
                Save to Schedule
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
