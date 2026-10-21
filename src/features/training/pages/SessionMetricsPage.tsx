import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@/shared/components/ui/Alert";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { KpiTile } from "@/shared/components/ui/KpiTile";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Select } from "@/shared/components/form/Select";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { messageFor } from "@/shared/lib/messages";
import { getHorses } from "@/features/horses/api";
import { todayClub, trainingApi } from "../api";
import { sessionButtons } from "../components/sessionRules";
import { EXERCISE_TYPE_LABEL, SESSION_STATUS_LABEL, SESSION_STATUS_TONE } from "../types";
import type { ExerciseSession } from "../types";

import { tr } from "@/shared/i18n/tr";
import { useAppLanguage } from "@/shared/lib/language";

function minusDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Kết quả buổi tập: HT thấy các buổi đang chờ ghi kết quả (đã tới giờ, hoặc Bỏ lỡ trong 7 ngày)
 * và các kết quả 14 ngày gần nhất; mọi vai trò được vào có lối mở Biểu đồ thể lực (SC-2.07).
 */
export default function SessionMetricsPage() {
  useAppLanguage();
  const user = useCurrentUser();
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [horses, setHorses] = useState<{ value: string; label: string }[]>([]);
  const [horseId, setHorseId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = todayClub();
    Promise.all([trainingApi.getSessions({ from: minusDays(today, 14), to: today }), getHorses({ limit: 100 })])
      .then(([rows, hs]) => {
        setSessions(rows);
        setHorses(hs.items.map((h) => ({ value: h.id, label: `${h.name} (${h.horseCode ?? ""})` })));
        setHorseId(hs.items[0]?.id ?? "");
      })
      .catch((err) => setError(messageFor(err)))
      .finally(() => setLoading(false));
  }, []);

  const pending = sessions.filter((s) => sessionButtons(s, user.role).record);
  const recent = sessions.filter((s) => s.status === "COMPLETED").reverse();

  const totalSessionsCount = sessions.length;
  const completedSessionsCount = recent.length;
  const scoredSessions = recent.filter((s) => s.result?.performanceScore != null);
  const avgScore =
    scoredSessions.length > 0
      ? (
          scoredSessions.reduce((acc, s) => acc + (s.result?.performanceScore || 0), 0) /
          scoredSessions.length
        ).toFixed(1)
      : "—";
  const pendingCount = pending.length;

  const TableHead = () => (
    <thead>
      <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--muted)", fontSize: "var(--fs-sm)", textAlign: "left" }}>
        <th style={{ padding: "0.6rem 0.75rem" }}>{tr("Date & Time")}</th>
        <th style={{ padding: "0.6rem 0.75rem" }}>{tr("Horse")}</th>
        <th style={{ padding: "0.6rem 0.75rem" }}>{tr("Exercise & Distance")}</th>
        <th style={{ padding: "0.6rem 0.75rem" }}>{tr("Status")}</th>
        <th style={{ padding: "0.6rem 0.75rem" }}>{tr("Performance Score")}</th>
        <th style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>{tr("Action")}</th>
      </tr>
    </thead>
  );

  const Row = ({ s, action }: { s: ExerciseSession; action: string }) => (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }}>{s.sessionDate} {s.startTime}</td>
      <td style={{ padding: "0.6rem 0.75rem" }}><strong>{s.horseName}</strong></td>
      <td style={{ padding: "0.6rem 0.75rem" }}>{tr(EXERCISE_TYPE_LABEL[s.sessionType])} · {s.targetDistanceMeters} m × {s.repetitions}</td>
      <td style={{ padding: "0.6rem 0.75rem" }}><Badge tone={SESSION_STATUS_TONE[s.status]}>{tr(SESSION_STATUS_LABEL[s.status])}</Badge></td>
      <td style={{ padding: "0.6rem 0.75rem", fontWeight: 700, color: s.result?.performanceScore != null && s.result.performanceScore >= 7 ? "var(--brand, #10b981)" : "inherit" }}>
        {s.result?.performanceScore != null ? `${s.result.performanceScore}/10` : "—"}
      </td>
      <td style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>
        <Link to={`/training/sessions/${s.id}/result`}><Button size="sm" tone="secondary">{tr(action)}</Button></Link>
      </td>
    </tr>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--fs-h1)", fontWeight: 700 }}>{tr("Session Metrics")}</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "var(--fs-body)" }}>
            {tr("Log workout performance, biometric telemetry, and abnormal health indicators.")}
          </p>
        </div>
        {(user.role === "HEAD_TRAINER" || user.role === "VETERINARIAN") && (
          <Link to="/training/alerts"><Button tone="secondary">{tr("Abnormal-sign alerts")}</Button></Link>
        )}
      </div>

      {/* KPI Stats Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <KpiTile
          label={tr("Recent Sessions (14d)")}
          value={String(totalSessionsCount)}
          caption={tr("Total scheduled workouts")}
        />
        <KpiTile
          label={tr("Completed Workouts")}
          value={String(completedSessionsCount)}
          caption={tr("Results recorded in log")}
          accent={completedSessionsCount > 0}
        />
        <KpiTile
          label={tr("Avg Performance Score")}
          value={avgScore !== "—" ? `${avgScore}/10` : "—"}
          caption={tr("Based on trainer ratings")}
          accent={avgScore !== "—" && Number(avgScore) >= 7}
        />
        <KpiTile
          label={tr("Pending Records")}
          value={String(pendingCount)}
          caption={tr("Awaiting result entry")}
        />
      </div>

      <Card pad={16}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600 }}>{tr("Fitness chart for:")}</span>
          <div style={{ minWidth: 260 }}>
            <Select value={horseId} onChange={(e) => setHorseId(e.target.value)} options={horses} />
          </div>
          <Link to={`/horses/${horseId}/fitness`}><Button tone="primary" disabled={!horseId}>{tr("Open chart")}</Button></Link>
        </div>
      </Card>

      {error && <Alert tone="danger" title={tr("Could not load data")}>{error}</Alert>}

      {user.role === "HEAD_TRAINER" && (
        <Card pad={16}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "var(--fs-body-lg)" }}>{tr("Waiting for a result ({{count}})", { count: pending.length })}</h2>
          {loading ? null : pending.length === 0 ? (
            <EmptyState title={tr("Nothing to record right now.")} />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--fs-body)", textAlign: "left" }}>
              <TableHead />
              <tbody>{pending.map((s) => <Row key={s.id} s={s} action="Record result" />)}</tbody>
            </table>
          )}
        </Card>
      )}

      <Card pad={16}>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "var(--fs-body-lg)" }}>{tr("Results – last 14 days ({{count}})", { count: recent.length })}</h2>
        {loading ? (
          <div style={{ color: "var(--text-muted)" }}>{tr("Loading...")}</div>
        ) : recent.length === 0 ? (
          <EmptyState title={tr("No results in the last 14 days.")} />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--fs-body)", textAlign: "left" }}>
            <TableHead />
            <tbody>{recent.map((s) => <Row key={s.id} s={s} action="View result" />)}</tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
