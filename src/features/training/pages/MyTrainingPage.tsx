import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@/shared/components/ui/Alert";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Tabs } from "@/shared/components/ui/Tabs";
import { messageFor } from "@/shared/lib/messages";
import { todayClub, trainingApi } from "../api";
import { EXERCISE_TYPE_LABEL, isHeavy, SESSION_STATUS_LABEL, SESSION_STATUS_TONE, TRACK_LABEL } from "../types";
import type { ExerciseSession } from "../types";

const REFRESH_MS = 5 * 60 * 1000;

function plusDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** SC-2.08 Lịch tập của tôi (GROOM): buổi được phân công, tự làm mới mỗi 5 phút. */
export default function MyTrainingPage() {
  const [tab, setTab] = useState("today");
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const latest = useRef(0);

  const today = todayClub();
  const range =
    tab === "today" ? { from: today, to: today } : tab === "tomorrow" ? { from: plusDays(today, 1), to: plusDays(today, 1) } : { from: today, to: plusDays(today, 7) };

  const load = useCallback(async () => {
    const requestId = ++latest.current;
    setError("");
    try {
      const rows = await trainingApi.getSessions({ from: range.from, to: range.to });
      if (requestId === latest.current) setSessions(rows);
    } catch (err) {
      if (requestId === latest.current) setError(messageFor(err));
    } finally {
      if (requestId === latest.current) setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <h1 style={{ margin: 0, fontSize: "var(--fs-kpi)" }}>My training schedule</h1>
        <Button size="sm" tone="secondary" onClick={() => void load()}>Refresh</Button>
      </div>
      <Tabs
        items={[
          { id: "today", label: "Today" },
          { id: "tomorrow", label: "Tomorrow" },
          { id: "week", label: "Next 7 days" },
        ]}
        active={tab}
        onChange={(t) => {
          setTab(t);
          setLoading(true);
        }}
      />
      {error && <Alert tone="danger" title="Could not load data">{error}</Alert>}
      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
      ) : sessions.length === 0 ? (
        <EmptyState title={tab === "today" ? "You have no workouts assigned today." : "No workouts assigned in this period."} />
      ) : (
        sessions.map((s) => {
          const blocked = s.status === "BLOCKED";
          const cancelled = s.status === "CANCELLED";
          return (
            <Card key={s.id} pad={16}>
              <div style={{ background: blocked ? "var(--danger-bg)" : undefined, textDecoration: cancelled ? "line-through" : undefined }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                  <strong style={{ fontSize: "var(--fs-section)" }}>
                    {tab === "week" ? `${s.sessionDate.slice(5)} ` : ""}{s.startTime} · {s.horseName}
                  </strong>
                  <Badge tone={SESSION_STATUS_TONE[s.status]}>{SESSION_STATUS_LABEL[s.status]}</Badge>
                </div>
                <div style={{ fontSize: "var(--fs-body)", marginTop: "0.25rem" }}>
                  Stall {s.stallCode ?? "—"} · {EXERCISE_TYPE_LABEL[s.sessionType]}{" "}
                  {isHeavy(s.sessionType, s.intensity) && <Badge tone="danger">Heavy</Badge>} · {s.targetDistanceMeters} m × {s.repetitions} ·{" "}
                  {TRACK_LABEL[s.trackType]} · Jockey: {s.jockeyName || "—"}
                </div>
                {blocked && (
                  <div style={{ color: "var(--danger)", fontWeight: 600, marginTop: "0.35rem" }}>
                    Blocked by a veterinary Training Lock – do not take the horse to the track.
                  </div>
                )}
                {open === s.id ? (
                  <div style={{ marginTop: "0.5rem", fontSize: "var(--fs-body)" }}>
                    <div><strong>Instructions:</strong> {s.notes || "—"}</div>
                    {s.status === "COMPLETED" && (
                      <Link to={`/training/sessions/${s.id}/result`}>View result</Link>
                    )}
                  </div>
                ) : null}
                <div style={{ marginTop: "0.5rem" }}>
                  <Button size="sm" tone="ghost" onClick={() => setOpen(open === s.id ? null : s.id)}>
                    {open === s.id ? "Hide details" : "Details"}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
