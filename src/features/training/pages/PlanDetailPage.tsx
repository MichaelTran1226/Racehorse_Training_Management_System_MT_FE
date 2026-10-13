import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
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
import { getStoredHorses, getHorseById } from "@/shared/mock/horsesData";
import { trainingApi } from "../api";
import type {
  ExerciseIntensity,
  ExerciseSession,
  ExerciseType,
  PlanStatus,
  TrackType,
  TrainingPlan,
} from "../types";

const STATUS_CONFIG: Record<PlanStatus, { label: string; tone: "ok" | "warn" | "danger" | "neutral" | "info" }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  ACTIVE: { label: "Active", tone: "ok" },
  COMPLETED: { label: "Completed", tone: "info" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
};

const SESSION_STATUS_CONFIG: Record<string, { label: string; tone: "ok" | "warn" | "danger" | "neutral" | "info" }> = {
  SCHEDULED: { label: "Scheduled", tone: "info" },
  IN_PROGRESS: { label: "In Progress", tone: "warn" },
  COMPLETED: { label: "Completed", tone: "ok" },
  BLOCKED_BY_LOCK: { label: "Blocked (Medical Lock 🔒)", tone: "danger" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

const INTENSITY_COLORS: Record<ExerciseIntensity, "ok" | "warn" | "danger"> = {
  LIGHT: "ok",
  MODERATE: "warn",
  HEAVY: "danger",
};

export default function PlanDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isTrainer = user?.role === "HEAD_TRAINER" || user?.role === "CLUB_MANAGER";

  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("PHASES");

  // Cancellation Modal (DL-2.03)
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Clone Modal (DL-2.05)
  const [showCloneModal, setShowCloneModal] = useState<boolean>(false);
  const availableHorses = useMemo(() => getStoredHorses(), []);
  const [cloneTargetHorseId, setCloneTargetHorseId] = useState<string>(() => availableHorses[0]?.id || "horse-1");
  const [cloning, setCloning] = useState<boolean>(false);

  // Delete Draft Modal (Bug #51)
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Add Session Modal (DL-2.01)
  const [showAddSessionModal, setShowAddSessionModal] = useState<boolean>(false);
  const [sessionDate, setSessionDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState<string>("06:30");
  const [endTime, setEndTime] = useState<string>("07:30");
  const [sessionType, setSessionType] = useState<ExerciseType>("CANTER");
  const [intensity, setIntensity] = useState<ExerciseIntensity>("MODERATE");
  const [targetMeters, setTargetMeters] = useState<number>(1200);
  const [trackType, setTrackType] = useState<TrackType>("TURF");
  const [groomName, setGroomName] = useState<string>("John Smith (Groom)");
  const [jockeyName, setJockeyName] = useState<string>("Alex Turner");
  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [creatingSession, setCreatingSession] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const fetchedPlan = await trainingApi.getPlanById(id);
      setPlan(fetchedPlan);

      if (fetchedPlan) {
        const fetchedSessions = await trainingApi.getSessions({ planId: fetchedPlan.id });
        setSessions(fetchedSessions);
      }
    } catch {
      toast.show("Failed to load training plan details.", "danger");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Check horse medical lock status (RULE-MED-01)
  const horseInfo = useMemo(() => {
    if (!plan?.horseId) return null;
    return getHorseById(plan.horseId);
  }, [plan]);

  const isHorseLocked = Boolean(plan?.isLockedByMedical || horseInfo?.isLocked);
  const lockReason = plan?.medicalLockReason || horseInfo?.lockReason || "Under protective clinical hold";

  // Action: Activate Plan (BTN-2.15)
  async function handleActivate() {
    if (!plan) return;
    if (isHorseLocked) {
      toast.show(
        `Activation blocked: Horse "${plan.horseName}" is currently under Veterinary Medical Lock (${lockReason}).`,
        "danger"
      );
      return;
    }
    try {
      await trainingApi.activatePlan(plan.id);
      toast.show(`Training plan "${plan.name}" is now ACTIVE.`, "ok");
      void loadData();
    } catch (err: any) {
      toast.show(err.message || "Failed to activate plan.", "danger");
    }
  }

  // Action: Complete Plan (BTN-2.16)
  async function handleComplete() {
    if (!plan) return;
    try {
      await trainingApi.completePlan(plan.id);
      toast.show(`Training plan "${plan.name}" marked as COMPLETED.`, "ok");
      void loadData();
    } catch {
      toast.show("Failed to complete plan.", "danger");
    }
  }

  // Action: Cancel Plan (BTN-2.17)
  async function handleConfirmCancel() {
    if (!plan) return;
    if (cancelReason.trim().length < 10) {
      toast.show("Cancellation reason must be at least 10 characters.", "warn");
      return;
    }
    try {
      setCancelling(true);
      await trainingApi.cancelPlan(plan.id, cancelReason.trim());
      toast.show(`Training plan "${plan.name}" has been CANCELLED.`, "info");
      setShowCancelModal(false);
      setCancelReason("");
      void loadData();
    } catch {
      toast.show("Failed to cancel plan.", "danger");
    } finally {
      setCancelling(false);
    }
  }

  // Action: Clone Plan (BTN-2.18)
  async function handleConfirmClone() {
    if (!plan) return;
    const target = availableHorses.find((h) => h.id === cloneTargetHorseId);
    if (!target) return;
    try {
      setCloning(true);
      const cloned = await trainingApi.clonePlan(plan.id, target.id, target.name);
      toast.show(`Plan duplicated for "${target.name}".`, "ok");
      setShowCloneModal(false);
      navigate(`/training/plans/${cloned.id}`);
    } catch {
      toast.show("Failed to clone training plan.", "danger");
    } finally {
      setCloning(false);
    }
  }

  // Action: Delete Draft Plan (Bug #51)
  async function handleConfirmDelete() {
    if (!plan) return;
    try {
      setDeleting(true);
      await trainingApi.deletePlan(plan.id);
      toast.show(`Draft plan "${plan.name}" has been permanently deleted.`, "ok");
      setShowDeleteModal(false);
      navigate("/training/plans");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete plan.";
      toast.show(msg, "danger");
    } finally {
      setDeleting(false);
    }
  }

  // Action: Add Workout Session (BTN-2.19 & DL-2.01)
  async function handleCreateSession() {
    if (!plan) return;
    if (isHorseLocked && (intensity === "HEAVY" || sessionType === "GALLOP" || sessionType === "TRIAL_RUN")) {
      toast.show(
        "Heavy workouts and trial runs are strictly prohibited while horse is under Veterinary Medical Lock (RULE-MED-01).",
        "danger"
      );
      return;
    }

    try {
      setCreatingSession(true);
      await trainingApi.createSession({
        planId: plan.id,
        planName: plan.name,
        horseId: plan.horseId,
        horseName: plan.horseName,
        horseCode: plan.horseCode,
        sessionDate,
        startTime,
        endTime,
        sessionType,
        intensity,
        status: "SCHEDULED",
        trackType,
        targetDistanceMeters: targetMeters,
        groomName,
        jockeyName,
        notes: sessionNotes.trim() || undefined,
      });

      toast.show("Workout session added to plan schedule.", "ok");
      setShowAddSessionModal(false);
      resetSessionForm();
      void loadData();
    } catch (err: any) {
      toast.show(err.message || "Failed to create workout session.", "danger");
    } finally {
      setCreatingSession(false);
    }
  }

  function resetSessionForm() {
    setSessionDate(new Date().toISOString().split("T")[0]);
    setStartTime("06:30");
    setEndTime("07:30");
    setSessionType("CANTER");
    setIntensity("MODERATE");
    setTargetMeters(1200);
    setTrackType("TURF");
    setSessionNotes("");
  }

  if (loading) {
    return (
      <Card pad={40}>
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
          Loading training plan details...
        </div>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card pad={40}>
        <EmptyState
          title="Training Plan Not Found"
          description="The requested training plan could not be located or you may not have permission to view it."
          action={
            <Link to="/training/plans">
              <Button tone="primary">Back to Training Plans</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Navigation Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
        <Link to="/training/plans" style={{ color: "var(--muted)", textDecoration: "none" }}>
          Training Plans
        </Link>
        <span style={{ color: "var(--border)" }}>/</span>
        <span style={{ fontWeight: 600, color: "var(--text)" }}>{plan.planCode}</span>
      </div>

      {/* Header Banner */}
      <Card pad={24}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "1.625rem", fontWeight: 700 }}>{plan.name}</h1>
              <Badge tone={STATUS_CONFIG[plan.status].tone}>{STATUS_CONFIG[plan.status].label}</Badge>
              {isHorseLocked && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.2rem 0.5rem",
                    borderRadius: 6,
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "var(--danger)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  🔒 MEDICAL LOCK ACTIVE
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", fontSize: "0.875rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
              <div>
                <strong>Horse:</strong>{" "}
                <Link to={`/horses/${plan.horseId}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
                  {plan.horseName} ({plan.horseCode})
                </Link>
              </div>
              <div>•</div>
              <div>
                <strong>Schedule:</strong> {plan.startDate} to {plan.endDate}
              </div>
              <div>•</div>
              <div>
                <strong>Target Distance:</strong> {plan.targetDistanceMeters}m
              </div>
              <div>•</div>
              <div>
                <strong>Head Trainer:</strong> {plan.headTrainerName}
              </div>
            </div>

            {plan.target && (
              <div style={{ fontSize: "0.875rem", color: "var(--text)", background: "var(--surface-sunken)", padding: "0.6rem 0.85rem", borderRadius: 6, marginTop: "0.25rem" }}>
                <strong>Conditioning Objective:</strong> {plan.target}
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", alignItems: "center" }}>
            {isTrainer && plan.status === "DRAFT" && (
              <Button
                tone={isHorseLocked ? "secondary" : "primary"}
                onClick={() => void handleActivate()}
                title={isHorseLocked ? "Activation blocked by Veterinary Medical Lock" : "Activate Plan"}
              >
                {isHorseLocked ? "🔒 Locked by Vet" : "Activate Plan"}
              </Button>
            )}

            {isTrainer && plan.status === "ACTIVE" && (
              <Button tone="accent" onClick={() => void handleComplete()}>
                Complete Plan
              </Button>
            )}

            {isTrainer && (plan.status === "DRAFT" || plan.status === "ACTIVE") && (
              <Button tone="danger" onClick={() => setShowCancelModal(true)}>
                Cancel Plan
              </Button>
            )}

            {isTrainer && plan.status === "DRAFT" && (
              <Button tone="danger" onClick={() => setShowDeleteModal(true)}>
                Delete Plan
              </Button>
            )}

            {isTrainer && (
              <Button tone="secondary" onClick={() => setShowCloneModal(true)}>
                Clone Plan
              </Button>
            )}

            {isTrainer && (plan.status === "DRAFT" || plan.status === "ACTIVE") && (
              <Button tone="ghost" onClick={() => setShowAddSessionModal(true)} icon="plus">
                Add Workout
              </Button>
            )}

            <Link to="/training/calendar">
              <Button tone="ghost">Calendar View</Button>
            </Link>

            <Link to="/training/metrics">
              <Button tone="ghost">Fitness Metrics</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* RULE-MED-01: Medical Lock Safety Enforcement Banner */}
      {isHorseLocked && (
        <div
          style={{
            padding: "1.1rem 1.25rem",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-card)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🔒</span>
            <div>
              <strong style={{ color: "var(--danger)", fontSize: "0.9375rem" }}>
                Veterinary Medical Suspension (RULE-MED-01) Active
              </strong>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Horse <strong>{plan.horseName}</strong> is under clinical suspension: &ldquo;{lockReason}&rdquo;. Plan activations, heavy sprint galloping, and trial runs are strictly prevented.
              </p>
            </div>
          </div>
          <Link to="/medical/locks">
            <Button tone="secondary">View Medical Locks Registry →</Button>
          </Link>
        </div>
      )}

      {/* Tabs Controller */}
      <Tabs
        items={[
          { id: "PHASES", label: `Phases & Conditioning (${plan.phases.length})` },
          { id: "SESSIONS", label: `Scheduled Workouts (${sessions.length})` },
          { id: "NOTES", label: "Trainer Review & Notes" },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 1: Phases */}
      {activeTab === "PHASES" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {plan.phases.length === 0 ? (
            <Card pad={32}>
              <EmptyState title="No Conditioning Phases Defined" description="This training plan has no structured phases yet." />
            </Card>
          ) : (
            plan.phases.map((phase) => (
              <Card key={phase.id} pad={20}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Badge tone="info">Phase {phase.phaseOrder}</Badge>
                      <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700 }}>{phase.name}</h3>
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                      Duration: <strong>{phase.startDate}</strong> to <strong>{phase.endDate}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", fontSize: "0.875rem" }}>
                    <div style={{ padding: "0.4rem 0.75rem", background: "var(--surface-sunken)", borderRadius: 6 }}>
                      <span style={{ color: "var(--text-muted)" }}>Max HR:</span>{" "}
                      <strong>{phase.targetHeartRateMax} bpm</strong>
                    </div>
                    <div style={{ padding: "0.4rem 0.75rem", background: "var(--surface-sunken)", borderRadius: 6 }}>
                      <span style={{ color: "var(--text-muted)" }}>Target Speed:</span>{" "}
                      <strong>{phase.targetSpeedKmh} km/h</strong>
                    </div>
                  </div>
                </div>

                {phase.focus && (
                  <div style={{ marginTop: "0.85rem", fontSize: "0.8125rem", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: "0.65rem" }}>
                    <strong>Training Focus:</strong> {phase.focus}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Sessions / Workouts */}
      {activeTab === "SESSIONS" && (
        <Card pad={0}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>Workouts in this Plan ({sessions.length})</div>
            {isTrainer && (plan.status === "DRAFT" || plan.status === "ACTIVE") && (
              <Button tone="primary" size="sm" icon="plus" onClick={() => setShowAddSessionModal(true)}>
                Add Workout
              </Button>
            )}
          </div>

          {sessions.length === 0 ? (
            <div style={{ padding: "2.5rem 1rem" }}>
              <EmptyState
                title="No Workouts Scheduled"
                description="There are currently no workout sessions scheduled for this plan."
                action={
                  isTrainer && (plan.status === "DRAFT" || plan.status === "ACTIVE") ? (
                    <Button tone="primary" onClick={() => setShowAddSessionModal(true)}>
                      + Add First Workout
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                    <th style={{ padding: "0.75rem 1rem" }}>Date & Time</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Type</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Intensity</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Track</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Distance</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Groom / Jockey</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((ses) => (
                    <tr key={ses.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                        <div>{ses.sessionDate}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {ses.startTime} - {ses.endTime}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ fontWeight: 600 }}>{ses.sessionType}</div>
                        {ses.notes && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ses.notes}</div>}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <Badge tone={INTENSITY_COLORS[ses.intensity]}>{ses.intensity}</Badge>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>{ses.trackType || "TURF"}</td>
                      <td style={{ padding: "0.75rem 1rem" }}>{ses.targetDistanceMeters || 1200}m</td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div>{ses.groomName || "Unassigned"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Jockey: {ses.jockeyName || "—"}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <Badge tone={SESSION_STATUS_CONFIG[ses.status]?.tone || "neutral"}>
                          {SESSION_STATUS_CONFIG[ses.status]?.label || ses.status}
                        </Badge>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                          {ses.status === "SCHEDULED" && isTrainer && (
                            <Link to={`/training/metrics?sessionId=${ses.id}`}>
                              <Button tone="secondary" size="sm">
                                Record Result
                              </Button>
                            </Link>
                          )}
                          {ses.status === "COMPLETED" && (
                            <Link to={`/training/metrics?sessionId=${ses.id}`}>
                              <Button tone="ghost" size="sm">
                                View Metrics
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Notes & Log */}
      {activeTab === "NOTES" && (
        <Card pad={24}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700 }}>Tactical & Health Considerations</h3>
            {plan.notes ? (
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "var(--text)", fontSize: "0.875rem" }}>
                {plan.notes}
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No tactical notes recorded for this plan.
              </div>
            )}

            {plan.cancelledReason && (
              <div style={{ padding: "0.85rem", borderRadius: 6, background: "rgba(239, 68, 68, 0.08)", border: "1px solid var(--danger)", marginTop: "0.5rem" }}>
                <strong style={{ color: "var(--danger)" }}>Cancellation Reason:</strong>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--danger)" }}>
                  {plan.cancelledReason}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Cancel Plan Modal (DL-2.03) */}
      {showCancelModal && (
        <Modal onClose={() => setShowCancelModal(false)} title={`Cancel Plan: ${plan.planCode}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "0.875rem" }}>
              Are you sure you want to cancel plan <strong>{plan.name}</strong>? All pending workout sessions will be marked as Cancelled.
            </p>

            <Field label="Cancellation Reason" required hint="Minimum 10 characters required">
              <Textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter clinical or tactical reason for stopping this plan..."
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <Button tone="ghost" onClick={() => setShowCancelModal(false)}>
                Dismiss
              </Button>
              <Button tone="danger" onClick={() => void handleConfirmCancel()} disabled={cancelling}>
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Clone Plan Modal (DL-2.05) */}
      {showCloneModal && (
        <Modal onClose={() => setShowCloneModal(false)} title={`Duplicate Plan: ${plan.planCode}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "0.875rem" }}>
              Clone structure, phases, and distance targets of <strong>{plan.name}</strong> to another racehorse:
            </p>

            <Field label="Assign Cloned Plan To" required>
              <Select
                value={cloneTargetHorseId}
                onChange={(e) => setCloneTargetHorseId(e.target.value)}
                options={availableHorses.map((h) => ({
                  value: h.id,
                  label: `${h.name} (${h.code || h.horseCode})${h.isLocked ? " - Medical Lock 🔒" : ""}`,
                }))}
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <Button tone="ghost" onClick={() => setShowCloneModal(false)}>
                Cancel
              </Button>
              <Button tone="primary" onClick={() => void handleConfirmClone()} disabled={cloning}>
                {cloning ? "Cloning..." : "Create Duplicate"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Draft Plan Modal (Bug #51) */}
      {showDeleteModal && (
        <Modal onClose={() => !deleting && setShowDeleteModal(false)} title={`Delete Draft Plan: ${plan.planCode}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text)" }}>
              Are you sure you want to permanently delete draft plan <strong>"{plan.name}"</strong>?
            </p>
            <div
              style={{
                padding: "0.75rem",
                borderRadius: 6,
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                fontSize: "0.8125rem",
              }}
            >
              ⚠️ <strong>Warning:</strong> This action cannot be undone. Only draft plans without completed sessions can be removed.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button tone="ghost" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button tone="danger" onClick={() => void handleConfirmDelete()} disabled={deleting}>
                {deleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Session Modal (DL-2.01 & P2-07 Enforcement) */}
      {showAddSessionModal && (
        <Modal onClose={() => setShowAddSessionModal(false)} title="Schedule New Workout Session" width={560}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {isHorseLocked && (
              <div
                style={{
                  padding: "0.75rem",
                  borderRadius: 6,
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid var(--danger)",
                  color: "var(--danger)",
                  fontSize: "0.8125rem",
                }}
              >
                🔒 <strong>RULE-MED-01 Enforcement:</strong> This horse is under active Veterinary Medical Lock. Heavy workouts (Gallop, Trial Runs) are disabled. Only light/moderate sessions (Walk, Trot, Canter) are permitted.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field label="Date" required>
                <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <Field label="Start" required>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </Field>
                <Field label="End" required>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </Field>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field label="Exercise Type" required>
                <Select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value as ExerciseType)}
                  options={[
                    { value: "WALK", label: "Walk / Walking Machine" },
                    { value: "TROT", label: "Trot / Basic Cadence" },
                    { value: "CANTER", label: "Canter / Moderate Aerobic" },
                    { value: "RECOVERY", label: "Hydrotherapy / Recovery" },
                    { value: "GATE_PRACTICE", label: "Starting Gate Practice" },
                    { value: "GALLOP", label: isHorseLocked ? "Gallop (Blocked 🔒)" : "Gallop / Fast Sprint" },
                    { value: "TRIAL_RUN", label: isHorseLocked ? "Trial Run (Blocked 🔒)" : "Trial Run / Simulated Race" },
                  ]}
                />
              </Field>

              <Field label="Intensity" required>
                <Select
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value as ExerciseIntensity)}
                  options={[
                    { value: "LIGHT", label: "Light" },
                    { value: "MODERATE", label: "Moderate" },
                    { value: "HEAVY", label: isHorseLocked ? "Heavy (Blocked 🔒)" : "Heavy" },
                  ]}
                />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field label="Track Surface" required>
                <Select
                  value={trackType}
                  onChange={(e) => setTrackType(e.target.value as TrackType)}
                  options={[
                    { value: "TURF", label: "Turf (Grass Course)" },
                    { value: "SAND", label: "Sand / Dirt Track" },
                    { value: "ALL_WEATHER", label: "All-Weather Synthetic" },
                  ]}
                />
              </Field>

              <Field label="Target Distance (meters)" required>
                <Input
                  type="number"
                  value={targetMeters}
                  onChange={(e) => setTargetMeters(Number(e.target.value))}
                  min={400}
                  max={4000}
                  step={200}
                />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field label="Groom Hand">
                <Input value={groomName} onChange={(e) => setGroomName(e.target.value)} />
              </Field>
              <Field label="Jockey">
                <Input value={jockeyName} onChange={(e) => setJockeyName(e.target.value)} />
              </Field>
            </div>

            <Field label="Trainer Instructions & Focal Points">
              <Textarea
                rows={2}
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Specific track lane, stride tempo, or warm-up instructions..."
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button tone="ghost" onClick={() => setShowAddSessionModal(false)}>
                Cancel
              </Button>
              <Button
                tone="primary"
                onClick={() => void handleCreateSession()}
                disabled={creatingSession || (isHorseLocked && (intensity === "HEAVY" || sessionType === "GALLOP" || sessionType === "TRIAL_RUN"))}
              >
                {creatingSession ? "Scheduling..." : "Schedule Workout"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
