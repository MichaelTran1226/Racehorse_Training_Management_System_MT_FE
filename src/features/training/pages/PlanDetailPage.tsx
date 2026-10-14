import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Alert } from "@/shared/components/ui/Alert";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Select } from "@/shared/components/form/Select";
import { Tabs } from "@/shared/components/ui/Tabs";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { formatDateTime } from "@/shared/lib/format";
import { messageFor } from "@/shared/lib/messages";
import { todayClub, trainingApi } from "../api";
import { ActivatePlanDialog, ClonePlanDialog, ClosePlanDialog } from "../components/PlanDialogs";
import { ProgressBar } from "../components/ProgressBar";
import { sessionButtons } from "../components/sessionRules";
import { CancelWorkoutDialog, RestoreWorkoutDialog, WorkoutDialog } from "../components/WorkoutDialogs";
import {
  ABNORMAL_SIGN_LABEL,
  EXERCISE_TYPE_LABEL,
  INTENSITY_LABEL,
  isHeavy,
  PHASE_TYPE_LABEL,
  PLAN_STATUS_LABEL,
  PLAN_STATUS_TONE,
  SESSION_STATUS_LABEL,
  SESSION_STATUS_TONE,
  TRACK_LABEL,
} from "../types";
import type { ExerciseSession, SessionStatus, TrainingPhase, TrainingPlan } from "../types";

import { tr } from "@/shared/i18n/tr";
type PlanWithSessions = TrainingPlan & { sessions: ExerciseSession[] };
type Dialog =
  | { kind: "activate" | "complete" | "cancel" | "clone" }
  | { kind: "add" }
  | { kind: "edit" | "cancelWorkout" | "restore"; session: ExerciseSession }
  | null;

const MEDICAL = ["UNDER_OBSERVATION", "INJURED", "ISOLATED"];

/** Thứ Hai (YYYY-MM-DD) của tuần chứa ngày d (YYYY-MM-DD). */
function mondayOf(d: string): string {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}

function distanceOf(s: ExerciseSession): number {
  return s.result?.actualDistanceMeters ?? s.targetDistanceMeters * s.repetitions;
}

/** SC-2.04 Chi tiết giáo án. HT thao tác; CM, VET, OWNER chỉ xem. */
export default function PlanDetailPage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const isTrainer = user.role === "HEAD_TRAINER";

  const [plan, setPlan] = useState<PlanWithSessions | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("phases");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [phaseFilter, setPhaseFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [commentLimit, setCommentLimit] = useState(20);

  const load = useCallback(async () => {
    setError("");
    try {
      setPlan(await trainingApi.getPlanById(id));
    } catch (err) {
      setError(messageFor(err));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // "Lưu và kích hoạt" ở SC-2.03 chuyển sang đây với ?activate=1 -> mở DL-2.02 ngay.
  useEffect(() => {
    if (plan && params.get("activate") === "1" && plan.status === "DRAFT" && isTrainer) {
      setDialog({ kind: "activate" });
      setParams({}, { replace: true });
    }
  }, [plan, params, setParams, isTrainer]);

  const today = todayClub();
  const sessions = useMemo(() => plan?.sessions ?? [], [plan]);
  const completed = sessions.filter((s) => s.status === "COMPLETED");

  if (error) {
    return (
      <Alert tone="danger" title={tr("Could not load the plan")}>
        {error} <Button size="sm" tone="secondary" onClick={() => void load()}>{tr("Try again")}</Button>
      </Alert>
    );
  }
  if (!plan) return <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>{tr("Loading plan...")}</div>;

  const open = plan.status === "DRAFT" || plan.status === "ACTIVE";
  const shownSessions = sessions.filter(
    (s) => (phaseFilter === "ALL" || s.phaseId === phaseFilter) && (statusFilter === "ALL" || s.status === statusFilter),
  );
  const comments = [...completed].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <Card pad={20}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "var(--fs-kpi)" }}>{plan.name}</h1>
              <Badge tone="neutral">{plan.planCode}</Badge>
              <Badge tone={PLAN_STATUS_TONE[plan.status]}>{PLAN_STATUS_LABEL[plan.status]}</Badge>
            </div>
            <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {tr("Horse:")}{" "}<Link to={`/horses/${plan.horseId}`}>{plan.horseName}</Link> · {plan.startDate} → {plan.endDate} {tr("· Trainer:")}{" "}
              {plan.headTrainerName}
            </div>
            {plan.objective && <div style={{ fontSize: "var(--fs-body)", marginTop: "0.25rem" }}>Objective: {plan.objective}</div>}
            <div style={{ maxWidth: 320, marginTop: "0.5rem" }}>
              <ProgressBar done={plan.progress.completed} total={plan.progress.due} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
            {isTrainer && open && (
              <Button tone="secondary" onClick={() => navigate(`/training/plans/${plan.id}/edit`)}>{tr("Edit plan")}</Button>
            )}
            {isTrainer && plan.status === "DRAFT" && (
              <Button
                tone="primary"
                onClick={() => setDialog({ kind: "activate" })}
                disabled={plan.isLockedByMedical || sessions.every((s) => s.status === "CANCELLED")}
                title={
                  plan.isLockedByMedical
                    ? tr("The horse is under a Training Lock.")
                    : sessions.every((s) => s.status === "CANCELLED")
                      ? tr("The plan has no workouts yet.")
                      : ""
                }
              >
                {tr("Activate")}
              </Button>
            )}
            {isTrainer && plan.status === "ACTIVE" && (
              <Button tone="accent" onClick={() => setDialog({ kind: "complete" })}>{tr("Complete")}</Button>
            )}
            {isTrainer && open && (
              <Button tone="danger" onClick={() => setDialog({ kind: "cancel" })}>{tr("Cancel plan")}</Button>
            )}
            {isTrainer && plan.status === "DRAFT" && (
              <Button
                tone="danger"
                onClick={async () => {
                  if (window.confirm(`Delete draft plan "${plan.name}"? This action cannot be undone.`)) {
                    try {
                      await trainingApi.deletePlan(plan.id);
                      navigate("/training/plans");
                    } catch (err) {
                      setError(messageFor(err));
                    }
                  }
                }}
              >
                {tr("Delete draft")}
              </Button>
            )}
            {isTrainer && <Button tone="ghost" onClick={() => setDialog({ kind: "clone" })}>{tr("Clone")}</Button>}
            <Link to={`/horses/${plan.horseId}/fitness`}>
              <Button tone="secondary">{tr("Fitness chart")}</Button>
            </Link>
          </div>
        </div>
      </Card>

      {plan.isLockedByMedical && (
        <Alert tone="danger" title={tr("Training Lock")}>
          The horse has been under a veterinary Training Lock
          {plan.lockedSince ? tr(` since ${formatDateTime(plan.lockedSince)}`) : ""}. Heavy workouts are blocked and cannot be
          added until the Veterinarian lifts the lock.
        </Alert>
      )}
      {!plan.isLockedByMedical && MEDICAL.includes(plan.horseStatus ?? "") && (
        <Alert tone="warn" title={tr("Medical status")}>
          The horse is in status {plan.horseStatus}. Think carefully before scheduling heavy workouts.
        </Alert>
      )}
      {plan.status === "CANCELLED" && plan.cancelledReason && (
        <Alert tone="info" title={tr("Cancelled")}>{plan.cancelledReason}</Alert>
      )}

      <Card pad={16}>
        <Tabs
          items={[
            { id: "phases", label: `Phases (${plan.phases.length})` },
            { id: "workouts", label: `Workouts (${sessions.length})` },
            { id: "comments", label: `Comments (${completed.length})` },
          ]}
          active={tab}
          onChange={setTab}
        />
      </Card>

      {tab === "phases" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {plan.phases.length === 0 && <EmptyState title={tr("No phases")} />}
          {plan.phases.map((ph) => (
            <PhaseCard key={ph.id} phase={ph} sessions={sessions.filter((s) => s.phaseId === ph.id)} current={ph.startDate <= today && today <= ph.endDate} />
          ))}
        </div>
      )}

      {tab === "workouts" && (
        <Card pad={16}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ width: 220 }}>
              <Select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
                options={[{ value: "ALL", label: "All phases" }, ...plan.phases.map((p) => ({ value: p.id, label: p.name }))]}
              />
            </div>
            <div style={{ width: 200 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "All statuses" },
                  ...(Object.keys(SESSION_STATUS_LABEL) as SessionStatus[]).map((s) => ({ value: s, label: SESSION_STATUS_LABEL[s] })),
                ]}
              />
            </div>
            <div style={{ flex: 1 }} />
            {isTrainer && open && <Button tone="primary" onClick={() => setDialog({ kind: "add" })}>{tr("+ Add workout")}</Button>}
          </div>
          {shownSessions.length === 0 ? (
            <EmptyState title={tr("No workouts yet.")} />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-body)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                    {["Date", "Phase", "Type", "Intensity", "Distance × reps", "Target speed", "Surface", "Jockey", "Groom", "Status", "Result", ""].map((h) => (
                      <th key={h} style={{ padding: "0.6rem 0.75rem", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shownSessions.map((s) => {
                    const b = sessionButtons(s, user.role);
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.6rem 0.75rem", whiteSpace: "nowrap" }}>{s.sessionDate} {s.startTime}</td>
                        <td style={{ padding: "0.6rem 0.75rem" }}>{s.phaseName ?? "—"}</td>
                        <td style={{ padding: "0.6rem 0.75rem" }}>
                          {EXERCISE_TYPE_LABEL[s.sessionType]} {isHeavy(s.sessionType, s.intensity) && <Badge tone="danger">{tr("Heavy")}</Badge>}
                        </td>
                        <td style={{ padding: "0.6rem 0.75rem" }}>{INTENSITY_LABEL[s.intensity]}</td>
                        <td style={{ padding: "0.6rem 0.75rem" }}>{s.targetDistanceMeters} m × {s.repetitions}</td>
                        <td style={{ padding: "0.6rem 0.75rem" }}>{s.targetSpeedKmh ? tr(`${s.targetSpeedKmh} km/h`) : "—"}</td>
                        <td style={{ padding: "0.6rem 0.75rem" }}>{TRACK_LABEL[s.trackType]}</td>
                        <td style={{ padding: "0.6rem 0.75rem" }}>{s.jockeyName || "—"}</td>
                        <td style={{ padding: "0.6rem 0.75rem" }}>{s.groomName || "—"}</td>
                        <td style={{ padding: "0.6rem 0.75rem" }}>
                          <Badge tone={SESSION_STATUS_TONE[s.status]}>{SESSION_STATUS_LABEL[s.status]}</Badge>
                        </td>
                        <td style={{ padding: "0.6rem 0.75rem" }}>
                          {s.result ? tr(`${s.result.performanceScore ?? "—"}/10 · ${s.result.avgSpeedKmh ?? "—"} km/h`) : "—"}
                        </td>
                        <td style={{ padding: "0.6rem 0.75rem", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                            {b.edit && <Button size="sm" tone="ghost" onClick={() => setDialog({ kind: "edit", session: s })}>{tr("Edit")}</Button>}
                            {b.record && (
                              <Link to={`/training/sessions/${s.id}/result`}><Button size="sm" tone="secondary">{tr("Record result")}</Button></Link>
                            )}
                            {b.viewResult && (
                              <Link to={`/training/sessions/${s.id}/result`}><Button size="sm" tone="secondary">{tr("View result")}</Button></Link>
                            )}
                            {b.restore && (
                              <Button
                                size="sm"
                                tone="primary"
                                disabled={Boolean(b.restoreBlockedReason)}
                                title={b.restoreBlockedReason ?? ""}
                                onClick={() => setDialog({ kind: "restore", session: s })}
                              >
                                {tr("Restore")}
                              </Button>
                            )}
                            {b.cancel && (
                              <Button size="sm" tone="danger" onClick={() => setDialog({ kind: "cancelWorkout", session: s })}>{tr("Cancel")}</Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "comments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {plan.completionSummary && (
            <Card pad={16}>
              <strong>{tr("Plan summary:")}</strong> {plan.completionSummary}
            </Card>
          )}
          {comments.length === 0 ? (
            <EmptyState title={tr("No comments yet.")} />
          ) : (
            comments.slice(0, commentLimit).map((s) => (
              <Card key={s.id} pad={16}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <strong>{s.sessionDate} {s.startTime}</strong>
                  <span>{EXERCISE_TYPE_LABEL[s.sessionType]}</span>
                  {s.result?.performanceScore != null && <Badge tone="info">{s.result.performanceScore}/10</Badge>}
                  {s.result?.hasAbnormalSigns && <Badge tone="danger">{tr("Abnormal signs")}</Badge>}
                  <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-body)" }}>by {s.result?.recordedBy ?? "—"}</span>
                </div>
                <div style={{ marginTop: "0.35rem" }}>{s.result?.headTrainerFeedback || "—"}</div>
                {s.result?.hasAbnormalSigns && (
                  <div style={{ marginTop: "0.35rem", color: "var(--danger)", fontSize: "var(--fs-body)" }}>
                    {s.result.abnormalSignTypes.map((x) => ABNORMAL_SIGN_LABEL[x]).join(", ")}: {s.result.abnormalSignsDescription}
                  </div>
                )}
              </Card>
            ))
          )}
          {comments.length > commentLimit && (
            <Button tone="secondary" onClick={() => setCommentLimit((n) => n + 20)}>{tr("Load more")}</Button>
          )}
        </div>
      )}

      {(dialog?.kind === "activate") && <ActivatePlanDialog plan={plan} onClose={() => setDialog(null)} onDone={() => void load()} />}
      {(dialog?.kind === "complete" || dialog?.kind === "cancel") && (
        <ClosePlanDialog kind={dialog.kind} plan={plan} onClose={() => setDialog(null)} onDone={() => void load()} />
      )}
      {dialog?.kind === "clone" && (
        <ClonePlanDialog plan={plan} onClose={() => setDialog(null)} onDone={(created) => created && navigate(`/training/plans/${created.id}`)} />
      )}
      {(dialog?.kind === "add" || dialog?.kind === "edit") && (
        <WorkoutDialog
          plan={plan}
          session={dialog.kind === "edit" ? dialog.session : undefined}
          defaultDate={plan.startDate > today ? plan.startDate : today}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            void load();
          }}
        />
      )}
      {dialog?.kind === "cancelWorkout" && (
        <CancelWorkoutDialog session={dialog.session} onClose={() => setDialog(null)} onDone={() => void load()} />
      )}
      {dialog?.kind === "restore" && (
        <RestoreWorkoutDialog session={dialog.session} onClose={() => setDialog(null)} onDone={() => void load()} />
      )}
    </div>
  );
}

/** Một giai đoạn: định mức vs thực tế; tuần vượt cự ly định mức có nhãn cam. */
function PhaseCard({ phase, sessions, current }: { phase: TrainingPhase; sessions: ExerciseSession[]; current: boolean }) {
  const done = sessions.filter((s) => s.status === "COMPLETED");
  const run = done.reduce((sum, s) => sum + distanceOf(s), 0);
  const weekly = new Map<string, number>();
  for (const s of sessions.filter((x) => x.status !== "CANCELLED")) {
    const key = mondayOf(s.sessionDate);
    weekly.set(key, (weekly.get(key) ?? 0) + distanceOf(s));
  }
  const overWeeks = [...weekly.entries()].filter(([, m]) => m > phase.maxWeeklyDistance).map(([w]) => w);

  return (
    <Card pad={16}>
      <div style={{ border: current ? "2px solid var(--brand)" : "none", borderRadius: "var(--r)", padding: current ? "0.5rem" : 0 }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <strong>{phase.name}</strong>
          <Badge tone="neutral">{PHASE_TYPE_LABEL[phase.type] ?? phase.type}</Badge>
          {current && <Badge tone="info">{tr("Current")}</Badge>}
        </div>
        <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>
          {phase.startDate} → {phase.endDate}
        </div>
        {phase.goal && <div style={{ fontSize: "var(--fs-body)", marginTop: "0.35rem" }}>{phase.goal}</div>}
        <div style={{ fontSize: "var(--fs-body)", marginTop: "0.5rem" }}>
          Quota: {phase.sessionsPerWeek}{tr("/week · max")}{" "}{phase.maxWeeklyDistance} {tr("m/week ·")}{" "}{TRACK_LABEL[phase.surface] ?? phase.surface}
          {phase.targetSpeedKmh ? tr(` · ${phase.targetSpeedKmh} km/h`) : ""}
        </div>
        <div style={{ fontSize: "var(--fs-body)" }}>
          Actual: {done.length} workout(s) completed · {run} m run
        </div>
        {overWeeks.map((w) => (
          <div key={w} style={{ marginTop: "0.25rem" }}>
            <Badge tone="warn">Over quota – week of {w}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
