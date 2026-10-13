import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert } from "@/shared/components/ui/Alert";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { messageFor } from "@/shared/lib/messages";
import { todayClub, trainingApi } from "../api";
import { sessionButtons } from "../components/sessionRules";
import { CancelWorkoutDialog, RestoreWorkoutDialog, WorkoutDialog } from "../components/WorkoutDialogs";
import {
  EXERCISE_TYPE_LABEL,
  INTENSITY_LABEL,
  isHeavy,
  SESSION_STATUS_LABEL,
  SESSION_STATUS_TONE,
  TRACK_LABEL,
} from "../types";
import type { ExerciseSession, ExerciseType, SessionStatus, TrackType, TrainingPlan } from "../types";

function shiftDay(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return shiftDay(date, -((d.getUTCDay() + 6) % 7));
}
function minutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

type Dialog =
  | { kind: "add" }
  | { kind: "edit" | "cancel" | "restore"; session: ExerciseSession }
  | null;

/** SC-2.05 Lịch tập. HT thêm / sửa / hủy / khôi phục; CM, VET xem; GROOM dùng "Lịch tập của tôi". */
export default function WeeklyCalendarPage() {
  const user = useCurrentUser();
  const [params] = useSearchParams();
  const isTrainer = user.role === "HEAD_TRAINER";

  const [mode, setMode] = useState<"day" | "week">("day");
  const [date, setDate] = useState(todayClub());
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [horse, setHorse] = useState("ALL");
  const [groom, setGroom] = useState("ALL");
  const [surface, setSurface] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState(params.get("status") ?? "ALL");
  const [selected, setSelected] = useState<ExerciseSession | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const latest = useRef(0);

  const from = mode === "day" ? date : mondayOf(date);
  const to = mode === "day" ? date : shiftDay(mondayOf(date), 6);

  // Đổi ngày nhanh: chỉ nhận kết quả của lần tải mới nhất.
  const load = useCallback(async () => {
    const requestId = ++latest.current;
    setLoading(true);
    setError("");
    try {
      const rows = await trainingApi.getSessions({ from, to });
      if (requestId === latest.current) setSessions(rows);
    } catch (err) {
      if (requestId === latest.current) setError(messageFor(err));
    } finally {
      if (requestId === latest.current) setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isTrainer) return;
    trainingApi
      .getPlans()
      .then((all) => setPlans(all.filter((p) => p.status === "DRAFT" || p.status === "ACTIVE")))
      .catch(() => setPlans([]));
  }, [isTrainer]);

  const shown = sessions.filter(
    (s) =>
      (horse === "ALL" || s.horseId === horse) &&
      (groom === "ALL" || s.groomId === groom) &&
      (surface === "ALL" || s.trackType === surface) &&
      (type === "ALL" || s.sessionType === type) &&
      (status === "ALL" || s.status === status),
  );

  // Nhân viên chăm sóc có 2 buổi trùng giờ (cách nhau < 30 phút cùng ngày) -> viền cam.
  const overlapping = useMemo(() => {
    const live = sessions.filter((s) => s.status !== "CANCELLED" && s.groomId);
    const ids = new Set<string>();
    for (const a of live) {
      for (const b of live) {
        if (a.id !== b.id && a.groomId === b.groomId && a.sessionDate === b.sessionDate && Math.abs(minutes(a.startTime) - minutes(b.startTime)) < 30) {
          ids.add(a.id);
        }
      }
    }
    return ids;
  }, [sessions]);

  const uniq = <T,>(rows: T[], key: (r: T) => string, label: (r: T) => string) =>
    [...new Map(rows.map((r) => [key(r), label(r)])).entries()].map(([value, l]) => ({ value, label: l }));

  const SessionBlock = ({ s }: { s: ExerciseSession }) => (
    <button
      type="button"
      onClick={() => setSelected(s)}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "block",
        padding: "0.6rem 0.75rem",
        borderRadius: "var(--r)",
        border: `1px solid ${overlapping.has(s.id) ? "var(--warn)" : "var(--border)"}`,
        background:
          selected?.id === s.id
            ? "var(--surface-3)"
            : s.status === "BLOCKED"
              ? "var(--danger-bg)"
              : s.status === "COMPLETED"
                ? "var(--ok-bg)"
                : "var(--brand-50)",
        textDecoration: s.status === "CANCELLED" ? "line-through" : undefined,
        width: "100%",
        boxSizing: "border-box",
      }}
      title={overlapping.has(s.id) ? `Groom ${s.groomName} has two workouts at the same time.` : ""}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.35rem", flexWrap: "wrap" }}>
        <strong>{s.startTime} {s.horseName}</strong>
        <Badge tone={SESSION_STATUS_TONE[s.status]}>{SESSION_STATUS_LABEL[s.status]}</Badge>
      </div>
      <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>
        {EXERCISE_TYPE_LABEL[s.sessionType]} {isHeavy(s.sessionType, s.intensity) && "· heavy"} · {s.targetDistanceMeters} m × {s.repetitions} · {TRACK_LABEL[s.trackType]} · {s.groomName ?? "—"}
        {overlapping.has(s.id) && " · groom overlap"}
      </div>
    </button>
  );

  const days = mode === "week" ? Array.from({ length: 7 }, (_, i) => shiftDay(from, i)) : [date];
  const b = selected ? sessionButtons(selected, user.role) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--fs-h1)", fontWeight: 700 }}>Training Schedule</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "var(--fs-body)" }}>
            Workouts by day or week. Heavy workouts are blocked while a horse is under a Training Lock.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/training/trials"><Button tone="secondary">Trial runs</Button></Link>
          {isTrainer && <Button tone="primary" onClick={() => setDialog({ kind: "add" })}>+ Schedule Workout</Button>}
        </div>
      </div>

      <Card pad={16}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <Button tone="ghost" size="sm" onClick={() => setDate(shiftDay(date, mode === "day" ? -1 : -7))} aria-label="Previous">‹</Button>
          <Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} style={{ width: 170 }} />
          <Button tone="ghost" size="sm" onClick={() => setDate(shiftDay(date, mode === "day" ? 1 : 7))} aria-label="Next">›</Button>
          <Button tone="secondary" size="sm" onClick={() => setDate(todayClub())}>Today</Button>
          <Button tone={mode === "day" ? "primary" : "secondary"} size="sm" onClick={() => setMode("day")}>Day</Button>
          <Button tone={mode === "week" ? "primary" : "secondary"} size="sm" onClick={() => setMode("week")}>Week</Button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem", marginTop: "0.75rem" }}>
          <Select value={horse} onChange={(e) => setHorse(e.target.value)} options={[{ value: "ALL", label: "All horses" }, ...uniq(sessions, (s) => s.horseId, (s) => s.horseName)]} />
          <Select
            value={groom}
            onChange={(e) => setGroom(e.target.value)}
            options={[{ value: "ALL", label: "All grooms" }, ...uniq(sessions.filter((s) => s.groomId), (s) => s.groomId as string, (s) => s.groomName ?? "—")]}
          />
          <Select
            value={surface}
            onChange={(e) => setSurface(e.target.value)}
            options={[{ value: "ALL", label: "All surfaces" }, ...(Object.keys(TRACK_LABEL) as TrackType[]).map((t) => ({ value: t, label: TRACK_LABEL[t] }))]}
          />
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[{ value: "ALL", label: "All types" }, ...(Object.keys(EXERCISE_TYPE_LABEL) as ExerciseType[]).map((t) => ({ value: t, label: EXERCISE_TYPE_LABEL[t] }))]}
          />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[{ value: "ALL", label: "All statuses" }, ...(Object.keys(SESSION_STATUS_LABEL) as SessionStatus[]).map((s) => ({ value: s, label: SESSION_STATUS_LABEL[s] }))]}
          />
        </div>
      </Card>

      {error && (
        <Alert tone="danger" title="Could not load data">
          {error} <Button size="sm" tone="secondary" onClick={() => void load()}>Try again</Button>
        </Alert>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selected ? "minmax(0, 1fr) 320px" : "minmax(0, 1fr)", gap: "1rem", alignItems: "start" }}>
        <div>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading schedule...</div>
          ) : mode === "day" ? (
            shown.length === 0 ? (
              <EmptyState title={`No workouts on ${date}.`} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {shown.map((s) => (
                  <SessionBlock key={s.id} s={s} />
                ))}
              </div>
            )
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(140px, 1fr))", gap: "0.5rem", overflowX: "auto" }}>
              {days.map((d) => (
                <div key={d} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "var(--fs-body)", color: d === todayClub() ? "var(--brand)" : undefined }}>{d.slice(5)}</div>
                  {shown.filter((s) => s.sessionDate === d).map((s) => (
                    <SessionBlock key={s.id} s={s} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && b && (
          <Card pad={16}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{selected.horseName}</strong>
              <Button tone="ghost" size="sm" onClick={() => setSelected(null)} aria-label="Close" icon="x" />
            </div>
            <div style={{ fontSize: "var(--fs-body)", display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.5rem" }}>
              <div>{selected.sessionDate} {selected.startTime} · {EXERCISE_TYPE_LABEL[selected.sessionType]} · {INTENSITY_LABEL[selected.intensity]}</div>
              <div>{selected.targetDistanceMeters} m × {selected.repetitions}{selected.targetSpeedKmh ? ` · ${selected.targetSpeedKmh} km/h` : ""}</div>
              <div>{TRACK_LABEL[selected.trackType]} · Jockey: {selected.jockeyName || "—"} · Groom: {selected.groomName || "—"}</div>
              <div>Plan: {selected.planName} {selected.phaseName ? `· ${selected.phaseName}` : ""}</div>
              {selected.notes && <div>Instructions: {selected.notes}</div>}
              {selected.statusReason && <div style={{ color: "var(--danger)" }}>{selected.statusReason}</div>}
              {selected.medicalOverride && <Badge tone="warn">Scheduled in a medical status</Badge>}
            </div>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
              {b.edit && <Button size="sm" tone="ghost" onClick={() => setDialog({ kind: "edit", session: selected })}>Edit</Button>}
              {b.record && <Link to={`/training/sessions/${selected.id}/result`}><Button size="sm" tone="secondary">Record result</Button></Link>}
              {b.viewResult && <Link to={`/training/sessions/${selected.id}/result`}><Button size="sm" tone="secondary">View result</Button></Link>}
              {b.restore && (
                <Button size="sm" tone="primary" disabled={Boolean(b.restoreBlockedReason)} title={b.restoreBlockedReason ?? ""} onClick={() => setDialog({ kind: "restore", session: selected })}>
                  Restore
                </Button>
              )}
              {b.cancel && <Button size="sm" tone="danger" onClick={() => setDialog({ kind: "cancel", session: selected })}>Cancel workout</Button>}
              {user.role !== "GROOM" && <Link to={`/training/plans/${selected.planId}`}><Button size="sm" tone="ghost">Open plan</Button></Link>}
            </div>
          </Card>
        )}
      </div>

      {(dialog?.kind === "add" || dialog?.kind === "edit") && (
        <WorkoutDialog
          plans={plans}
          plan={dialog.kind === "edit" ? plans.find((p) => p.id === dialog.session.planId) : undefined}
          session={dialog.kind === "edit" ? dialog.session : undefined}
          defaultDate={date < todayClub() ? todayClub() : date}
          onClose={() => setDialog(null)}
          onSaved={(d) => {
            setDialog(null);
            setSelected(null);
            if (d >= from && d <= to) void load();
            else setDate(d);
          }}
        />
      )}
      {dialog?.kind === "cancel" && (
        <CancelWorkoutDialog session={dialog.session} onClose={() => setDialog(null)} onDone={() => { setSelected(null); void load(); }} />
      )}
      {dialog?.kind === "restore" && (
        <RestoreWorkoutDialog session={dialog.session} onClose={() => setDialog(null)} onDone={() => { setSelected(null); void load(); }} />
      )}
    </div>
  );
}
