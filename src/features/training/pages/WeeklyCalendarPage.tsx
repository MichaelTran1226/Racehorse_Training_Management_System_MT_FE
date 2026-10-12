import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@/shared/components/ui/Alert";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { Select } from "@/shared/components/form/Select";
import { Tabs } from "@/shared/components/ui/Tabs";
import { Textarea } from "@/shared/components/form/Textarea";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { ApiError } from "@/shared/lib/api";
import { messageFor } from "@/shared/lib/messages";
import { clubIso, todayClub, trainingApi } from "../api";
import {
  ALWAYS_HEAVY,
  CANCEL_REASON_LABEL,
  EXERCISE_TYPE_LABEL,
  INTENSITY_LABEL,
  NO_SURFACE,
  SESSION_STATUS_LABEL,
  TRACK_LABEL,
} from "../types";
import type {
  CancelWorkoutReason,
  ExerciseIntensity,
  ExerciseSession,
  ExerciseType,
  Groom,
  SessionStatus,
  TrackType,
  TrainingPlan,
} from "../types";

const INTENSITY_TONE: Record<ExerciseIntensity, "ok" | "warn" | "danger"> = { LIGHT: "ok", MEDIUM: "warn", HEAVY: "danger" };
const STATUS_TONE: Record<SessionStatus, "ok" | "warn" | "danger" | "neutral" | "info"> = {
  SCHEDULED: "info",
  COMPLETED: "ok",
  BLOCKED: "danger",
  MISSED: "warn",
  CANCELLED: "neutral",
};

function shiftDay(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** SC-2.05 Lịch tập theo ngày. HT thêm / hủy / khôi phục buổi tập; CM, VET xem; GROOM chỉ thấy buổi được giao. */
export default function WeeklyCalendarPage() {
  const user = useCurrentUser();
  const toast = useToast();
  const isTrainer = user.role === "HEAD_TRAINER";

  const [date, setDate] = useState(todayClub());
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterIntensity, setFilterIntensity] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelling, setCancelling] = useState<ExerciseSession | null>(null);
  const [restoring, setRestoring] = useState<ExerciseSession | null>(null);

  // Đổi ngày nhanh: chỉ nhận kết quả của lần tải mới nhất (lần tải cũ về sau không được ghi đè).
  const latestRequest = useRef(0);
  const loadSessions = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    try {
      const data = await trainingApi.getSessions({ date });
      if (requestId === latestRequest.current) setSessions(data);
    } catch (err) {
      if (requestId === latestRequest.current) toast.show(messageFor(err), "danger");
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [date, toast]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const shown = sessions.filter((s) => filterIntensity === "ALL" || s.intensity === filterIntensity);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Training Schedule</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Daily workouts, groom and jockey assignments. Heavy workouts are blocked while a horse is under a Training Lock.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/training/trials">
            <Button tone="secondary">Trial runs</Button>
          </Link>
          {isTrainer && (
            <Button tone="primary" onClick={() => setCreateOpen(true)}>
              + Schedule Workout
            </Button>
          )}
        </div>
      </div>

      <Card pad={16}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Button tone="ghost" size="sm" onClick={() => setDate(shiftDay(date, -1))} aria-label="Previous day">‹</Button>
            <Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} style={{ width: 170 }} />
            <Button tone="ghost" size="sm" onClick={() => setDate(shiftDay(date, 1))} aria-label="Next day">›</Button>
            <Button tone="secondary" size="sm" onClick={() => setDate(todayClub())}>Today</Button>
          </div>
          <Tabs
            items={[
              { id: "ALL", label: `All (${sessions.length})` },
              { id: "LIGHT", label: "Light" },
              { id: "MEDIUM", label: "Medium" },
              { id: "HEAVY", label: "Heavy" },
            ]}
            active={filterIntensity}
            onChange={setFilterIntensity}
          />
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading schedule...</div>
        ) : shown.length === 0 ? (
          <EmptyState title="No workouts on this day" description="Pick another date or schedule a workout." />
        ) : (
          shown.map((s) => (
            <Card key={s.id} pad={20}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {s.status === "BLOCKED" && (
                  <Alert tone="danger" title="Blocked by Training Lock">
                    {s.statusReason}
                    {s.isHorseLocked ? " The lock is still active." : " The lock has been lifted – this workout can be restored."}
                  </Alert>
                )}
                {s.status === "CANCELLED" && s.statusReason && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Cancelled: {s.statusReason}</div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>{s.startTime}</span>
                      <Badge tone={INTENSITY_TONE[s.intensity]}>
                        {EXERCISE_TYPE_LABEL[s.sessionType]} · {INTENSITY_LABEL[s.intensity]}
                      </Badge>
                      <Badge tone={STATUS_TONE[s.status]}>{SESSION_STATUS_LABEL[s.status]}</Badge>
                      {s.medicalOverride && <Badge tone="warn">Scheduled in medical status</Badge>}
                    </div>
                    <h3 style={{ margin: "0.5rem 0 0", fontSize: "1.25rem", fontWeight: 700 }}>
                      <Link to={`/horses/${s.horseId}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {s.horseName}
                      </Link>
                    </h3>
                    {s.planName && (
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                        Plan: <strong>{s.planName}</strong>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
                    <div>Groom: <strong>{s.groomName || "—"}</strong></div>
                    <div>Jockey: <strong>{s.jockeyName || "—"}</strong></div>
                    <div>
                      {TRACK_LABEL[s.trackType]} · {s.repetitions} × {s.targetDistanceMeters}m
                      {s.targetSpeedKmh ? ` · ${s.targetSpeedKmh} km/h` : ""}
                    </div>
                  </div>
                </div>
                {s.notes && s.status !== "COMPLETED" && (
                  <div style={{ fontSize: "0.875rem", background: "var(--surface-sunken)", padding: "0.5rem 0.75rem", borderRadius: 4 }}>
                    <strong>Instructions:</strong> {s.notes}
                  </div>
                )}
                {isTrainer && (
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                    {(s.status === "SCHEDULED" || s.status === "MISSED" || s.status === "COMPLETED") && (
                      <Link to={`/training/metrics?horse=${s.horseId}&session=${s.id}`}>
                        <Button tone="secondary" size="sm">{s.status === "COMPLETED" ? "Edit result" : "Record result"}</Button>
                      </Link>
                    )}
                    {s.status === "BLOCKED" && (
                      <Button
                        tone="primary"
                        size="sm"
                        onClick={() => setRestoring(s)}
                        disabled={s.isHorseLocked}
                        title={s.isHorseLocked ? "Wait until the Veterinarian lifts the Training Lock." : ""}
                      >
                        Restore
                      </Button>
                    )}
                    {(s.status === "SCHEDULED" || s.status === "BLOCKED" || s.status === "MISSED") && (
                      <Button tone="danger" size="sm" onClick={() => setCancelling(s)}>Cancel workout</Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {createOpen && (
        <CreateWorkoutDialog
          defaultDate={date < todayClub() ? todayClub() : date}
          onClose={() => setCreateOpen(false)}
          onCreated={(d) => {
            setCreateOpen(false);
            if (d === date) void loadSessions();
            else setDate(d);
          }}
        />
      )}
      {cancelling && (
        <CancelWorkoutDialog session={cancelling} onClose={() => setCancelling(null)} onDone={() => void loadSessions()} />
      )}
      {restoring && (
        <RestoreWorkoutDialog session={restoring} onClose={() => setRestoring(null)} onDone={() => void loadSessions()} />
      )}
    </div>
  );
}

/** DL-2.01 Thêm buổi tập: chọn ngựa có giáo án Nháp / Đang áp dụng; luật thật kiểm ở BE. */
function CreateWorkoutDialog({ defaultDate, onClose, onCreated }: { defaultDate: string; onClose: () => void; onCreated: (date: string) => void }) {
  const toast = useToast();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [grooms, setGrooms] = useState<Groom[]>([]);
  const [planId, setPlanId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("06:30");
  const [type, setType] = useState<ExerciseType>("CANTER");
  const [intensity, setIntensity] = useState<ExerciseIntensity>("MEDIUM");
  const [distance, setDistance] = useState(1200);
  const [reps, setReps] = useState(1);
  const [speed, setSpeed] = useState("");
  const [surface, setSurface] = useState<TrackType>("TURF");
  const [jockey, setJockey] = useState("");
  const [groomId, setGroomId] = useState("");
  const [notes, setNotes] = useState("");
  const [needVet, setNeedVet] = useState(false);
  const [vetConsulted, setVetConsulted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([trainingApi.getPlans(), trainingApi.getGrooms()])
      .then(([all, g]) => {
        const open = all.filter((p) => p.status === "DRAFT" || p.status === "ACTIVE");
        setPlans(open);
        setPlanId(open[0]?.id ?? "");
        setGrooms(g);
        setGroomId(g[0]?.id ?? "");
      })
      .catch((err) => setError(messageFor(err)));
  }, []);

  const plan = useMemo(() => plans.find((p) => p.id === planId), [plans, planId]);
  const locked = Boolean(plan?.isLockedByMedical);
  const forcedHeavy = ALWAYS_HEAVY.includes(type);
  const noSurface = NO_SURFACE.includes(type);
  const effIntensity: ExerciseIntensity = forcedHeavy ? "HEAVY" : intensity;
  const effSurface: TrackType = noSurface ? "NONE" : surface;

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await trainingApi.createSession(planId, {
        scheduledDate: clubIso(date, time),
        workoutType: type,
        intensity: effIntensity,
        distanceMeters: distance,
        repetitions: reps,
        targetSpeedKmh: speed ? Number(speed) : undefined,
        trackSurface: effSurface,
        jockeyName: jockey.trim() || undefined,
        assignedStaffUserId: groomId,
        trainerNotes: notes.trim() || undefined,
        vetConsulted: vetConsulted || undefined,
      });
      toast.show("Workout added.", "ok");
      onCreated(date);
    } catch (err) {
      // DL-2.06: ngựa ở trạng thái y tế + bài nặng -> HT xác nhận rồi bấm lại.
      if (err instanceof ApiError && err.code === "VET_CONFIRMATION_REQUIRED") setNeedVet(true);
      setError(messageFor(err));
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions = (Object.keys(EXERCISE_TYPE_LABEL) as ExerciseType[]).map((t) => ({
    value: t,
    label: EXERCISE_TYPE_LABEL[t],
    disabled: locked && ALWAYS_HEAVY.includes(t),
  }));

  return (
    <Modal
      title="Schedule Workout"
      onClose={onClose}
      width={640}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button tone="ghost" onClick={onClose}>Cancel</Button>
          <Button tone="primary" onClick={() => void submit()} disabled={submitting || !planId || !groomId || (needVet && !vetConsulted)}>
            Save workout
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {error && <Alert tone={needVet ? "warn" : "danger"} title={needVet ? "Medical status" : "Cannot save"}>{error}</Alert>}
        {plans.length === 0 && !error && (
          <Alert tone="info" title="No open plan">Create a training plan (Draft or Active) first.</Alert>
        )}
        <Field label="Horse / plan" required>
          <Select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            options={plans.map((p) => ({
              value: p.id,
              label: `${p.horseName} – ${p.name} (${p.status === "ACTIVE" ? "Active" : "Draft"})${p.isLockedByMedical ? " 🔒" : ""}`,
            }))}
          />
        </Field>
        {locked && (
          <Alert tone="danger" title="Training Lock">
            Only light or medium workouts can be scheduled for this horse. Breeze, trial run and heavy intensity are disabled.
          </Alert>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Field label="Date" required hint={plan ? `Plan: ${plan.startDate} → ${plan.endDate}` : undefined}>
            <Input type="date" min={todayClub()} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Start time" required hint="04:00 – 20:00">
            <Input type="time" min="04:00" max="20:00" step={900} value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Field label="Workout type" required>
            <Select value={type} onChange={(e) => setType(e.target.value as ExerciseType)} options={typeOptions} />
          </Field>
          <Field label="Intensity" required hint={forcedHeavy ? "Breeze and trial runs are always heavy" : undefined}>
            <Select
              value={effIntensity}
              disabled={forcedHeavy}
              onChange={(e) => setIntensity(e.target.value as ExerciseIntensity)}
              options={(Object.keys(INTENSITY_LABEL) as ExerciseIntensity[]).map((i) => ({
                value: i,
                label: INTENSITY_LABEL[i],
                disabled: locked && i === "HEAVY",
              }))}
            />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <Field label="Distance per rep (m)" required hint="100 – 5000">
            <Input type="number" min={100} max={5000} value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
          </Field>
          <Field label="Reps" required hint="1 – 10">
            <Input type="number" min={1} max={10} value={reps} onChange={(e) => setReps(Number(e.target.value))} />
          </Field>
          <Field label="Target speed (km/h)" required={forcedHeavy} hint="10 – 70">
            <Input type="number" min={10} max={70} step={0.1} value={speed} onChange={(e) => setSpeed(e.target.value)} />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Field label="Track surface" required>
            <Select
              value={effSurface}
              disabled={noSurface}
              onChange={(e) => setSurface(e.target.value as TrackType)}
              options={(Object.keys(TRACK_LABEL) as TrackType[])
                .filter((t) => noSurface || t !== "NONE")
                .map((t) => ({ value: t, label: TRACK_LABEL[t] }))}
            />
          </Field>
          <Field label="Jockey" required={forcedHeavy}>
            <Input value={jockey} maxLength={100} onChange={(e) => setJockey(e.target.value)} />
          </Field>
        </div>
        <Field label="Groom" required>
          <Select
            value={groomId}
            onChange={(e) => setGroomId(e.target.value)}
            options={grooms.map((g) => ({ value: g.id, label: g.fullName }))}
          />
        </Field>
        <Field label="Instructions" hint="Up to 500 characters">
          <Textarea rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {needVet && (
          <Checkbox
            label="I have discussed this with the Veterinarian and take responsibility for this workout"
            checked={vetConsulted}
            onChange={setVetConsulted}
          />
        )}
      </div>
    </Modal>
  );
}

/** DL-2.05 Hủy buổi tập. */
function CancelWorkoutDialog({ session, onClose, onDone }: { session: ExerciseSession; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState<CancelWorkoutReason | "">("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const noteOk = reason !== "OTHER" || (note.trim().length >= 10 && note.trim().length <= 500);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await trainingApi.cancelSession(session.id, reason, note.trim());
      toast.show("Workout cancelled.", "ok");
      onDone();
      onClose();
    } catch (err) {
      toast.show(messageFor(err), "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Cancel ${EXERCISE_TYPE_LABEL[session.sessionType]} at ${session.sessionDate} ${session.startTime} – ${session.horseName}?`}
      tone="warn"
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button tone="ghost" onClick={onClose}>Close</Button>
          <Button tone="danger" onClick={() => void submit()} disabled={submitting || !reason || !noteOk}>Cancel workout</Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Field label="Reason" required>
          <Select
            value={reason}
            onChange={(e) => setReason(e.target.value as CancelWorkoutReason)}
            options={[
              { value: "", label: "Select a reason", disabled: true },
              ...(Object.keys(CANCEL_REASON_LABEL) as CancelWorkoutReason[]).map((r) => ({ value: r, label: CANCEL_REASON_LABEL[r] })),
            ]}
          />
        </Field>
        <Field label="Note" required={reason === "OTHER"} hint="10-500 characters">
          <Textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/** DL-2.07 Khôi phục buổi tập bị chặn (sau khi gỡ khóa), có thể dời ngày giờ. */
function RestoreWorkoutDialog({ session, onClose, onDone }: { session: ExerciseSession; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const today = todayClub();
  const [date, setDate] = useState(session.sessionDate >= today ? session.sessionDate : today);
  const [time, setTime] = useState(session.startTime);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await trainingApi.restoreBlockedSession(session.id, clubIso(date, time));
      toast.show("Workout restored.", "ok");
      onDone();
      onClose();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Restore workout – ${session.horseName}`}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button tone="ghost" onClick={onClose}>Cancel</Button>
          <Button tone="primary" onClick={() => void submit()} disabled={submitting}>Restore</Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {error && <Alert tone="danger" title="Cannot restore">{error}</Alert>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Field label="Date" required>
            <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Start time" required hint="04:00 – 20:00">
            <Input type="time" min="04:00" max="20:00" step={900} value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
